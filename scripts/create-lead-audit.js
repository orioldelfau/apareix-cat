const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const LEADS_PATH = path.join(ROOT, "data", "restaurant-leads.json");
const OUT_DIR = path.join(ROOT, "reports", "lead-audits");

const leadId = readArg("--lead") || process.env.LEAD_ID;

main();

function main() {
  const data = JSON.parse(fs.readFileSync(LEADS_PATH, "utf8"));
  const lead = leadId ? data.leads.find((item) => item.id === leadId) : nextLead(data.leads);

  if (!lead) {
    throw new Error(leadId ? `Lead not found: ${leadId}` : "No lead available.");
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const outputPath = path.join(OUT_DIR, `${lead.id}.md`);
  fs.writeFileSync(outputPath, renderAudit(lead), "utf8");

  console.log(
    JSON.stringify(
      {
        ok: true,
        lead: lead.id,
        output: path.relative(ROOT, outputPath),
        nextAction: lead.nextAction
      },
      null,
      2
    )
  );
}

function nextLead(leads) {
  return leads.find((lead) => ["identified", "audited"].includes(lead.status));
}

function renderAudit(lead) {
  const angle = commercialAngle(lead);

  return `# Auditoria curta - ${lead.name}

Data: ${new Date().toISOString().slice(0, 10)}

## Context

- Restaurant: ${lead.name}
- Zona: ${lead.area}
- Segment: ${lead.segment}
- Web: ${lead.website || "pendent"}
- Google Maps: ${lead.googleMapsUrl || "pendent de revisar"}
- Contacte public: ${lead.publicContact || "pendent de localitzar"}
- Font: ${lead.sourceUrl}

## Observacio inicial

${lead.initialObservation}

## Oportunitat comercial

${angle}

## Auditoria de 5 punts

### 1. Fitxa i dades publiques

Revisar si nom, horaris, telefon, web, carta i reserva estan complets i alineats entre Google Maps i la web.

Punt a validar manualment:

- Hi ha link de reserva visible?
- La carta/menu es facil de trobar?
- Els horaris especials semblen treballats?

### 2. Fotos i primera impressio

Revisar si les fotos expliquen be plats, sala, facana, ambient i proposta diferencial.

Punt a validar manualment:

- Les fotos recents venen l'experiencia real?
- Hi ha fotos de facana per facilitar arribada?
- Hi ha fotos de plats clau?

### 3. Ressenyes i confiança

Revisar volum, recurrencia i qualitat de respostes a ressenyes.

Punt a validar manualment:

- Hi ha ressenyes recents sense resposta?
- El to de resposta ajuda a vendre confiança?
- Hi ha patrons repetits de queixa o elogi?

### 4. Activitat i posts

Revisar si Google Business Profile mostra activitat recent i si hi ha contingut que doni motius per reservar.

Primeres idees de posts:

- Plat o proposta diferencial de la setmana.
- Menu de migdia, si aplica.
- Ressenya destacada convertida en prova social.
- Servei diferencial: terrassa, grups, reserves, take away o experiencia.

### 5. Conversio local

Revisar si una persona que arriba des de Google pot decidir rapid: trucar, reservar, veure carta o demanar indicacions.

Punt a validar manualment:

- Hi ha una accio clara?
- La proposta s'entén en menys de 10 segons?
- La web reforça el que promet la fitxa?

## Accions recomanades en 7 dies

1. Revisar dades publiques i links de conversio.
2. Preparar 1 post setmanal amb una proposta concreta.
3. Detectar ressenyes pendents i preparar respostes curtes.

## Proposta Apareix

Apareix pot convertir aquesta gestio en una rutina mensual per 50 EUR/mes:

- Revisio inicial de la fitxa.
- 4 posts mensuals.
- Revisio setmanal de ressenyes.
- Recomanacions concretes.
- Informe mensual simple.

## Missatge curt suggerit

Hola, he estat mirant la presencia de ${lead.name} a Google i crec que hi ha algunes millores concretes per fer que la fitxa transmeti millor i generi mes accions. No parlo de web nova ni anuncis: nomes Google Maps, posts, ressenyes i conversio local. Et puc enviar una auditoria curta amb 5 punts?
`;
}

function commercialAngle(lead) {
  const text = `${lead.segment} ${lead.initialObservation}`.toLowerCase();

  if (text.includes("menu") || text.includes("migdia")) {
    return "El menu de migdia es un angle fort per captar cerques locals recurrents. Google Maps hauria de mostrar activitat, proposta clara i accio rapida per reservar o trucar.";
  }

  if (text.includes("reserva")) {
    return "El restaurant ja te una accio de conversio clara. L'oportunitat es reduir friccio entre Google Maps, web i reserva perquè el client no hagi de pensar massa.";
  }

  if (text.includes("gràcia") || text.includes("gracia")) {
    return "La zona de Gràcia permet treballar cerques locals de barri i intencio alta. La fitxa ha d'explicar be tipus de cuina, ambient i motius per triar-lo davant competidors propers.";
  }

  return "L'oportunitat principal es fer que Google Maps sembli tan cuidat com el restaurant: informacio clara, activitat recent, ressenyes gestionades i accions de conversio visibles.";
}

function readArg(name) {
  const index = process.argv.indexOf(name);
  if (index === -1) return null;
  return process.argv[index + 1] || null;
}

