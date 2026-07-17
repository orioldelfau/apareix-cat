# Pipeline Comercial de Leads

Objectiu: convertir restaurants identificats en auditories enviades i converses comercials.

## Fitxers

- `data/restaurant-leads.json`: tracker de restaurants objectiu.
- `scripts/create-lead-audit.js`: genera una auditoria curta a partir d'un lead.
- `scripts/create-send-queue.js`: genera una cua d'enviament executable, sense enviar res.
- `reports/lead-audits/`: sortida de les auditories en markdown.

## Estats

- `identified`: restaurant detectat.
- `audited`: auditoria preparada.
- `contact_ready`: missatge i auditoria llestos per enviar.
- `contacted`: contacte enviat.
- `responded`: ha respost.
- `meeting`: conversa o trucada agendada.
- `proposal_sent`: proposta enviada.
- `won`: client guanyat.
- `lost`: no encaixa o no respon.

## Registrar activitat

Cada contacte, resposta o canvi important s'ha de registrar a:

```text
data/lead-activity.json
```

Comanda:

```bash
npm run lead:record -- \
  --lead lead-kaguya-hime-barcelona \
  --type contacted \
  --channel email \
  --summary "Enviat primer missatge amb auditoria curta." \
  --next-action "Fer seguiment en 3 dies." \
  --status contacted
```

La comanda pot actualitzar l'estat del lead amb `--status`.

Important: executar registres d'activitat de forma seqüencial. No llançar diversos `lead:record` en paral·lel perquè tots escriuen sobre els mateixos fitxers JSON.

## Veure resum del pipeline

```bash
npm run lead:status
```

Mostra:

- Total de leads.
- Leads amb contacte públic.
- Distribució per estat i prioritat.
- Propers candidats contactables.
- Últimes activitats.

## Com generar una auditoria curta

```bash
npm run lead:audit -- --lead lead-kaguya-hime-barcelona
```

Aixo genera:

```text
reports/lead-audits/lead-kaguya-hime-barcelona.md
```

## Com preparar un lot de contacte

```bash
npm run lead:outreach -- --leads lead-kaguya-hime-barcelona,lead-fukuoka-barcelona,lead-patron-barcelona
```

Aixo genera un markdown revisable a:

```text
reports/outreach-batches/
```

El lot no envia res. Serveix per revisar missatges abans de contactar restaurants manualment.

## Com preparar un pack d'aprovació

```bash
npm run lead:approval
```

Genera:

```text
reports/approval-packs/YYYY-MM-DD-approval-pack.md
reports/approval-packs/YYYY-MM-DD-approval-pack.html
```

El HTML inclou missatges finals, enllaços `mailto:` i checklist abans d'enviar. Tampoc envia res automaticament.

## Com preparar una cua d'enviament

```bash
npm run lead:send-queue -- --limit 10 --name first-10-send-queue
```

Genera:

```text
reports/sales-queues/YYYY-MM-DD-first-10-send-queue.md
reports/sales-queues/YYYY-MM-DD-first-10-send-queue.html
```

La cua ordena els leads `contact_ready`, prioritza els que tenen email directe i inclou:

- Botons `mailto:` o `tel:`.
- Missatge recomanat.
- Enllaç a auditoria i proposta.
- Comanda exacta per registrar el contacte després d'enviar-lo.

La cua no envia emails ni truca automaticament.

## Com preparar el kit de respostes

```bash
npm run lead:response-kit -- --name first-pilot-response-kit
```

Genera:

```text
reports/sales-response-kits/YYYY-MM-DD-first-pilot-response-kit.md
reports/sales-response-kits/YYYY-MM-DD-first-pilot-response-kit.html
```

Serveix per gestionar respostes sense improvisar:

- Si demanen l'auditoria.
- Si pregunten preu.
- Si volen parlar.
- Si diuen que ara no.
- Si accepten començar el pilot.

El kit inclou missatges i comandes `lead:record` per actualitzar el pipeline.

## Com preparar el kit d'activacio del pilot

```bash
npm run lead:activation-kit -- --name first-pilot-activation-kit
```

Genera:

```text
reports/pilot-activation-kits/YYYY-MM-DD-first-pilot-activation-kit.md
reports/pilot-activation-kits/YYYY-MM-DD-first-pilot-activation-kit.html
```

Serveix quan un restaurant diu que vol començar:

- Email de confirmacio.
- Missatge de pagament manual.
- Dades fiscals a demanar.
- Abast del pilot de 30 dies.
- Checklist abans de començar.
- Comandes per registrar `won`, `payment_pending` o `payment_confirmed`.

## Regla abans de contactar

No enviar cap missatge real fins que:

- L'auditoria tingui una observacio especifica de la fitxa o web.
- El missatge no sembli massiu.
- Hi hagi una crida simple: "Et puc enviar 5 millores concretes?"
- Oriol hagi validat el primer lot de missatges o hagi autoritzat enviaments.

## Criteri de Bona Auditoria

Una auditoria curta ha de tenir:

- Una oportunitat visible.
- Un risc o friccio concreta.
- Tres accions prioritzades.
- Una proposta de primer mes.
- Una frase comercial clara per obrir conversa.

## Objectiu Setmanal

Fins arribar al primer pilot:

- Identificar 10 restaurants.
- Preparar 3 auditories.
- Contactar 5 restaurants.
- Fer seguiment als contactes oberts.
