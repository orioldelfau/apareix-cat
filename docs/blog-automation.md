# Automatitzacio del Blog

## Objectiu

Generar un article setmanal per al blog d'Apareix sense publicar contingut sense revisar.

Flux recomanat:

1. GitHub Actions genera un article nou cada dilluns.
2. El workflow actualitza `data/blog-posts.json`, regenera el blog, sitemap, RSS, `llms-full.txt` i `dist`.
3. GitHub obre una pull request.
4. Revisem el text.
5. Fem merge.
6. Vercel publica la nova versio si el repo esta connectat a Vercel.

## Que cal configurar

### 1. Secret d'OpenAI

A GitHub:

`Settings > Secrets and variables > Actions > New repository secret`

Crear:

```text
OPENAI_API_KEY=sk-...
```

Opcionalment, a `Variables`, pots definir:

```text
OPENAI_MODEL=gpt-4.1-mini
```

Si no es defineix `OPENAI_MODEL`, el workflow utilitza `gpt-4.1-mini`.

### 2. Connexio GitHub-Vercel

Ara el deploy manual a Vercel funciona, pero per publicar automaticament quan es faci merge cal connectar el repo a Vercel.

Ruta recomanada:

`Vercel > Project Settings > Git > Connect Git Repository`

Repo:

```text
orioldelfau/apareix-cat
```

Build:

```text
npm run build
```

Output:

```text
dist
```

### 3. Revisio editorial

No recomano autopublicar sense revisio fins que hi hagi 8-12 articles generats amb qualitat estable.

Checklist abans de merge:

- L'article aporta criteri practic per restaurants.
- No promet posicions concretes a Google Maps.
- No sembla una plantilla generica.
- Te resposta curta clara per GEO.
- Inclou FAQs i entitats rellevants.
- El CTA apunta a Apareix Maps per 50 EUR/mes.

## Com executar-ho manualment

Per veure quin tema generaria sense cridar l'API:

```bash
npm run generate:blog -- --dry-run
```

Per generar un article localment:

```bash
OPENAI_API_KEY=sk-... npm run generate:blog
npm run build
```

Per forcar una data:

```bash
BLOG_POST_DATE=2026-07-20 OPENAI_API_KEY=sk-... npm run generate:blog
```

## Fonts del sistema

- `data/content-seeds.json`: pilars, angles, audiencia i mercat.
- `scripts/generate-blog-post.js`: genera un article nou amb OpenAI.
- `scripts/build-blog.js`: converteix `data/blog-posts.json` en HTML, RSS, sitemap i `llms-full.txt`.
- `.github/workflows/blog-automation.yml`: workflow setmanal que obre una PR.
