# Connectar `apareix.cat` des de Hostinger

El domini esta comprat a Hostinger, pero pots allotjar la web en una altra plataforma. Recomanacio per Apareix:

- Mantenir el domini a Hostinger.
- Pujar el codi a GitHub.
- Desplegar el site public des de `dist/` amb Vercel o Cloudflare Pages.
- Canviar els DNS a Hostinger segons els valors que doni el hosting.

## Opcio A - Vercel + domini a Hostinger

Passos:

1. Pujar aquest repo a GitHub.
2. Crear projecte a Vercel des de GitHub.
3. Build command: `npm run build`.
4. Output directory: `dist`.
5. Afegir domini `apareix.cat` a Vercel.
6. Afegir també `www.apareix.cat`.
7. Copiar els registres DNS que Vercel mostri.
8. Entrar a Hostinger > Dominis > DNS / Nameservers.
9. Crear o substituir els registres indicats per Vercel.
10. Esperar propagacio i SSL.

No posis el repo sencer a `public_html`. La carpeta publica correcta es `dist/`.

## Opcio B - Cloudflare Pages + domini a Hostinger

Passos:

1. Pujar aquest repo a GitHub.
2. Crear projecte a Cloudflare Pages.
3. Build command: `npm run build`.
4. Output directory: `dist`.
5. Connectar `apareix.cat`.
6. Cloudflare et dira si cal moure nameservers o crear registres DNS.

Cloudflare Pages es bona opcio si vols gestionar DNS i hosting en un mateix lloc.

## Opcio C - Hostinger com a hosting

Si vols fer servir hosting de Hostinger directament:

1. Executa `npm run build`.
2. Puja nomes el contingut de `dist/` a `public_html`.
3. No pugis `dashboard.html`, `audit.html`, `docs/`, `data/`, `scripts/` ni `reports/`.

Aixo es mes manual. Per automatitzar amb GitHub, millor Vercel o Cloudflare Pages.

## Estat Actual del Projecte

El build public ja esta preparat:

```bash
npm run build
```

La carpeta que s'ha de publicar es:

```text
dist/
```

## Que Necessito per Fer-ho Jo

Ara mateix aquest entorn no te GitHub autenticat:

- `gh auth status` diu que no hi ha login.
- SSH amb GitHub retorna `Permission denied (publickey)`.

Per poder pujar-ho jo, fes una de les dues coses:

1. Executa `gh auth login` en aquest ordinador i torna'm a dir "ja esta".
2. Crea un repo buit a GitHub i afegeix aquest ordinador/usuari amb accés de push, despres passa'm la URL del repo.

Quan hi hagi GitHub autenticat o remote configurat, puc executar:

```bash
git remote add origin <repo-url>
git push -u origin main
```
