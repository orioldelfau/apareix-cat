# Pla d'Enviament - Primers 10 Contactes

Data: 2026-07-17

Objectiu: enviar els primers 10 contactes manuals d'Apareix i registrar resposta o seguiment.

Regla: no enviar cap missatge si no s'ha revisat abans la fitxa de Google Maps i afegit una observacio concreta.

## Fitxers de Treball

- Pack unic HTML: `reports/approval-packs/2026-07-17-first-10-approval-pack.html`
- Pack unic Markdown: `reports/approval-packs/2026-07-17-first-10-approval-pack.md`
- Lot de contacte: `reports/outreach-batches/2026-07-17-first-10-contact.md`
- Tracker: `data/lead-activity.json`

## Ordre Recomanat

1. Kaguya-Hime BCN - email directe - angle: menu del dia i Google Maps a Gracia.
2. Fukuoka BCN - email directe - angle: carta, menu del dia i cerques de sushi/japones a Gracia.
3. Patron - email directe - angle: menu del dia prop de Diagonal.
4. Rubion - email directe - angle: restaurant de centre i activitat recurrent a Maps.
5. Cafe Sardina - email directe - angle: cerques locals i turistiques a Sitges.
6. L'Escala - email directe - angle: menu, grups i reserves a Eixample.
7. Haninjung - email directe - angle: reserves i cuina coreana a Eixample.
8. La Granja de Gracia - email directe - angle: menu de migdia i restaurant de barri.
9. Thai Barcelona - telefon public - buscar email o contactar manualment.
10. La Gilda - telefon public - buscar email o contactar manualment.

## Registre Despres d'Enviar

Per cada email enviat:

```bash
npm run lead:record -- --lead LEAD_ID --type contacted --channel email --summary "Primer missatge enviat." --next-action "Fer seguiment en 3 dies." --status contacted
```

Per contacte per trucada o WhatsApp:

```bash
npm run lead:record -- --lead LEAD_ID --type contacted --channel phone --summary "Primer contacte manual fet." --next-action "Fer seguiment en 3 dies." --status contacted
```

## Follow-up

Si no hi ha resposta en 3 dies laborables:

- Enviar un missatge mes curt.
- Adjuntar o enganxar 2 punts de l'auditoria, no tot el document.
- Preguntar si prefereixen rebre-ho per email o WhatsApp.

## Criteri d'Exit

La tasca `rev-003` es pot marcar com a feta quan hi hagi 10 leads en estat `contacted`, encara que no hagin respost.
