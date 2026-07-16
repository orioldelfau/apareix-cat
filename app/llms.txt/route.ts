import { site } from "@/lib/site";

export function GET() {
  return new Response(
    `# Apareix

> Apareix ajuda restaurants a mantenir Google Maps i Google Business Profile actius amb posts, ressenyes i informes mensuals per 50 EUR/mes.

## Contingut principal

- [Servei per restaurants](${site.url}/)
- [Blog sobre Google Maps per restaurants](${site.url}/blog)
- [Portal client](${site.url}/login)

## Temes coberts

- Google Maps per restaurants
- Google Business Profile
- SEO local en restauracio
- Ressenyes i reputacio online
- Posts setmanals a Google
- Informes mensuals de visibilitat local

## Contacte

Per activar Apareix per 50 EUR/mes, visita ${site.url}/login.
`,
    { headers: { "Content-Type": "text/plain; charset=utf-8" } }
  );
}
