const WP_URL = (process.env.WP_URL || "https://apareix.cat").replace(/\/$/, "");
const WP_USER = process.env.WP_USER;
const WP_APP_PASSWORD = process.env.WP_APP_PASSWORD || process.env.WP_PASS;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const NOTIFY_TO = process.env.APAREIX_OWNER_EMAIL || "hola@orioldelfau.com";
const RESEND_FROM = process.env.RESEND_FROM || "Apareix <onboarding@resend.dev>";
const DRY_RUN = process.argv.includes("--dry-run");

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

async function main() {
  if (!WP_USER || !WP_APP_PASSWORD) {
    throw new Error("Missing WP_USER and WP_APP_PASSWORD. Use a WordPress Application Password.");
  }

  const wp = createWordPressClient();
  const drafts = await getEditorialDrafts(wp);
  const results = [];

  for (const draft of drafts) {
    if (DRY_RUN) {
      results.push({ id: draft.id, slug: draft.slug, title: textOf(draft.title), action: "would_publish" });
      continue;
    }

    const post = await wp(`/posts/${draft.id}`, {
      method: "POST",
      body: JSON.stringify({ status: "publish" })
    });
    const notification = await notifyPublication(post);
    results.push({
      id: post.id,
      slug: post.slug,
      status: post.status,
      link: post.link,
      action: "published",
      notification
    });
  }

  console.log(JSON.stringify({ ok: true, count: results.length, results }, null, 2));
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

async function getEditorialDrafts(wp) {
  const drafts = [];
  let page = 1;

  while (page <= 10) {
    const posts = await wp(
      `/posts?status=draft&per_page=100&page=${page}&context=edit&_fields=id,slug,status,title,content,link`
    );

    drafts.push(
      ...posts.filter((post) => {
        const content = post.content?.raw || post.content?.rendered || "";
        return content.includes("apx-article");
      })
    );

    if (posts.length < 100) break;
    page += 1;
  }

  return drafts;
}

async function notifyPublication(post) {
  if (!RESEND_API_KEY) {
    return { sent: false, reason: "missing_resend_api_key" };
  }

  const title = textOf(post.title);
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: RESEND_FROM,
      to: NOTIFY_TO,
      subject: `Article publicat a Apareix: ${title}`,
      text: [`S'ha publicat un article al blog d'Apareix.`, "", `Titol: ${title}`, `URL: ${post.link}`].join("\n"),
      html: `<p>S'ha publicat un article al blog d'Apareix.</p><p><strong>${escapeHtml(
        title
      )}</strong></p><p><a href="${escapeHtml(post.link)}">${escapeHtml(post.link)}</a></p>`
    })
  });

  const text = await response.text();
  if (!response.ok) {
    return { sent: false, reason: `resend_${response.status}`, body: text.slice(0, 240) };
  }

  const json = text ? JSON.parse(text) : {};
  return { sent: true, id: json.id || null, to: NOTIFY_TO };
}

function textOf(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value.raw || value.rendered?.replace(/<[^>]+>/g, "") || "";
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
