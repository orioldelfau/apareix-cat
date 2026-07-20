const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const CONFIG_PATH = path.join(ROOT, "data", "site-config.json");
const REPORT_JSON_PATH = path.join(ROOT, "reports", "google-growth-insights.json");
const REPORT_MD_PATH = path.join(ROOT, "reports", "google-growth-insights.md");
const DRY_RUN = process.argv.includes("--dry-run");

const config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

async function main() {
  const auth = loadGoogleAuth();
  const dateRange = getDateRange();

  if (DRY_RUN) {
    console.log(
      JSON.stringify(
        {
          ok: true,
          mode: "dry-run",
          searchConsoleProperty: config.searchConsoleProperty,
          ga4PropertyId: config.googleAnalyticsPropertyId,
          authType: auth.type,
          principal: auth.principal,
          dateRange
        },
        null,
        2
      )
    );
    return;
  }

  const token = await getAccessToken(auth);

  const [searchConsole, analytics] = await Promise.all([
    readSearchConsole(token, dateRange).catch((error) => ({ error: error.message, rows: [] })),
    readAnalytics(token, dateRange).catch((error) => ({ error: error.message, rows: [] }))
  ]);

  const report = buildReport({ dateRange, searchConsole, analytics });

  fs.mkdirSync(path.dirname(REPORT_JSON_PATH), { recursive: true });
  fs.writeFileSync(REPORT_JSON_PATH, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  fs.writeFileSync(REPORT_MD_PATH, renderMarkdown(report), "utf8");

  console.log(
    JSON.stringify(
      {
        ok: true,
        searchConsoleRows: searchConsole.rows.length,
        analyticsRows: analytics.rows.length,
        opportunities: report.opportunities.length,
        errors: report.errors,
        outputs: [REPORT_JSON_PATH, REPORT_MD_PATH]
      },
      null,
      2
    )
  );
}

function loadGoogleAuth() {
  if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    const credential = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
    return {
      type: "service_account",
      principal: credential.client_email,
      credential,
      scopes: [
        "https://www.googleapis.com/auth/webmasters.readonly",
        "https://www.googleapis.com/auth/analytics.readonly"
      ]
    };
  }

  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    const credential = JSON.parse(fs.readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, "utf8"));
    return {
      type: "service_account",
      principal: credential.client_email,
      credential,
      scopes: [
        "https://www.googleapis.com/auth/webmasters.readonly",
        "https://www.googleapis.com/auth/analytics.readonly"
      ]
    };
  }

  if (
    process.env.GOOGLE_OAUTH_CLIENT_ID &&
    process.env.GOOGLE_OAUTH_CLIENT_SECRET &&
    process.env.GOOGLE_OAUTH_REFRESH_TOKEN
  ) {
    return {
      type: "oauth",
      principal: process.env.GOOGLE_OAUTH_CLIENT_ID,
      credential: {
        clientId: process.env.GOOGLE_OAUTH_CLIENT_ID,
        clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
        refreshToken: process.env.GOOGLE_OAUTH_REFRESH_TOKEN
      }
    };
  }

  throw new Error(
    "Missing Google credentials. Add GOOGLE_SERVICE_ACCOUNT_JSON, GOOGLE_APPLICATION_CREDENTIALS, or GOOGLE_OAUTH_CLIENT_ID + GOOGLE_OAUTH_CLIENT_SECRET + GOOGLE_OAUTH_REFRESH_TOKEN."
  );
}

async function getAccessToken(auth) {
  if (auth.type === "oauth") return getOAuthAccessToken(auth.credential);
  return getServiceAccountAccessToken(auth.credential, auth.scopes);
}

async function getServiceAccountAccessToken(credential, scopes) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = base64Url(
    JSON.stringify({
      iss: credential.client_email,
      scope: scopes.join(" "),
      aud: credential.token_uri || "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600
    })
  );
  const unsignedToken = `${header}.${claim}`;
  const signature = crypto.createSign("RSA-SHA256").update(unsignedToken).sign(credential.private_key);
  const assertion = `${unsignedToken}.${base64Url(signature)}`;

  const response = await fetch(credential.token_uri || "https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion
    })
  });

  const body = await response.json();

  if (!response.ok) {
    throw new Error(`Google auth failed: ${JSON.stringify(body)}`);
  }

  return body.access_token;
}

async function getOAuthAccessToken(credential) {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: credential.clientId,
      client_secret: credential.clientSecret,
      refresh_token: credential.refreshToken,
      grant_type: "refresh_token"
    })
  });

  const body = await response.json();

  if (!response.ok) {
    throw new Error(`Google OAuth failed: ${JSON.stringify(body)}`);
  }

  return body.access_token;
}

async function readSearchConsole(token, dateRange) {
  if (!config.searchConsoleProperty) return { rows: [], error: "Missing searchConsoleProperty" };

  const siteUrl = encodeURIComponent(config.searchConsoleProperty);
  const response = await fetch(
    `https://www.googleapis.com/webmasters/v3/sites/${siteUrl}/searchAnalytics/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        dimensions: ["query", "page"],
        rowLimit: 250,
        startRow: 0,
        dataState: "final"
      })
    }
  );

  const body = await response.json();

  if (!response.ok) {
    throw new Error(`Search Console failed: ${JSON.stringify(body)}`);
  }

  return {
    rows: (body.rows || []).map((row) => ({
      query: row.keys?.[0] || "",
      page: row.keys?.[1] || "",
      clicks: row.clicks || 0,
      impressions: row.impressions || 0,
      ctr: row.ctr || 0,
      position: row.position || 0
    }))
  };
}

async function readAnalytics(token, dateRange) {
  if (!config.googleAnalyticsPropertyId) return { rows: [], error: "Missing googleAnalyticsPropertyId" };

  const response = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${config.googleAnalyticsPropertyId}:runReport`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        dateRanges: [{ startDate: dateRange.startDate, endDate: dateRange.endDate }],
        dimensions: [{ name: "pagePath" }, { name: "sessionDefaultChannelGroup" }],
        metrics: [{ name: "sessions" }, { name: "screenPageViews" }, { name: "engagementRate" }],
        limit: 250,
        orderBys: [{ metric: { metricName: "sessions" }, desc: true }]
      })
    }
  );

  const body = await response.json();

  if (!response.ok) {
    throw new Error(`GA4 failed: ${JSON.stringify(body)}`);
  }

  return {
    rows: (body.rows || []).map((row) => ({
      pagePath: row.dimensionValues?.[0]?.value || "",
      channel: row.dimensionValues?.[1]?.value || "",
      sessions: Number(row.metricValues?.[0]?.value || 0),
      pageViews: Number(row.metricValues?.[1]?.value || 0),
      engagementRate: Number(row.metricValues?.[2]?.value || 0)
    }))
  };
}

function buildReport({ dateRange, searchConsole, analytics }) {
  const opportunities = scoreOpportunities(searchConsole.rows, analytics.rows);
  const errors = [searchConsole.error, analytics.error].filter(Boolean);

  return {
    generatedAt: new Date().toISOString(),
    dateRange,
    sources: {
      searchConsoleProperty: config.searchConsoleProperty,
      ga4PropertyId: config.googleAnalyticsPropertyId,
      ga4MeasurementId: config.googleAnalyticsMeasurementId
    },
    searchConsole,
    analytics,
    opportunities,
    errors
  };
}

function scoreOpportunities(searchRows, analyticsRows) {
  const analyticsByPath = new Map();

  for (const row of analyticsRows) {
    const current = analyticsByPath.get(row.pagePath) || {
      sessions: 0,
      pageViews: 0,
      engagementRate: 0,
      entries: 0
    };
    current.sessions += row.sessions;
    current.pageViews += row.pageViews;
    current.engagementRate += row.engagementRate;
    current.entries += 1;
    analyticsByPath.set(row.pagePath, current);
  }

  return searchRows
    .filter((row) => row.query && row.impressions >= 5)
    .map((row) => {
      const path = safePath(row.page);
      const analytics = analyticsByPath.get(path);
      const ctrGap = Math.max(0, 0.08 - row.ctr);
      const positionScore = row.position >= 4 && row.position <= 30 ? 30 - row.position : 0;
      const score =
        row.impressions * 0.5 +
        ctrGap * 350 +
        Math.max(0, positionScore) * 2 +
        (analytics ? Math.min(analytics.sessions, 50) * 0.2 : 0);

      return {
        query: row.query,
        page: row.page,
        clicks: row.clicks,
        impressions: row.impressions,
        ctr: round(row.ctr),
        position: round(row.position),
        recommendedAction: actionFor(row),
        score: round(score)
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 25);
}

function actionFor(row) {
  if (row.position > 20) return "Create supporting article or cluster page";
  if (row.ctr < 0.04 && row.position <= 12) return "Rewrite SEO title and meta description";
  if (row.position >= 8 && row.position <= 20) return "Expand the article with examples, FAQs and internal links";
  return "Monitor and add internal links";
}

function renderMarkdown(report) {
  const lines = [
    "# Google Growth Insights",
    "",
    `Periode: ${report.dateRange.startDate} - ${report.dateRange.endDate}`,
    "",
    "## Estat",
    "",
    `- Search Console rows: ${report.searchConsole.rows.length}`,
    `- GA4 rows: ${report.analytics.rows.length}`,
    `- Oportunitats: ${report.opportunities.length}`
  ];

  if (report.errors.length) {
    lines.push("", "## Errors", "", ...report.errors.map((error) => `- ${error}`));
  }

  lines.push("", "## Oportunitats principals", "");

  if (!report.opportunities.length) {
    lines.push("Encara no hi ha prou dades o no hi ha credencials API configurades.");
  } else {
    for (const item of report.opportunities.slice(0, 15)) {
      lines.push(
        `- ${item.query}: ${item.impressions} impressions, CTR ${(item.ctr * 100).toFixed(
          1
        )}%, posicio ${item.position}. Accio: ${item.recommendedAction}`
      );
    }
  }

  lines.push("");
  return `${lines.join("\n")}\n`;
}

function getDateRange() {
  if (process.env.GOOGLE_INSIGHTS_START_DATE && process.env.GOOGLE_INSIGHTS_END_DATE) {
    return {
      startDate: process.env.GOOGLE_INSIGHTS_START_DATE,
      endDate: process.env.GOOGLE_INSIGHTS_END_DATE
    };
  }

  const end = new Date();
  end.setDate(end.getDate() - 3);
  const start = new Date(end);
  start.setDate(start.getDate() - 28);

  return {
    startDate: formatDate(start),
    endDate: formatDate(end)
  };
}

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

function safePath(url) {
  try {
    return new URL(url).pathname;
  } catch {
    return url;
  }
}

function round(value) {
  return Math.round(value * 10000) / 10000;
}

function base64Url(input) {
  const buffer = Buffer.isBuffer(input) ? input : Buffer.from(input);
  return buffer.toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}
