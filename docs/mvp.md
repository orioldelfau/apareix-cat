# MVP Apareix Restauracio

## Objectiu del MVP

Construir una primera versio que permeti operar 5-10 restaurants amb el minim treball manual possible, sense intentar automatitzar tot des del primer dia.

L'MVP ha de vendre un resultat: tenir la fitxa de Google Maps viva, optimitzada i mes orientada a convertir cerques locals en clients.

## Principi de Producte

Primer cal automatitzar el que es repetitiu i deixar supervisio humana on hi ha risc:

- Baix risc: informes, deteccio de canvis, generacio de posts, resum de ressenyes.
- Risc mitja: publicacio de posts, suggeriments de canvis a la fitxa.
- Risc alt: canviar horaris, categories principals, nom del negoci, respondre ressenyes negatives delicades.

## Funcionalitats MVP

### 1. Onboarding de Restaurant

Recollir informacio basica del restaurant i connectar o preparar l'acces a Google Business Profile.

Sortida esperada:

- Fitxa del client creada dins del sistema.
- Checklist d'informacio completat.
- Acces Google validat o pendent.
- Estat inicial documentat.

### 2. Auditoria Inicial

Analitzar la fitxa i generar una llista de millores.

Punts a revisar:

- Nom del negoci.
- Categories.
- Descripcio.
- Horaris normals i especials.
- Telefon, web i reserves.
- Carta/menu.
- Fotos.
- Serveis i atributs.
- Ressenyes i rating.
- Frequencia d'activitat.
- Competidors propers.

Sortida esperada:

- Informe inicial curt.
- Llista d'accions prioritzades.
- Canvis que requereixen aprovacio.

### 3. Posts Setmanals

Generar i publicar posts adaptats al restaurant.

Tipus de posts:

- Menu de la setmana.
- Plat destacat.
- Promocio o esdeveniment.
- Temporada o producte local.
- Recordatori de reserves.
- Servei de take away o delivery.

Primer MVP:

- Generacio automatica del text.
- Revisio interna o aprovacio del client.
- Publicacio manual o semi-automatica.

Despres:

- Publicacio automatica via API quan l'acces i les politiques estiguin clares.

### 4. Gestio de Ressenyes

Monitorar ressenyes i generar respostes.

Flux:

- Detectar ressenyes noves.
- Classificar sentiment: positiva, neutra, negativa.
- Generar resposta suggerida.
- Marcar si requereix revisio humana.
- Publicar resposta quan sigui segura o aprovada.

Regla inicial:

- Ressenyes positives: resposta automatitzable amb plantilles variables.
- Ressenyes neutres: revisio rapida.
- Ressenyes negatives: aprovacio obligatoria.

### 5. Informe Mensual PDF

Generar un informe simple i visual.

Contingut:

- Resum executiu.
- Accions fetes aquest mes.
- Evolucio de trucades, clics, indicacions i visites si estan disponibles.
- Ressenyes noves i evolucio del rating.
- Posts publicats.
- Fotos o canvis destacats.
- Comparativa amb mes anterior.
- Recomanacions pel mes seguent.

### 6. Panell Intern

No cal que el primer dashboard sigui per al client. Primer ha de servir per operar be.

Vistes necessaries:

- Llista de restaurants.
- Estat d'onboarding.
- Tasques pendents.
- Posts pendents d'aprovar/publicar.
- Ressenyes pendents.
- Informes mensuals.

## Fora de l'MVP

Aquestes funcionalitats son bones, pero no calen per vendre els primers clients:

- Dashboard complet per al client.
- Pagaments integrats.
- Multiidioma complet.
- Benchmarking automatic complex.
- Automatitzacio total de canvis de fitxa.
- App mobil.
- CRM complet.

## Criteri d'Exit

L'MVP funciona si permet:

- Donar d'alta un restaurant en menys de 30 minuts.
- Preparar una auditoria inicial en menys de 20 minuts.
- Generar 4 posts mensuals en menys de 10 minuts.
- Gestionar ressenyes setmanals en menys de 10 minuts per client.
- Crear l'informe mensual en menys de 10 minuts per client.

## Primer Experiment

Abans de construir massa:

1. Triar 10 restaurants objectiu.
2. Fer una auditoria manual de la seva fitxa.
3. Preparar una proposta personalitzada d'1 pagina.
4. Vendre 3 mesos de servei.
5. Operar-los amb eines internes simples.
6. Convertir el que es repeteix en software.
