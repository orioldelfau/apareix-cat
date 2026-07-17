const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const LEADS_PATH = path.join(ROOT, "data", "restaurant-leads.json");
const ACTIVITY_PATH = path.join(ROOT, "data", "lead-activity.json");
const OUT_DIR = path.join(ROOT, "reports", "email-drafts");

const leadIds = readListArg("--leads");
const limit = Number(readArg("--limit") || 8);
const date = readArg("--date") || new Date().toISOString().slice(0, 10);
const draftName = slugify(readArg("--name") || "email-drafts");
const fromEmail = process.env.APAREIX_OWNER_EMAIL || "hola@orioldelfau.com";

main();

function main() {
  const data = JSON.parse(fs.readFileSync(LEADS_PATH, "utf8"));
  const activity = readActivity();
  const leads = pickLeads(data.leads, activity.events);

  if (!leads.length) throw new Error("No email-ready leads selected for draft generation.");

  const outputDir = path.join(OUT_DIR, `${date}-${draftName}`);
  fs.mkdirSync(outputDir, { recursive: true });

  const drafts = leads.map((lead, index) => {
    const email = firstEmail(lead.publicContact);
    const subject = `Una cosa rapida sobre Google Maps de ${lead.name}`;
    const body = finalMessage(lead);
    const filename = `${String(index + 1).padStart(2, "0")}-${slugify(lead.name)}.eml`;
    const outputPath = path.join(outputDir, filename);

    fs.writeFileSync(outputPath, renderEml({ email, subject, body }), "utf8");

    return {
      lead,
      email,
      subject,
      body,
      file: path.relative(ROOT, outputPath)
    };
  });

  const indexPath = path.join(outputDir, "README.md");
  fs.writeFileSync(indexPath, renderIndex(drafts), "utf8");

  console.log(
    JSON.stringify(
      {
        ok: true,
        count: drafts.length,
        directory: path.relative(ROOT, outputDir),
        index: path.relative(ROOT, indexPath),
        drafts: drafts.map((draft) => draft.file)
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

  const selected = leadIds.length
    ? leadIds.map((id) => {
        const lead = allLeads.find((item) => item.id === id);
        if (!lead) throw new Error(`Lead not found: ${id}`);
        return lead;
      })
    : allLeads
        .filter((lead) => lead.status === "contact_ready")
        .filter((lead) => !contacted.has(lead.id))
        .sort(compareLead);

  return selected.filter((lead) => firstEmail(lead.publicContact)).slice(0, limit);
}

function renderEml({ email, subject, body }) {
  return [
    "X-Unsent: 1",
    `From: Apareix <${fromEmail}>`,
    `To: ${email}`,
    `Subject: ${encodeMimeHeader(subject)}`,
    "MIME-Version: 1.0",
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: 8bit",
    "",
    body,
    ""
  ].join("\r\n");
}

function renderIndex(drafts) {
  return `# Esborranys Email - ${date}

Objectiu: obrir, revisar i enviar manualment els primers emails d'Apareix.

Important: aquests fitxers no envien res automaticament. Són esborranys locals amb capçalera \`X-Unsent: 1\`.

## Esborranys

${drafts.map(renderDraftIndex).join("\n\n")}

## Despres d'enviar

Registra cada email enviat:

\`\`\`bash
npm run lead:record -- --lead LEAD_ID --type contacted --channel email --summary "Primer email enviat manualment." --next-action "Fer seguiment en 3 dies." --status contacted
\`\`\`
`;
}

function renderDraftIndex(draft, index) {
  return `### ${index + 1}. ${draft.lead.name}

- Lead: ${draft.lead.id}
- Email: ${draft.email}
- Fitxer: ${draft.file}
- Assumpte: ${draft.subject}
- Registre:

\`\`\`bash
npm run lead:record -- --lead ${draft.lead.id} --type contacted --channel email --summary "Primer email enviat manualment." --next-action "Fer seguiment en 3 dies." --status contacted
\`\`\``;
}

function finalMessage(lead) {
  return `Hola,

He estat revisant ${lead.name} i crec que hi ha algunes millores concretes perquè Google Maps us ajudi més quan algú busca on menjar per ${lead.area}.

No parlo de fer una web nova ni anuncis. Parlo de tenir la fitxa més viva: posts, ressenyes, fotos, carta/reserva i una mica més de control mensual.

He preparat una auditoria curta amb 5 punts. Te la puc enviar?

Oriol`;
}

function readActivity() {
  if (!fs.existsSync(ACTIVITY_PATH)) return { events: [] };
  return JSON.parse(fs.readFileSync(ACTIVITY_PATH, "utf8"));
}

function compareLead(a, b) {
  const priorityDelta = priorityScore(b.priority) - priorityScore(a.priority);
  if (priorityDelta !== 0) return priorityDelta;
  return a.name.localeCompare(b.name);
}

function priorityScore(value) {
  if (value === "high") return 2;
  if (value === "medium") return 1;
  return 0;
}

function firstEmail(value) {
  const match = String(value || "").match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  return match ? match[0] : "";
}

function encodeMimeHeader(value) {
  return `=?UTF-8?B?${Buffer.from(String(value), "utf8").toString("base64")}?=`;
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
