# Sistema editorial WordPress

## Objectiu

Crear i publicar articles de blog per Apareix directament a WordPress amb revisio SEO/GEO previa.

Cada article inclou:

- Layout editorial d'Apareix amb Elementor.
- Estat `publish` en el workflow diari.
- Categoria.
- Imatge destacada SVG 1200x675 amb alt text.
- Camps Yoast SEO:
  - `_yoast_wpseo_focuskw`
  - `_yoast_wpseo_title`
  - `_yoast_wpseo_metadesc`
- Resposta curta per GEO.
- Taula de continguts.
- FAQs.
- CTA al pla de 50 EUR/mes.

## Comandes

Previsualitzar el proper tema sense crear res:

```bash
WP_USER="..." WP_APP_PASSWORD="..." npm run wp:draft:dry-run
```

Crear el proper article com a esborrany local/manual:

```bash
WP_USER="..." WP_APP_PASSWORD="..." npm run wp:draft
```

Crear i publicar el proper article:

```bash
WP_POST_STATUS="publish" \
NOTIFY_PUBLICATION="true" \
WP_USER="..." \
WP_APP_PASSWORD="..." \
npm run wp:draft
```

Publicar tots els esborranys editorials d'Apareix ja existents:

```bash
WP_USER="..." WP_APP_PASSWORD="..." npm run wp:publish-editorial-drafts
```

Forcar un tema concret:

```bash
ARTICLE_SLUG="errors-fitxa-google-maps-restaurant" \
WP_USER="..." \
WP_APP_PASSWORD="..." \
npm run wp:draft
```

## Cua editorial

La cua viu a:

```text
data/editorial-queue.json
```

El script tria el primer tema que encara no existeix a WordPress com a `publish`, `draft`, `future`, `pending` o `private`.

## Regla operativa

El workflow diari publica automaticament nomes si:

- El tema supera la validacio SEO/GEO del generador.
- WordPress accepta la imatge destacada i els camps Yoast.
- Existeixen els secrets `WP_USER` i `WP_APP_PASSWORD`.

Si falta `RESEND_API_KEY`, l'article es publica igual pero no s'envia email.

## Automatitzacio diaria

Hi ha un workflow preparat a:

```text
.github/workflows/wordpress-editorial-drafts.yml
```

S'executa cada dia a les 07:15 UTC i tambe es pot executar manualment des de GitHub Actions. En horari d'estiu a Barcelona, aixo equival aproximadament a les 09:15.

Secrets necessaris a GitHub:

```text
WP_USER
WP_APP_PASSWORD
```

`WP_APP_PASSWORD` ha de ser un WordPress Application Password, no la contrasenya normal del compte.

Secrets/variables opcionals per notificacio:

```text
RESEND_API_KEY
RESEND_FROM
APAREIX_OWNER_EMAIL
```

## Search Console

Despres de publicar, el sistema deixa la URL final disponible al log del workflow i envia email si Resend esta configurat.

La indexacio manual de Search Console no es pot automatitzar de forma fiable amb l'API publica normal. La URL Inspection API permet consultar l'estat d'una URL, pero no premer "Solicitar indexacion". La Indexing API de Google esta limitada a `JobPosting` i `BroadcastEvent` dins de `VideoObject`, i no s'ha d'usar per articles normals del blog.

Proces recomanat:

1. Obrir la URL publicada.
2. Entrar a Search Console.
3. Fer `Inspeccionar URL`.
4. Fer `Solicitar indexacion`.

Quan validem qualitat durant unes setmanes, podem afegir:

- Connectors de Search Console, GA4 i Google Ads per reordenar la cua segons dades reals.
- Generacio d'imatges amb model d'imatge en lloc de SVG branded.
- Resum setmanal automatic del rendiment del blog.

## Checklist abans de publicar

- El titol SEO es natural i clar.
- La meta description explica benefici i no promet resultats garantits.
- La imatge destacada te filename i alt text descriptius.
- L'article aporta criteri propi per restaurants.
- No repeteix un article existent.
- Inclou enllacos interns i CTA.
- Yoast mostra title, description i schema correctes.
