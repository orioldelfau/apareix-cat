# Desplegament i Domini

## Objectiu

Publicar nomes el site public d'Apareix al domini `apareix.cat`.

Important: el repo conte eines internes (`dashboard.html`, `audit.html`), documents i dades. No s'ha de publicar tota l'arrel del repo. El build public es genera a `dist/`.

## Build Public

```bash
npm run build
```

Aquest comandament:

1. Aplica configuracio de Google a la landing.
2. Regenera el blog, sitemap, RSS i `llms-full.txt`.
3. Copia nomes fitxers publics a `dist/`.

Fitxers publics:

- `index.html`
- `styles.css`
- `blog.css`
- `blog/`
- `assets/`
- `robots.txt`
- `sitemap.xml`
- `rss.xml`
- `llms.txt`
- `llms-full.txt`

Fitxers interns exclosos:

- `dashboard.html`
- `audit.html`
- `docs/`
- `data/`
- `reports/`
- `content-drafts/`
- `scripts/`

## Opcio Recomanada

Per aquest projecte, la via mes simple es:

1. Pujar el repo a GitHub.
2. Connectar GitHub amb Vercel, Netlify o Cloudflare Pages.
3. Configurar build command: `npm run build`.
4. Configurar output directory: `dist`.
5. Connectar domini `apareix.cat`.

## DNS

Els registres DNS exactes depenen del hosting.

### Vercel

Normalment:

- `A` per domini apex `apareix.cat` cap a la IP que indiqui Vercel.
- `CNAME` per `www.apareix.cat` cap al target que indiqui Vercel.

Vercel mostra els valors exactes quan afegeixes el domini.

### Netlify

Normalment:

- `A` per domini apex cap a les IPs de Netlify, o nameservers de Netlify.
- `CNAME` per `www` cap al subdomini Netlify.

Netlify mostra els valors exactes quan afegeixes el domini.

### Cloudflare Pages

Normalment:

- Domini gestionat a Cloudflare.
- `CNAME` cap al projecte Pages.
- SSL automatic.

Cloudflare Pages es bona opcio si el domini ja esta a Cloudflare.

## Que Necessito de Tu

Per connectar el domini sense demanar contrasenyes, el millor es que em donis:

- On has comprat el domini: Cloudflare, DonDominio, IONOS, GoDaddy, Namecheap, etc.
- On vols allotjar el site: Vercel, Netlify, Cloudflare Pages o un altre.
- Si tens GitHub i vols que pugem aquest repo.
- Els IDs de Google quan els tinguis:
  - Search Console verification.
  - GA4 measurement ID.
  - GA4 property ID.
  - Google Ads conversion ID i label.

## Recomanacio Practica

Si no tens preferencia:

- Hosting: Vercel o Cloudflare Pages.
- DNS: Cloudflare si vols control i rapidesa.
- Publicacio: sempre des de `dist/`.

## Checklist de Posada en Marxa

- Build public creat amb `npm run build`.
- `dist/` revisat.
- Hosting connectat al repo.
- Output directory configurat com `dist`.
- Domini apex `apareix.cat` afegit al hosting.
- Subdomini `www.apareix.cat` afegit i redirigit.
- DNS aplicats.
- SSL actiu.
- `https://apareix.cat/robots.txt` accessible.
- `https://apareix.cat/sitemap.xml` accessible.
- Domini verificat a Search Console.
