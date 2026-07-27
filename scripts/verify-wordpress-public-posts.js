const WP_URL = (process.env.WP_URL || process.env.WP_SITE_URL || "https://apareix.cat").replace(/\/$/, "");
const WP_USER = process.env.WP_USER || process.env.WP_USERNAME;
const WP_APP_PASSWORD = process.env.WP_APP_PASSWORD || process.env.WP_PASS;
const LIMIT = Number(process.env.WP_VERIFY_POST_LIMIT || 10);

const auth = WP_USER && WP_APP_PASSWORD ? Buffer.from(`${WP_USER}:${WP_APP_PASSWORD}`).toString("base64") : "";

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

async function main() {
  const posts = await fetchPosts();
  const results = [];

  for (const post of posts) {
    const response = await fetch(post.link, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; ApareixBot/1.0; +https://apareix.cat/)"
      }
    });
    const html = await response.text();
    const title = strip(post.title?.rendered || "");
    const ok = response.ok && html.length > 1000 && html.includes(title.slice(0, Math.min(24, title.length)));
    results.push({ id: post.id, slug: post.slug, url: post.link, status: response.status, bytes: html.length, ok });
  }

  const failed = results.filter((result) => !result.ok);
  console.log(JSON.stringify({ ok: failed.length === 0, checked: results.length, failed, results }, null, 2));

  if (failed.length) {
    throw new Error(`Public WordPress post verification failed for ${failed.length} URL(s).`);
  }
}

async function fetchPosts() {
  const headers = auth ? { Authorization: `Basic ${auth}` } : {};
  const response = await fetch(
    `${WP_URL}/wp-json/wp/v2/posts?per_page=${LIMIT}&status=publish&orderby=date&order=desc&_fields=id,slug,link,title`,
    { headers }
  );
  const text = await response.text();

  if (!response.ok) {
    throw new Error(`Could not fetch WordPress posts: ${response.status} ${text.slice(0, 500)}`);
  }

  return text ? JSON.parse(text) : [];
}

function strip(value) {
  return String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
