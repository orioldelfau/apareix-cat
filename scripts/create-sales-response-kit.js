const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const LEADS_PATH = path.join(ROOT, "data", "restaurant-leads.json");
const ACTIVITY_PATH = path.join(ROOT, "data", "lead-activity.json");
const TEMPLATE_PATH = path.join(ROOT, "data", "pilot-template.json");
const OUT_DIR = path.join(ROOT, "reports", "sales-response-kits");

const date = readArg("--date") || new Date().toISOString().slice(0, 10);
const kitName = slugify(readArg("--name") || "response-kit");
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://apareix.cat";

main();

function main() {
  const leadsData = JSON.parse(fs.readFileSync(LEADS_PATH, "utf8"));
  const template = JSON.parse(fs.readFileSync(TEMPLATE_PATH, "utf8"));
  const activity = readActivity();
  const leads = pickActiveLeads(leadsData.leads, activity.events);

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const markdownPath = path.join(OUT_DIR, `${date}-${kitName}.md`);
  const htmlPath = path.join(OUT_DIR, `${date}-${kitName}.html`);

  fs.writeFileSync(markdownPath, renderMarkdown(leads, template), "utf8");
  fs.writeFileSync(htmlPath, renderHtml(leads, template), "utf8");

  console.log(
    JSON.stringify(
      {
        ok: true,
        leads: leads.length,
        markdown: path.relative(ROOT, markdownPath),
        html: path.relative(ROOT, htmlPath)
      },
      null,
      2
    )
  );
}

function pickActiveLeads(leads, events) {
  const activeIds = new Set(
    events
      .filter((event) =>
        ["contact_ready", "contacted", "responded", "meeting", "proposal_sent"].includes(event.type)
      )
      .map((event) => event.leadId)
      .filter((id) => id !== "batch")
  );

  const active = leads.filter((lead) => activeIds.has(lead.id));
  const fallback = leads.filter((lead) => lead.status === "contact_ready");

  return (active.length ? active : fallback)
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(0, 12);
}

function renderMarkdown(leads, template) {
  return `# Kit de Respostes Comercials - ${date}

Objectiu: convertir respostes dels restaurants en una decisio simple: rebre auditoria, fer trucada curta o activar el pilot de ${template.priceEurPerMonth} EUR/mes.

## Oferta que s'ha de mantenir

- Nom: ${template.offerName}
- Preu: ${template.priceEurPerMonth} EUR/mes
- Setup: ${template.setup}
- Permanencia: ${template.commitment}
- Onboarding: ${siteUrl}/onboarding

## Quan responen "envia'm l'auditoria"

${replyAudit(template)}

Registre:

\`\`\`bash
npm run lead:record -- --lead LEAD_ID --type responded --channel email --summary "Demana rebre auditoria curta." --next-action "Enviar auditoria i proposar pilot de 30 dies." --status responded
\`\`\`

## Quan pregunten preu

${replyPrice(template)}

Registre:

\`\`\`bash
npm run lead:record -- --lead LEAD_ID --type proposal_sent --channel email --summary "Preu i pilot explicats." --next-action "Fer seguiment de decisio en 2 dies." --status proposal_sent
\`\`\`

## Quan volen parlar

${replyMeeting()}

Registre:

\`\`\`bash
npm run lead:record -- --lead LEAD_ID --type meeting --channel email --summary "Trucada o conversa proposada." --next-action "Fer trucada i tancar pilot si encaixa." --status meeting
\`\`\`

## Quan diuen que ara no

${replyLater()}

Registre:

\`\`\`bash
npm run lead:record -- --lead LEAD_ID --type follow_up --channel email --summary "No és moment ara; seguiment programat." --next-action "Recontactar en 30 dies amb una observacio nova." 
\`\`\`

## Quan accepten començar

${replyStart(template)}

Registre:

\`\`\`bash
npm run lead:record -- --lead LEAD_ID --type won --channel email --summary "Pilot de 30 dies acceptat." --next-action "Enviar onboarding, confirmar pagament i demanar acces GBP." --status won
\`\`\`

## Objeccions rapides

### Ja tenim algu que ho porta

Cap problema. Justament per això ho plantejo petit: puc mirar només si Google Maps està alineat amb el que ja feu i enviar-vos 3-5 punts. Si ja ho teniu cobert, perfecte.

### No volem anuncis

No és publicitat. És gestió orgànica de la fitxa: dades, posts, ressenyes, fotos, carta/reserva i informe mensual.

### No podem garantir resultats

Correcte, no prometo posicions concretes. El compromís és mantenir la fitxa cuidada, activa i més orientada a conversió, i ensenyar cada mes què s'ha fet.

## Leads actius

${leads.map(renderLeadMarkdown).join("\n\n")}
`;
}

function renderLeadMarkdown(lead, index) {
  return `### ${index + 1}. ${lead.name}

- Estat: ${lead.status}
- Zona: ${lead.area}
- Contacte: ${lead.publicContact || "pendent"}
- Auditoria: reports/lead-audits/${lead.id}.md
- Proposta: reports/pilot-proposals/${lead.id}.md
- Onboarding si accepta: ${siteUrl}/onboarding
`;
}

function renderHtml(leads, template) {
  const blocks = [
    ["Envien interes", replyAudit(template), "responded"],
    ["Pregunten preu", replyPrice(template), "proposal_sent"],
    ["Volen parlar", replyMeeting(), "meeting"],
    ["Ara no", replyLater(), "follow_up"],
    ["Accepten començar", replyStart(template), "won"]
  ];

  return `<!doctype html>
<html lang="ca">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Kit de respostes Apareix - ${date}</title>
  <style>
    :root{--green:#064733;--deep:#071d15;--cream:#f7f1e8;--card:#fffaf2;--line:#e4dacb;--ink:#17221c;--muted:#66736b;--gold:#bd8029}
    *{box-sizing:border-box}
    body{margin:0;background:linear-gradient(180deg,#fff8ea,var(--cream));color:var(--ink);font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
    header{background:var(--deep);color:white;padding:52px 22px}
    header div,main{width:min(1120px,100%);margin:0 auto}
    .eyebrow{margin:0 0 10px;color:#9ee0b7;font-size:12px;font-weight:900;letter-spacing:.18em;text-transform:uppercase}
    h1{max-width:840px;margin:0;font-family:Georgia,serif;font-size:clamp(42px,7vw,78px);line-height:.9;letter-spacing:-.06em}
    header p{max-width:760px;color:rgba(255,255,255,.76);font-size:18px;line-height:1.55}
    main{padding:24px 18px 72px}
    .offer,.card{border:1px solid var(--line);background:rgba(255,250,242,.94);box-shadow:0 18px 50px rgba(33,27,18,.08);border-radius:24px}
    .offer{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-top:-44px;margin-bottom:20px;padding:16px}
    .offer div{background:white;border:1px solid var(--line);border-radius:18px;padding:14px}.offer strong{display:block;color:var(--green);font-family:Georgia,serif;font-size:28px}
    .grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}
    .card{padding:22px}.wide{grid-column:1/-1}
    h2{margin:0 0 12px;color:var(--green);font-family:Georgia,serif;font-size:34px;line-height:1}
    pre{white-space:pre-wrap;background:var(--deep);color:#fff7eb;border-radius:18px;padding:18px;line-height:1.55;font-family:inherit}
    code{display:block;overflow:auto;background:white;border:1px dashed #cdbb9d;border-radius:14px;padding:12px;font-size:12px}
    .lead-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.lead{background:white;border:1px solid var(--line);border-radius:16px;padding:14px}
    .lead strong{color:var(--green)}
    @media(max-width:820px){.offer,.grid,.lead-list{grid-template-columns:1fr}.wide{grid-column:auto}}
  </style>
</head>
<body>
  <header><div>
    <p class="eyebrow">Apareix sales response kit</p>
    <h1>Respondre rapid i tancar el pilot.</h1>
    <p>Plantilles per passar d'interes a pilot de 30 dies sense improvisar ni prometre resultats que no controlem.</p>
  </div></header>
  <main>
    <section class="offer">
      <div><strong>${template.priceEurPerMonth} EUR</strong><span>al mes</span></div>
      <div><strong>30 dies</strong><span>pilot inicial</span></div>
      <div><strong>${escapeHtml(template.setup)}</strong><span>setup</span></div>
      <div><strong>0</strong><span>permanencia</span></div>
    </section>
    <section class="grid">
      ${blocks.map(renderBlock).join("\n")}
      <article class="card wide">
        <h2>Leads actius</h2>
        <div class="lead-list">${leads.map(renderLeadHtml).join("\n")}</div>
      </article>
    </section>
  </main>
</body>
</html>`;
}

function renderBlock([title, body, type]) {
  return `<article class="card">
  <h2>${escapeHtml(title)}</h2>
  <pre>${escapeHtml(body)}</pre>
  <code>npm run lead:record -- --lead LEAD_ID --type ${type} --channel email --summary "Resposta gestionada." --next-action "Seguent pas definit." --status ${type === "follow_up" ? "contacted" : type}</code>
</article>`;
}

function renderLeadHtml(lead) {
  return `<div class="lead"><strong>${escapeHtml(lead.name)}</strong><br>${escapeHtml(lead.area)}<br>${escapeHtml(lead.publicContact || "pendent")}<br><small>${escapeHtml(lead.status)}</small></div>`;
}

function replyAudit() {
  return `Perfecte, t'ho envio.

Ho he preparat en format curt: 5 punts sobre fitxa, posts, ressenyes i conversio local. La idea no és vendre't una web ni anuncis, sinó veure si Google Maps pot estar més actiu i més clar.

Si després de veure-ho té sentit, et proposo provar Apareix 30 dies per 50 EUR i ho deixem tot molt simple.`;
}

function replyPrice(template) {
  return `El pilot són ${template.priceEurPerMonth} EUR/mes, sense permanència i amb setup inclòs.

Inclou revisió inicial de la fitxa, 4 posts mensuals, revisió de ressenyes, respostes suggerides i un informe simple amb què s'ha fet i què prioritzar el mes següent.

No inclou anuncis ni prometo una posició concreta a Google Maps. L'objectiu és que la fitxa estigui més cuidada, activa i orientada a generar accions.`;
}

function replyMeeting() {
  return `Sí, fem-ho simple.

Podem fer una trucada de 15 minuts. Només necessito entendre qui gestiona ara la fitxa, si teniu accés a Google Business Profile i quin objectiu us interessa més: reserves, trucades, ressenyes o visibilitat al barri.

Si encaixa, ho activem com a pilot de 30 dies.`;
}

function replyLater() {
  return `Cap problema.

T'ho deixo apuntat i més endavant et puc enviar una observació concreta de Google Maps si veig alguna oportunitat clara. No cal tocar web ni anuncis per començar; és una rutina petita sobre la fitxa.`;
}

function replyStart(template) {
  return `Perfecte. Ho activem com a ${template.offerName}: ${template.priceEurPerMonth} EUR/mes, 30 dies, sense permanència.

Següent pas:

1. Completar l'onboarding: ${siteUrl}/onboarding
2. Donar accés de gestor a Google Business Profile, sense compartir contrasenyes.
3. Enviar fotos/carta o carpeta Drive si en teniu.

Quan tingui això, preparo la revisió inicial i el primer calendari de 4 posts.`;
}

function readActivity() {
  if (!fs.existsSync(ACTIVITY_PATH)) return { events: [] };
  return JSON.parse(fs.readFileSync(ACTIVITY_PATH, "utf8"));
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

function slugify(value) {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
