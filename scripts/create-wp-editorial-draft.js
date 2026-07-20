const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const ROOT = process.cwd();
const QUEUE_PATH = process.env.EDITORIAL_QUEUE_PATH
  ? path.resolve(ROOT, process.env.EDITORIAL_QUEUE_PATH)
  : path.join(ROOT, "data", "editorial-queue.json");
const DRY_RUN = process.argv.includes("--dry-run");
const FORCE_SLUG = readArg("--slug") || process.env.ARTICLE_SLUG;
const WP_URL = (process.env.WP_URL || "https://apareix.cat").replace(/\/$/, "");
const WP_USER = process.env.WP_USER;
const WP_APP_PASSWORD = process.env.WP_APP_PASSWORD || process.env.WP_PASS;

const queue = JSON.parse(fs.readFileSync(QUEUE_PATH, "utf8"));

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

async function main() {
  if (DRY_RUN && (!WP_USER || !WP_APP_PASSWORD)) {
    const topic = pickTopic(new Set());
    const draft = buildDraft(topic);
    console.log(JSON.stringify({ queuePath: QUEUE_PATH, topic, draft: previewDraft(draft) }, null, 2));
    return;
  }

  if (!WP_USER || !WP_APP_PASSWORD) {
    throw new Error("Missing WP_USER and WP_APP_PASSWORD. Use a WordPress Application Password.");
  }

  const client = createWordPressClient();
  const existingSlugs = FORCE_SLUG ? new Set() : await getExistingSlugs(client);
  const topic = pickTopic(existingSlugs);
  const draft = buildDraft(topic);

  if (DRY_RUN) {
    console.log(JSON.stringify({ topic, draft: previewDraft(draft) }, null, 2));
    return;
  }

  const categoryId = await ensureCategory(client, topic.category);
  const media = await uploadFeaturedImage(client, topic);
  const post = await createDraftPost(client, draft, categoryId, media);
  const verified = await verifyYoast(client, post.id);

  console.log(
    JSON.stringify(
      {
        ok: true,
        id: post.id,
        status: post.status,
        edit: `${WP_URL}/wp-admin/post.php?post=${post.id}&action=edit`,
        preview: post.link,
        featuredMedia: media?.id || null,
        yoast: verified
      },
      null,
      2
    )
  );
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

async function getExistingSlugs(wp) {
  const posts = await wp("/posts?per_page=100&status=publish,draft,future,pending,private&_fields=slug");
  return new Set(posts.map((post) => post.slug));
}

function pickTopic(existingSlugs) {
  if (FORCE_SLUG) {
    const topic = queue.topics.find((item) => item.slug === FORCE_SLUG);
    if (!topic) throw new Error(`No topic found for slug: ${FORCE_SLUG}`);
    return topic;
  }

  const topic = queue.topics.find((item) => !existingSlugs.has(item.slug));
  if (!topic) {
    throw new Error(`No unused topics left in ${QUEUE_PATH}.`);
  }

  return topic;
}

function buildDraft(topic) {
  const html = renderArticle(topic);
  return {
    slug: topic.slug,
    title: topic.title,
    excerpt: topic.metaDescription,
    content: plainText(topic),
    elementorHtml: html,
    yoast: {
      focusKeyphrase: topic.focusKeyphrase,
      title: topic.seoTitle,
      description: topic.metaDescription
    }
  };
}

function previewDraft(draft) {
  return {
    slug: draft.slug,
    title: draft.title,
    excerpt: draft.excerpt,
    yoast: draft.yoast,
    contentCharacters: draft.elementorHtml.length
  };
}

async function ensureCategory(wp, categoryName) {
  const existing = await wp(`/categories?search=${encodeURIComponent(categoryName)}&_fields=id,name,slug`);
  const match = existing.find((category) => category.name.toLowerCase() === categoryName.toLowerCase());
  if (match) return match.id;

  const created = await wp("/categories", {
    method: "POST",
    body: JSON.stringify({ name: categoryName })
  });

  return created.id;
}

async function uploadFeaturedImage(wp, topic) {
  const png = renderFeaturedPng(topic);
  const filename = `${topic.slug}.png`;
  const auth = Buffer.from(`${WP_USER}:${WP_APP_PASSWORD}`).toString("base64");
  const response = await fetch(`${WP_URL}/wp-json/wp/v2/media`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "image/png",
      "Content-Disposition": `attachment; filename="${filename}"`
    },
    body: png
  });

  const text = await response.text();
  const body = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(`Could not upload featured image: ${response.status} ${text}`);
  }

  await wp(`/media/${body.id}`, {
    method: "POST",
    body: JSON.stringify({
      alt_text: topic.imageAlt,
      caption: topic.imageAlt,
      title: topic.imageTitle
    })
  });

  return body;
}

async function createDraftPost(wp, draft, categoryId, media) {
  return wp("/posts", {
    method: "POST",
    body: JSON.stringify({
      status: "draft",
      slug: draft.slug,
      title: draft.title,
      excerpt: draft.excerpt,
      content: draft.content,
      categories: [categoryId],
      featured_media: media?.id || 0,
      meta: {
        _yoast_wpseo_focuskw: draft.yoast.focusKeyphrase,
        _yoast_wpseo_title: draft.yoast.title,
        _yoast_wpseo_metadesc: draft.yoast.description,
        _elementor_edit_mode: "builder",
        _elementor_template_type: "wp-post",
        _elementor_data: JSON.stringify(elementorHtml(draft.elementorHtml)),
        _elementor_page_settings: { hide_title: "yes" }
      }
    })
  });
}

async function verifyYoast(wp, postId) {
  const post = await wp(
    `/posts/${postId}?context=edit&_fields=id,meta,yoast_head_json,featured_media,status,slug`
  );

  return {
    focusKeyphrase: post.meta._yoast_wpseo_focuskw,
    title: post.meta._yoast_wpseo_title,
    description: post.meta._yoast_wpseo_metadesc,
    yoastTitle: post.yoast_head_json?.title,
    yoastDescription: post.yoast_head_json?.description,
    featuredMedia: post.featured_media
  };
}

function elementorHtml(html) {
  return [
    {
      id: "apxauto1",
      elType: "section",
      settings: { layout: "full_width", gap: "no" },
      elements: [
        {
          id: "apxautoc",
          elType: "column",
          settings: { _column_size: 100 },
          elements: [
            {
              id: "apxautoh",
              elType: "widget",
              settings: { html },
              elements: [],
              widgetType: "html"
            }
          ],
          isInner: false
        }
      ],
      isInner: false
    }
  ];
}

function renderArticle(topic) {
  const toc = topic.sections
    .map((section) => `<a href="#${slugify(section.heading)}">${escapeHtml(section.heading)}</a>`)
    .join("");
  const sections = topic.sections
    .map(
      (section) => `<section id="${slugify(section.heading)}"><h2>${escapeHtml(section.heading)}</h2><p>${escapeHtml(
        section.body
      )}</p>${renderBullets(section.bullets)}</section>`
    )
    .join("");
  const faqs = topic.faqs
    .map(
      (faq) => `<details><summary>${escapeHtml(faq.question)}</summary><p>${escapeHtml(faq.answer)}</p></details>`
    )
    .join("");
  const geoEntities = renderGeoEntities(topic);
  const internalLinks = renderInternalLinks(topic);
  const intro = topic.intro ? `<p>${escapeHtml(topic.intro)}</p>` : "";
  const nextSteps = renderNextSteps(topic);
  const schema = renderSchema(topic);

  return `${articleCss()}<article class="apx-article"><div class="article-nav"><div class="wrap"><a href="/">Apareix.</a><a href="/blog/">Tornar al blog</a></div></div><header class="hero"><div class="wrap"><div class="crumb">${escapeHtml(
    topic.category
  )}</div><h1>${escapeHtml(topic.title)}</h1><p class="dek">${escapeHtml(
    topic.directAnswer
  )}</p><div class="meta"><span>Esborrany editorial</span><span>${escapeHtml(
    topic.focusKeyphrase
  )}</span><span>Restaurants</span></div>${geoEntities}</div></header><div class="body"><div class="wrap layout"><aside><strong>En aquesta guia</strong>${toc}${internalLinks}</aside><main>${intro}<div class="callout"><strong>Resposta curta</strong><p>${escapeHtml(
    topic.directAnswer
  )}</p></div>${sections}${nextSteps}<section><h2>Preguntes frequents</h2>${faqs}</section><div class="cta"><h2>Vols que Apareix ho revisi cada mes?</h2><p>${escapeHtml(
    topic.cta
  )}</p><a href="/#contacte">Sol·licitar el pla de 50€/mes</a></div></main></div></div></article>${schema}`;
}

function renderFeaturedPng(topic) {
  const width = 1200;
  const height = 675;
  const pixels = Buffer.alloc(width * height * 4);
  const seed = hashString(topic.slug);
  const palette = paletteFor(topic.category, seed);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const t = (x / width + y / height) / 2;
      const base = mixColor(palette.backgroundA, palette.backgroundB, t);
      setPixel(pixels, width, x, y, base[0], base[1], base[2], 255);
    }
  }

  drawCircle(pixels, width, height, 1030 - (seed % 90), 105 + (seed % 70), 155 + (seed % 45), palette.halo);
  drawCircle(pixels, width, height, 90 + (seed % 120), 610 - (seed % 75), 180 + (seed % 55), palette.wash);
  drawRoundedRect(pixels, width, height, 70, 78, 510, 420, 34, [255, 250, 241, 246]);
  drawRoundedRect(pixels, width, height, 620, 130, 420, 370, 38, [255, 255, 255, 255]);
  drawRoundedRect(pixels, width, height, 660, 176, 340, 135, 22, [220, 235, 225, 255]);
  drawRoundedRect(pixels, width, height, 660, 345, 340, 74, 20, [255, 249, 238, 255]);
  drawRoundedRect(pixels, width, height, 660, 443, 230, 26, 13, [230, 220, 203, 255]);
  drawCircle(pixels, width, height, 704, 382, 22, palette.primary);
  drawCheck(pixels, width, height, 694, 379, [255, 255, 255, 255]);
  drawLine(pixels, width, height, 740, 369, 918, 369, [100, 116, 107, 255], 9);
  drawLine(pixels, width, height, 740, 397, 872, 397, [100, 116, 107, 255], 9);
  drawRoundedRect(pixels, width, height, 92, 526, 244, 70, 35, palette.primary);

  const accentCount = Math.min(5, Math.max(3, topic.sections.length));
  for (let index = 0; index < accentCount; index += 1) {
    const y = 155 + index * 56;
    drawRoundedRect(
      pixels,
      width,
      height,
      112,
      y,
      250 + ((seed + index * 47) % 110),
      16,
      8,
      index === 0 ? palette.primary : palette.secondary
    );
  }

  drawMotif(pixels, width, height, seed, palette);
  return encodePng(width, height, pixels);
}

function renderBullets(bullets = []) {
  if (!bullets.length) return "";
  return `<ul class="checklist">${bullets.map((bullet) => `<li>${escapeHtml(bullet)}</li>`).join("")}</ul>`;
}

function renderGeoEntities(topic) {
  const entities = topic.geoEntities || topic.entities || [];
  if (!entities.length) return "";
  return `<div class="geo-entities">${entities.map((entity) => `<span>${escapeHtml(entity)}</span>`).join("")}</div>`;
}

function renderInternalLinks(topic) {
  const links = topic.internalLinks || [
    { label: "Pla mensual Apareix", url: "/#contacte" },
    { label: "Blog de SEO local", url: "/blog/" }
  ];
  return `<div class="internal-links"><strong>Relacionat</strong>${links
    .map((link) => `<a href="${escapeHtml(link.url)}">${escapeHtml(link.label)}</a>`)
    .join("")}</div>`;
}

function renderNextSteps(topic) {
  if (!topic.nextSteps?.length) return "";
  return `<section><h2>Prioritat practica</h2><ol class="steps">${topic.nextSteps
    .map((step) => `<li>${escapeHtml(step)}</li>`)
    .join("")}</ol></section>`;
}

function renderSchema(topic) {
  const article = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: topic.title,
    description: topic.metaDescription,
    inLanguage: "ca",
    about: topic.geoEntities || topic.entities || [topic.focusKeyphrase],
    mainEntityOfPage: `https://apareix.cat/${topic.slug}/`
  };
  const faq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: topic.faqs.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer }
    }))
  };
  return `<script type="application/ld+json">${escapeScript(JSON.stringify([article, faq]))}</script>`;
}

function drawMotif(pixels, width, height, seed, palette) {
  const mode = seed % 4;
  if (mode === 0) {
    for (let index = 0; index < 4; index += 1) {
      const x = 700 + index * 62;
      const y = 205 + ((seed + index * 31) % 72);
      drawCircle(pixels, width, height, x, y, 18, palette.primary);
      drawLine(pixels, width, height, x, y + 16, x - 13, y + 52, palette.primary, 8);
      drawLine(pixels, width, height, x, y + 16, x + 13, y + 52, palette.primary, 8);
    }
    return;
  }

  if (mode === 1) {
    for (let index = 0; index < 5; index += 1) {
      drawCircle(pixels, width, height, 714 + index * 42, 230, 16, palette.primary);
    }
    drawRoundedRect(pixels, width, height, 704, 280, 220, 28, 14, palette.secondary);
    return;
  }

  if (mode === 2) {
    for (let index = 0; index < 4; index += 1) {
      drawRoundedRect(pixels, width, height, 700 + index * 62, 266 - index * 22, 34, 88 + index * 22, 17, palette.primary);
    }
    return;
  }

  for (let index = 0; index < 4; index += 1) {
    const y = 218 + index * 34;
    drawRoundedRect(pixels, width, height, 702, y, 214 - index * 22, 18, 9, index === 0 ? palette.primary : palette.secondary);
  }
}

function paletteFor(category, seed) {
  const alpha = 255;
  if (category === "Ressenyes") {
    return {
      primary: [153, 96 + (seed % 18), 38, alpha],
      secondary: [191, 132, 74, 210],
      backgroundA: [255, 247, 235],
      backgroundB: [241, 229, 211],
      halo: [235, 191, 144, 160],
      wash: [245, 229, 211, 190]
    };
  }
  if (category === "Contingut") {
    return {
      primary: [194, 139, 44, alpha],
      secondary: [221, 177, 83, 210],
      backgroundA: [255, 250, 235],
      backgroundB: [238, 236, 207],
      halo: [239, 214, 163, 170],
      wash: [230, 237, 214, 190]
    };
  }
  if (category === "Metriques" || category === "SEO local") {
    return {
      primary: [20, 80, 107 + (seed % 28), alpha],
      secondary: [65, 119, 136, 210],
      backgroundA: [239, 248, 245],
      backgroundB: [222, 234, 238],
      halo: [188, 218, 227, 170],
      wash: [222, 235, 225, 190]
    };
  }
  return {
    primary: [6, 71 + (seed % 18), 51, alpha],
    secondary: [71, 111, 92, 210],
    backgroundA: [255, 249, 238],
    backgroundB: [224, 238, 228],
    halo: [239, 214, 163, 160],
    wash: [220, 235, 225, 180]
  };
}

function encodePng(width, height, rgba) {
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);

  for (let y = 0; y < height; y += 1) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk("IHDR", Buffer.concat([uint32(width), uint32(height), Buffer.from([8, 6, 0, 0, 0])])),
    pngChunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    pngChunk("IEND", Buffer.alloc(0))
  ]);
}

function pngChunk(type, data) {
  const typeBuffer = Buffer.from(type);
  return Buffer.concat([uint32(data.length), typeBuffer, data, uint32(crc32(Buffer.concat([typeBuffer, data])))]);
}

function uint32(value) {
  const buffer = Buffer.alloc(4);
  buffer.writeUInt32BE(value >>> 0);
  return buffer;
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function setPixel(pixels, width, x, y, r, g, b, a) {
  const offset = (y * width + x) * 4;
  pixels[offset] = r;
  pixels[offset + 1] = g;
  pixels[offset + 2] = b;
  pixels[offset + 3] = a;
}

function blendPixel(pixels, width, x, y, color) {
  const offset = (y * width + x) * 4;
  const alpha = color[3] / 255;
  pixels[offset] = Math.round(color[0] * alpha + pixels[offset] * (1 - alpha));
  pixels[offset + 1] = Math.round(color[1] * alpha + pixels[offset + 1] * (1 - alpha));
  pixels[offset + 2] = Math.round(color[2] * alpha + pixels[offset + 2] * (1 - alpha));
  pixels[offset + 3] = 255;
}

function drawRoundedRect(pixels, width, height, x, y, rectWidth, rectHeight, radius, color) {
  for (let yy = y; yy < y + rectHeight; yy += 1) {
    for (let xx = x; xx < x + rectWidth; xx += 1) {
      if (xx < 0 || xx >= width || yy < 0 || yy >= height) continue;
      const dx = Math.max(x - xx + radius, 0, xx - (x + rectWidth - radius - 1));
      const dy = Math.max(y - yy + radius, 0, yy - (y + rectHeight - radius - 1));
      if (dx * dx + dy * dy <= radius * radius) blendPixel(pixels, width, xx, yy, color);
    }
  }
}

function drawCircle(pixels, width, height, cx, cy, radius, color) {
  for (let y = cy - radius; y <= cy + radius; y += 1) {
    for (let x = cx - radius; x <= cx + radius; x += 1) {
      if (x < 0 || x >= width || y < 0 || y >= height) continue;
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy <= radius * radius) blendPixel(pixels, width, x, y, color);
    }
  }
}

function drawLine(pixels, width, height, x1, y1, x2, y2, color, thickness) {
  const steps = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1));
  for (let i = 0; i <= steps; i += 1) {
    const x = Math.round(x1 + ((x2 - x1) * i) / steps);
    const y = Math.round(y1 + ((y2 - y1) * i) / steps);
    drawCircle(pixels, width, height, x, y, Math.ceil(thickness / 2), color);
  }
}

function drawCheck(pixels, width, height, x, y, color) {
  drawLine(pixels, width, height, x, y + 7, x + 7, y + 15, color, 5);
  drawLine(pixels, width, height, x + 7, y + 15, x + 22, y - 4, color, 5);
}

function mixColor(a, b, t) {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t)
  ];
}

function articleCss() {
  return `<style>
:root{--ap-green:#064733;--ap-green-2:#0b6145;--ap-ink:#142019;--ap-muted:#64746b;--ap-cream:#f5efe4;--ap-line:#e6dccb;--ap-gold:#c28b2c}
.apx-article{background:var(--ap-cream);font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:var(--ap-ink)}
.apx-article .wrap{width:min(1040px,calc(100% - 40px));margin:0 auto}.apx-article .article-nav{background:#030906;padding:24px 0;color:white}.apx-article .article-nav .wrap{display:flex;justify-content:space-between;gap:20px}.apx-article .article-nav a{color:white;font-weight:900;text-decoration:none}
.apx-article .hero{padding:72px 0;background:linear-gradient(135deg,#fff9ee,#edf4ea)}.apx-article .crumb{font-size:12px;letter-spacing:.2em;text-transform:uppercase;color:var(--ap-green-2);font-weight:900}.apx-article h1{font-family:Georgia,serif;font-size:clamp(42px,6vw,76px);line-height:.95;letter-spacing:-.055em;color:var(--ap-green);max-width:930px;margin:14px 0 20px}.apx-article .dek{font-size:21px;line-height:1.55;color:#3d4c44;max-width:780px}.apx-article .meta{display:flex;gap:10px;flex-wrap:wrap;margin-top:24px}.apx-article .meta span{background:white;border:1px solid var(--ap-line);border-radius:999px;padding:9px 13px;color:#425149;font-weight:800;font-size:13px}
.apx-article .body{padding:58px 0 86px}.apx-article .layout{display:grid;grid-template-columns:280px 1fr;gap:42px;align-items:start}.apx-article aside{position:sticky;top:92px;background:#fffaf1;border:1px solid var(--ap-line);border-radius:24px;padding:22px}.apx-article aside strong{display:block;font-family:Georgia,serif;color:var(--ap-green);font-size:22px;margin-bottom:12px}.apx-article aside a{display:block;color:#405048;padding:10px 0;border-top:1px solid #ece3d4;font-weight:750;text-decoration:none}
.apx-article main{background:#fffaf1;border:1px solid var(--ap-line);border-radius:30px;padding:42px;box-shadow:0 18px 50px rgba(25,34,28,.06)}.apx-article h2{font-family:Georgia,serif;font-size:38px;line-height:1.05;color:var(--ap-green);letter-spacing:-.04em;margin:8px 0 16px}.apx-article p{font-size:18px;line-height:1.72;color:#3d4c44}.apx-article details{border-top:1px solid #e8decf;padding:16px 0}.apx-article summary{cursor:pointer;font-weight:900;color:var(--ap-green);font-size:18px}.apx-article .callout{background:#eaf3ec;border:1px solid #d4e4d8;border-radius:24px;padding:24px;margin:0 0 28px}.apx-article .callout strong{font-family:Georgia,serif;color:var(--ap-green);font-size:25px}.apx-article .cta{margin-top:34px;background:var(--ap-green);color:white;border-radius:26px;padding:30px}.apx-article .cta h2{color:white;margin:0 0 10px}.apx-article .cta p{color:rgba(255,255,255,.78);margin:0 0 18px}.apx-article .cta a{display:inline-flex;background:white;color:var(--ap-green);padding:13px 18px;border-radius:999px;font-weight:900;text-decoration:none}
.apx-article .geo-entities{display:flex;gap:9px;flex-wrap:wrap;margin-top:18px}.apx-article .geo-entities span{background:rgba(6,71,51,.08);border:1px solid rgba(6,71,51,.12);border-radius:999px;color:var(--ap-green);font-size:12px;font-weight:900;padding:8px 11px}.apx-article .internal-links{margin-top:22px;border-top:1px solid #ece3d4;padding-top:18px}.apx-article .internal-links strong{font-size:14px;margin-bottom:8px}.apx-article .checklist{display:grid;gap:10px;margin:18px 0 26px;padding:0;list-style:none}.apx-article .checklist li{position:relative;background:#fff;border:1px solid #ebe1d2;border-radius:16px;padding:13px 14px 13px 42px;color:#3d4c44;font-weight:750}.apx-article .checklist li:before{content:"";position:absolute;left:16px;top:17px;width:10px;height:10px;border-radius:999px;background:var(--ap-green)}.apx-article .steps{counter-reset:item;display:grid;gap:12px;margin:18px 0 26px;padding:0;list-style:none}.apx-article .steps li{counter-increment:item;background:#fff;border:1px solid #ebe1d2;border-radius:18px;padding:15px 16px;color:#3d4c44;font-weight:760}.apx-article .steps li:before{content:counter(item);display:inline-grid;place-items:center;width:24px;height:24px;margin-right:10px;border-radius:50%;background:var(--ap-green);color:white;font-size:12px;font-weight:900}
@media(max-width:900px){.apx-article .layout{grid-template-columns:1fr}.apx-article aside{position:relative;top:auto}.apx-article main{padding:28px}.apx-article .article-nav .wrap{display:grid}}
</style>`;
}

function plainText(topic) {
  return [
    topic.intro || "",
    "",
    topic.directAnswer,
    "",
    ...topic.sections.flatMap((section) => [section.heading, section.body, ...(section.bullets || []), ""]),
    ...(topic.nextSteps?.length ? ["Prioritat practica", ...topic.nextSteps, ""] : []),
    "Preguntes frequents",
    ...topic.faqs.flatMap((faq) => [faq.question, faq.answer, ""]),
    topic.cta
  ].join("\n");
}

function slugify(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeScript(value) {
  return value.replace(/</g, "\\u003c");
}

function hashString(value) {
  let hash = 2166136261;
  for (const char of value) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function readArg(name) {
  const index = process.argv.indexOf(name);
  if (index === -1) return null;
  return process.argv[index + 1] || null;
}
