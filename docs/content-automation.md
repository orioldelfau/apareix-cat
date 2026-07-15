# Automatitzacio del Blog

## Objectiu

Crear contingut recurrent per Apareix sense caure en contingut massiu, generic o fet nomes per manipular SEO.

El blog ha de servir per:

- Educar propietaris i gerents de restaurants.
- Captar auditories gratuites.
- Demostrar criteri sobre Google Maps, ressenyes, posts i SEO local.
- Respondre consultes conversacionals i millorar GEO.
- Reutilitzar aprenentatges reals dels pilots.

## Regla Principal

Automatitzar esborranys, calendaris, estructures i publicacio tecnica. No publicar automaticament articles sense revisio.

## Flux Recomanat

1. Generar idees amb `node scripts/plan-content.js`.
2. Triar un tema del pla editorial.
3. Crear o revisar l'article a `data/blog-posts.json`.
4. Afegir experiencia real: exemples, errors vistos en auditories, criteris propis.
5. Executar `node scripts/build-blog.js`.
6. Executar `node scripts/apply-site-config.js` si has canviat IDs de Google.
7. Revisar la pagina generada.
8. Publicar el site.

## Automatitzacio Possible

### Ara

- Generacio de blog estatic des de JSON.
- Generacio de sitemap.
- Generacio de RSS.
- Generacio de pla editorial.
- Generacio de `llms-full.txt`.
- Tracking de clics cap a auditoria amb Google tag quan hi hagi IDs.
- Analisi de dades exportades amb `node scripts/analyze-growth-data.js`.

### Seguent Fase

- Generar esborranys amb OpenAI a partir de briefs.
- Crear PR automatic setmanal amb article en estat draft.
- Revisar i aprovar manualment.
- Publicar nomes quan el contingut superi el control de qualitat.

### Fase Avancada

- Connectar Search Console.
- Detectar consultes amb impressions pero pocs clics.
- Proposar articles o millores d'articles existents.
- Connectar Analytics 4.
- Connectar conversions de Google Ads.
- Actualitzar contingut amb dades dels pilots i preguntes reals de clients.

## Control de Qualitat

Cada article ha de respondre:

- Quin problema real d'un restaurant resol?
- Te exemples aplicables a restauracio?
- Aporta criteri propi d'Apareix?
- Evita prometre resultats impossibles?
- Acaba amb una accio clara cap a auditoria o pilot?

## Temes Prioritaris

- Google Maps per restaurants.
- Google Business Profile per restaurants.
- Ressenyes positives, neutres i negatives.
- Posts setmanals.
- Menus de migdia i temporada.
- Indicacions, trucades, clics i reserves.
- Errors habituals a fitxes de restaurants.
- Competidors locals.

## Risc SEO

Google recomana crear contingut útil, fiable i pensat per persones. També considera senyal d'alerta l'automatitzacio extensa feta per produir molt contingut de molts temes sense valor afegit.

Per Apareix, la via correcta es:

- Publicar menys articles, pero mes especifics.
- Basar-los en auditories reals.
- Mantenir un nixo clar: restaurants i Google Maps.
- Revisar cada peça abans de publicar.
