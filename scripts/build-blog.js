const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const CONFIG_PATH = path.join(ROOT, "data", "site-config.json");
const POSTS_PATH = path.join(ROOT, "data", "blog-posts.json");
const BLOG_DIR = path.join(ROOT, "blog");
const POSTS_DIR = path.join(BLOG_DIR, "posts");
const siteConfig = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
const SITE_URL = siteConfig.siteUrl.replace(/\/$/, "");

const posts = JSON.parse(fs.readFileSync(POSTS_PATH, "utf8")).sort((a, b) =>
  b.date.localeCompare(a.date)
);

fs.mkdirSync(POSTS_DIR, { recursive: true });

for (const post of posts) {
  fs.writeFileSync(path.join(POSTS_DIR, `${post.slug}.html`), renderPost(post), "utf8");
}

fs.writeFileSync(path.join(BLOG_DIR, "index.html"), renderBlogIndex(posts), "utf8");
fs.writeFileSync(path.join(ROOT, "sitemap.xml"), renderSitemap(posts), "utf8");
fs.writeFileSync(path.join(ROOT, "rss.xml"), renderRss(posts), "utf8");
fs.writeFileSync(path.join(ROOT, "llms-full.txt"), renderLlmsFull(posts), "utf8");

function renderBlogIndex(items) {
  const cards = items
    .map(
      (post) => `
        <article class="post-card">
          <p class="eyebrow">${escapeHtml(post.category)} · ${formatDate(post.date)}</p>
          <h2><a href="posts/${post.slug}.html">${escapeHtml(post.title)}</a></h2>
          <p>${escapeHtml(post.description)}</p>
          <a class="read-link" href="posts/${post.slug}.html">Llegir article</a>
        </article>`
    )
    .join("\n");

  return basePage({
    title: "Blog Apareix | Google Maps i SEO local per restaurants",
    description:
      "Articles practics sobre Google Maps, ressenyes, posts i SEO local per restaurants.",
    canonical: `${SITE_URL}/blog/`,
    depth: "blog",
    body: `
      <header class="blog-hero">
        <p class="eyebrow">Blog Apareix</p>
        <h1>Google Maps, ressenyes i SEO local per restaurants.</h1>
        <p>Guies practiques per restaurants que volen tenir una fitxa mes activa, clara i orientada a generar accions locals.</p>
      </header>
      <section class="post-grid" aria-label="Articles del blog">
        ${cards}
      </section>`
  });
}

function renderPost(post) {
  const directAnswerHtml = post.directAnswer
    ? `<aside class="direct-answer">
        <h2>Resposta curta</h2>
        <p>${escapeHtml(post.directAnswer)}</p>
      </aside>`
    : "";

  const sectionHtml = post.sections
    .map(
      (section) => `
        <section>
          <h2>${escapeHtml(section.heading)}</h2>
          <p>${escapeHtml(section.body)}</p>
        </section>`
    )
    .join("\n");
  const faqHtml = Array.isArray(post.faqs)
    ? `<section class="faq-block">
        <h2>Preguntes frequents</h2>
        ${post.faqs
          .map(
            (faq) => `
              <details>
                <summary>${escapeHtml(faq.question)}</summary>
                <p>${escapeHtml(faq.answer)}</p>
              </details>`
          )
          .join("\n")}
      </section>`
    : "";
  const entityHtml = Array.isArray(post.entities)
    ? `<ul class="entity-list" aria-label="Entitats relacionades">
        ${post.entities.map((entity) => `<li>${escapeHtml(entity)}</li>`).join("\n")}
      </ul>`
    : "";

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.date,
    author: {
      "@type": "Organization",
      name: "Apareix"
    },
    publisher: {
      "@type": "Organization",
      name: "Apareix"
    },
    keywords: post.keywords,
    about: (post.entities || []).map((entity) => ({
      "@type": "Thing",
      name: entity
    })),
    mainEntityOfPage: `${SITE_URL}/blog/posts/${post.slug}.html`
  };
  const schema = [articleSchema, breadcrumbSchema(post)];

  return basePage({
    title: `${post.title} | Apareix`,
    description: post.description,
    canonical: `${SITE_URL}/blog/posts/${post.slug}.html`,
    structuredData: schema,
    depth: "post",
    body: `
      <article class="article">
        <header class="article-header">
          <a class="back-link" href="../index.html">Blog</a>
          <p class="eyebrow">${escapeHtml(post.category)} · ${formatDate(post.date)} · ${post.readingMinutes} min</p>
          <h1>${escapeHtml(post.title)}</h1>
          <p>${escapeHtml(post.intro)}</p>
          ${entityHtml}
        </header>
        ${directAnswerHtml}
        ${sectionHtml}
        ${faqHtml}
        <aside class="article-cta">
          <h2>Vols tenir Google Maps actiu cada setmana?</h2>
          <p>${escapeHtml(post.cta)}</p>
          <a class="button primary" href="../../index.html#contacte" data-conversion="blog_cta_click">Començar per 50 EUR/mes</a>
        </aside>
      </article>`
  });
}

function basePage({ title, description, canonical, body, structuredData, depth }) {
  const schema = structuredData
    ? `<script type="application/ld+json">${JSON.stringify(structuredData)}</script>`
    : "";
  const rootPrefix = depth === "post" ? "../../" : "../";
  const blogHref = depth === "post" ? "../index.html" : "./";
  const cssHref = depth === "post" ? "../../blog.css" : "../blog.css";

  return `<!doctype html>
<html lang="ca">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <link rel="canonical" href="${canonical}" />
    <link rel="alternate" type="application/rss+xml" title="Blog Apareix" href="${SITE_URL}/rss.xml" />
    <link rel="stylesheet" href="${cssHref}" />
    ${renderVerificationMeta()}
    ${renderMeasurementHead(rootPrefix)}
    ${schema}
  </head>
  <body>
    <header class="site-header">
      <a class="brand" href="${rootPrefix}index.html"><span>A</span><strong>Apareix</strong></a>
      <nav>
        <a href="${rootPrefix}index.html#servei">Servei</a>
        <a href="${rootPrefix}index.html#preu">Preu</a>
        <a href="${blogHref}">Blog</a>
        <a href="${rootPrefix}index.html#contacte">Començar</a>
      </nav>
    </header>
    <main>
      ${body}
    </main>
    <footer class="footer">
      <strong>Apareix</strong>
      <span>Google Maps i Business Profile per restaurants.</span>
    </footer>
  </body>
</html>`;
}

function renderSitemap(items) {
  const urls = [
    { loc: `${SITE_URL}/`, priority: "1.0" },
    { loc: `${SITE_URL}/blog/`, priority: "0.8" },
    ...items.map((post) => ({
      loc: `${SITE_URL}/blog/posts/${post.slug}.html`,
      lastmod: post.date,
      priority: "0.7"
    }))
  ];

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) => `  <url>
    <loc>${url.loc}</loc>${url.lastmod ? `\n    <lastmod>${url.lastmod}</lastmod>` : ""}
    <priority>${url.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>
`;
}

function renderRss(items) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Blog Apareix</title>
    <link>${SITE_URL}/blog/</link>
    <description>Google Maps i SEO local per restaurants.</description>
${items
  .map(
    (post) => `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${SITE_URL}/blog/posts/${post.slug}.html</link>
      <guid>${SITE_URL}/blog/posts/${post.slug}.html</guid>
      <pubDate>${new Date(`${post.date}T08:00:00Z`).toUTCString()}</pubDate>
      <description>${escapeXml(post.description)}</description>
    </item>`
  )
  .join("\n")}
  </channel>
</rss>
`;
}

function renderLlmsFull(items) {
  return `# Apareix

Apareix ajuda restaurants a mantenir Google Maps i Google Business Profile actius amb posts, ressenyes i informes mensuals per 50 EUR/mes.

## Servei

- Nixo: restaurants independents i petits grups locals.
- Oferta: subscripcio mensual de 50 EUR amb configuracio inicial, optimitzacio de fitxa, posts setmanals, revisio de ressenyes i informe mensual.
- Objectiu: ajudar restaurants a tenir mes visibilitat local i convertir millor les cerques a Google Maps.

## Articles

${items
  .map(
    (post) => `### ${post.title}

URL: ${SITE_URL}/blog/posts/${post.slug}.html
Categoria: ${post.category}
Resposta curta: ${post.directAnswer || post.description}
Entitats: ${(post.entities || []).join(", ")}
`
  )
  .join("\n")}
`;
}

function breadcrumbSchema(post) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Apareix",
        item: `${SITE_URL}/`
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Blog",
        item: `${SITE_URL}/blog/`
      },
      {
        "@type": "ListItem",
        position: 3,
        name: post.title,
        item: `${SITE_URL}/blog/posts/${post.slug}.html`
      }
    ]
  };
}

function renderVerificationMeta() {
  if (!siteConfig.googleSearchConsoleVerification) return "";
  return `<meta name="google-site-verification" content="${escapeHtml(siteConfig.googleSearchConsoleVerification)}" />`;
}

function renderMeasurementHead(rootPrefix) {
  const tagIds = [
    siteConfig.googleAnalyticsMeasurementId,
    siteConfig.googleAdsConversionId
  ].filter(Boolean);

  const publicConfig = {
    googleAnalyticsMeasurementId: siteConfig.googleAnalyticsMeasurementId,
    googleAdsConversionId: siteConfig.googleAdsConversionId,
    googleAdsConversionLabel: siteConfig.googleAdsConversionLabel
  };

  const bootstrap = `<script>window.APAREIX_MEASUREMENT=${JSON.stringify(publicConfig)};</script>
    <script defer src="${rootPrefix}assets/measurement.js"></script>`;

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

function formatDate(value) {
  return new Intl.DateTimeFormat("ca", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(new Date(`${value}T12:00:00Z`));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeXml(value) {
  return escapeHtml(value);
}

function escapeJs(value) {
  return String(value).replaceAll("\\", "\\\\").replaceAll("'", "\\'");
}
