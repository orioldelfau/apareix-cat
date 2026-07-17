const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const LEADS_PATH = path.join(ROOT, "data", "restaurant-leads.json");
const ACTIVITY_PATH = path.join(ROOT, "data", "lead-activity.json");
const OUT_DIR = path.join(ROOT, "reports", "sales-queues");

const leadIds = readListArg("--leads");
const limit = Number(readArg("--limit") || 10);
const date = readArg("--date") || new Date().toISOString().slice(0, 10);
const queueName = slugify(readArg("--name") || "send-queue");

main();

function main() {
  const data = JSON.parse(fs.readFileSync(LEADS_PATH, "utf8"));
  const activity = readActivity();
  const leads = pickLeads(data.leads, activity.events);

  if (!leads.length) throw new Error("No leads selected for send queue.");

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const markdownPath = path.join(OUT_DIR, `${date}-${queueName}.md`);
  const htmlPath = path.join(OUT_DIR, `${date}-${queueName}.html`);

  fs.writeFileSync(markdownPath, renderMarkdown(leads), "utf8");
  fs.writeFileSync(htmlPath, renderHtml(leads), "utf8");

  console.log(
    JSON.stringify(
      {
        ok: true,
        count: leads.length,
        emailReady: leads.filter((lead) => firstEmail(lead.publicContact)).length,
        phoneOnly: leads.filter((lead) => !firstEmail(lead.publicContact) && firstPhone(lead.publicContact)).length,
        markdown: path.relative(ROOT, markdownPath),
        html: path.relative(ROOT, htmlPath),
        leads: leads.map((lead) => lead.id)
      },
      null,
      2
    )
  );
}

function pickLeads(allLeads, events) {
  const contacted = new Set(
    events.filter((event) => event.type === "contacted").map((event) => event.leadId)
  );

  if (leadIds.length) {
    return leadIds.map((id) => {
      const lead = allLeads.find((item) => item.id === id);
      if (!lead) throw new Error(`Lead not found: ${id}`);
      return lead;
    });
  }

  return allLeads
    .filter((lead) => lead.status === "contact_ready")
    .filter((lead) => !contacted.has(lead.id))
    .sort(compareLead)
    .slice(0, limit);
}

function compareLead(a, b) {
  const emailDelta = Number(Boolean(firstEmail(b.publicContact))) - Number(Boolean(firstEmail(a.publicContact)));
  if (emailDelta !== 0) return emailDelta;

  const priorityDelta = priorityScore(b.priority) - priorityScore(a.priority);
  if (priorityDelta !== 0) return priorityDelta;

  return a.name.localeCompare(b.name);
}

function renderMarkdown(leads) {
  return `# Cua d'Enviament - ${date}

Objectiu: convertir els leads preparats en contactes reals registrats.

Regles:

- No enviar massivament.
- Obrir cada fitxa de Google Maps abans d'enviar.
- Afegir una observacio concreta al missatge.
- Registrar cada contacte immediatament amb la comanda indicada.

## Resum

- Leads a contactar: ${leads.length}
- Amb email directe: ${leads.filter((lead) => firstEmail(lead.publicContact)).length}
- Només telefon/pendent email: ${leads.filter((lead) => !firstEmail(lead.publicContact)).length}

${leads.map(renderLeadMarkdown).join("\n\n")}
`;
}

function renderLeadMarkdown(lead, index) {
  const email = firstEmail(lead.publicContact);
  const phone = firstPhone(lead.publicContact);
  const channel = email ? "email" : "phone";
  const message = finalMessage(lead);

  return `## ${index + 1}. ${lead.name}

- Prioritat: ${lead.priority}
- Zona: ${lead.area}
- Contacte public: ${lead.publicContact || "pendent"}
- Canal recomanat: ${email ? `email (${email})` : phone ? `telefon (${phone})` : "buscar contacte"}
- Auditoria: reports/lead-audits/${lead.id}.md
- Proposta: reports/pilot-proposals/${lead.id}.md

### Missatge

${message}

${email ? `Mailto: ${mailto(email, lead, message)}` : phone ? `Telefon: tel:${phone}` : "Accio: buscar email o WhatsApp abans de contactar."}

### Registrar despres

\`\`\`bash
npm run lead:record -- --lead ${lead.id} --type contacted --channel ${channel} --summary "Primer contacte manual fet." --next-action "Fer seguiment en 3 dies." --status contacted
\`\`\`
`;
}

function renderHtml(leads) {
  const emailReady = leads.filter((lead) => firstEmail(lead.publicContact)).length;
  const phoneOnly = leads.filter((lead) => !firstEmail(lead.publicContact) && firstPhone(lead.publicContact)).length;

  return `<!doctype html>
<html lang="ca">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Cua d'enviament Apareix - ${date}</title>
  <style>
    :root{--forest:#064733;--deep:#071d15;--cream:#f7f1e8;--card:#fffaf2;--line:#e4dacb;--ink:#17221c;--muted:#66736b;--gold:#bd8029;--tomato:#d64f32}
    *{box-sizing:border-box}
    body{margin:0;background:radial-gradient(circle at top left,#fff8dc 0,#f7f1e8 36%,#efe5d5 100%);color:var(--ink);font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
    header{background:linear-gradient(135deg,#041c14,#07583e);color:white;padding:52px 22px 70px}
    header div,main{width:min(1180px,100%);margin:0 auto}
    .eyebrow{margin:0 0 10px;color:#9ee0b7;font-size:12px;font-weight:900;letter-spacing:.18em;text-transform:uppercase}
    h1{max-width:850px;margin:0;font-family:Georgia,serif;font-size:clamp(42px,7vw,84px);line-height:.88;letter-spacing:-.06em}
    header p{max-width:760px;color:rgba(255,255,255,.76);font-size:18px;line-height:1.55}
    main{padding:0 18px 72px}
    .metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin-top:-44px;margin-bottom:20px}
    .metric,.card{border:1px solid var(--line);background:rgba(255,250,242,.94);box-shadow:0 18px 50px rgba(33,27,18,.08)}
    .metric{border-radius:20px;padding:18px}.metric strong{display:block;color:var(--forest);font-family:Georgia,serif;font-size:34px}.metric span{color:var(--muted);font-weight:800}
    .notice{border:1px solid #e8c886;background:#fff6da;border-radius:18px;padding:16px 18px;margin-bottom:20px;color:#5f430e;font-weight:800}
    .grid{display:grid;gap:18px}
    .card{border-radius:26px;padding:22px}
    .top{display:flex;justify-content:space-between;gap:18px;align-items:flex-start}
    h2{margin:0;color:var(--forest);font-family:Georgia,serif;font-size:34px;line-height:1}
    .pill{display:inline-flex;border-radius:999px;padding:8px 10px;font-size:12px;font-weight:950;text-transform:uppercase;white-space:nowrap}
    .email{background:#e4f4e9;color:var(--forest)}.phone{background:#fff0d8;color:#8a5611}.blocked{background:#ffe4df;color:#992b19}
    .meta{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:18px 0}
    .meta span{border:1px solid var(--line);background:white;border-radius:14px;padding:10px;color:var(--muted);line-height:1.35}.meta strong{color:var(--ink)}
    .message{white-space:pre-wrap;background:var(--deep);color:#fff7eb;border-radius:18px;padding:18px;line-height:1.55}
    .actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:16px}
    .button{display:inline-flex;align-items:center;text-decoration:none;border-radius:999px;padding:11px 14px;font-weight:950}
    .primary{background:var(--forest);color:white}.secondary{border:1px solid var(--line);background:white;color:var(--forest)}.warn{background:var(--tomato);color:white}
    .command{margin-top:16px;background:white;border:1px dashed #cdbb9d;border-radius:14px;padding:12px;overflow:auto}
    code{font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;font-size:12px}
    @media(max-width:820px){.metrics,.meta{grid-template-columns:1fr}.top{display:grid}}
  </style>
</head>
<body>
  <header><div>
    <p class="eyebrow">Apareix sales queue</p>
    <h1>Contactar restaurants sense perdre el fil.</h1>
    <p>Cua manual per convertir leads preparats en contactes registrats. No envia res automaticament.</p>
  </div></header>
  <main>
    <section class="metrics">
      <div class="metric"><strong>${leads.length}</strong><span>a contactar</span></div>
      <div class="metric"><strong>${emailReady}</strong><span>amb email</span></div>
      <div class="metric"><strong>${phoneOnly}</strong><span>telefon</span></div>
      <div class="metric"><strong>0</strong><span>enviats automaticament</span></div>
    </section>
    <div class="notice">Abans d'enviar: revisar fitxa, afegir una observacio concreta i registrar amb la comanda de cada targeta.</div>
    <section class="grid">
      ${leads.map(renderLeadHtml).join("\n")}
    </section>
  </main>
</body>
</html>`;
}

function renderLeadHtml(lead, index) {
  const email = firstEmail(lead.publicContact);
  const phone = firstPhone(lead.publicContact);
  const message = finalMessage(lead);
  const channel = email ? "email" : "phone";
  const contactClass = email ? "email" : phone ? "phone" : "blocked";
  const contactLabel = email ? "email directe" : phone ? "telefon" : "buscar contacte";
  const recordCommand = `npm run lead:record -- --lead ${lead.id} --type contacted --channel ${channel} --summary "Primer contacte manual fet." --next-action "Fer seguiment en 3 dies." --status contacted`;

  return `<article class="card">
  <div class="top">
    <div>
      <h2>${index + 1}. ${escapeHtml(lead.name)}</h2>
      <p>${escapeHtml(openingAngle(lead))}</p>
    </div>
    <span class="pill ${contactClass}">${escapeHtml(contactLabel)}</span>
  </div>
  <div class="meta">
    <span><strong>Zona</strong><br>${escapeHtml(lead.area)}</span>
    <span><strong>Contacte</strong><br>${escapeHtml(lead.publicContact || "pendent")}</span>
    <span><strong>Prioritat</strong><br>${escapeHtml(lead.priority)}</span>
  </div>
  <div class="message">${escapeHtml(message)}</div>
  <div class="actions">
    ${email ? `<a class="button primary" href="${escapeHtml(mailto(email, lead, message))}">Obrir email</a>` : ""}
    ${!email && phone ? `<a class="button warn" href="tel:${escapeHtml(phone)}">Trucar</a>` : ""}
    <a class="button secondary" href="../lead-audits/${lead.id}.md">Auditoria</a>
    <a class="button secondary" href="../pilot-proposals/${lead.id}.md">Proposta 50 EUR</a>
    <a class="button secondary" href="${escapeHtml(lead.website || lead.sourceUrl)}">Web</a>
  </div>
  <div class="command"><code>${escapeHtml(recordCommand)}</code></div>
</article>`;
}

function finalMessage(lead) {
  return `Hola,

He estat revisant ${lead.name} i crec que hi ha algunes millores concretes perquè Google Maps us ajudi més quan algú busca on menjar per ${lead.area}.

No parlo de fer una web nova ni anuncis. Parlo de tenir la fitxa més viva: posts, ressenyes, fotos, carta/reserva i una mica més de control mensual.

He preparat una auditoria curta amb 5 punts. Te la puc enviar?`;
}

function openingAngle(lead) {
  const text = `${lead.segment} ${lead.initialObservation}`.toLowerCase();
  if (text.includes("menu") || text.includes("migdia")) return "Angle: menu de migdia i cerques locals recurrents.";
  if (text.includes("reserva")) return "Angle: connectar millor fitxa, web i reserves.";
  if (text.includes("sitges") || text.includes("turist")) return "Angle: captar millor cerques locals i turistiques.";
  return "Angle: fitxa mes activa, confiable i orientada a conversio.";
}

function readActivity() {
  if (!fs.existsSync(ACTIVITY_PATH)) return { events: [] };
  return JSON.parse(fs.readFileSync(ACTIVITY_PATH, "utf8"));
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

function mailto(email, lead, message) {
  const subject = `Una cosa rapida sobre Google Maps de ${lead.name}`;
  return `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
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

function readListArg(name) {
  const value = readArg(name);
  if (!value) return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function slugify(value) {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
