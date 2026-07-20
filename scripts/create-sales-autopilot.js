const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const LEADS_PATH = path.join(ROOT, "data", "restaurant-leads.json");
const ACTIVITY_PATH = path.join(ROOT, "data", "lead-activity.json");
const BACKLOG_PATH = path.join(ROOT, "data", "operator-backlog.json");
const OUT_DIR = path.join(ROOT, "reports", "sales-autopilot");

const date = readArg("--date") || new Date().toISOString().slice(0, 10);
const limit = Number(readArg("--limit") || 5);
const writeSummary = process.argv.includes("--github-summary");

main();

function main() {
  const leadsData = JSON.parse(fs.readFileSync(LEADS_PATH, "utf8"));
  const activity = readJson(ACTIVITY_PATH, { events: [] });
  const backlog = readJson(BACKLOG_PATH, {});
  const leads = leadsData.leads;
  const events = activity.events;

  const model = {
    date,
    objective: backlog.objective || "Facturar amb Apareix.",
    northStar: backlog.northStar || {},
    metrics: buildMetrics(leads, events),
    followUps: dueFollowUps(leads, events).slice(0, limit),
    outreach: nextOutreach(leads, events).slice(0, limit),
    blockers: blockers(backlog),
    dailyPlan: dailyPlan()
  };

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const markdownPath = path.join(OUT_DIR, `${date}-sales-autopilot.md`);
  const htmlPath = path.join(OUT_DIR, `${date}-sales-autopilot.html`);

  const markdown = renderMarkdown(model);
  fs.writeFileSync(markdownPath, markdown, "utf8");
  fs.writeFileSync(htmlPath, renderHtml(model), "utf8");

  if (writeSummary && process.env.GITHUB_STEP_SUMMARY) {
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, markdown, "utf8");
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        markdown: path.relative(ROOT, markdownPath),
        html: path.relative(ROOT, htmlPath),
        outreach: model.outreach.map((lead) => lead.id),
        followUps: model.followUps.map((item) => item.lead.id)
      },
      null,
      2
    )
  );
}

function buildMetrics(leads, events) {
  const contacted = new Set(events.filter((event) => event.type === "contacted").map((event) => event.leadId));
  const responded = new Set(events.filter((event) => event.type === "responded").map((event) => event.leadId));
  const won = new Set(events.filter((event) => event.type === "won").map((event) => event.leadId));

  return {
    totalLeads: leads.length,
    contactReady: leads.filter((lead) => lead.status === "contact_ready").length,
    contactable: leads.filter((lead) => firstEmail(lead.publicContact) || firstPhone(lead.publicContact)).length,
    contacted: contacted.size,
    responded: responded.size,
    won: won.size,
    responseRate: contacted.size ? Math.round((responded.size / contacted.size) * 100) : 0
  };
}

function nextOutreach(leads, events) {
  const contacted = new Set(events.filter((event) => event.type === "contacted").map((event) => event.leadId));

  return leads
    .filter((lead) => lead.status === "contact_ready")
    .filter((lead) => !contacted.has(lead.id))
    .filter((lead) => firstEmail(lead.publicContact) || firstPhone(lead.publicContact))
    .sort(compareLead);
}

function dueFollowUps(leads, events) {
  const leadMap = new Map(leads.map((lead) => [lead.id, lead]));
  const lastByLead = new Map();

  for (const event of events) {
    if (event.leadId === "batch") continue;
    lastByLead.set(event.leadId, event);
  }

  return [...lastByLead.values()]
    .filter((event) => ["contacted", "proposal_sent", "meeting", "responded", "follow_up"].includes(event.type))
    .map((event) => ({ event, lead: leadMap.get(event.leadId), daysSince: daysBetween(event.date, date) }))
    .filter((item) => item.lead && item.daysSince >= followUpDelay(item.event.type))
    .sort((a, b) => b.daysSince - a.daysSince || compareLead(a.lead, b.lead));
}

function blockers(backlog) {
  const constraints = backlog.constraints || [];
  const apiBlocked = (backlog.later || []).filter((item) => item.id === "api-001");
  return [
    "Google Ads API pendent d'aprovacio Basic Access; fins llavors el contingut diari tira de backlog estrategic.",
    ...constraints.slice(0, 3),
    ...apiBlocked.map((item) => item.title)
  ];
}

function dailyPlan() {
  return [
    "Enviar o revisar 5 primers contactes, no mes.",
    "Registrar cada contacte amb npm run lead:record immediatament.",
    "Fer follow-up als contactes vençuts abans d'afegir mes leads.",
    "Si hi ha resposta positiva, passar directament a pilot de 50 EUR/mes i onboarding."
  ];
}

function renderMarkdown(model) {
  return `# Apareix Sales Autopilot - ${model.date}

Objectiu: ${model.objective}

## Scoreboard

- Leads totals: ${model.metrics.totalLeads}
- Contact ready: ${model.metrics.contactReady}
- Contactables: ${model.metrics.contactable}
- Contactats: ${model.metrics.contacted}
- Respostes: ${model.metrics.responded}
- Guanyats: ${model.metrics.won}
- Response rate: ${model.metrics.responseRate}%

## Pla d'avui

${model.dailyPlan.map((item) => `- ${item}`).join("\n")}

## Follow-ups vençuts

${model.followUps.length ? model.followUps.map(renderFollowUpMarkdown).join("\n\n") : "- Cap follow-up vençut registrat."}

## Nous contactes recomanats

${model.outreach.length ? model.outreach.map(renderOutreachMarkdown).join("\n\n") : "- No hi ha leads contact_ready pendents amb contacte public."}

## Bloquejos / context

${model.blockers.map((item) => `- ${item}`).join("\n")}
`;
}

function renderFollowUpMarkdown(item, index) {
  const lead = item.lead;
  return `### ${index + 1}. ${lead.name}

- Lead: ${lead.id}
- Ultim event: ${item.event.type} fa ${item.daysSince} dies
- Contacte: ${lead.publicContact || "pendent"}
- Seguent accio: ${item.event.nextAction || "Fer seguiment curt."}

\`\`\`bash
npm run lead:record -- --lead ${lead.id} --type follow_up --channel email --summary "Follow-up enviat." --next-action "Esperar resposta o recontactar en 7 dies." --status contacted
\`\`\``;
}

function renderOutreachMarkdown(lead, index) {
  const email = firstEmail(lead.publicContact);
  const phone = firstPhone(lead.publicContact);
  const channel = email ? "email" : "phone";

  return `### ${index + 1}. ${lead.name}

- Lead: ${lead.id}
- Zona: ${lead.area}
- Contacte: ${lead.publicContact}
- Canal: ${channel}
- Angle: ${openingAngle(lead)}

Missatge base:

${finalMessage(lead)}

Registrar despres:

\`\`\`bash
npm run lead:record -- --lead ${lead.id} --type contacted --channel ${channel} --summary "Primer contacte manual fet." --next-action "Fer seguiment en 3 dies." --status contacted
\`\`\``;
}

function renderHtml(model) {
  return `<!doctype html>
<html lang="ca">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Apareix Sales Autopilot - ${model.date}</title>
  <style>
    :root{--green:#064733;--deep:#06150f;--cream:#f6efe4;--card:#fffaf2;--line:#e4dacb;--muted:#66736b;--gold:#bd8029}
    body{margin:0;background:linear-gradient(135deg,#fff9ee,#edf4ea);color:#142019;font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
    header{background:#06150f;color:white;padding:52px 24px}
    .wrap{width:min(1160px,calc(100% - 36px));margin:0 auto}
    .eyebrow{color:#9ee0b7;font-size:12px;font-weight:900;letter-spacing:.18em;text-transform:uppercase}
    h1{font-family:Georgia,serif;font-size:clamp(42px,7vw,82px);line-height:.88;letter-spacing:-.06em;margin:8px 0 14px}
    header p{max-width:780px;color:rgba(255,255,255,.75);font-size:18px;line-height:1.55}
    main{padding:24px 0 70px}
    .metrics{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:12px;margin-top:-44px}
    .metric,.card{background:rgba(255,250,242,.96);border:1px solid var(--line);box-shadow:0 18px 45px rgba(33,27,18,.08)}
    .metric{border-radius:18px;padding:16px}.metric strong{display:block;color:var(--green);font-family:Georgia,serif;font-size:30px}.metric span{color:var(--muted);font-weight:800;font-size:12px}
    section{margin-top:24px}.grid{display:grid;gap:16px}.card{border-radius:24px;padding:22px}
    h2{font-family:Georgia,serif;color:var(--green);font-size:38px;line-height:1;margin:0 0 14px}
    h3{margin:0 0 8px;color:var(--green);font-size:24px}
    .pill{display:inline-flex;border-radius:999px;background:#e5f3e9;color:var(--green);padding:7px 10px;font-size:12px;font-weight:950;text-transform:uppercase}
    .meta{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:14px 0}
    .meta span{background:white;border:1px solid var(--line);border-radius:14px;padding:10px;color:var(--muted)}
    pre{white-space:pre-wrap;background:var(--deep);color:#fff7ea;border-radius:16px;padding:16px;line-height:1.5}
    code{font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;font-size:12px}
    ul{line-height:1.7}
    @media(max-width:900px){.metrics,.meta{grid-template-columns:1fr 1fr}}@media(max-width:620px){.metrics,.meta{grid-template-columns:1fr}}
  </style>
</head>
<body>
  <header><div class="wrap">
    <div class="eyebrow">Apareix operator</div>
    <h1>Sales autopilot.</h1>
    <p>${escapeHtml(model.objective)}</p>
  </div></header>
  <main class="wrap">
    <div class="metrics">
      ${metric("Leads", model.metrics.totalLeads)}
      ${metric("Ready", model.metrics.contactReady)}
      ${metric("Contactables", model.metrics.contactable)}
      ${metric("Contactats", model.metrics.contacted)}
      ${metric("Respostes", model.metrics.responded)}
      ${metric("Won", model.metrics.won)}
    </div>
    <section><h2>Pla d'avui</h2><div class="card"><ul>${model.dailyPlan.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></div></section>
    <section><h2>Follow-ups</h2><div class="grid">${model.followUps.length ? model.followUps.map(renderFollowUpHtml).join("") : `<div class="card">Cap follow-up vençut registrat.</div>`}</div></section>
    <section><h2>Nous contactes</h2><div class="grid">${model.outreach.length ? model.outreach.map(renderOutreachHtml).join("") : `<div class="card">No hi ha leads contact_ready pendents amb contacte public.</div>`}</div></section>
    <section><h2>Bloquejos</h2><div class="card"><ul>${model.blockers.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></div></section>
  </main>
</body>
</html>`;
}

function metric(label, value) {
  return `<div class="metric"><strong>${value}</strong><span>${escapeHtml(label)}</span></div>`;
}

function renderFollowUpHtml(item, index) {
  return `<article class="card">
    <span class="pill">follow-up</span>
    <h3>${index + 1}. ${escapeHtml(item.lead.name)}</h3>
    <div class="meta">
      <span><strong>Lead</strong><br>${escapeHtml(item.lead.id)}</span>
      <span><strong>Ultim event</strong><br>${escapeHtml(item.event.type)} fa ${item.daysSince} dies</span>
      <span><strong>Contacte</strong><br>${escapeHtml(item.lead.publicContact || "pendent")}</span>
    </div>
    <pre><code>npm run lead:record -- --lead ${escapeHtml(item.lead.id)} --type follow_up --channel email --summary "Follow-up enviat." --next-action "Esperar resposta o recontactar en 7 dies." --status contacted</code></pre>
  </article>`;
}

function renderOutreachHtml(lead, index) {
  const email = firstEmail(lead.publicContact);
  const channel = email ? "email" : "phone";
  return `<article class="card">
    <span class="pill">${escapeHtml(channel)}</span>
    <h3>${index + 1}. ${escapeHtml(lead.name)}</h3>
    <div class="meta">
      <span><strong>Zona</strong><br>${escapeHtml(lead.area)}</span>
      <span><strong>Contacte</strong><br>${escapeHtml(lead.publicContact)}</span>
      <span><strong>Angle</strong><br>${escapeHtml(openingAngle(lead))}</span>
    </div>
    <pre>${escapeHtml(finalMessage(lead))}</pre>
    <pre><code>npm run lead:record -- --lead ${escapeHtml(lead.id)} --type contacted --channel ${channel} --summary "Primer contacte manual fet." --next-action "Fer seguiment en 3 dies." --status contacted</code></pre>
  </article>`;
}

function finalMessage(lead) {
  return `Hola,

He estat revisant ${lead.name} i crec que hi ha algunes millores concretes perquè Google Maps us ajudi més quan algú busca on menjar per ${lead.area}.

${specificObservation(lead)}

No parlo de fer una web nova ni anuncis. Parlo de tenir la fitxa més viva: posts, ressenyes, fotos, carta/reserva i una mica més de control mensual.

He preparat una auditoria curta amb 5 punts. Te la puc enviar?

Oriol`;
}

function specificObservation(lead) {
  const text = `${lead.segment} ${lead.initialObservation}`.toLowerCase();
  if (text.includes("menu") || text.includes("migdia") || text.includes("diari")) {
    return "El punt que em sembla més aprofitable és el menú: pot donar molt joc per posts recurrents i cerques locals de migdia si la fitxa ho comunica bé.";
  }
  if (text.includes("reserva")) {
    return "El punt que miraria primer és la connexió entre fitxa, web i reserva, perquè la persona que arriba des de Maps hauria de decidir ràpid sense perdre's.";
  }
  if (text.includes("fotos") || text.includes("horaris")) {
    return "El punt que miraria primer és si la fitxa transmet la mateixa confiança que el restaurant: fotos, horaris, ressenyes i activitat recent.";
  }
  return "El punt que miraria primer és si la fitxa està prou activa i orientada a accions: trucar, reservar, veure carta o demanar indicacions.";
}

function openingAngle(lead) {
  const text = `${lead.segment} ${lead.initialObservation}`.toLowerCase();
  if (text.includes("menu") || text.includes("migdia")) return "menu de migdia i cerques locals";
  if (text.includes("reserva")) return "fitxa, web i reserves";
  if (text.includes("fotos")) return "fotos, confiança i activitat recent";
  return "Google Maps actiu i conversio local";
}

function compareLead(a, b) {
  const emailDelta = Number(Boolean(firstEmail(b.publicContact))) - Number(Boolean(firstEmail(a.publicContact)));
  if (emailDelta !== 0) return emailDelta;
  const priorityDelta = priorityScore(b.priority) - priorityScore(a.priority);
  if (priorityDelta !== 0) return priorityDelta;
  return a.name.localeCompare(b.name);
}

function followUpDelay(type) {
  if (type === "proposal_sent") return 2;
  if (type === "meeting" || type === "responded") return 1;
  return 3;
}

function daysBetween(fromDate, toDate) {
  return Math.max(0, Math.floor((Date.parse(`${toDate}T00:00:00Z`) - Date.parse(`${fromDate}T00:00:00Z`)) / 86400000));
}

function firstEmail(value) {
  const match = String(value || "").match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  return match ? match[0] : "";
}

function firstPhone(value) {
  const match = String(value || "").match(/(?:\+34\s*)?(?:\d[\s-]?){9,}/);
  return match ? match[0].replace(/\s+/g, "") : "";
}

function priorityScore(value) {
  if (value === "high") return 2;
  if (value === "medium") return 1;
  return 0;
}

function readJson(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function readArg(name) {
  const index = process.argv.indexOf(name);
  if (index === -1) return null;
  return process.argv[index + 1] || null;
}
