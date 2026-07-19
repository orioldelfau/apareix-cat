# Esborranys Email - 2026-07-17

Objectiu: obrir, revisar i enviar manualment els primers emails d'Apareix.

Important: aquests fitxers no envien res automaticament. Són esborranys locals amb capçalera `X-Unsent: 1`.

## Esborranys

### 1. Café Sardina

- Lead: lead-cafe-sardina-sitges
- Email: reservations@cafesardinas.com
- Fitxer: reports/email-drafts/2026-07-17-first-10-email-drafts/01-cafe-sardina.eml
- Assumpte: Una cosa rapida sobre Google Maps de Café Sardina
- Registre:

```bash
npm run lead:record -- --lead lead-cafe-sardina-sitges --type contacted --channel email --summary "Primer email enviat manualment." --next-action "Fer seguiment en 3 dies." --status contacted
```

### 2. Fukuoka BCN

- Lead: lead-fukuoka-barcelona
- Email: fukuokasushingrill@gmail.com
- Fitxer: reports/email-drafts/2026-07-17-first-10-email-drafts/02-fukuoka-bcn.eml
- Assumpte: Una cosa rapida sobre Google Maps de Fukuoka BCN
- Registre:

```bash
npm run lead:record -- --lead lead-fukuoka-barcelona --type contacted --channel email --summary "Primer email enviat manualment." --next-action "Fer seguiment en 3 dies." --status contacted
```

### 3. Haninjung

- Lead: lead-haninjung-barcelona
- Email: ugnoos@gmail.com
- Fitxer: reports/email-drafts/2026-07-17-first-10-email-drafts/03-haninjung.eml
- Assumpte: Una cosa rapida sobre Google Maps de Haninjung
- Registre:

```bash
npm run lead:record -- --lead lead-haninjung-barcelona --type contacted --channel email --summary "Primer email enviat manualment." --next-action "Fer seguiment en 3 dies." --status contacted
```

### 4. Kaguya-Hime BCN

- Lead: lead-kaguya-hime-barcelona
- Email: reservas@kaguyahimebcn.es
- Fitxer: reports/email-drafts/2026-07-17-first-10-email-drafts/04-kaguya-hime-bcn.eml
- Assumpte: Una cosa rapida sobre Google Maps de Kaguya-Hime BCN
- Registre:

```bash
npm run lead:record -- --lead lead-kaguya-hime-barcelona --type contacted --channel email --summary "Primer email enviat manualment." --next-action "Fer seguiment en 3 dies." --status contacted
```

### 5. L'Escala

- Lead: lead-lescala-barcelona
- Email: info@lescalabcn.com
- Fitxer: reports/email-drafts/2026-07-17-first-10-email-drafts/05-l-escala.eml
- Assumpte: Una cosa rapida sobre Google Maps de L'Escala
- Registre:

```bash
npm run lead:record -- --lead lead-lescala-barcelona --type contacted --channel email --summary "Primer email enviat manualment." --next-action "Fer seguiment en 3 dies." --status contacted
```

### 6. La Gilda

- Lead: lead-la-gilda-barcelona
- Email: hola@lagildabcn.com
- Fitxer: reports/email-drafts/2026-07-17-first-10-email-drafts/06-la-gilda.eml
- Assumpte: Una cosa rapida sobre Google Maps de La Gilda
- Registre:

```bash
npm run lead:record -- --lead lead-la-gilda-barcelona --type contacted --channel email --summary "Primer email enviat manualment." --next-action "Fer seguiment en 3 dies." --status contacted
```

### 7. La Granja de Gràcia

- Lead: lead-la-granja-de-gracia-barcelona
- Email: info@lagranjadegracia.com
- Fitxer: reports/email-drafts/2026-07-17-first-10-email-drafts/07-la-granja-de-gracia.eml
- Assumpte: Una cosa rapida sobre Google Maps de La Granja de Gràcia
- Registre:

```bash
npm run lead:record -- --lead lead-la-granja-de-gracia-barcelona --type contacted --channel email --summary "Primer email enviat manualment." --next-action "Fer seguiment en 3 dies." --status contacted
```

### 8. Patrón

- Lead: lead-patron-barcelona
- Email: booking@patron-restaurant.com
- Fitxer: reports/email-drafts/2026-07-17-first-10-email-drafts/08-patron.eml
- Assumpte: Una cosa rapida sobre Google Maps de Patrón
- Registre:

```bash
npm run lead:record -- --lead lead-patron-barcelona --type contacted --channel email --summary "Primer email enviat manualment." --next-action "Fer seguiment en 3 dies." --status contacted
```

### 9. Rubion

- Lead: lead-rubion-sabadell
- Email: restaurant@rubion.es
- Fitxer: reports/email-drafts/2026-07-17-first-10-email-drafts/09-rubion.eml
- Assumpte: Una cosa rapida sobre Google Maps de Rubion
- Registre:

```bash
npm run lead:record -- --lead lead-rubion-sabadell --type contacted --channel email --summary "Primer email enviat manualment." --next-action "Fer seguiment en 3 dies." --status contacted
```

### 10. Thai Barcelona

- Lead: lead-thai-barcelona
- Email: info@thaibarcelona.com
- Fitxer: reports/email-drafts/2026-07-17-first-10-email-drafts/10-thai-barcelona.eml
- Assumpte: Una cosa rapida sobre Google Maps de Thai Barcelona
- Registre:

```bash
npm run lead:record -- --lead lead-thai-barcelona --type contacted --channel email --summary "Primer email enviat manualment." --next-action "Fer seguiment en 3 dies." --status contacted
```

## Despres d'enviar

Registra cada email enviat:

```bash
npm run lead:record -- --lead LEAD_ID --type contacted --channel email --summary "Primer email enviat manualment." --next-action "Fer seguiment en 3 dies." --status contacted
```
