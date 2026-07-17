const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const LEADS_PATH = path.join(ROOT, "data", "restaurant-leads.json");
const OUT_DIR = path.join(ROOT, "reports", "approval-packs");

const leadIds = readListArg("--leads");
const limit = Number(readArg("--limit") || 5);
const date = readArg("--date") || new Date().toISOString().slice(0, 10);

main();

function main() {
  const data = JSON.parse(fs.readFileSync(LEADS_PATH, "utf8"));
  const leads = pickLeads(data.leads);
  if (!leads.length) throw new Error("No leads selected.");

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const markdownPath = path.join(OUT_DIR, `${date}-approval-pack.md`);
  const htmlPath = path.join(OUT_DIR, `${date}-approval-pack.html`);

  fs.writeFileSync(markdownPath, renderMarkdown(leads), "utf8");
  fs.writeFileSync(htmlPath, renderHtml(leads), "utf8");

  console.log(
    JSON.stringify(
      {
        ok: true,
        count: leads.length,
        markdown: path.relative(ROOT, markdownPath),
        html: path.relative(ROOT, htmlPath),
        leads: leads.map((lead) => lead.id)
      },
      null,
      2
    )
  );
}

function pickLeads(allLeads) {
  if (leadIds.length) {
    return leadIds.map((id) => {
      const lead = allLeads.find((item) => item.id === id);
      if (!lead) throw new Error(`Lead not found: ${id}`);
      return lead;
    });
  }

  return allLeads
    .filter((lead) => lead.status === "contact_ready")
    .slice(0, limit);
}

function renderMarkdown(leads) {
  return `# Pack d'Aprovació - ${date}

Objectiu: validar els primers missatges abans d'enviar contacte comercial real.

Regla: si un missatge sembla massa genèric, no enviar-lo encara. Afegir una observació concreta de la fitxa de Google Maps.

${leads.map(renderLeadMarkdown).join("\n\n")}
`;
}

function renderLeadMarkdown(lead, index) {
  const email = firstEmail(lead.publicContact);
  const message = finalMessage(lead);
  return `## ${index + 1}. ${lead.name}

- Estat: ${lead.status}
- Zona: ${lead.area}
- Contacte: ${lead.publicContact || "pendent"}
- Web: ${lead.website || lead.sourceUrl}
- Auditoria: reports/lead-audits/${lead.id}.md
- Proposta: reports/pilot-proposals/${lead.id}.md

### Missatge recomanat

${message}

${email ? `Mailto: ${mailto(email, lead, message)}` : "Mailto: pendent de correu"}

### Checklist abans d'enviar

- Revisar fitxa de Google Maps manualment.
- Afegir una observació concreta si es veu clara.
- Enviar només si el missatge queda personalitzat.
- Després d'enviar, registrar amb \`npm run lead:record -- --lead ${lead.id} --type contacted --channel email --summary \"Primer missatge enviat.\" --next-action \"Fer seguiment en 3 dies.\" --status contacted\``;
}

function renderHtml(leads) {
  return `<!doctype html>
<html lang="ca">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Pack d'aprovació Apareix - ${date}</title>
  <style>
    :root{--green:#064733;--cream:#f7f1e8;--line:#e4dacb;--ink:#17221c;--muted:#66736b;--gold:#b67a22}
    *{box-sizing:border-box}
    body{margin:0;background:var(--cream);color:var(--ink);font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
    header{background:linear-gradient(135deg,#062d21,#075f42);color:white;padding:48px 24px}
    header div,main{max-width:1120px;margin:0 auto}
    h1{font-family:Georgia,serif;font-size:clamp(36px,6vw,68px);line-height:.95;margin:0 0 12px;letter-spacing:-.05em}
    header p{max-width:760px;color:rgba(255,255,255,.78);font-size:18px;line-height:1.55}
    main{padding:28px 20px 72px}
    .summary{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin-top:-44px;margin-bottom:24px}
    .metric{background:#fffaf2;border:1px solid var(--line);border-radius:20px;padding:18px;box-shadow:0 14px 35px rgba(30,24,16,.08)}
    .metric strong{display:block;font-family:Georgia,serif;color:var(--green);font-size:30px}
    .grid{display:grid;gap:18px}
    .card{background:#fffaf2;border:1px solid var(--line);border-radius:24px;padding:22px;box-shadow:0 14px 35px rgba(30,24,16,.06)}
    .top{display:flex;justify-content:space-between;gap:16px;align-items:start}
    h2{font-family:Georgia,serif;color:var(--green);font-size:32px;line-height:1.05;margin:0}
    .pill{border:1px solid #cfe0d5;background:#eaf4ed;color:var(--green);border-radius:999px;padding:7px 10px;font-size:12px;font-weight:900;text-transform:uppercase;white-space:nowrap}
    .meta{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:18px 0;color:var(--muted)}
    .meta span{background:white;border:1px solid var(--line);border-radius:14px;padding:10px}
    .message{white-space:pre-wrap;background:#062d21;color:#fff7eb;border-radius:18px;padding:18px;line-height:1.55}
    .actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:16px}
    a.button{display:inline-flex;text-decoration:none;border-radius:999px;padding:11px 14px;font-weight:900}
    .primary{background:var(--green);color:white}.secondary{background:white;color:var(--green);border:1px solid var(--line)}
    .check{margin-top:16px;color:var(--muted);line-height:1.6}
    code{background:#f1e7d8;border-radius:8px;padding:2px 6px}
    @media(max-width:760px){.summary,.meta{grid-template-columns:1fr}.top{display:grid}}
  </style>
</head>
<body>
  <header><div>
    <h1>Pack d'aprovació Apareix</h1>
    <p>Primer lot de restaurants preparats per contacte manual. No s'ha enviat res. Revisa cada missatge i envia només si queda prou personalitzat.</p>
  </div></header>
  <main>
    <section class="summary">
      <div class="metric"><strong>${leads.length}</strong><span>contactes preparats</span></div>
      <div class="metric"><strong>${leads.filter((lead) => firstEmail(lead.publicContact)).length}</strong><span>amb email directe</span></div>
      <div class="metric"><strong>0</strong><span>enviats automàticament</span></div>
    </section>
    <section class="grid">
      ${leads.map(renderLeadHtml).join("\n")}
    </section>
  </main>
</body>
</html>`;
}

function renderLeadHtml(lead, index) {
  const email = firstEmail(lead.publicContact);
  const message = finalMessage(lead);
  const mail = email ? mailto(email, lead, message) : "";
  return `<article class="card">
  <div class="top">
    <div><h2>${index + 1}. ${escapeHtml(lead.name)}</h2><p>${escapeHtml(lead.initialObservation)}</p></div>
    <span class="pill">${escapeHtml(lead.status)}</span>
  </div>
  <div class="meta">
    <span><strong>Zona</strong><br>${escapeHtml(lead.area)}</span>
    <span><strong>Contacte</strong><br>${escapeHtml(lead.publicContact || "pendent")}</span>
    <span><strong>Segment</strong><br>${escapeHtml(lead.segment)}</span>
    <span><strong>Web</strong><br>${escapeHtml(lead.website || lead.sourceUrl)}</span>
  </div>
  <div class="message">${escapeHtml(message)}</div>
  <div class="actions">
    ${mail ? `<a class="button primary" href="${escapeHtml(mail)}">Obrir email</a>` : ""}
    <a class="button secondary" href="../lead-audits/${lead.id}.md">Auditoria</a>
    <a class="button secondary" href="../../data/restaurant-leads.json">Tracker</a>
  </div>
  <div class="check">
    <strong>Abans d'enviar:</strong> revisar fitxa, afegir una observació concreta i registrar després amb <code>npm run lead:record</code>.
  </div>
</article>`;
}

function finalMessage(lead) {
  return `Hola,

He estat revisant ${lead.name} i crec que hi ha algunes millores bastant concretes per fer que Google Maps us ajudi més quan algú busca on menjar per ${lead.area}.

No parlo de fer una web nova ni anuncis. Parlo de tenir la fitxa més viva: posts, ressenyes, fotos, carta/reserva i una mica més de control mensual.

He preparat una auditoria curta amb 5 punts. Te la puc enviar?`;
}

function firstEmail(value) {
  const match = String(value || "").match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  return match ? match[0] : "";
}

function mailto(email, lead, message) {
  const subject = `Una cosa ràpida sobre Google Maps de ${lead.name}`;
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

