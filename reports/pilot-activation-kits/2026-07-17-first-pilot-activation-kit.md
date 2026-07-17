# Kit d'Activacio del Pilot - 2026-07-17

Objectiu: quan un restaurant accepta, convertir el "sí" en pilot pagat i onboarding sense improvisar.

## Oferta

- Nom: Apareix Maps - Pilot 30 dies
- Preu: 50 EUR/mes
- Durada inicial: 30 dies
- Setup: Inclòs
- Permanencia: Sense permanència
- Onboarding: https://apareix.cat/onboarding
- Contacte Apareix: hola@orioldelfau.com

## Email de confirmacio

Perfecte, activem el pilot.

Resum:

- Apareix Maps - Pilot 30 dies
- 50 EUR/mes
- 30 dies inicials
- Sense permanencia
- Setup inclos

El següent pas és completar l'onboarding i confirmar el pagament del primer mes. Quan tinguem això, preparem la revisió inicial de la fitxa i el primer calendari de 4 posts.

## Dades que cal demanar per cobrar i facturar

- Nom fiscal.
- NIF/CIF.
- Adreca fiscal.
- Email de facturacio.
- Persona de contacte.
- Metode de pagament acordat: transferencia, Bizum o link de pagament quan estigui disponible.
- Data d'inici del pilot.

## Missatge de pagament manual

Per començar el pilot, cal confirmar el primer mes: 50 EUR.

Et puc enviar les dades de pagament per transferencia/Bizum o, si prefereixes, preparar un link de pagament quan el tinguem actiu.

Per facturacio, envia'm:

- Nom fiscal
- NIF/CIF
- Adreca fiscal
- Email de facturacio

## Abast del pilot

Inclou:

- Revisió inicial de Google Business Profile
- Optimització o recomanació de dades públiques
- 4 posts mensuals preparats per Google Maps
- Revisió setmanal de ressenyes
- Respostes suggerides a ressenyes
- Informe mensual simple
- Pla d'acció per al mes següent

No inclou:

- Anuncis
- Gestió completa de xarxes socials
- Canvis web complexos
- Garantia de posició concreta a Google Maps

Important: no prometem una posicio concreta a Google Maps. El compromís és mantenir la fitxa més cuidada, activa i orientada a accions locals.

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

```bash
npm run lead:record -- --lead LEAD_ID --type won --channel email --summary "Pilot de 30 dies acceptat." --next-action "Confirmar pagament, onboarding i acces GBP." --status won
```

Quan paga:

```bash
npm run lead:record -- --lead LEAD_ID --type payment_confirmed --channel manual --summary "Primer mes del pilot cobrat." --next-action "Activar onboarding i preparar setup inicial."
```

Quan falta pagament:

```bash
npm run lead:record -- --lead LEAD_ID --type payment_pending --channel manual --summary "Pilot acceptat pendent de pagament." --next-action "Fer seguiment de pagament en 24 hores."
```

## Nota operativa

Aquest document no substitueix una factura legal ni assessorament fiscal. Serveix per no perdre el control comercial i operatiu del primer pilot.
