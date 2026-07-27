const WP_URL = (process.env.WP_URL || process.env.WP_SITE_URL || "https://apareix.cat").replace(/\/$/, "");
const WP_USER = process.env.WP_USER || process.env.WP_USERNAME;
const WP_APP_PASSWORD = process.env.WP_APP_PASSWORD || process.env.WP_PASS;

if (!WP_USER || !WP_APP_PASSWORD) {
  console.error("Missing WP_USER/WP_USERNAME and WP_APP_PASSWORD.");
  process.exit(1);
}

const auth = Buffer.from(`${WP_USER}:${WP_APP_PASSWORD}`).toString("base64");

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

async function main() {
  const settings = await request(`${WP_URL}/wp-json/wp/v2/settings`);
  const updates = {};

  if (settings.url && settings.url.startsWith("http://")) updates.url = settings.url.replace(/^http:/, "https:");
  if (settings.home && settings.home.startsWith("http://")) updates.home = settings.home.replace(/^http:/, "https:");
  if (!settings.home) updates.home = WP_URL;

  let settingsUpdated = false;
  let settingsUpdateError = "";
  if (Object.keys(updates).length) {
    try {
      const response = await request(`${WP_URL}/wp-json/wp/v2/settings`, {
        method: "POST",
        body: JSON.stringify(updates)
      });
      settingsUpdated = Boolean(response);
    } catch (error) {
      settingsUpdateError = error.message;
    }
  }

  const robots = await fetch(`${WP_URL}/robots.txt`).then((response) => response.text());
  const sitemapIndex = await fetch(`${WP_URL}/sitemap_index.xml`).then((response) => response.text());

  const report = {
    ok: true,
    settingsUpdated,
    settingsUpdateError,
    attemptedSettings: updates,
    robotsUsesHttpsSitemap: robots.includes(`Sitemap: ${WP_URL}/sitemap_index.xml`),
    sitemapIndexUsesHttpsChildren: !/<loc>http:\/\//i.test(sitemapIndex),
    recommendations: []
  };

  if (!report.robotsUsesHttpsSitemap) {
    report.recommendations.push(`robots.txt should reference: Sitemap: ${WP_URL}/sitemap_index.xml`);
  }

  if (!report.sitemapIndexUsesHttpsChildren) {
    report.recommendations.push("Yoast sitemap index still contains http:// child sitemap URLs; update WordPress Address/Site Address to HTTPS in WP settings if REST settings could not change it.");
  }

  console.log(JSON.stringify(report, null, 2));
}

async function request(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });
  const text = await response.text();

  if (!response.ok) {
    throw new Error(`${options.method || "GET"} ${url} failed: ${response.status} ${text.slice(0, 500)}`);
  }

  return text ? JSON.parse(text) : null;
}
