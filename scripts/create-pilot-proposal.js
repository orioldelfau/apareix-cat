const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const LEADS_PATH = path.join(ROOT, "data", "restaurant-leads.json");
const TEMPLATE_PATH = path.join(ROOT, "data", "pilot-template.json");
const OUT_DIR = path.join(ROOT, "reports", "pilot-proposals");

const leadId = readArg("--lead") || process.env.LEAD_ID;

main();

function main() {
  if (!leadId) throw new Error("Missing --lead <lead-id>.");

  const leads = JSON.parse(fs.readFileSync(LEADS_PATH, "utf8")).leads;
  const template = JSON.parse(fs.readFileSync(TEMPLATE_PATH, "utf8"));
  const lead = leads.find((item) => item.id === leadId);
  if (!lead) throw new Error(`Lead not found: ${leadId}`);

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const outputPath = path.join(OUT_DIR, `${lead.id}.md`);
  fs.writeFileSync(outputPath, renderProposal(lead, template), "utf8");

  console.log(
    JSON.stringify(
      {
        ok: true,
        lead: lead.id,
        output: path.relative(ROOT, outputPath)
      },
      null,
      2
    )
  );
}

function renderProposal(lead, template) {
  return `# Proposta Pilot - ${lead.name}

Data: ${new Date().toISOString().slice(0, 10)}

## Context

- Restaurant: ${lead.name}
- Zona: ${lead.area}
- Segment: ${lead.segment}
- Web/font: ${lead.website || lead.sourceUrl}
- Contacte públic: ${lead.publicContact || "pendent"}

## Per què té sentit

${lead.initialObservation}

Google Maps pot ajudar especialment en aquest cas per:

- Fer més clara la proposta quan algú busca on menjar a la zona.
- Convertir millor visites a la fitxa en trucades, reserves, web o indicacions.
- Mantenir activitat recurrent sense que l'equip del restaurant ho hagi de recordar cada setmana.

## Oferta

${template.offerName}

- Preu: ${template.priceEurPerMonth} EUR/mes
- Setup: ${template.setup}
- Permanència: ${template.commitment}

## Inclou

${template.included.map((item) => `- ${item}`).join("\n")}

## No Inclou

${template.notIncluded.map((item) => `- ${item}`).join("\n")}

## Primer Mes

1. Revisar fitxa, dades, links i conversió.
2. Preparar 4 posts adaptats a ${lead.segment}.
3. Revisar ressenyes i proposar respostes.
4. Enviar informe mensual amb accions fetes i següent prioritat.

## Condició de Confiança

${template.trustCondition}

## Missatge de Tancament

La idea és començar petit: 30 dies, 50 EUR, sense permanència. Si veus que la fitxa està més cuidada i tens més control sobre Google Maps, ho mantenim mensualment. Si no, ho parem.
`;
}

function readArg(name) {
  const index = process.argv.indexOf(name);
  if (index === -1) return null;
  return process.argv[index + 1] || null;
}

