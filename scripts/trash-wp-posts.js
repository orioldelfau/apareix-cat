const WP_URL = (process.env.WP_URL || "https://apareix.cat").replace(/\/$/, "");
const WP_USER = process.env.WP_USER;
const WP_APP_PASSWORD = process.env.WP_APP_PASSWORD || process.env.WP_PASS;
const slugs = process.argv.slice(2).filter(Boolean);

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

async function main() {
  if (!WP_USER || !WP_APP_PASSWORD) {
    throw new Error("Missing WP_USER and WP_APP_PASSWORD. Use a WordPress Application Password.");
  }

  if (!slugs.length) {
    throw new Error("Pass one or more post slugs to trash.");
  }

  const wp = createWordPressClient();
  const results = [];

  for (const slug of slugs) {
    const matches = await wp(
      `/posts?slug=${encodeURIComponent(slug)}&status=publish&context=edit&_fields=id,slug,status,title`
    );

    if (!matches.length) {
      results.push({ slug, action: "not_found" });
      continue;
    }

    for (const post of matches) {
      const trashed = await wp(`/posts/${post.id}`, {
        method: "DELETE",
        body: JSON.stringify({ force: false })
      });
      results.push({
        slug,
        id: post.id,
        previousStatus: post.status,
        action: "trashed",
        newStatus: trashed.status
      });
    }
  }

  console.log(JSON.stringify({ ok: true, results }, null, 2));
}

function createWordPressClient() {
  const auth = Buffer.from(`${WP_USER}:${WP_APP_PASSWORD}`).toString("base64");

  return async function wp(pathname, options = {}) {
    const response = await fetch(`${WP_URL}/wp-json/wp/v2${pathname}`, {
      ...options,
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
        ...(options.headers || {})
      }
    });

    const text = await response.text();
    const body = text ? JSON.parse(text) : null;

    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}: ${text}`);
    }

    return body;
  };
}
