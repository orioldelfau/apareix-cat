const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const inputPath = process.argv[2]
  ? path.resolve(ROOT, process.argv[2])
  : path.join(ROOT, "data", "growth-metrics.sample.json");
const outDir = path.join(ROOT, "reports");

const data = JSON.parse(fs.readFileSync(inputPath, "utf8"));
const insights = {
  generatedAt: new Date().toISOString(),
  source: path.relative(ROOT, inputPath),
  searchOpportunities: analyzeSearchConsole(data.searchConsole || []),
  contentOpportunities: analyzeAnalytics(data.analytics || []),
  adsOpportunities: analyzeAds(data.ads || [])
};

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "growth-insights.json"), JSON.stringify(insights, null, 2), "utf8");
fs.writeFileSync(path.join(outDir, "growth-insights.md"), renderMarkdown(insights), "utf8");
console.log("Growth insights created: reports/growth-insights.json and reports/growth-insights.md");

function analyzeSearchConsole(rows) {
  return rows
    .filter((row) => Number(row.impressions) >= 100)
    .map((row) => {
      const ctr = Number(row.ctr || 0);
      const position = Number(row.position || 0);
      const isGeoQuery = looksConversational(row.query);
      let action = "Monitoritzar";

      if (ctr < 0.025 && position <= 20) {
        action = "Millorar title, intro i resposta directa";
      }

      if (isGeoQuery) {
        action = `${action}; afegir bloc pregunta-resposta GEO`;
      }

      return {
        query: row.query,
        page: row.page,
        impressions: row.impressions,
        clicks: row.clicks,
        ctr,
        position,
        isGeoQuery,
        action
      };
    })
    .sort((a, b) => b.impressions - a.impressions);
}

function analyzeAnalytics(rows) {
  return rows.map((row) => {
    const sessions = Number(row.sessions || 0);
    const auditClicks = Number(row.auditClicks || 0);
    const auditClickRate = sessions > 0 ? auditClicks / sessions : 0;
    return {
      page: row.page,
      sessions,
      auditClicks,
      auditClickRate,
      engagementRate: Number(row.engagementRate || 0),
      action:
        auditClickRate < 0.03
          ? "Revisar CTA, promesa i posicio del bloc d'auditoria"
          : "Mantenir i buscar variants del tema"
    };
  });
}

function analyzeAds(rows) {
  return rows.map((row) => {
    const cost = Number(row.cost || 0);
    const conversions = Number(row.conversions || 0);
    const cpa = conversions > 0 ? cost / conversions : null;
    return {
      campaign: row.campaign,
      keyword: row.keyword,
      cost,
      clicks: Number(row.clicks || 0),
      conversions,
      cpa,
      action:
        conversions === 0 && cost > 25
          ? "Pausar o moure a contingut informatiu abans de seguir invertint"
          : "Mantenir test i comparar CPA amb valor del pilot"
    };
  });
}

function looksConversational(query) {
  const value = String(query || "").toLowerCase();
  return /\b(com|que|quan|per que|quant|millor|guia|idees|exemples)\b/.test(value);
}

function renderMarkdown(insights) {
  return `# Growth Insights Apareix

Generat: ${insights.generatedAt}
Font: ${insights.source}

## Search Console

${insights.searchOpportunities
  .map(
    (item) => `- ${item.query}: ${item.impressions} impressions, CTR ${(item.ctr * 100).toFixed(1)}%, posicio ${item.position}. Accio: ${item.action}.`
  )
  .join("\n")}

## Analytics

${insights.contentOpportunities
  .map(
    (item) => `- ${item.page}: ${item.sessions} sessions, taxa clic auditoria ${(item.auditClickRate * 100).toFixed(1)}%. Accio: ${item.action}.`
  )
  .join("\n")}

## Ads

${insights.adsOpportunities
  .map(
    (item) => `- ${item.keyword}: cost ${item.cost}, conversions ${item.conversions}, CPA ${item.cpa === null ? "n/a" : item.cpa.toFixed(2)}. Accio: ${item.action}.`
  )
  .join("\n")}
`;
}
