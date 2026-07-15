const STORAGE_KEY = "apareix.audits.v1";

const scoreFields = {
  basicInfo: { max: 15, label: "Informacio basica" },
  categories: { max: 15, label: "Categories i serveis" },
  photosMenu: { max: 15, label: "Fotos i carta" },
  reviews: { max: 20, label: "Ressenyes" },
  activity: { max: 15, label: "Activitat i posts" },
  conversion: { max: 10, label: "Conversio" },
  competition: { max: 10, label: "Competencia local" }
};

const form = document.querySelector("#audit-form");
const scoreNode = document.querySelector("#score");
const scoreLabel = document.querySelector("#score-label");
const output = document.querySelector("#audit-output");
const loadDemo = document.querySelector("#load-demo");
const copyOutput = document.querySelector("#copy-output");
const clearHistory = document.querySelector("#clear-history");
const historyList = document.querySelector("#history-list");

let history = loadHistory();

renderRangeValues();
renderScore();
renderHistory();

form.addEventListener("input", () => {
  renderRangeValues();
  renderScore();
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const audit = readAudit();
  const report = buildAuditReport(audit);
  output.value = report;
  history.unshift({
    id: createId(),
    name: audit.name,
    area: audit.area,
    cuisine: audit.cuisine,
    score: audit.score,
    createdAt: new Date().toISOString(),
    report
  });
  history = history.slice(0, 10);
  saveHistory();
  renderHistory();
});

loadDemo.addEventListener("click", () => {
  form.name.value = "La Taula del Barri";
  form.area.value = "Eixample, Barcelona";
  form.cuisine.value = "cuina catalana de temporada";
  form.mapsUrl.value = "https://maps.google.com/";
  form.rating.value = "4.2";
  form.reviewCount.value = "143";
  form.basicInfo.value = "11";
  form.categories.value = "8";
  form.photosMenu.value = "6";
  form.reviews.value = "10";
  form.activity.value = "3";
  form.conversion.value = "5";
  form.competition.value = "4";
  form.notes.value = "Fitxa amb bones ressenyes, pero sense posts recents. Les fotos principals son antigues i no queda clar el menu de migdia. Dos competidors propers responen totes les ressenyes.";
  renderRangeValues();
  renderScore();
});

copyOutput.addEventListener("click", async () => {
  if (!output.value.trim()) {
    output.value = buildAuditReport(readAudit());
  }

  try {
    await navigator.clipboard.writeText(output.value);
    copyOutput.textContent = "Copiat";
  } catch {
    output.select();
    copyOutput.textContent = "Seleccionat";
  }

  window.setTimeout(() => {
    copyOutput.textContent = "Copiar text";
  }, 1200);
});

clearHistory.addEventListener("click", () => {
  history = [];
  saveHistory();
  renderHistory();
});

function readAudit() {
  const data = new FormData(form);
  const scores = Object.fromEntries(
    Object.keys(scoreFields).map((key) => [key, Number(data.get(key) || 0)])
  );
  const score = Object.values(scores).reduce((total, value) => total + value, 0);

  return {
    name: String(data.get("name") || "Restaurant pendent").trim(),
    area: String(data.get("area") || "zona pendent").trim(),
    cuisine: String(data.get("cuisine") || "cuina pendent").trim(),
    mapsUrl: String(data.get("mapsUrl") || "").trim(),
    rating: String(data.get("rating") || "pendent").trim(),
    reviewCount: String(data.get("reviewCount") || "pendent").trim(),
    notes: String(data.get("notes") || "").trim(),
    scores,
    score
  };
}

function renderRangeValues() {
  Object.entries(scoreFields).forEach(([key, meta]) => {
    const input = form.elements[key];
    const value = Number(input.value || 0);
    const label = document.querySelector(`[data-value-for="${key}"]`);
    label.textContent = `${value}/${meta.max}`;
  });
}

function renderScore() {
  const audit = readAudit();
  scoreNode.textContent = audit.score;
  scoreLabel.textContent = scoreCategory(audit.score);
}

function renderHistory() {
  historyList.innerHTML = "";
  if (history.length === 0) {
    const empty = document.createElement("p");
    empty.textContent = "Encara no hi ha auditories guardades.";
    historyList.append(empty);
    return;
  }

  history.forEach((item) => {
    const row = document.createElement("button");
    row.type = "button";
    row.className = "history-item";
    row.innerHTML = `
      <span>
        <strong>${escapeHtml(item.name)}</strong>
        <span>${escapeHtml(item.area)} · ${escapeHtml(item.cuisine)} · ${formatDate(item.createdAt)}</span>
      </span>
      <span class="history-score">${item.score}</span>
    `;
    row.addEventListener("click", () => {
      output.value = item.report;
      scoreNode.textContent = item.score;
      scoreLabel.textContent = scoreCategory(item.score);
    });
    historyList.append(row);
  });
}

function buildAuditReport(audit) {
  const weakAreas = rankedWeakAreas(audit).slice(0, 5);
  const recommendations = buildRecommendations(audit, weakAreas);

  return [
    `Auditoria Apareix - ${audit.name}`,
    "",
    `Zona: ${audit.area}`,
    `Tipus de cuina: ${audit.cuisine}`,
    `Rating actual: ${audit.rating}`,
    `Ressenyes: ${audit.reviewCount}`,
    audit.mapsUrl ? `Google Maps: ${audit.mapsUrl}` : "Google Maps: pendent",
    "",
    `Puntuacio global: ${audit.score}/100 (${scoreCategory(audit.score)})`,
    "",
    "Lectura rapida",
    quickDiagnosis(audit),
    "",
    "Punts amb mes oportunitat",
    ...weakAreas.map((area, index) => `${index + 1}. ${area.label}: ${area.value}/${area.max}`),
    "",
    "5 millores concretes",
    ...recommendations.map((item, index) => `${index + 1}. ${item}`),
    "",
    "Text curt per al client",
    clientSummary(audit, recommendations),
    "",
    "Observacions internes",
    audit.notes || "Sense observacions afegides."
  ].join("\n");
}

function rankedWeakAreas(audit) {
  return Object.entries(scoreFields)
    .map(([key, meta]) => ({
      key,
      label: meta.label,
      max: meta.max,
      value: audit.scores[key],
      ratio: audit.scores[key] / meta.max
    }))
    .sort((a, b) => a.ratio - b.ratio);
}

function buildRecommendations(audit, weakAreas) {
  const byKey = {
    basicInfo: `Revisar informacio basica de ${audit.name}: horaris, web, reserves, carta i horaris especials abans de festius.`,
    categories: `Ajustar categoria principal, categories secundaries i serveis perquè Google entengui millor quan mostrar el restaurant.`,
    photosMenu: "Afegir fotos recents de plats, sala, facana i carta/menu per millorar decisio visual abans de reservar.",
    reviews: "Respondre ressenyes pendents i crear una rutina per demanar ressenyes noves als clients satisfets.",
    activity: "Publicar 1 post setmanal amb menu, plat destacat, reserva, temporada o prova social.",
    conversion: "Fer mes visibles les accions que generen negoci: trucar, reservar, veure carta i obtenir indicacions.",
    competition: `Comparar ${audit.name} amb 3 competidors propers i atacar les diferencies de fotos, ressenyes i categories.`
  };

  const recommendations = weakAreas.map((area) => byKey[area.key]);
  const fallback = [
    "Mesurar mensualment trucades, clics, indicacions i evolucio de ressenyes.",
    "Preparar un calendari de 12 posts per als primers 90 dies.",
    "Crear una resposta base per ressenyes positives, neutres i negatives."
  ];

  return [...recommendations, ...fallback].slice(0, 5);
}

function quickDiagnosis(audit) {
  if (audit.score >= 80) {
    return `La fitxa de ${audit.name} te una base forta. L'oportunitat principal es mantenir activitat recurrent i convertir millor les visites a Google Maps.`;
  }

  if (audit.score >= 60) {
    return `La fitxa de ${audit.name} te base, pero encara pot transmetre millor i tenir mes rutina. Hi ha marge clar en activitat, ressenyes i conversio.`;
  }

  return `La fitxa de ${audit.name} esta per sota del que hauria de tenir un restaurant competitiu a ${audit.area}. Hi ha oportunitats rapides per millorar presencia i confianca.`;
}

function clientSummary(audit, recommendations) {
  const topThree = recommendations.slice(0, 3).join(" ");
  return `La vostra fitxa ja pot captar demanda local, pero ara mateix pot convertir millor. Les principals oportunitats que veiem son: ${topThree} Amb una gestio mensual constant, Apareix pot mantenir la fitxa mes activa, millor presentada i mes orientada a generar accions des de Google Maps.`;
}

function scoreCategory(score) {
  if (score >= 80) return "Fort";
  if (score >= 60) return "Millorable";
  if (score >= 40) return "Oportunitat clara";
  return "Urgent";
}

function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return [];
  }
}

function saveHistory() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

function createId() {
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function formatDate(value) {
  return new Intl.DateTimeFormat("ca", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
