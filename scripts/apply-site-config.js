const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const config = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "site-config.json"), "utf8"));
const indexPath = path.join(ROOT, "index.html");
const html = fs.readFileSync(indexPath, "utf8");

const replacement = `<!-- APAREIX_SITE_CONFIG_START -->
    ${renderVerificationMeta()}
    ${renderMeasurementHead()}
    <!-- APAREIX_SITE_CONFIG_END -->`;

const nextHtml = html.replace(
  /<!-- APAREIX_SITE_CONFIG_START -->[\s\S]*?<!-- APAREIX_SITE_CONFIG_END -->/,
  replacement
);

fs.writeFileSync(indexPath, nextHtml, "utf8");
console.log("Applied site config to index.html");

function renderVerificationMeta() {
  if (!config.googleSearchConsoleVerification) return "";
  return `<meta name="google-site-verification" content="${escapeHtml(config.googleSearchConsoleVerification)}" />`;
}

function renderMeasurementHead() {
  const tagIds = [
    config.googleAnalyticsMeasurementId,
    config.googleAdsConversionId
  ].filter(Boolean);

  const publicConfig = {
    googleAnalyticsMeasurementId: config.googleAnalyticsMeasurementId,
    googleAdsConversionId: config.googleAdsConversionId,
    googleAdsConversionLabel: config.googleAdsConversionLabel
  };

  const bootstrap = `<script>window.APAREIX_MEASUREMENT=${JSON.stringify(publicConfig)};</script>
    <script defer src="assets/measurement.js"></script>`;

  if (tagIds.length === 0) return bootstrap;

  return `<script async src="https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(tagIds[0])}"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      ${tagIds.map((id) => `gtag('config', '${escapeJs(id)}');`).join("\n      ")}
    </script>
    ${bootstrap}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeJs(value) {
  return String(value).replaceAll("\\", "\\\\").replaceAll("'", "\\'");
}
