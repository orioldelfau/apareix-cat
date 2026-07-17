# Apareix

Apareix es un producte de subscripcio per ajudar restaurants a mantenir activa la seva presencia a Google Maps i Google Search per 50 EUR/mes.

El primer nixo es restauracio: restaurants, bars, cafeteries, braseries, pizzeries, restaurants de menu, restaurants de cuina local i negocis de menjar per emportar.

## Promesa

Fer que el restaurant aparegui millor, comuniqui millor i converteixi millor quan algu busca on menjar a prop.

## Producte

- Subscripcio unica de 50 EUR/mes.
- Setup inicial inclos.
- Optimitzacio recurrent de Google Business Profile.
- Posts setmanals adaptats al restaurant.
- Revisio setmanal i respostes suggerides a ressenyes.
- Informe mensual en PDF.
- Recomanacions accionables per millorar visibilitat i conversio.

## Documents del projecte

- [package.json](package.json): scripts de build, blog, planificacio i servei local.
- [dist](dist): carpeta generada per publicar al domini. No editar manualment.
- [docs/deployment.md](docs/deployment.md): com desplegar i connectar `apareix.cat`.
- [docs/hostinger-domain.md](docs/hostinger-domain.md): opcions per connectar el domini comprat a Hostinger.
- [index.html](index.html): landing publica per captar subscripcions de restaurants.
- [styles.css](styles.css): estils de la landing.
- [assets/apareix-restaurant-hero.png](assets/apareix-restaurant-hero.png): imatge hero generada per la landing.
- [dashboard.html](dashboard.html): panell intern per operar restaurants.
- [dashboard.css](dashboard.css): estils del panell intern.
- [dashboard.js](dashboard.js): logica local del panell amb `localStorage`.
- [audit.html](audit.html): eina interna per generar auditories rapides de Google Maps.
- [audit.css](audit.css): estils de l'eina d'auditoria.
- [audit.js](audit.js): calcul de puntuacio, recomanacions i historial local d'auditories.
- [blog/index.html](blog/index.html): index del blog generat.
- [blog/posts](blog/posts): articles del blog generats.
- [blog.css](blog.css): estils del blog.
- [data/blog-posts.json](data/blog-posts.json): font dels articles publicats.
- [data/content-seeds.json](data/content-seeds.json): pilars i angles per generar plans editorials.
- [data/site-config.json](data/site-config.json): configuracio publica de domini, Search Console, Analytics i Ads.
- [data/growth-metrics.sample.json](data/growth-metrics.sample.json): format d'entrada per analitzar dades de creixement.
- [scripts/build-blog.js](scripts/build-blog.js): genera blog, sitemap i RSS.
- [scripts/plan-content.js](scripts/plan-content.js): genera un pla editorial de 8 setmanes.
- [scripts/apply-site-config.js](scripts/apply-site-config.js): aplica configuracio Google a la landing principal.
- [scripts/analyze-growth-data.js](scripts/analyze-growth-data.js): converteix dades de GSC, GA4 i Ads en oportunitats.
- [docs/content-automation.md](docs/content-automation.md): flux recomanat d'automatitzacio de contingut.
- [docs/blog-automation.md](docs/blog-automation.md): workflow setmanal per generar articles amb OpenAI i obrir PRs.
- [docs/saas-setup.md](docs/saas-setup.md): configuracio de Supabase, Resend i Vercel per activar el portal SaaS.
- [docs/geo-strategy.md](docs/geo-strategy.md): estrategia GEO per consultes conversacionals i motors generatius.
- [docs/google-integrations.md](docs/google-integrations.md): configuracio de Search Console, Analytics i Ads.
- [docs/business-plan.md](docs/business-plan.md): enfoc comercial, client ideal, oferta i pricing.
- [docs/mvp.md](docs/mvp.md): definicio del producte inicial construible i vendible.
- [docs/client-onboarding.md](docs/client-onboarding.md): informacio que cal demanar al restaurant.
- [docs/technical-roadmap.md](docs/technical-roadmap.md): arquitectura i fases de desenvolupament.
- [docs/offer.md](docs/offer.md): oferta comercial i proposta de subscripcio.
- [docs/sales-outreach.md](docs/sales-outreach.md): emails, trucades i missatges per vendre els primers clients.
- [docs/audit-template.md](docs/audit-template.md): plantilla per auditar una fitxa de Google Maps.
- [docs/lead-pipeline.md](docs/lead-pipeline.md): pipeline comercial, estats i generacio d'auditories curtes.
- [docs/pilot-proposal.md](docs/pilot-proposal.md): proposta pilot de 30 dies per convertir auditories en clients.
- [docs/monthly-report-template.md](docs/monthly-report-template.md): estructura d'informe mensual per demostrar feina recurrent.
- [docs/mvp-operating-system.md](docs/mvp-operating-system.md): sistema manual per operar els primers clients abans del software complet.
- [docs/product-backlog.md](docs/product-backlog.md): versions del producte i criteris de fet.
- [docs/founder-decisions.md](docs/founder-decisions.md): decisions pendents per prioritzar el negoci i el primer sprint.
- [docs/operator-mode.md](docs/operator-mode.md): regles per operar Apareix amb Codex com a operador proactiu.
- [docs/30-day-revenue-sprint.md](docs/30-day-revenue-sprint.md): sprint comercial per aconseguir el primer pilot pagant.
- [data/operator-backlog.json](data/operator-backlog.json): backlog priorititzat per facturacio, operacio i producte.
