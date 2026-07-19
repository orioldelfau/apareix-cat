# Pla d'Enviament - Primers 10 Contactes

Data de preparacio: 2026-07-17
Data recomanada d'enviament: dilluns 2026-07-20, 09:15-10:15

Objectiu: enviar els primers 10 contactes manuals d'Apareix i registrar resposta o seguiment.

Regla: no enviar cap missatge si no s'ha revisat abans la fitxa de Google Maps i afegit una observacio concreta.

## Fitxers de Treball

- Pack unic HTML: `reports/approval-packs/2026-07-17-first-10-approval-pack.html`
- Pack unic Markdown: `reports/approval-packs/2026-07-17-first-10-approval-pack.md`
- Lot de contacte: `reports/outreach-batches/2026-07-17-first-10-contact.md`
- Esborranys locals `.eml`: `reports/email-drafts/2026-07-17-first-10-email-drafts/`
- Cua executable: `reports/sales-queues/2026-07-17-first-10-send-queue.html`
- Tracker: `data/lead-activity.json`

## Execucio Recomanada

1. Obrir Gmail o el client de correu de `hola@orioldelfau.com`.
2. Obrir un `.eml`, revisar nom del restaurant, email i primer paragraf.
3. Enviar només si el missatge sona natural i l'observacio concreta encaixa.
4. Registrar l'enviament amb el comandament indicat a sota.
5. Passar al següent lead. No optimitzar més el copy durant aquesta ronda.

Objectiu de temps: 10 emails en 45 minuts. Si un email genera dubte, saltar-lo i seguir amb el següent.

## Ordre Recomanat

1. Cafe Sardina - `reservations@cafesardinas.com` - angle: cerques locals i turistiques a Sitges.
2. Fukuoka BCN - `fukuokasushingrill@gmail.com` - angle: carta, menu del dia i cerques de sushi/japones a Gracia.
3. Haninjung - `ugnoos@gmail.com` - angle: reserves i cuina coreana a Eixample.
4. Kaguya-Hime BCN - `reservas@kaguyahimebcn.es` - angle: menu del dia i Google Maps a Gracia.
5. L'Escala - `info@lescalabcn.com` - angle: menu, grups i reserves a Eixample.
6. La Gilda - `hola@lagildabcn.com` - angle: tapes, ressenyes i visibilitat Gracia / Eixample Dret.
7. La Granja de Gracia - `info@lagranjadegracia.com` - angle: menu de migdia i restaurant de barri.
8. Patron - `booking@patron-restaurant.com` - angle: menu del dia prop de Diagonal.
9. Rubion - `restaurant@rubion.es` - angle: restaurant de centre i activitat recurrent a Maps.
10. Thai Barcelona - `info@thaibarcelona.com` - angle: menu de migdia i Passeig de Gracia.

## Registre Despres d'Enviar

Per cada email enviat:

```bash
npm run lead:record -- --lead LEAD_ID --type contacted --channel email --summary "Primer missatge enviat." --next-action "Fer seguiment en 3 dies." --status contacted
```

## Follow-up

Si no hi ha resposta en 3 dies laborables:

- Enviar un missatge mes curt.
- Adjuntar o enganxar 2 punts de l'auditoria, no tot el document.
- Preguntar si prefereixen rebre-ho per email o WhatsApp.

Primera data de follow-up recomanada si s'envien el 2026-07-20: dijous 2026-07-23.

## Criteri d'Exit

La tasca `rev-003` es pot marcar com a feta quan hi hagi 10 leads en estat `contacted`, encara que no hagin respost.
