const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const POSTS_PATH = path.join(ROOT, "data", "blog-posts.json");
const SEEDS_PATH = path.join(ROOT, "data", "content-seeds.json");
const DRY_RUN = process.argv.includes("--dry-run");
const MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini";

const posts = JSON.parse(fs.readFileSync(POSTS_PATH, "utf8"));
const seeds = JSON.parse(fs.readFileSync(SEEDS_PATH, "utf8"));
const nextIdea = pickNextIdea(posts, seeds);

if (DRY_RUN) {
  console.log(JSON.stringify(nextIdea, null, 2));
  process.exit(0);
}

if (!process.env.OPENAI_API_KEY) {
  console.error("Missing OPENAI_API_KEY. Add it as a GitHub Actions secret or export it locally.");
  process.exit(1);
}

generatePost(nextIdea)
  .then((post) => {
    const nextPosts = [post, ...posts]
      .sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug));

    fs.writeFileSync(POSTS_PATH, `${JSON.stringify(nextPosts, null, 2)}\n`, "utf8");
    console.log(`Generated blog post: ${post.slug}`);
  })
  .catch((error) => {
    console.error(error.message);
    process.exit(1);
  });

async function generatePost(idea) {
  const schema = {
    type: "object",
    additionalProperties: false,
    required: [
      "slug",
      "title",
      "description",
      "date",
      "category",
      "readingMinutes",
      "keywords",
      "entities",
      "directAnswer",
      "faqs",
      "intro",
      "sections",
      "cta"
    ],
    properties: {
      slug: { type: "string" },
      title: { type: "string" },
      description: { type: "string" },
      date: { type: "string" },
      category: { type: "string" },
      readingMinutes: { type: "number" },
      keywords: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 8 },
      entities: { type: "array", items: { type: "string" }, minItems: 4, maxItems: 10 },
      directAnswer: { type: "string" },
      faqs: {
        type: "array",
        minItems: 2,
        maxItems: 4,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["question", "answer"],
          properties: {
            question: { type: "string" },
            answer: { type: "string" }
          }
        }
      },
      intro: { type: "string" },
      sections: {
        type: "array",
        minItems: 4,
        maxItems: 6,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["heading", "body"],
          properties: {
            heading: { type: "string" },
            body: { type: "string" }
          }
        }
      },
      cta: { type: "string" }
    }
  };

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: MODEL,
      input: [
        {
          role: "system",
          content:
            "Escrius contingut expert en catala per Apareix, un producte de 50 EUR/mes que ajuda restaurants a mantenir activa la seva fitxa de Google Maps. Escriu amb criteri practic, sense promeses de posicions garantides i sense sonar generic."
        },
        {
          role: "user",
          content: buildPrompt(idea)
        }
      ],
      text: {
        format: {
          type: "json_schema",
          name: "apareix_blog_post",
          strict: true,
          schema
        }
      }
    })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`OpenAI API error ${response.status}: ${body}`);
  }

  const data = await response.json();
  const text = extractOutputText(data);
  const post = JSON.parse(text);
  const normalized = normalizePost(post, idea);
  validatePost(normalized, idea);
  return normalized;
}

function buildPrompt(idea) {
  return [
    `Tema: ${idea.title}`,
    `Categoria: ${idea.category}`,
    `Pilar: ${idea.pillar}`,
    `Angle: ${idea.angle}`,
    `Data: ${idea.date}`,
    `Slug obligatori: ${idea.slug}`,
    `Audiencia: ${seeds.audience}`,
    `Mercat: ${seeds.market}`,
    "",
    "Requisits:",
    "- Escriu en catala natural per propietaris i gerents de restaurants.",
    "- L'article ha de ser útil per SEO i GEO: resposta curta clara, entitats, FAQs i estructura escanejable.",
    "- Inclou exemples aplicables a restaurants reals: menu, reserves, ressenyes, fotos, horaris, barri o temporada.",
    "- No prometis una posicio concreta a Google Maps ni resultats garantits.",
    "- El CTA ha de portar cap a Apareix Maps per 50 EUR/mes.",
    "- Retorna nomes JSON valid segons l'esquema."
  ].join("\n");
}

function pickNextIdea(existingPosts, config) {
  const existingSlugs = new Set(existingPosts.map((post) => post.slug));
  const today = process.env.BLOG_POST_DATE || new Date().toISOString().slice(0, 10);

  for (const pillar of config.pillars) {
    for (const angle of pillar.angles) {
      const title = titleFor(pillar.name, angle);
      const slug = slugify(title);
      if (!existingSlugs.has(slug)) {
        return {
          title,
          slug,
          date: today,
          pillar: pillar.name,
          angle,
          category: categoryFor(pillar.name)
        };
      }
    }
  }

  throw new Error("No unused content ideas left in data/content-seeds.json.");
}

function normalizePost(post, idea) {
  return {
    ...post,
    slug: idea.slug,
    date: idea.date,
    category: post.category || idea.category,
    readingMinutes: Number(post.readingMinutes) || 5
  };
}

function validatePost(post, idea) {
  if (post.slug !== idea.slug) throw new Error(`Generated slug changed: ${post.slug}`);
  if (post.date !== idea.date) throw new Error(`Generated date changed: ${post.date}`);
  if (!Array.isArray(post.sections) || post.sections.length < 4) {
    throw new Error("Generated post needs at least 4 sections.");
  }
  if (!Array.isArray(post.faqs) || post.faqs.length < 2) {
    throw new Error("Generated post needs at least 2 FAQs.");
  }
  if (!post.cta.includes("50")) {
    throw new Error("Generated CTA must mention the 50 EUR/month product.");
  }
}

function extractOutputText(data) {
  if (typeof data.output_text === "string") return data.output_text;

  const output = Array.isArray(data.output) ? data.output : [];
  for (const item of output) {
    const content = Array.isArray(item.content) ? item.content : [];
    for (const part of content) {
      if (typeof part.text === "string") return part.text;
    }
  }

  throw new Error("Could not find text output in OpenAI response.");
}

function titleFor(pillar, angle) {
  const normalized = angle.charAt(0).toUpperCase() + angle.slice(1);
  if (pillar === "Google Maps per restaurants") {
    return `${normalized} a Google Maps si tens un restaurant`;
  }

  if (pillar === "Ressenyes i reputacio") {
    return `${normalized}: guia practica per restaurants`;
  }

  if (pillar === "Posts i contingut local") {
    return `${normalized} per mantenir activa la fitxa de Google`;
  }

  return `${normalized}: que hauria de mirar un restaurant cada mes`;
}

function categoryFor(pillar) {
  if (pillar.includes("Ressenyes")) return "Ressenyes";
  if (pillar.includes("Posts")) return "Contingut";
  if (pillar.includes("Informes")) return "Metriques";
  return "Google Maps";
}

function slugify(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
