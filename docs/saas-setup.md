# Apareix SaaS Setup

## Estat

El repo ja inclou una primera base SaaS amb:

- Landing i blog en Next.js.
- Registre i login amb Supabase Auth.
- Onboarding de restaurant.
- Portal client.
- Panell intern `/admin`.
- Notificacio per email amb Resend quan es completa onboarding.
- Migracio SQL a `supabase/migrations/001_apareix_saas.sql`.

## Variables d'entorn

Configurar a Vercel i `.env.local`:

```text
NEXT_PUBLIC_SITE_URL=https://apareix.cat
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
RESEND_API_KEY=...
RESEND_FROM=Apareix <onboarding@resend.dev>
APAREIX_OWNER_EMAIL=hola@orioldelfau.com
```

Quan el domini `apareix.cat` tingui email verificat a Resend, canviar:

```text
RESEND_FROM=Apareix <hola@apareix.cat>
```

## Supabase

1. Crear projecte Supabase.
2. Executar `supabase/migrations/001_apareix_saas.sql` al SQL editor.
3. Copiar `Project URL` a `NEXT_PUBLIC_SUPABASE_URL`.
4. Copiar `anon public key` a `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
5. Crear el primer usuari des del portal.
6. Convertir-lo en admin:

```sql
update public.profiles
set role = 'admin'
where email = 'hola@orioldelfau.com';
```

## Vercel

El projecte ara és Next.js. Build:

```text
npm run build
```

No necessita `dist` com a output.

## Flux client

1. El client entra a `/login`.
2. Crea compte.
3. Completa `/onboarding`.
4. Rep portal a `/portal`.
5. Apareix rep email intern.
6. L'equip prepara posts, ressenyes i informe des de `/admin`.

## Següent fase

- Stripe Checkout per activar la subscripcio de 50 EUR/mes.
- Formularis d'aprovacio de posts.
- Generador de posts per restaurant.
- Upload real de fotos amb Supabase Storage.
- Integracio Google Business Profile API.
