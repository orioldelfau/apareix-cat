const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const TEMPLATE_PATH = path.join(ROOT, "data", "pilot-template.json");
const OUT_DIR = path.join(ROOT, "reports", "pilot-activation-kits");

const date = readArg("--date") || new Date().toISOString().slice(0, 10);
const kitName = slugify(readArg("--name") || "pilot-activation-kit");
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://apareix.cat";
const ownerEmail = process.env.APAREIX_OWNER_EMAIL || "hola@orioldelfau.com";

main();

function main() {
  const template = JSON.parse(fs.readFileSync(TEMPLATE_PATH, "utf8"));

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const markdownPath = path.join(OUT_DIR, `${date}-${kitName}.md`);
  const htmlPath = path.join(OUT_DIR, `${date}-${kitName}.html`);

  fs.writeFileSync(markdownPath, renderMarkdown(template), "utf8");
  fs.writeFileSync(htmlPath, renderHtml(template), "utf8");

  console.log(
    JSON.stringify(
      {
        ok: true,
        markdown: path.relative(ROOT, markdownPath),
        html: path.relative(ROOT, htmlPath)
      },
      null,
      2
    )
  );
}

function renderMarkdown(template) {
  return `# Kit d'Activacio del Pilot - ${date}

Objectiu: quan un restaurant accepta, convertir el "sí" en pilot pagat i onboarding sense improvisar.

## Oferta

- Nom: ${template.offerName}
- Preu: ${template.priceEurPerMonth} EUR/mes
- Durada inicial: 30 dies
- Setup: ${template.setup}
- Permanencia: ${template.commitment}
- Onboarding: ${siteUrl}/onboarding
- Contacte Apareix: ${ownerEmail}

## Email de confirmacio

${confirmationEmail(template)}

## Dades que cal demanar per cobrar i facturar

- Nom fiscal.
- NIF/CIF.
- Adreca fiscal.
- Email de facturacio.
- Persona de contacte.
- Metode de pagament acordat: transferencia, Bizum o link de pagament quan estigui disponible.
- Data d'inici del pilot.

## Missatge de pagament manual

${paymentMessage(template)}

## Abast del pilot

${scopeText(template)}

## Checklist abans de començar

- Pagament del primer mes confirmat o compromís explícit per escrit.
- Onboarding completat.
- Acces de gestor a Google Business Profile rebut o sol.licitat.
- Link de Google Maps confirmat.
- Web, carta/menu i reserves confirmats.
- Fotos o carpeta Drive rebuda, si existeix.
- Prioritat del primer mes definida.
- Primer calendari de 4 posts preparat.

## Registre del pipeline

Quan accepta:

\`\`\`bash
npm run lead:record -- --lead LEAD_ID --type won --channel email --summary "Pilot de 30 dies acceptat." --next-action "Confirmar pagament, onboarding i acces GBP." --status won
\`\`\`

Quan paga:

\`\`\`bash
npm run lead:record -- --lead LEAD_ID --type payment_confirmed --channel manual --summary "Primer mes del pilot cobrat." --next-action "Activar onboarding i preparar setup inicial."
\`\`\`

Quan falta pagament:

\`\`\`bash
npm run lead:record -- --lead LEAD_ID --type payment_pending --channel manual --summary "Pilot acceptat pendent de pagament." --next-action "Fer seguiment de pagament en 24 hores."
\`\`\`

## Nota operativa

Aquest document no substitueix una factura legal ni assessorament fiscal. Serveix per no perdre el control comercial i operatiu del primer pilot.
`;
}

function renderHtml(template) {
  const blocks = [
    ["Email de confirmacio", confirmationEmail(template)],
    ["Missatge de pagament", paymentMessage(template)],
    ["Abast del pilot", scopeText(template)],
    ["Comanda: won", 'npm run lead:record -- --lead LEAD_ID --type won --channel email --summary "Pilot de 30 dies acceptat." --next-action "Confirmar pagament, onboarding i acces GBP." --status won'],
    ["Comanda: payment_confirmed", 'npm run lead:record -- --lead LEAD_ID --type payment_confirmed --channel manual --summary "Primer mes del pilot cobrat." --next-action "Activar onboarding i preparar setup inicial."']
  ];

  return `<!doctype html>
<html lang="ca">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Kit d'activacio Apareix - ${date}</title>
  <style>
    :root{--green:#064733;--deep:#071d15;--cream:#f7f1e8;--card:#fffaf2;--line:#e4dacb;--ink:#17221c;--muted:#66736b;--gold:#bd8029}
    *{box-sizing:border-box}
    body{margin:0;background:radial-gradient(circle at top left,#fff8dc 0,#f7f1e8 38%,#efe4d3 100%);color:var(--ink);font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
    header{background:linear-gradient(135deg,#041c14,#07583e);color:white;padding:52px 22px}
    header div,main{width:min(1120px,100%);margin:0 auto}
    .eyebrow{margin:0 0 10px;color:#9ee0b7;font-size:12px;font-weight:900;letter-spacing:.18em;text-transform:uppercase}
    h1{max-width:820px;margin:0;font-family:Georgia,serif;font-size:clamp(42px,7vw,80px);line-height:.9;letter-spacing:-.06em}
    header p{max-width:760px;color:rgba(255,255,255,.76);font-size:18px;line-height:1.55}
    main{padding:24px 18px 72px}
    .metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin-top:-44px;margin-bottom:20px}
    .metric,.card{border:1px solid var(--line);background:rgba(255,250,242,.94);box-shadow:0 18px 50px rgba(33,27,18,.08)}
    .metric{border-radius:20px;padding:18px}.metric strong{display:block;color:var(--green);font-family:Georgia,serif;font-size:32px}.metric span{color:var(--muted);font-weight:800}
    .grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}
    .card{border-radius:24px;padding:22px}.wide{grid-column:1/-1}
    h2{margin:0 0 12px;color:var(--green);font-family:Georgia,serif;font-size:32px;line-height:1}
    pre{white-space:pre-wrap;background:var(--deep);color:#fff7eb;border-radius:18px;padding:18px;line-height:1.55;font-family:inherit}
    ul{line-height:1.7;color:var(--muted)}
    @media(max-width:820px){.metrics,.grid{grid-template-columns:1fr}.wide{grid-column:auto}}
  </style>
</head>
<body>
  <header><div>
    <p class="eyebrow">Apareix pilot activation</p>
    <h1>Del sí al primer mes cobrat.</h1>
    <p>Kit operatiu per activar el pilot de 30 dies sense afegir eines de pagament abans d'hora.</p>
  </div></header>
  <main>
    <section class="metrics">
      <div class="metric"><strong>${template.priceEurPerMonth} EUR</strong><span>primer mes</span></div>
      <div class="metric"><strong>30 dies</strong><span>pilot</span></div>
      <div class="metric"><strong>${escapeHtml(template.setup)}</strong><span>setup</span></div>
      <div class="metric"><strong>0</strong><span>permanencia</span></div>
    </section>
    <section class="grid">
      ${blocks.map(renderBlock).join("\n")}
      <article class="card wide">
        <h2>Checklist</h2>
        <ul>
          <li>Pagament del primer mes confirmat o compromís explícit per escrit.</li>
          <li>Onboarding completat a ${escapeHtml(siteUrl)}/onboarding.</li>
          <li>Acces de gestor a Google Business Profile rebut o sol.licitat.</li>
          <li>Web, carta/menu, reserves i Google Maps confirmats.</li>
          <li>Prioritat del primer mes definida.</li>
        </ul>
      </article>
    </section>
  </main>
</body>
</html>`;
}

function renderBlock([title, body]) {
  return `<article class="card">
  <h2>${escapeHtml(title)}</h2>
  <pre>${escapeHtml(body)}</pre>
</article>`;
}

function confirmationEmail(template) {
  return `Perfecte, activem el pilot.

Resum:

- ${template.offerName}
- ${template.priceEurPerMonth} EUR/mes
- 30 dies inicials
- Sense permanencia
- Setup inclos

El següent pas és completar l'onboarding i confirmar el pagament del primer mes. Quan tinguem això, preparem la revisió inicial de la fitxa i el primer calendari de 4 posts.`;
}

function paymentMessage(template) {
  return `Per començar el pilot, cal confirmar el primer mes: ${template.priceEurPerMonth} EUR.

Et puc enviar les dades de pagament per transferencia/Bizum o, si prefereixes, preparar un link de pagament quan el tinguem actiu.

Per facturacio, envia'm:

- Nom fiscal
- NIF/CIF
- Adreca fiscal
- Email de facturacio`;
}

function scopeText(template) {
  return `Inclou:

${template.included.map((item) => `- ${item}`).join("\n")}

No inclou:

${template.notIncluded.map((item) => `- ${item}`).join("\n")}

Important: no prometem una posicio concreta a Google Maps. El compromís és mantenir la fitxa més cuidada, activa i orientada a accions locals.`;
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
