# Sistema editorial WordPress

## Objectiu

Crear esborranys de blog per Apareix directament a WordPress, sense publicar automaticament.

Cada esborrany inclou:

- Layout editorial d'Apareix amb Elementor.
- Estat `draft`.
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

Crear el proper esborrany:

```bash
WP_USER="..." WP_APP_PASSWORD="..." npm run wp:draft
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

## Regla de seguretat

No es publica automaticament. El sistema nomes crea esborranys.

## Automatitzacio diaria

Hi ha un workflow preparat a:

```text
.github/workflows/wordpress-editorial-drafts.yml
```

S'executa cada dia a les 07:15 UTC i tambe es pot executar manualment des de GitHub Actions.

Secrets necessaris a GitHub:

```text
WP_USER
WP_APP_PASSWORD
```

`WP_APP_PASSWORD` ha de ser un WordPress Application Password, no la contrasenya normal del compte.

Quan validem qualitat durant unes setmanes, podem afegir:

- Connectors de Search Console, GA4 i Google Ads per reordenar la cua segons dades reals.
- Generacio d'imatges amb model d'imatge en lloc de SVG branded.
- Notificacio email quan hi ha nou esborrany pendent de revisio.

## Checklist abans de publicar

- El titol SEO es natural i clar.
- La meta description explica benefici i no promet resultats garantits.
- La imatge destacada te filename i alt text descriptius.
- L'article aporta criteri propi per restaurants.
- No repeteix un article existent.
- Inclou enllacos interns i CTA.
- Yoast mostra title, description i schema correctes.
