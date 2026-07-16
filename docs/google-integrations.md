# Integracions Google

Aquest document defineix com Apareix ha d'utilitzar Google Search Console, Google Analytics 4 i Google Ads per aprendre i millorar el blog, la landing i les campanyes.

## Objectiu

Connectar contingut, captacio i aprenentatge:

- Search Console diu quines consultes, pagines, impressions, clics, CTR i posicio tenim a Google.
- Analytics diu que fan els usuaris dins del site.
- Ads diu quines campanyes i keywords porten leads o auditories.

La decisio important: no volem mirar dades per curiositat. Volem convertir-les en accions editorials i comercials.

## Configuracio

Els IDs publics es defineixen a:

`data/site-config.json`

Camps:

- `googleSearchConsoleVerification`: meta tag de verificacio de Search Console.
- `googleAnalyticsMeasurementId`: ID GA4 tipus `G-XXXXXXXXXX`.
- `googleAnalyticsPropertyId`: ID numeric de propietat GA4 per API.
- `googleAdsConversionId`: ID Google Ads tipus `AW-XXXXXXXXXX`.
- `googleAdsConversionLabel`: label de conversio de lead.
- `googleAdsCustomerId`: customer ID de Google Ads.
- `searchConsoleProperty`: propietat GSC, recomanat `sc-domain:apareix.cat`.

Despres d'omplir aquests valors:

```bash
node scripts/build-blog.js
```

## Estat actual Apareix

- Search Console esta connectat a WordPress via Site Kit.
- GA4 esta connectat a WordPress via Site Kit.
- GA4 Measurement ID: `G-Q2CNN7YK1V`.
- GA4 Property ID: `532726049`.
- Search Console property: `https://apareix.cat/`.
- Google Ads encara no esta connectat.

Important: Site Kit esta connectat al WordPress, pero l'automatitzacio no pot llegir dades amb Application Password de WordPress. Per automatitzar decisions editorials cal una connexio API propia amb Google.

## Connexio API per automatitzacio

El script:

```bash
npm run google:insights
```

Llegeix:

- Search Console `searchAnalytics.query`.
- GA4 Data API `properties.runReport`.

I genera:

```text
reports/google-growth-insights.json
reports/google-growth-insights.md
```

### Credencials necessaries

Opcio recomanada: Google service account.

Secrets/variables:

```text
GOOGLE_SERVICE_ACCOUNT_JSON
```

Alternativa local:

```text
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
```

### Permisos necessaris

Afegir el `client_email` del service account a:

- Google Search Console property `https://apareix.cat/` amb permis de lectura.
- GA4 property `532726049` com a Viewer o Analyst.

Scopes utilitzats:

```text
https://www.googleapis.com/auth/webmasters.readonly
https://www.googleapis.com/auth/analytics.readonly
```

### Prova de configuracio

```bash
GOOGLE_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}' npm run google:insights:dry-run
```

Si la configuracio es valida, mostrara:

- Search Console property.
- GA4 property ID.
- Email del service account.
- Rang de dates que consultara.

## Events Recomanats

Events a mesurar:

- `request_audit_click`: clic a demanar auditoria.
- `internal_audit_click`: clic a preparar auditoria interna.
- `blog_cta_click`: clic des d'article cap a auditoria.
- `lead_form_submit`: enviament de formulari quan tinguem backend real.

Ara el site inclou `assets/measurement.js`, que envia events quan un enllac o boto te `data-conversion`.

## Search Console

Fer servir Search Console per detectar:

- Consultes amb moltes impressions i pocs clics.
- Pagines amb posicio mitjana entre 8 i 20.
- Consultes conversacionals que indiquen intencio GEO.
- Articles que necessiten millor title, intro, resposta directa o exemples.

API oficial:

- `searchAnalytics.query` permet consultar dades amb dimensions com `query`, `page`, `country`, `device` i retorna clics, impressions, CTR i posicio.

## Analytics 4

Fer servir GA4 per detectar:

- Articles que porten clics cap a auditoria.
- Percentatge de scroll o interaccio quan ho implementem.
- Fonts de trafic amb mes intencio.
- Diferencia entre SEO, Ads, directe i referits.

API oficial:

- `properties.runReport` retorna informes amb dimensions, metriques i rangs de data.

## Google Ads

Fer servir Ads per:

- Provar keywords comercials amb intencio alta.
- Mesurar cost per auditoria.
- Reutilitzar queries bones com articles.
- Pausar termes amb clics cars i zero leads.

Important:

- Per Google Ads API cal configuracio mes delicada: compte Ads, OAuth, developer token i permisos. Per començar, n'hi ha prou amb Google tag + conversio.

## Rutina Setmanal

1. Revisar Search Console.
2. Detectar 5 consultes amb impressions i CTR baix.
3. Revisar GA4 per veure quins articles generen clics a auditoria.
4. Revisar Ads si hi ha campanyes actives.
5. Crear 1 accio:
   - nou article,
   - millora d'article existent,
   - canvi de CTA,
   - nova keyword per Ads,
   - nova pregunta-resposta GEO.

## Decisions Pendents

Necessito de tu:

- ID de verificacio Search Console.
- ID GA4 `G-...`.
- Property ID GA4 numeric.
- ID de conversio Ads `AW-...`, si vols Ads des del principi.
- Conversion label Ads, quan existeixi.
