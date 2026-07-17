# Pipeline Comercial de Leads

Objectiu: convertir restaurants identificats en auditories enviades i converses comercials.

## Fitxers

- `data/restaurant-leads.json`: tracker de restaurants objectiu.
- `scripts/create-lead-audit.js`: genera una auditoria curta a partir d'un lead.
- `reports/lead-audits/`: sortida de les auditories en markdown.

## Estats

- `identified`: restaurant detectat.
- `audited`: auditoria preparada.
- `contact_ready`: missatge i auditoria llestos per enviar.
- `contacted`: contacte enviat.
- `responded`: ha respost.
- `meeting`: conversa o trucada agendada.
- `proposal_sent`: proposta enviada.
- `won`: client guanyat.
- `lost`: no encaixa o no respon.

## Com generar una auditoria curta

```bash
npm run lead:audit -- --lead lead-kaguya-hime-barcelona
```

Aixo genera:

```text
reports/lead-audits/lead-kaguya-hime-barcelona.md
```

## Regla abans de contactar

No enviar cap missatge real fins que:

- L'auditoria tingui una observacio especifica de la fitxa o web.
- El missatge no sembli massiu.
- Hi hagi una crida simple: "Et puc enviar 5 millores concretes?"
- Oriol hagi validat el primer lot de missatges o hagi autoritzat enviaments.

## Criteri de Bona Auditoria

Una auditoria curta ha de tenir:

- Una oportunitat visible.
- Un risc o friccio concreta.
- Tres accions prioritzades.
- Una proposta de primer mes.
- Una frase comercial clara per obrir conversa.

## Objectiu Setmanal

Fins arribar al primer pilot:

- Identificar 10 restaurants.
- Preparar 3 auditories.
- Contactar 5 restaurants.
- Fer seguiment als contactes oberts.

