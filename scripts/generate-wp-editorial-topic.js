const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const SEEDS_PATH = path.join(ROOT, "data", "content-seeds.json");
const STATIC_QUEUE_PATH = path.join(ROOT, "data", "seo-geo-drafts.json");
const ADS_REPORT_PATH = path.join(ROOT, "reports", "google-ads-keyword-ideas.json");
const OUTPUT_PATH = path.join(ROOT, "reports", "generated-wp-topic.json");
const DRY_RUN = process.argv.includes("--dry-run");
const MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini";
const RUN_DATE = process.env.CONTENT_DATE || new Date().toISOString().slice(0, 10);

const seeds = JSON.parse(fs.readFileSync(SEEDS_PATH, "utf8"));
const staticQueue = JSON.parse(fs.readFileSync(STATIC_QUEUE_PATH, "utf8"));

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

async function main() {
  const opportunity = pickOpportunity();

  if (DRY_RUN) {
    console.log(JSON.stringify({ ok: true, date: RUN_DATE, opportunity }, null, 2));
    return;
  }

  if (!process.env.OPENAI_API_KEY) {
    throw new Error("Missing OPENAI_API_KEY. Add it as a GitHub Actions secret.");
  }

  const topic = await generateTopic(opportunity);
  const normalized = normalizeTopic(topic, opportunity);
  validateTopic(normalized);

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(
    OUTPUT_PATH,
    `${JSON.stringify(
      {
        cadence: "daily-ai-draft",
        language: "ca",
        source: opportunity.source,
        generatedAt: new Date().toISOString(),
        topics: [normalized]
      },
      null,
      2
    )}\n`,
    "utf8"
  );

  console.log(JSON.stringify({ ok: true, output: OUTPUT_PATH, slug: normalized.slug }, null, 2));
}

function pickOpportunity() {
  const candidates = [...adsCandidates(), ...seedCandidates()];
  const staticSlugs = new Set(staticQueue.topics.map((topic) => topic.slug));
  const usable = candidates.filter((candidate) => !staticSlugs.has(candidate.slug));

  if (!usable.length) {
    throw new Error("No content opportunities available.");
  }

  const index = daysSinceStart(RUN_DATE) % usable.length;
  return usable[index];
}

function adsCandidates() {
  if (!fs.existsSync(ADS_REPORT_PATH)) return [];

  const report = JSON.parse(fs.readFileSync(ADS_REPORT_PATH, "utf8"));
  return (report.editorialRecommendations || []).slice(0, 40).map((item) => {
    const keyword = cleanKeyword(item.keyword);
    const title = item.suggestedArticle || `${capitalize(keyword)}: guia practica per restaurants`;
    return {
      source: "google_ads",
      keyword,
      title,
      slug: slugify(title),
      category: categoryForKeyword(keyword),
      reason: item.reason || "oportunitat detectada amb Google Ads Keyword Planner"
    };
  });
}

function seedCandidates() {
  const candidates = [];

  for (const pillar of seeds.pillars) {
    for (const angle of pillar.angles) {
      const title = titleFor(pillar.name, angle);
      candidates.push({
        source: "content_seeds",
        keyword: keyphraseFor(pillar.name, angle),
        title,
        slug: slugify(title),
        category: categoryForPillar(pillar.name),
        reason: `backlog estrategic: ${pillar.name} / ${angle}`
      });
    }
  }

  return candidates;
}

async function generateTopic(opportunity) {
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
            "Ets l'editor SEO/GEO d'Apareix.cat. Escrius en catala natural per restaurants independents. Prioritza utilitat, concrecio, SEO local, entitats i conversio. No prometis posicions garantides a Google Maps."
        },
        {
          role: "user",
          content: buildPrompt(opportunity)
        }
      ],
      text: {
        format: {
          type: "json_schema",
          name: "apareix_wp_editorial_topic",
          strict: true,
          schema: topicSchema()
        }
      }
    })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`OpenAI API error ${response.status}: ${body}`);
  }

  const data = await response.json();
  return JSON.parse(extractOutputText(data));
}

function buildPrompt(opportunity) {
  return [
    `Data: ${RUN_DATE}`,
    `Tema obligatori: ${opportunity.title}`,
    `Frase clau objectiu exacta: ${opportunity.keyword}`,
    `Slug obligatori: ${opportunity.slug}`,
    `Categoria: ${opportunity.category}`,
    `Motiu: ${opportunity.reason}`,
    `Audiencia: ${seeds.audience}`,
    `Mercat: ${seeds.market}`,
    "",
    "Requisits Yoast obligatoris:",
    "- seoTitle ha de començar exactament amb la frase clau objectiu.",
    "- metaDescription ha de començar exactament amb la frase clau objectiu.",
    "- intro ha de començar exactament amb la frase clau objectiu i funcionar com a primer paragraf.",
    "- El primer H2 ha d'incloure exactament la frase clau objectiu.",
    "- La frase clau objectiu ha d'apareixer 4-6 cops en total, naturalment.",
    "- Inclou almenys 1 enllaç intern absolut a Apareix i 1 enllaç extern oficial de Google.",
    "- Escriu 6 seccions amb bullets accionables i 4 FAQs.",
    "- Retorna nomes JSON valid segons l'esquema."
  ].join("\n");
}

function topicSchema() {
  return {
    type: "object",
    additionalProperties: false,
    required: [
      "slug",
      "title",
      "seoTitle",
      "metaDescription",
      "focusKeyphrase",
      "category",
      "intent",
      "imageTitle",
      "imageAlt",
      "geoEntities",
      "externalLinks",
      "internalLinks",
      "directAnswer",
      "intro",
      "sections",
      "nextSteps",
      "faqs",
      "cta"
    ],
    properties: {
      slug: { type: "string" },
      title: { type: "string" },
      seoTitle: { type: "string" },
      metaDescription: { type: "string" },
      focusKeyphrase: { type: "string" },
      category: { type: "string" },
      intent: { type: "string" },
      imageTitle: { type: "string" },
      imageAlt: { type: "string" },
      geoEntities: { type: "array", minItems: 5, maxItems: 10, items: { type: "string" } },
      externalLinks: { type: "array", minItems: 1, maxItems: 2, items: linkSchema() },
      internalLinks: { type: "array", minItems: 2, maxItems: 4, items: linkSchema() },
      directAnswer: { type: "string" },
      intro: { type: "string" },
      sections: {
        type: "array",
        minItems: 6,
        maxItems: 6,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["heading", "body", "bullets"],
          properties: {
            heading: { type: "string" },
            body: { type: "string" },
            bullets: { type: "array", minItems: 3, maxItems: 4, items: { type: "string" } }
          }
        }
      },
      nextSteps: { type: "array", minItems: 3, maxItems: 5, items: { type: "string" } },
      faqs: {
        type: "array",
        minItems: 4,
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
      cta: { type: "string" }
    }
  };
}

function linkSchema() {
  return {
    type: "object",
    additionalProperties: false,
    required: ["label", "url"],
    properties: {
      label: { type: "string" },
      url: { type: "string" }
    }
  };
}

function normalizeTopic(topic, opportunity) {
  return {
    ...topic,
    slug: opportunity.slug,
    focusKeyphrase: opportunity.keyword,
    category: topic.category || opportunity.category,
    internalLinks: normalizeInternalLinks(topic.internalLinks),
    externalLinks: normalizeExternalLinks(topic.externalLinks)
  };
}

function normalizeInternalLinks(links) {
  const normalized = links.filter((link) => link.url.includes("apareix.cat"));
  return normalized.length
    ? normalized
    : [
        { label: "Pla mensual Apareix", url: "https://apareix.cat/#contacte" },
        { label: "Blog de SEO local", url: "https://apareix.cat/blog/" }
      ];
}

function normalizeExternalLinks(links) {
  const normalized = links.filter((link) => !link.url.includes("apareix.cat"));
  return normalized.length
    ? normalized
    : [{ label: "Guia oficial de Google Business Profile", url: "https://support.google.com/business/answer/3038063" }];
}

function validateTopic(topic) {
  const keyphrase = topic.focusKeyphrase.toLowerCase();
  const haystack = [
    topic.seoTitle,
    topic.metaDescription,
    topic.intro,
    topic.directAnswer,
    ...topic.sections.flatMap((section) => [section.heading, section.body, ...(section.bullets || [])])
  ]
    .join("\n")
    .toLowerCase();
  const count = haystack.split(keyphrase).length - 1;

  const failures = [];
  if (!topic.seoTitle.toLowerCase().startsWith(keyphrase)) failures.push("seoTitle must start with focusKeyphrase");
  if (!topic.metaDescription.toLowerCase().startsWith(keyphrase)) failures.push("metaDescription must start with focusKeyphrase");
  if (!topic.intro.toLowerCase().startsWith(keyphrase)) failures.push("intro must start with focusKeyphrase");
  if (!topic.sections[0]?.heading.toLowerCase().includes(keyphrase)) failures.push("first H2 must include focusKeyphrase");
  if (count < 4) failures.push(`focusKeyphrase count too low: ${count}`);
  if (!topic.internalLinks?.some((link) => link.url.includes("apareix.cat"))) failures.push("missing internal link");
  if (!topic.externalLinks?.some((link) => !link.url.includes("apareix.cat"))) failures.push("missing external link");

  if (failures.length) throw new Error(`Generated topic failed validation: ${failures.join("; ")}`);
}

function titleFor(pillar, angle) {
  const normalized = angle.charAt(0).toUpperCase() + angle.slice(1);
  if (pillar === "Google Maps per restaurants") return `${normalized} a Google Maps si tens un restaurant`;
  if (pillar === "Ressenyes i reputacio") return `${normalized}: guia practica per restaurants`;
  if (pillar === "Posts i contingut local") return `${normalized} per mantenir activa la fitxa de Google`;
  if (pillar === "SEO local i GEO") return `${normalized}: guia SEO/GEO per restaurants`;
  return `${normalized}: que hauria de mirar un restaurant cada mes`;
}

function keyphraseFor(pillar, angle) {
  const normalized = compactKeyword(angle);
  if (pillar === "Google Maps per restaurants") return `${normalized} Google Maps restaurant`;
  if (pillar === "Ressenyes i reputacio") return `${normalized} ressenyes restaurant`;
  if (pillar === "Posts i contingut local") return `${normalized} Google Business Profile`;
  if (pillar === "SEO local i GEO") return `${normalized} restaurants`;
  return `${normalized} Google Maps restaurant`;
}

function categoryForPillar(pillar) {
  if (pillar.includes("Ressenyes")) return "Ressenyes";
  if (pillar.includes("Posts")) return "Contingut";
  if (pillar.includes("Informes")) return "Metriques";
  if (pillar.includes("SEO")) return "SEO local";
  return "Google Maps";
}

function categoryForKeyword(keyword) {
  const value = keyword.toLowerCase();
  if (value.includes("ressen")) return "Ressenyes";
  if (value.includes("post") || value.includes("contingut")) return "Contingut";
  if (value.includes("seo")) return "SEO local";
  if (value.includes("metric") || value.includes("trucad") || value.includes("clic")) return "Metriques";
  return "Google Maps";
}

function daysSinceStart(date) {
  const start = Date.parse("2026-07-20T00:00:00Z");
  return Math.max(0, Math.floor((Date.parse(`${date}T00:00:00Z`) - start) / 86400000));
}

function cleanKeyword(value) {
  return String(value)
    .replace(/[:?!.]+/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function compactKeyword(value) {
  const stopwords = new Set([
    "a",
    "amb",
    "com",
    "de",
    "del",
    "dels",
    "el",
    "els",
    "en",
    "i",
    "la",
    "les",
    "per",
    "que",
    "sense",
    "un",
    "una"
  ]);
  const words = cleanKeyword(value)
    .split(" ")
    .filter((word) => word.length > 2 && !stopwords.has(word));

  return words.slice(0, 3).join(" ") || cleanKeyword(value).split(" ").slice(0, 3).join(" ");
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function slugify(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
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
