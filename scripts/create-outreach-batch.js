const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const LEADS_PATH = path.join(ROOT, "data", "restaurant-leads.json");
const OUT_DIR = path.join(ROOT, "reports", "outreach-batches");

const leadIds = readListArg("--leads");
const limit = Number(readArg("--limit") || 5);

main();

function main() {
  const data = JSON.parse(fs.readFileSync(LEADS_PATH, "utf8"));
  const leads = pickLeads(data.leads);

  if (!leads.length) {
    throw new Error("No leads selected for outreach batch.");
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const date = new Date().toISOString().slice(0, 10);
  const outputPath = path.join(OUT_DIR, `${date}-first-contact.md`);
  fs.writeFileSync(outputPath, renderBatch(leads, date), "utf8");

  console.log(
    JSON.stringify(
      {
        ok: true,
        count: leads.length,
        output: path.relative(ROOT, outputPath),
        leads: leads.map((lead) => lead.id)
      },
      null,
      2
    )
  );
}

function pickLeads(allLeads) {
  if (leadIds.length) {
    const selected = leadIds.map((id) => {
      const lead = allLeads.find((item) => item.id === id);
      if (!lead) throw new Error(`Lead not found: ${id}`);
      return lead;
    });
    return selected;
  }

  return allLeads
    .filter((lead) => lead.priority === "high")
    .slice(0, limit);
}

function renderBatch(leads, date) {
  return `# Lot de Contacte - ${date}

Objectiu: validar si hi ha interes real en una auditoria curta d'Apareix.

Regla: no enviar massivament. Revisar cada missatge, afegir una observacio especifica de la fitxa i enviar nomes quan sembli personalitzat.

## Missatge base

Hola [Nom],

He estat mirant la presència de [Restaurant] a Google i crec que hi ha algunes millores concretes per fer que la fitxa transmeti millor i generi més accions.

No parlo de fer una web nova ni anuncis. Parlo de Google Maps: posts, ressenyes, fotos, carta/reserva i conversió local.

Et puc enviar una auditoria curta amb 5 punts?

Oriol

## Leads

${leads.map(renderLead).join("\n\n")}
`;
}

function renderLead(lead, index) {
  return `### ${index + 1}. ${lead.name}

- Estat: ${lead.status}
- Prioritat: ${lead.priority}
- Zona: ${lead.area}
- Segment: ${lead.segment}
- Contacte públic: ${lead.publicContact || "pendent"}
- Web/font: ${lead.website || lead.sourceUrl}
- Auditoria: reports/lead-audits/${lead.id}.md

Observació inicial:

${lead.initialObservation}

Angle d'obertura:

${openingAngle(lead)}

Missatge curt:

> Hola, he estat mirant ${lead.name} i crec que hi ha 4-5 millores concretes perquè Google Maps transmeti millor la proposta i generi més accions. Especialment per ${shortReason(lead)}. Et puc enviar una auditoria curta sense cost?

Següent acció:

- Revisar manualment la fitxa de Google Maps.
- Afegir una observació específica real al missatge.
- Enviar només si el missatge queda personalitzat.`;
}

function openingAngle(lead) {
  const text = `${lead.segment} ${lead.initialObservation}`.toLowerCase();
  if (text.includes("menu") || text.includes("migdia") || text.includes("diari")) {
    return "Menú de migdia/setmanal com a ganxo de cerques locals recurrents.";
  }
  if (text.includes("reserva") || text.includes("trucades")) {
    return "Reduir fricció entre Google Maps, reserva, trucada i web.";
  }
  if (text.includes("turisme") || text.includes("sitges") || text.includes("girona")) {
    return "Convertir millor cerques locals i turístiques amb informació clara i activitat recent.";
  }
  return "Fer que la fitxa sembli tan cuidada com el restaurant i estigui activa cada setmana.";
}

function shortReason(lead) {
  const text = `${lead.segment} ${lead.initialObservation}`.toLowerCase();
  if (text.includes("menu") || text.includes("migdia") || text.includes("diari")) return "aprofitar millor el menú i les cerques de migdia";
  if (text.includes("reserva")) return "connectar millor fitxa, web i reserves";
  if (text.includes("turisme") || text.includes("sitges")) return "captar millor cerques locals i turístiques";
  return "tenir la fitxa més activa i orientada a conversió";
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

