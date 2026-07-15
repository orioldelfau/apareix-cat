const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const seeds = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "content-seeds.json"), "utf8"));
const outDir = path.join(ROOT, "content-drafts");

fs.mkdirSync(outDir, { recursive: true });

const today = new Date();
const ideas = buildIdeas(today, 8);
const outputPath = path.join(outDir, `content-plan-${formatIsoDate(today)}.json`);

fs.writeFileSync(outputPath, JSON.stringify(ideas, null, 2), "utf8");
console.log(`Content plan created: ${outputPath}`);

function buildIdeas(startDate, weeks) {
  const ideas = [];
  for (let index = 0; index < weeks; index += 1) {
    const pillar = seeds.pillars[index % seeds.pillars.length];
    const angle = pillar.angles[Math.floor(index / seeds.pillars.length) % pillar.angles.length];
    const publishDate = addDays(startDate, index * 7);
    const title = titleFor(pillar.name, angle);

    ideas.push({
      status: "draft_brief",
      publishDate: formatIsoDate(publishDate),
      pillar: pillar.name,
      angle,
      title,
      targetAudience: seeds.audience,
      language: seeds.language,
      intent: "educar restaurant i portar-lo cap a auditoria gratuita",
      brief: [
        "Explicar el problema amb exemples de restauracio.",
        "Donar passos practics que el propietari pugui aplicar.",
        "Incloure criteris d'Apareix basats en experiencia operativa.",
        "Tancar amb invitacio a demanar auditoria gratis."
      ],
      qualityGate: [
        "Aporta experiencia o criteri propi, no nomes resum generic.",
        "No promet posicions concretes a Google Maps.",
        "Inclou exemples aplicables a restaurants.",
        "Ha estat revisat abans de publicar."
      ]
    });
  }

  return ideas;
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

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function formatIsoDate(date) {
  return date.toISOString().slice(0, 10);
}
