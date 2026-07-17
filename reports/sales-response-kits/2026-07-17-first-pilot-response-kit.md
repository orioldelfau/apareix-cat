# Kit de Respostes Comercials - 2026-07-17

Objectiu: convertir respostes dels restaurants en una decisio simple: rebre auditoria, fer trucada curta o activar el pilot de 50 EUR/mes.

## Oferta que s'ha de mantenir

- Nom: Apareix Maps - Pilot 30 dies
- Preu: 50 EUR/mes
- Setup: Inclòs
- Permanencia: Sense permanència
- Onboarding: https://apareix.cat/onboarding

## Quan responen "envia'm l'auditoria"

Perfecte, t'ho envio.

Ho he preparat en format curt: 5 punts sobre fitxa, posts, ressenyes i conversio local. La idea no és vendre't una web ni anuncis, sinó veure si Google Maps pot estar més actiu i més clar.

Si després de veure-ho té sentit, et proposo provar Apareix 30 dies per 50 EUR i ho deixem tot molt simple.

Registre:

```bash
npm run lead:record -- --lead LEAD_ID --type responded --channel email --summary "Demana rebre auditoria curta." --next-action "Enviar auditoria i proposar pilot de 30 dies." --status responded
```

## Quan pregunten preu

El pilot són 50 EUR/mes, sense permanència i amb setup inclòs.

Inclou revisió inicial de la fitxa, 4 posts mensuals, revisió de ressenyes, respostes suggerides i un informe simple amb què s'ha fet i què prioritzar el mes següent.

No inclou anuncis ni prometo una posició concreta a Google Maps. L'objectiu és que la fitxa estigui més cuidada, activa i orientada a generar accions.

Registre:

```bash
npm run lead:record -- --lead LEAD_ID --type proposal_sent --channel email --summary "Preu i pilot explicats." --next-action "Fer seguiment de decisio en 2 dies." --status proposal_sent
```

## Quan volen parlar

Sí, fem-ho simple.

Podem fer una trucada de 15 minuts. Només necessito entendre qui gestiona ara la fitxa, si teniu accés a Google Business Profile i quin objectiu us interessa més: reserves, trucades, ressenyes o visibilitat al barri.

Si encaixa, ho activem com a pilot de 30 dies.

Registre:

```bash
npm run lead:record -- --lead LEAD_ID --type meeting --channel email --summary "Trucada o conversa proposada." --next-action "Fer trucada i tancar pilot si encaixa." --status meeting
```

## Quan diuen que ara no

Cap problema.

T'ho deixo apuntat i més endavant et puc enviar una observació concreta de Google Maps si veig alguna oportunitat clara. No cal tocar web ni anuncis per començar; és una rutina petita sobre la fitxa.

Registre:

```bash
npm run lead:record -- --lead LEAD_ID --type follow_up --channel email --summary "No és moment ara; seguiment programat." --next-action "Recontactar en 30 dies amb una observacio nova." 
```

## Quan accepten començar

Perfecte. Ho activem com a Apareix Maps - Pilot 30 dies: 50 EUR/mes, 30 dies, sense permanència.

Següent pas:

1. Completar l'onboarding: https://apareix.cat/onboarding
2. Donar accés de gestor a Google Business Profile, sense compartir contrasenyes.
3. Enviar fotos/carta o carpeta Drive si en teniu.

Quan tingui això, preparo la revisió inicial i el primer calendari de 4 posts.

Registre:

```bash
npm run lead:record -- --lead LEAD_ID --type won --channel email --summary "Pilot de 30 dies acceptat." --next-action "Enviar onboarding, confirmar pagament i demanar acces GBP." --status won
```

## Objeccions rapides

### Ja tenim algu que ho porta

Cap problema. Justament per això ho plantejo petit: puc mirar només si Google Maps està alineat amb el que ja feu i enviar-vos 3-5 punts. Si ja ho teniu cobert, perfecte.

### No volem anuncis

No és publicitat. És gestió orgànica de la fitxa: dades, posts, ressenyes, fotos, carta/reserva i informe mensual.

### No podem garantir resultats

Correcte, no prometo posicions concretes. El compromís és mantenir la fitxa cuidada, activa i més orientada a conversió, i ensenyar cada mes què s'ha fet.

## Leads actius

### 1. Café Sardina

- Estat: contact_ready
- Zona: Sitges
- Contacte: reservations@cafesardinas.com / +34 936 59 86 86
- Auditoria: reports/lead-audits/lead-cafe-sardina-sitges.md
- Proposta: reports/pilot-proposals/lead-cafe-sardina-sitges.md
- Onboarding si accepta: https://apareix.cat/onboarding


### 2. Fukuoka BCN

- Estat: contact_ready
- Zona: Gràcia, Barcelona
- Contacte: fukuokasushingrill@gmail.com / 932 851 568
- Auditoria: reports/lead-audits/lead-fukuoka-barcelona.md
- Proposta: reports/pilot-proposals/lead-fukuoka-barcelona.md
- Onboarding si accepta: https://apareix.cat/onboarding


### 3. Haninjung

- Estat: contact_ready
- Zona: Eixample, Barcelona
- Contacte: ugnoos@gmail.com / 934 54 05 63
- Auditoria: reports/lead-audits/lead-haninjung-barcelona.md
- Proposta: reports/pilot-proposals/lead-haninjung-barcelona.md
- Onboarding si accepta: https://apareix.cat/onboarding


### 4. Kaguya-Hime BCN

- Estat: contact_ready
- Zona: Gràcia, Barcelona
- Contacte: reservas@kaguyahimebcn.es / 934 36 16 94
- Auditoria: reports/lead-audits/lead-kaguya-hime-barcelona.md
- Proposta: reports/pilot-proposals/lead-kaguya-hime-barcelona.md
- Onboarding si accepta: https://apareix.cat/onboarding


### 5. L'Escala

- Estat: contact_ready
- Zona: Eixample, Barcelona
- Contacte: info@lescalabcn.com / +34 934 87 47 65
- Auditoria: reports/lead-audits/lead-lescala-barcelona.md
- Proposta: reports/pilot-proposals/lead-lescala-barcelona.md
- Onboarding si accepta: https://apareix.cat/onboarding


### 6. La Gilda

- Estat: contact_ready
- Zona: Gràcia / Eixample Dret, Barcelona
- Contacte: +34 931 180 354
- Auditoria: reports/lead-audits/lead-la-gilda-barcelona.md
- Proposta: reports/pilot-proposals/lead-la-gilda-barcelona.md
- Onboarding si accepta: https://apareix.cat/onboarding


### 7. La Granja de Gràcia

- Estat: contact_ready
- Zona: Gràcia, Barcelona
- Contacte: info@lagranjadegracia.com / 931 78 19 69
- Auditoria: reports/lead-audits/lead-la-granja-de-gracia-barcelona.md
- Proposta: reports/pilot-proposals/lead-la-granja-de-gracia-barcelona.md
- Onboarding si accepta: https://apareix.cat/onboarding


### 8. Patrón

- Estat: contact_ready
- Zona: Sarrià-Sant Gervasi / Diagonal, Barcelona
- Contacte: booking@patron-restaurant.com / +34 934 14 66 22
- Auditoria: reports/lead-audits/lead-patron-barcelona.md
- Proposta: reports/pilot-proposals/lead-patron-barcelona.md
- Onboarding si accepta: https://apareix.cat/onboarding


### 9. Rubion

- Estat: contact_ready
- Zona: Centre, Sabadell
- Contacte: restaurant@rubion.es / 937 27 88 77
- Auditoria: reports/lead-audits/lead-rubion-sabadell.md
- Proposta: reports/pilot-proposals/lead-rubion-sabadell.md
- Onboarding si accepta: https://apareix.cat/onboarding


### 10. Thai Barcelona

- Estat: contact_ready
- Zona: Passeig de Gràcia, Barcelona
- Contacte: +34 934 879 898
- Auditoria: reports/lead-audits/lead-thai-barcelona.md
- Proposta: reports/pilot-proposals/lead-thai-barcelona.md
- Onboarding si accepta: https://apareix.cat/onboarding

