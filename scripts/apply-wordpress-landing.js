const fs = require("fs");
const path = require("path");

const siteUrl = process.env.WP_SITE_URL || "https://apareix.cat";
const username = process.env.WP_USERNAME;
const appPassword = process.env.WP_APP_PASSWORD;
const pageId = process.env.WP_PAGE_ID || "12";
const htmlPath = process.argv[2] || "wordpress/apareix-landing.html";
const title = "Apareix | Gestió de Google Maps per a restaurants";
const excerpt =
  "Gestionem cada mes la fitxa de Google Maps del teu restaurant: publicacions, ressenyes, SEO local, informació actualitzada i informe mensual per 50 € al mes.";

if (!username || !appPassword) {
  console.error("Missing WP_USERNAME or WP_APP_PASSWORD.");
  process.exit(1);
}

const baseUrl = siteUrl.replace(/\/$/, "");
const pageEndpoint = `${baseUrl}/wp-json/wp/v2/pages/${encodeURIComponent(pageId)}`;
const auth = Buffer.from(`${username}:${appPassword}`).toString("base64");
const html = fs.readFileSync(path.resolve(process.cwd(), htmlPath), "utf8").trim();

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

async function main() {
  const page = await getJson(`${pageEndpoint}?context=edit`);
  const elementorData = page.meta && page.meta._elementor_data;

  if (!elementorData) {
    throw new Error("WordPress page does not expose _elementor_data.");
  }

  const nextElementorData = replaceElementorHtmlWidget(elementorData, html);
  const payload = {
    title,
    excerpt,
    content: html,
    meta: {
      _elementor_data: nextElementorData
    }
  };

  const updateResponse = await postJson(pageEndpoint, payload);
  if (!updateResponse.ok) {
    throw new Error(`WordPress page update failed: ${updateResponse.status} ${await updateResponse.text()}`);
  }

  await purgeElementorCache();
  await purgeWpSuperCache();

  const updated = await updateResponse.json();
  console.log(`Updated Apareix landing: ${updated.link || pageEndpoint}`);
}

function replaceElementorHtmlWidget(rawData, nextHtml) {
  const data = JSON.parse(rawData);
  let changed = false;

  visitElementorNodes(data, (node) => {
    const currentHtml = node && node.settings && node.settings.html;
    if (typeof currentHtml !== "string" || !currentHtml.includes('<div class="apx">')) return;
    node.settings.html = `\n${nextHtml}`;
    changed = true;
  });

  if (!changed) {
    throw new Error("Could not find the Apareix Elementor HTML widget.");
  }

  return JSON.stringify(data);
}

function visitElementorNodes(nodes, callback) {
  if (!Array.isArray(nodes)) return;
  for (const node of nodes) {
    callback(node);
    visitElementorNodes(node.elements, callback);
  }
}

async function getJson(url) {
  const response = await fetch(url, {
    headers: {
      Authorization: `Basic ${auth}`
    }
  });

  const body = await response.text();
  if (!response.ok) {
    throw new Error(`GET ${url} failed: ${response.status} ${body}`);
  }

  return JSON.parse(body);
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

async function purgeElementorCache() {
  await fetch(`${baseUrl}/wp-json/elementor/v1/cache`, {
    method: "DELETE",
    headers: {
      Authorization: `Basic ${auth}`
    }
  }).catch(() => null);
}

async function purgeWpSuperCache() {
  await fetch(`${baseUrl}/wp-json/wp-super-cache/v1/cache`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ all: true })
  }).catch(() => null);
}
