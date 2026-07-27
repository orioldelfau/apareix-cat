const fs = require("fs");

const WP_URL = (process.env.WP_URL || process.env.WP_SITE_URL || "https://apareix.cat").replace(/\/$/, "");
const WP_USER = process.env.WP_USER || process.env.WP_USERNAME;
const WP_APP_PASSWORD = process.env.WP_APP_PASSWORD || process.env.WP_PASS;
const WP_BLOG_PAGE_ID = process.env.WP_BLOG_PAGE_ID || "93";
const LIMIT = Number(process.env.WP_BLOG_POST_LIMIT || 60);

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
  const posts = await fetchPosts();
  if (!posts.length) {
    throw new Error("No published WordPress posts found for the blog index.");
  }

  const page = await wp(`/pages/${encodeURIComponent(WP_BLOG_PAGE_ID)}?context=edit`);
  const html = renderBlogIndex(posts);
  const payload = {
    title: "Blog | Apareix",
    excerpt: "Guies d'Apareix sobre Google Maps, SEO local, ressenyes i visibilitat per restaurants.",
    content: html
  };

  if (page.meta?._elementor_data) {
    payload.meta = {
      _elementor_data: replaceElementorHtmlWidget(page.meta._elementor_data, html)
    };
  }

  const updated = await wp(`/pages/${encodeURIComponent(WP_BLOG_PAGE_ID)}`, {
    method: "POST",
    body: JSON.stringify(payload)
  });

  await purgeCaches();

  console.log(
    JSON.stringify(
      {
        ok: true,
        page: updated.link || `${WP_URL}/blog/`,
        posts: posts.length,
        latestPost: posts[0].link
      },
      null,
      2
    )
  );
}

async function fetchPosts() {
  const fields = "id,slug,link,title,excerpt,date,modified,featured_media";
  const posts = await wp(`/posts?per_page=${LIMIT}&status=publish&orderby=date&order=desc&_fields=${fields}`);
  return posts.filter((post) => post.link && post.title?.rendered);
}

async function wp(pathname, options = {}) {
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
    throw new Error(`${response.status} ${response.statusText}: ${text.slice(0, 500)}`);
  }

  return body;
}

function replaceElementorHtmlWidget(rawData, nextHtml) {
  let data;
  try {
    data = JSON.parse(rawData);
  } catch {
    return rawData;
  }

  let changed = false;
  visitElementorNodes(data, (node) => {
    const currentHtml = node?.settings?.html;
    if (typeof currentHtml !== "string") return;
    if (!currentHtml.includes('<div class="apx">') && !currentHtml.includes("apx-blog-hero")) return;
    node.settings.html = `\n${nextHtml}`;
    changed = true;
  });

  return changed ? JSON.stringify(data) : rawData;
}

function visitElementorNodes(nodes, callback) {
  if (!Array.isArray(nodes)) return;
  for (const node of nodes) {
    callback(node);
    visitElementorNodes(node.elements, callback);
  }
}

function renderBlogIndex(posts) {
  const [featured, ...rest] = posts;
  const cards = rest.map(renderPostCard).join("");

  return `<style>${css()}</style><div class="apx apx-blog-index"><nav class="apx-nav"><div class="apx-wrap"><a class="apx-brand" href="/">Apareix<span>.</span></a><div class="apx-links"><a href="/#producte">Producte</a><a href="/#preu">Preu</a><a href="/blog/">Blog</a><a href="/#activar-apareix" class="apx-pill">Demo gratuïta</a></div></div></nav><section class="apx-blog-hero"><div class="apx-wrap"><p class="apx-kicker">Blog Apareix</p><h1>SEO local i Google Maps per restaurants.</h1><p class="apx-lead">Guies pràctiques per entendre què millorar a la fitxa, com treballar ressenyes, quins posts publicar i com convertir més cerques locals en clients.</p></div></section><main class="apx-section"><div class="apx-wrap"><a class="apx-featured-post" href="${escapeHtml(featured.link)}"><span>Última guia</span><h2>${escapeHtml(clean(featured.title.rendered))}</h2><p>${escapeHtml(excerpt(featured))}</p><b>Llegir article</b></a><div class="apx-blog-grid">${cards}</div></div></main><section class="apx-blog-cta"><div class="apx-wrap"><h2>Vols una demo gratuïta amb el teu restaurant?</h2><p>Envia el link de Google Maps i Apareix et retorna una primera lectura accionable de la fitxa.</p><a href="/#activar-apareix">Demo gratuïta</a></div></section><footer class="apx-footer"><div class="apx-wrap"><strong>Apareix.cat</strong><a href="/">Inici</a><span>Google Maps i SEO local per restaurants.</span><span>hola@orioldelfau.com</span></div></footer></div>`;
}

function renderPostCard(post) {
  return `<a class="apx-blog-card" href="${escapeHtml(post.link)}"><span>${formatDate(post.date)}</span><h3>${escapeHtml(
    clean(post.title.rendered)
  )}</h3><p>${escapeHtml(excerpt(post))}</p><b>Llegir article</b></a>`;
}

function excerpt(post) {
  const value = clean(post.excerpt?.rendered || "");
  if (value) return truncate(value, 160);
  return "Guia pràctica d'Apareix per millorar visibilitat local, Google Maps i conversió del restaurant.";
}

function formatDate(value) {
  if (!value) return "Guia";
  return new Intl.DateTimeFormat("ca", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

function clean(value) {
  return String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function truncate(value, max) {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1).trim()}…`;
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function css() {
  return `html,body{margin-top:0!important;padding-top:0!important}.apx{--ap-green:#064733;--ap-green-2:#0d6b4d;--ap-cream:#f7f0e5;--ap-ink:#17231d;--ap-line:#e6dccd;--ap-gold:#c28b2c;background:var(--ap-cream);color:var(--ap-ink);font-family:"DM Sans",system-ui,sans-serif}.apx *{box-sizing:border-box}.apx a{text-decoration:none}.apx-wrap{width:min(1120px,calc(100% - 40px));margin:0 auto}.apx-nav{background:#fff9ee;border-bottom:1px solid rgba(6,71,51,.08);padding:18px 0}.apx-nav .apx-wrap,.apx-footer .apx-wrap{display:flex;align-items:center;justify-content:space-between;gap:18px;flex-wrap:wrap}.apx-brand{font-family:Georgia,serif;font-weight:900;color:var(--ap-green);font-size:22px}.apx-brand span{color:var(--ap-gold)}.apx-links{display:flex;align-items:center;gap:22px}.apx-links a{color:#33443b;font-weight:800}.apx-pill{background:var(--ap-green);color:white!important;border-radius:999px;padding:11px 16px}.apx-blog-hero{padding:86px 0;background:radial-gradient(circle at 80% 15%,rgba(194,139,44,.2),transparent 24%),linear-gradient(135deg,#fff9ee,#eef5ec)}.apx-kicker{color:var(--ap-green-2);font-weight:950;text-transform:uppercase;letter-spacing:.22em;font-size:12px}.apx h1,.apx h2,.apx h3{font-family:Georgia,serif;color:var(--ap-green);letter-spacing:-.045em}.apx h1{font-size:clamp(46px,7vw,82px);line-height:.94;max-width:900px;margin:12px 0 20px}.apx-lead{font-size:20px;line-height:1.62;color:#44544b;max-width:760px}.apx-section{padding:74px 0}.apx-featured-post{display:block;background:var(--ap-green);color:white;border-radius:34px;padding:42px;margin-bottom:26px;box-shadow:0 24px 80px rgba(25,34,28,.14)}.apx-featured-post span,.apx-blog-card span{text-transform:uppercase;letter-spacing:.18em;font-size:11px;font-weight:950;color:var(--ap-gold)}.apx-featured-post h2{color:white;font-size:clamp(36px,5vw,60px);line-height:.98;margin:16px 0}.apx-featured-post p{color:rgba(255,255,255,.76);font-size:18px;line-height:1.6;max-width:760px}.apx-featured-post b{color:white}.apx-blog-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}.apx-blog-card{display:block;background:#fffaf1;border:1px solid var(--ap-line);border-radius:24px;padding:24px;min-height:230px;box-shadow:0 18px 60px rgba(25,34,28,.06)}.apx-blog-card h3{font-size:28px;line-height:1.05;margin:14px 0 12px}.apx-blog-card p{color:#526158;line-height:1.58}.apx-blog-card b{color:var(--ap-green);font-weight:950}.apx-blog-cta{background:#03110b;color:white;text-align:center;padding:72px 0}.apx-blog-cta h2{color:white;font-size:44px;margin:0 0 12px}.apx-blog-cta p{color:rgba(255,255,255,.72);font-size:18px}.apx-blog-cta a{display:inline-flex;margin-top:16px;background:white;color:var(--ap-green);font-weight:950;border-radius:999px;padding:14px 20px}.apx-footer{background:#030906;color:rgba(255,255,255,.58);padding:28px 0}.apx-footer strong,.apx-footer a{color:white}@media(max-width:900px){.apx-links{display:none}.apx-blog-grid{grid-template-columns:1fr}.apx-blog-hero,.apx-section,.apx-blog-cta{padding:56px 0}.apx h1{font-size:48px}}`;
}

async function purgeCaches() {
  await fetch(`${WP_URL}/wp-json/elementor/v1/cache`, {
    method: "DELETE",
    headers: { Authorization: `Basic ${auth}` }
  }).catch(() => null);

  await fetch(`${WP_URL}/wp-json/wp-super-cache/v1/cache`, {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
    body: JSON.stringify({ all: true })
  }).catch(() => null);
}
