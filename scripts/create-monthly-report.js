const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const LEADS_PATH = path.join(ROOT, "data", "restaurant-leads.json");
const OUT_DIR = path.join(ROOT, "reports", "monthly-reports");

const leadId = readArg("--lead") || process.env.LEAD_ID;
const month = readArg("--month") || new Date().toISOString().slice(0, 7);

main();

function main() {
  if (!leadId) throw new Error("Missing --lead <lead-id>.");

  const leads = JSON.parse(fs.readFileSync(LEADS_PATH, "utf8")).leads;
  const lead = leads.find((item) => item.id === leadId);
  if (!lead) throw new Error(`Lead not found: ${leadId}`);

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const outputPath = path.join(OUT_DIR, `${month}-${lead.id}.md`);
  fs.writeFileSync(outputPath, renderReport(lead, month), "utf8");

  console.log(
    JSON.stringify(
      {
        ok: true,
        lead: lead.id,
        month,
        output: path.relative(ROOT, outputPath)
      },
      null,
      2
    )
  );
}

function renderReport(lead, month) {
  return `# Informe Mensual Apareix Maps - ${lead.name}

Mes: ${month}

## 1. Resum Executiu

Aquest és un informe base de mostra per al pilot. L'objectiu és demostrar quina feina recurrent faria Apareix cada mes: fitxa revisada, posts preparats, ressenyes controlades i una prioritat clara per al mes següent.

Per ${lead.name}, la primera hipòtesi és:

> ${lead.initialObservation}

## 2. Accions Realitzades

- Revisió inicial de la fitxa de Google Maps: pendent d'accés o revisió manual completa.
- Revisió de web, carta o reserva: iniciada amb dades públiques.
- Posts mensuals: proposta inicial pendent de validació.
- Ressenyes: pendent de revisar amb accés o captura.
- Recomanacions: primera priorització preparada.

## 3. Activitat de Google Maps

Dades pendents.

Quan el restaurant doni accés o comparteixi captura mensual, aquest apartat inclourà:

- Visualitzacions.
- Cerques.
- Trucades.
- Clics a web o reserva.
- Sol·licituds d'indicacions.

## 4. Ressenyes

Pendent de revisió completa.

Primer criteri:

- Detectar ressenyes pendents.
- Identificar patrons repetits.
- Preparar respostes suggerides amb to professional.

## 5. Contingut del Mes

Proposta de 4 posts:

1. Post de proposta principal: ${postIdea(lead, 1)}
2. Post de menú, carta o producte: ${postIdea(lead, 2)}
3. Post de confiança: ressenya destacada o història del restaurant.
4. Post de conversió: reserva, trucada, indicacions o servei diferencial.

## 6. Oportunitats Detectades

1. Revisar que Google Maps expliqui clarament el tipus de restaurant i zona.
2. Fer més visible l'acció principal: reservar, trucar o veure carta.
3. Mantenir activitat setmanal perquè la fitxa no sembli abandonada.

## 7. Pla del Mes Vinent

- Preparar i publicar 4 posts.
- Revisar ressenyes 1 cop per setmana.
- Revisar fotos i links principals.
- Comparar amb 3 competidors propers.
- Enviar nou informe amb dades reals si ja hi ha accés.
`;
}

function postIdea(lead, index) {
  const text = `${lead.segment} ${lead.initialObservation}`.toLowerCase();
  if (text.includes("menu") || text.includes("migdia") || text.includes("diari")) {
    return index === 1 ? "destacar el menú de migdia o setmanal" : "mostrar un plat o opció del menú amb crida a reservar";
  }
  if (text.includes("reserva")) {
    return index === 1 ? "explicar per què reservar ara" : "mostrar un plat o experiència que justifiqui la reserva";
  }
  return index === 1 ? "destacar la proposta diferencial" : "mostrar plat, carta o ambient del restaurant";
}

function readArg(name) {
  const index = process.argv.indexOf(name);
  if (index === -1) return null;
  return process.argv[index + 1] || null;
}

