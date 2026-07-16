const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const SEEDS_PATH = path.join(ROOT, "data", "google-ads-seeds.json");
const REPORT_JSON_PATH = path.join(ROOT, "reports", "google-ads-keyword-ideas.json");
const REPORT_MD_PATH = path.join(ROOT, "reports", "google-ads-keyword-ideas.md");
const DRY_RUN = process.argv.includes("--dry-run");

const API_VERSION = process.env.GOOGLE_ADS_API_VERSION || "v24";
const seeds = JSON.parse(fs.readFileSync(SEEDS_PATH, "utf8"));

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

async function main() {
  const credentials = loadCredentials();

  if (DRY_RUN) {
    console.log(
      JSON.stringify(
        {
          ok: true,
          mode: "dry-run",
          apiVersion: API_VERSION,
          customerId: credentials.customerId ? maskId(credentials.customerId) : "",
          loginCustomerId: credentials.loginCustomerId ? maskId(credentials.loginCustomerId) : "",
          hasDeveloperToken: Boolean(credentials.developerToken),
          hasOAuth: Boolean(credentials.clientId && credentials.clientSecret && credentials.refreshToken),
          seedCount: seeds.keywordSeeds.length,
          pageUrl: seeds.pageUrl,
          languageId: process.env.GOOGLE_ADS_LANGUAGE_ID || seeds.languageId || "",
          geoTargetConstants: getGeoTargetConstants()
        },
        null,
        2
      )
    );
    return;
  }

  validateCredentials(credentials);
  const accessToken = await getAccessToken(credentials);
  const ideas = await generateKeywordIdeas(credentials, accessToken);
  const report = buildReport(ideas, credentials);

  fs.mkdirSync(path.dirname(REPORT_JSON_PATH), { recursive: true });
  fs.writeFileSync(REPORT_JSON_PATH, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  fs.writeFileSync(REPORT_MD_PATH, renderMarkdown(report), "utf8");

  console.log(
    JSON.stringify(
      {
        ok: true,
        ideas: report.ideas.length,
        outputs: [REPORT_JSON_PATH, REPORT_MD_PATH]
      },
      null,
      2
    )
  );
}

function loadCredentials() {
  return {
    developerToken: process.env.GOOGLE_ADS_DEVELOPER_TOKEN || "",
    clientId: process.env.GOOGLE_ADS_CLIENT_ID || "",
    clientSecret: process.env.GOOGLE_ADS_CLIENT_SECRET || "",
    refreshToken: process.env.GOOGLE_ADS_REFRESH_TOKEN || "",
    customerId: normalizeCustomerId(process.env.GOOGLE_ADS_CUSTOMER_ID || ""),
    loginCustomerId: normalizeCustomerId(process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID || "")
  };
}

function validateCredentials(credentials) {
  const missing = Object.entries({
    GOOGLE_ADS_DEVELOPER_TOKEN: credentials.developerToken,
    GOOGLE_ADS_CLIENT_ID: credentials.clientId,
    GOOGLE_ADS_CLIENT_SECRET: credentials.clientSecret,
    GOOGLE_ADS_REFRESH_TOKEN: credentials.refreshToken,
    GOOGLE_ADS_CUSTOMER_ID: credentials.customerId
  })
    .filter(([, value]) => !value)
    .map(([name]) => name);

  if (missing.length) {
    throw new Error(`Missing Google Ads credentials: ${missing.join(", ")}`);
  }
}

async function getAccessToken(credentials) {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: credentials.clientId,
      client_secret: credentials.clientSecret,
      refresh_token: credentials.refreshToken,
      grant_type: "refresh_token"
    })
  });

  const body = await response.json();

  if (!response.ok) {
    throw new Error(`Google OAuth failed: ${JSON.stringify(body)}`);
  }

  return body.access_token;
}

async function generateKeywordIdeas(credentials, accessToken) {
  const request = buildKeywordIdeasRequest(credentials.customerId);
  const response = await fetch(
    `https://googleads.googleapis.com/${API_VERSION}/customers/${credentials.customerId}:generateKeywordIdeas`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "developer-token": credentials.developerToken,
        ...(credentials.loginCustomerId ? { "login-customer-id": credentials.loginCustomerId } : {}),
        "Content-Type": "application/json"
      },
      body: JSON.stringify(request)
    }
  );

  const body = await response.json();

  if (!response.ok) {
    throw new Error(`Google Ads API failed: ${JSON.stringify(body)}`);
  }

  return (body.results || []).map(normalizeIdea);
}

function buildKeywordIdeasRequest(customerId) {
  const request = {
    customerId,
    keywordPlanNetwork: process.env.GOOGLE_ADS_KEYWORD_PLAN_NETWORK || "GOOGLE_SEARCH_AND_PARTNERS"
  };

  const keywordSeeds = readKeywordSeeds();
  const pageUrl = process.env.GOOGLE_ADS_PAGE_URL || seeds.pageUrl;

  if (keywordSeeds.length && pageUrl) {
    request.keywordAndUrlSeed = { keywords: keywordSeeds, url: pageUrl };
  } else if (keywordSeeds.length) {
    request.keywordSeed = { keywords: keywordSeeds };
  } else if (pageUrl) {
    request.urlSeed = { url: pageUrl };
  } else {
    throw new Error("At least one keyword seed or pageUrl is required.");
  }

  const languageId = process.env.GOOGLE_ADS_LANGUAGE_ID || seeds.languageId;
  if (languageId) request.language = `languageConstants/${languageId}`;

  const geoTargetConstants = getGeoTargetConstants();
  if (geoTargetConstants.length) {
    request.geoTargetConstants = geoTargetConstants.map((id) => `geoTargetConstants/${id}`);
  }

  return request;
}

function readKeywordSeeds() {
  const envSeeds = process.env.GOOGLE_ADS_KEYWORD_SEEDS;
  if (envSeeds) {
    return envSeeds
      .split(",")
      .map((seed) => seed.trim())
      .filter(Boolean);
  }

  return seeds.keywordSeeds || [];
}

function getGeoTargetConstants() {
  const envValue = process.env.GOOGLE_ADS_GEO_TARGET_CONSTANTS;
  if (envValue) {
    return envValue
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return seeds.geoTargetConstants || [];
}

function normalizeIdea(result) {
  const metrics = result.keywordIdeaMetrics || {};
  const avgMonthlySearches = Number(metrics.avgMonthlySearches || 0);
  const competitionIndex = Number(metrics.competitionIndex || 0);
  const lowTopOfPageBidMicros = Number(metrics.lowTopOfPageBidMicros || 0);
  const highTopOfPageBidMicros = Number(metrics.highTopOfPageBidMicros || 0);

  return {
    text: result.text,
    avgMonthlySearches,
    competition: metrics.competition || "",
    competitionIndex,
    lowTopOfPageBidEur: microsToEur(lowTopOfPageBidMicros),
    highTopOfPageBidEur: microsToEur(highTopOfPageBidMicros),
    score: scoreIdea({ avgMonthlySearches, competitionIndex, lowTopOfPageBidMicros, highTopOfPageBidMicros })
  };
}

function buildReport(ideas, credentials) {
  const sortedIdeas = ideas
    .filter((idea) => idea.text)
    .sort((a, b) => b.score - a.score || b.avgMonthlySearches - a.avgMonthlySearches);

  return {
    generatedAt: new Date().toISOString(),
    apiVersion: API_VERSION,
    customerId: maskId(credentials.customerId),
    loginCustomerId: credentials.loginCustomerId ? maskId(credentials.loginCustomerId) : "",
    seeds: {
      pageUrl: process.env.GOOGLE_ADS_PAGE_URL || seeds.pageUrl,
      keywordSeeds: readKeywordSeeds(),
      geoTargetConstants: getGeoTargetConstants(),
      languageId: process.env.GOOGLE_ADS_LANGUAGE_ID || seeds.languageId || ""
    },
    ideas: sortedIdeas.slice(0, 100),
    editorialRecommendations: sortedIdeas.slice(0, 25).map((idea) => ({
      keyword: idea.text,
      suggestedArticle: articleTitleFor(idea.text),
      reason: reasonFor(idea)
    }))
  };
}

function renderMarkdown(report) {
  const lines = [
    "# Google Ads Keyword Ideas",
    "",
    `Generat: ${report.generatedAt}`,
    `Customer ID: ${report.customerId}`,
    "",
    "## Seeds",
    "",
    `- URL: ${report.seeds.pageUrl || "No configurada"}`,
    `- Keywords: ${report.seeds.keywordSeeds.join(", ")}`,
    `- Geo targets: ${report.seeds.geoTargetConstants.join(", ") || "No configurats"}`,
    `- Language: ${report.seeds.languageId || "No configurat"}`,
    "",
    "## Top keyword ideas",
    ""
  ];

  if (!report.ideas.length) {
    lines.push("Encara no hi ha dades. Revisa credencials, customer ID i permisos de Google Ads.");
  } else {
    for (const idea of report.ideas.slice(0, 30)) {
      lines.push(
        `- ${idea.text}: ${idea.avgMonthlySearches} cerques/mes, competència ${idea.competition || "n/d"}, CPC ${idea.lowTopOfPageBidEur}-${idea.highTopOfPageBidEur} EUR, score ${idea.score}`
      );
    }
  }

  lines.push("", "## Recomanacions editorials", "");

  for (const recommendation of report.editorialRecommendations.slice(0, 15)) {
    lines.push(`- ${recommendation.suggestedArticle}: ${recommendation.reason}`);
  }

  lines.push("");
  return `${lines.join("\n")}\n`;
}

function scoreIdea({ avgMonthlySearches, competitionIndex, lowTopOfPageBidMicros, highTopOfPageBidMicros }) {
  const volumeScore = Math.log10(avgMonthlySearches + 10) * 28;
  const competitionPenalty = Math.max(0, competitionIndex - 65) * 0.25;
  const commercialSignal = Math.min(22, (lowTopOfPageBidMicros + highTopOfPageBidMicros) / 1000000);
  return round(volumeScore + commercialSignal - competitionPenalty);
}

function articleTitleFor(keyword) {
  const normalized = keyword.charAt(0).toUpperCase() + keyword.slice(1);
  if (keyword.toLowerCase().includes("ressen")) return `${normalized}: guia per restaurants`;
  if (keyword.toLowerCase().includes("post")) return `${normalized}: idees i exemples`;
  if (keyword.toLowerCase().includes("seo")) return `${normalized}: què ha de prioritzar un restaurant`;
  return `${normalized}: guia pràctica per restaurants`;
}

function reasonFor(idea) {
  if (idea.avgMonthlySearches >= 100 && idea.competitionIndex <= 65) {
    return "bon equilibri entre volum i competència";
  }

  if (idea.lowTopOfPageBidEur > 0.5 || idea.highTopOfPageBidEur > 1) {
    return "senyal comercial útil per landing, Ads o contingut transaccional";
  }

  return "tema útil per reforçar clústers SEO/GEO";
}

function normalizeCustomerId(value) {
  return String(value || "").replace(/-/g, "").trim();
}

function maskId(value) {
  const normalized = normalizeCustomerId(value);
  if (normalized.length <= 4) return normalized;
  return `${normalized.slice(0, 3)}***${normalized.slice(-3)}`;
}

function microsToEur(value) {
  return round(value / 1000000);
}

function round(value) {
  return Math.round(value * 100) / 100;
}
