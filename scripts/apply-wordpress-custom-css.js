const fs = require("fs");
const path = require("path");

const siteUrl = process.env.WP_SITE_URL || "https://apareix.cat";
const username = process.env.WP_USERNAME;
const appPassword = process.env.WP_APP_PASSWORD;
const stylesheet = process.env.WP_STYLESHEET || "hello-elementor";
const pageId = process.env.WP_PAGE_ID;
const cssPath = process.argv[2] || "wordpress/apareix-live-design-fixes.css";

if (!username || !appPassword) {
  console.error("Missing WP_USERNAME or WP_APP_PASSWORD.");
  process.exit(1);
}

const absoluteCssPath = path.resolve(process.cwd(), cssPath);
const css = fs.readFileSync(absoluteCssPath, "utf8");
const baseUrl = siteUrl.replace(/\/$/, "");
const endpoint = `${baseUrl}/wp-json/wp/v2/custom_css/${encodeURIComponent(stylesheet)}`;
const auth = Buffer.from(`${username}:${appPassword}`).toString("base64");

async function main() {
  const response = await postJson(endpoint, {
    content: css,
    status: "publish"
  });

  if (response.ok) {
    const parsed = await response.json();
    console.log(`Updated WordPress custom CSS for ${stylesheet}: ${parsed.link || endpoint}`);
    return;
  }

  const body = await response.text();
  if (response.status !== 404 || !pageId) {
    console.error(`WordPress CSS update failed: ${response.status}`);
    console.error(body);
    if (!pageId) {
      console.error("Set WP_PAGE_ID=12 to inject the CSS into the Elementor page as a fallback.");
    }
    process.exit(1);
  }

  await updatePageContent();
}

async function updatePageContent() {
  const pageEndpoint = `${baseUrl}/wp-json/wp/v2/pages/${encodeURIComponent(pageId)}`;
  const pageResponse = await fetch(`${pageEndpoint}?context=edit`, {
    headers: {
      Authorization: `Basic ${auth}`
    }
  });

  const pageBody = await pageResponse.text();
  if (!pageResponse.ok) {
    console.error(`WordPress page read failed: ${pageResponse.status}`);
    console.error(pageBody);
    process.exit(1);
  }

  const page = JSON.parse(pageBody);
  const raw = page.content && page.content.raw;
  if (!raw) {
    console.error("WordPress page did not return editable raw content.");
    process.exit(1);
  }

  const nextContent = injectCssBlock(raw, css);
  if (nextContent === raw) {
    console.log("WordPress page already contains the latest design fixes.");
    return;
  }

  const updateResponse = await postJson(pageEndpoint, {
    content: nextContent
  });

  const updateBody = await updateResponse.text();
  if (!updateResponse.ok) {
    console.error(`WordPress page update failed: ${updateResponse.status}`);
    console.error(updateBody);
    process.exit(1);
  }

  const updated = JSON.parse(updateBody);
  console.log(`Injected design fixes into WordPress page ${pageId}: ${updated.link || pageEndpoint}`);
}

function injectCssBlock(content, nextCss) {
  const start = "<!-- APAREIX_LIVE_DESIGN_FIXES_START -->";
  const end = "<!-- APAREIX_LIVE_DESIGN_FIXES_END -->";
  const block = `${start}\n<style id="apareix-live-design-fixes">\n${nextCss.trim()}\n</style>\n${end}`;
  const existing = new RegExp(`${escapeRegExp(start)}[\\s\\S]*?${escapeRegExp(end)}`);

  if (existing.test(content)) {
    return content.replace(existing, block);
  }

  if (content.includes('<div class="apx">')) {
    return content.replace('<div class="apx">', `${block}\n<div class="apx">`);
  }

  return `${block}\n${content}`;
}

function postJson(url, body) {
  return fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
