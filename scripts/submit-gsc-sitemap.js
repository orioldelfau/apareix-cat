const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const CONFIG_PATH = path.join(ROOT, "data", "site-config.json");
const config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));

const SITE_URL = process.env.SEARCH_CONSOLE_SITE_URL || config.searchConsoleProperty || "https://apareix.cat/";
const SITEMAP_URL = process.env.SEARCH_CONSOLE_SITEMAP_URL || `${config.siteUrl || "https://apareix.cat"}/sitemap_index.xml`;
const REQUIRED = process.env.SEARCH_CONSOLE_SUBMIT_REQUIRED === "true";

main().catch((error) => {
  if (REQUIRED) {
    console.error(error.message);
    process.exit(1);
  }

  console.log(JSON.stringify({ ok: false, skipped: true, reason: error.message }, null, 2));
});

async function main() {
  const auth = loadGoogleOAuth();
  const token = await getOAuthAccessToken(auth);
  const result = await submitSitemap(token);
  console.log(JSON.stringify(result, null, 2));
}

function loadGoogleOAuth() {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_OAUTH_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      "Missing Google OAuth credentials. Add GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET and GOOGLE_OAUTH_REFRESH_TOKEN."
    );
  }

  return { clientId, clientSecret, refreshToken };
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

async function submitSitemap(token) {
  const endpoint = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(
    SITE_URL
  )}/sitemaps/${encodeURIComponent(SITEMAP_URL)}`;
  const response = await fetch(endpoint, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` }
  });
  const text = await response.text();

  if (!response.ok) {
    const result = {
      ok: false,
      status: response.status,
      siteUrl: SITE_URL,
      sitemapUrl: SITEMAP_URL,
      body: text.slice(0, 500)
    };

    if (REQUIRED) throw new Error(`Search Console sitemap submit failed: ${JSON.stringify(result)}`);
    return result;
  }

  return {
    ok: true,
    status: response.status,
    siteUrl: SITE_URL,
    sitemapUrl: SITEMAP_URL,
    submittedAt: new Date().toISOString()
  };
}
