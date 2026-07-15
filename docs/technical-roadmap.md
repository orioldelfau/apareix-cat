# Roadmap Tecnic Apareix

## Objectiu Tecnic

Crear una eina interna que permeti operar restaurants de forma repetible i, amb el temps, convertir-la en un SaaS o productized service amb portal per client.

## Fase 0 - Validacio Manual Assistida

Durada recomanada: 1-3 setmanes.

Objectiu:

- Vendre i operar els primers restaurants amb processos simples.

Eines:

- Google Sheets o base de dades simple.
- Formulari d'onboarding.
- Generacio de textos amb IA.
- Plantilla d'informe PDF.
- Gestio manual d'accessos.

Resultat:

- Saber exactament que es repeteix.
- Entendre quines dades son dificils d'aconseguir.
- Tancar els primers casos d'us.

## Fase 1 - Panell Intern MVP

Funcionalitats:

- CRUD de restaurants.
- Estat d'onboarding.
- Checklist per client.
- Generador de posts.
- Registre de publicacions.
- Registre de ressenyes i respostes.
- Generador d'informes mensuals PDF.

Stack recomanat:

- Next.js per l'aplicacio.
- PostgreSQL per dades.
- Supabase per auth i base de dades, si es vol rapidesa.
- Storage per fotos i PDFs.
- OpenAI API per generacio de textos i resum d'informes.
- Integracio Google Business Profile quan l'acces API estigui aprovat.

## Fase 2 - Integracio Google

Objectiu:

- Connectar comptes Google Business Profile amb OAuth.
- Llegir ubicacions, ressenyes i metriques disponibles.
- Publicar posts quan sigui viable.

Punts importants:

- Cal sol.licitar acces a les Business Profile APIs.
- No s'han de demanar contrasenyes.
- Cal gestionar permisos per compte i ubicacio.
- Les accions sensibles han de quedar registrades.

Moduls:

- Google OAuth.
- Locations sync.
- Reviews sync.
- Performance metrics sync.
- Posts publishing.
- Audit log.

## Fase 3 - Portal Client

Quan el servei ja estigui validat:

- Dashboard mensual.
- Aprovacio de posts.
- Aprovacio de respostes a ressenyes negatives.
- Biblioteca de fotos.
- Formulari per enviar promocions o canvis de menu.
- Historic d'informes.

## Model de Dades Inicial

### Restaurant

- id
- name
- address
- phone
- website_url
- booking_url
- menu_url
- cuisine_type
- average_ticket
- tone_of_voice
- status
- created_at

### GoogleLocation

- id
- restaurant_id
- google_location_id
- maps_url
- verified_status
- primary_category
- additional_categories
- last_synced_at

### OnboardingChecklist

- id
- restaurant_id
- field_key
- status
- value
- notes
- updated_at

### Post

- id
- restaurant_id
- title
- body
- image_url
- status
- scheduled_for
- published_at
- google_post_id

### Review

- id
- restaurant_id
- google_review_id
- rating
- author
- body
- sentiment
- reply_status
- suggested_reply
- published_reply
- created_at

### MonthlyReport

- id
- restaurant_id
- period
- pdf_url
- summary
- metrics_json
- created_at

## Automatitzacions Prioritaries

1. Generar auditoria inicial.
2. Generar posts setmanals.
3. Detectar ressenyes pendents.
4. Suggerir respostes.
5. Crear informe mensual PDF.
6. Recordar al client que enviï menus, fotos o promocions.

## Riscos Tecnics

- Acces a Google Business Profile API pot requerir aprovacio.
- Algunes metriques poden no estar disponibles per totes les fitxes.
- La publicacio automatica ha de respectar politiques de Google.
- Les respostes a ressenyes negatives poden tenir risc reputacional.
- Les dades de competidors no sempre tindran API oficial suficient.

## Decisions Recomanades

- Comencar amb panell intern, no portal client.
- No construir scraping agressiu de Google Maps.
- Fer servir aprovacions humanes per canvis sensibles.
- Guardar logs de totes les accions.
- Fer informes simples abans de fer dashboards complexos.

## Primer Sprint Tecnic

Objectiu:

Tenir una app local on es pugui donar d'alta un restaurant i generar el seu primer paquet operatiu.

Tasques:

- Crear projecte Next.js.
- Crear base de dades.
- Crear taula de restaurants.
- Crear formulari d'onboarding.
- Crear generador de posts amb dades del restaurant.
- Crear plantilla d'informe mensual.
- Exportar informe en PDF.

Definicio de fet:

- Es pot crear un restaurant.
- Es pot completar la checklist.
- Es poden generar 4 posts.
- Es pot generar un PDF mensual basic.
