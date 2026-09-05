# Google Ads : étude de faisabilité et décision

**Décision : non, pas maintenant. Et la raison n'est ni le budget ni les mots-clés.**

Étude du 5 septembre 2026. Huit lentilles de diagnostic, trois scénarios conçus séparément, neuf jurés, et douze affirmations structurantes soumises à deux vérificateurs chacune. Quarante-quatre agents, aucun échec.

Ce document remplace la version du 6 juillet 2026, dont plusieurs prémisses sont fausses : elle décrivait le formulaire comme un lien mailto, ignorait l'en-tête de sécurité du site, et désignait comme « la pépite » une campagne AMO visant les particuliers en VEFA, alors que l'AMO du cabinet vise les entreprises.

---

## 1. Le classement des trois scénarios

| Scénario | Note du jury | Budget | Mise en place |
|---|---|---|---|
| Reporter et rendre la mesure vraie d'abord | **6,00 / 10** | 1200 euros sur 22 semaines | 46 heures |
| Acheter sans aucun traceur | 5,33 / 10 | 900 euros sur 6 semaines | 25 heures |
| Mesure complète assumée, avec bandeau | 3,67 / 10 | 2387 euros sur 22 semaines | 75 heures |

Aucun n'atteint 7. C'est en soi un résultat : il n'existe pas aujourd'hui de bonne façon de faire de la publicité payante sur ce dossier, seulement une moins mauvaise.

---

## 2. Les quatre constats qui décident

### La condition écrite dans le plan de l'année n'est pas remplie, et elle ne peut pas l'être sans code

Le plan conditionne Google Ads à ce que « les conversions soient comptées ». Vérifié dans le dépôt : la charge utile envoyée à `/api/contact` par `index.html` contient huit champs, dont un `source` codé en dur à `"aceconseil.co"`. Aucune lecture de `location.search`, aucune lecture du référent. La fonction serverless ignore silencieusement tout champ supplémentaire.

**Aucun euro dépensé ne pourrait être rattaché à une demande.** Ni par campagne, ni par groupe d'annonces, ni par mot-clé. Pas même à la main, en relisant le courriel reçu : il ne porte aucune trace de la provenance.

### L'en-tête de sécurité interdit physiquement le tag, et l'ouvrir coûte cher

L'en-tête servi en production est `script-src 'self' 'unsafe-inline'` et `connect-src 'self'`. Le tag Google se charge depuis `googletagmanager.com` et poste vers `googleadservices.com` : les deux sont bloqués.

Poser le tag suppose d'ouvrir cinq domaines Google en exécution de script sur les 34 pages. La documentation de Google recommande d'utiliser un nonce plutôt que `'unsafe-inline'` pour limiter le risque, mais ce site a besoin de `'unsafe-inline'` pour son propre formulaire : la protection recommandée est inapplicable sans refonte.

Autoriser `googletagmanager.com` donne à quiconque accède à l'interface de gestion des balises le pouvoir d'exécuter du JavaScript sur toutes les pages, **sans déploiement et sans passer par le dépôt**. Sur un cabinet qui vend de la rigueur numérique, l'en-tête strict est le second actif de conformité après les mentions légales.

Le mode consentement version 2 ne règle rien : il n'existe qu'à l'intérieur du tag que l'en-tête bloque.

### L'économie ne se referme pas sur l'offre à 499 euros

Seule offre avec un prix public. Chaîne d'hypothèses raisonnable, et elles sont marquées comme telles puisque aucune donnée de conversion n'existe : 2 % de transformation de la page, 50 % de la demande au rendez-vous, 15 % du rendez-vous à la signature. Soit **667 clics par mission signée, donc 0,75 euro de coût par clic maximal**.

Dans le coin le plus optimiste défendable (4 %, 60 %, 25 %), le plafond monte à 3 euros, mais à marge nulle avant tout coût de temps.

Face à cela, l'ancienne version de ce document estimait ces clics entre 1,50 et 4 euros. **La campagne est structurellement déficitaire aux propres hypothèses de coût du document.** Elle ne doit pas être lancée, quel que soit le budget.

Le modèle ne se referme qu'à partir d'un ticket de 2400 euros. Or les offres à ce niveau n'ont aujourd'hui ni prix public, ni page d'atterrissage avec formulaire, ni une seule impression de demande mesurée.

### La plus grosse famille de demande vise un produit que le cabinet ne vend pas

La grappe facture électronique pèse 139 impressions sur 59 requêtes, et son intention commerciale est forte. Mais la formulation dit ce qui est acheté : « plateforme agréée facturation électronique », « comparatif pdp », « meilleure pdp pour tpe ». **L'objet de l'achat est un abonnement logiciel.**

Les enchérisseurs de ce terrain amortissent un clic sur des années de revenu récurrent. ACE amortit sur une prestation ponctuelle sans prix public. Et la liste officielle que ces chercheurs veulent est publiée gratuitement par la DGFiP.

C'est de l'audience à informer, pas de la demande à acheter.

---

## 3. Une correction que je dois à mes propres analyses

J'ai plusieurs fois utilisé le « zéro clic » de la grappe facture comme un signal. **C'était sans fondement.**

À la position 42, soit la cinquième page de résultats, le nombre de clics attendu sur 139 impressions est inférieur à un, quelle que soit l'intention du chercheur. Le zéro observé est exactement le zéro prédit.

L'export établit trois choses, et trois seulement : que la demande existe, comment elle se formule, et qui elle vise. Il ne mesure ni le volume du marché, ni le taux de transformation. Il est donc interdit d'en conclure « ces requêtes ne convertissent pas », et symétriquement interdit d'en conclure « 139 impressions, c'est trop petit pour acheter ».

Les volumes français réels ne s'obtiennent que dans le Planificateur de mots-clés, qui est gratuit et ne demande aucune campagne en diffusion.

---

## 4. Le piège que personne n'avait vu

Même en ne posant **aucun tag**, lancer une campagne casserait une phrase publiée hier.

Google ajoute automatiquement un identifiant de clic unique à l'adresse d'atterrissage, sous la forme `?gclid=...`. Or le script de mesure d'audience installé sur les 34 pages transmet `location.href` intact, paramètres compris. Vérifié en lisant le script servi : la valeur n'est jamais nettoyée.

**Un identifiant publicitaire unique partirait donc chez le prestataire de mesure dès le premier clic payant**, alors que les mentions légales affirment qu'« aucun identifiant publicitaire n'est utilisé ».

Aucun cookie n'est posé, l'article 82 n'est pas déclenché, aucun bandeau ne devient obligatoire. Mais la phrase publiée devient fausse, et c'est exactement le genre d'incohérence qu'un cabinet vendant de la conformité ne peut pas se permettre.

Correctif : trois lignes, un `beforeSend` qui retire la chaîne de requête avant l'envoi.

---

## 5. Ce qu'il faut faire d'abord, et qui coûte trois heures

Deux corrections rendent la mesure vraie sans cookie, sans bandeau, sans toucher à l'en-tête de sécurité, et sans nouveau sous-traitant.

**Capter la provenance dans le formulaire.** Lire `gclid` et les paramètres `utm_` depuis l'adresse en JavaScript de première partie, ce que l'en-tête autorise, les ajouter à la charge utile, et les afficher dans le courriel reçu. Chaque demande dira alors d'où elle vient. Deux heures.

**Nettoyer la chaîne de requête avant la mesure d'audience.** Le `beforeSend` décrit plus haut. Une heure.

Une limite à connaître : les sept pages piliers n'ont pas de formulaire et renvoient vers `index.html#contact` par une navigation dure, qui efface les paramètres. La capture ne fonctionnera donc que pour un visiteur qui atterrit sur l'accueil. Faire survivre l'identifiant d'une page à l'autre imposerait du stockage sur l'appareil, ce que les mentions légales excluent. C'est un argument de plus pour que toute campagne future pointe vers des pages d'atterrissage autonomes, formulaire inclus dans la page.

---

## 6. Ce que valent 1200 euros et quelques heures, ailleurs, maintenant

Le jury a classé ces alternatives devant Google Ads, et pour une raison simple : elles produisent un signal plus tôt et laissent un actif derrière elles.

**La mise en balance des intérêts légitimes**, trois heures, qui dégèle la prospection sortante aujourd'hui bloquée pour une raison de conformité et non de méthode. Gratuit.

**La fiche Google Business**, qui est la seule chose répondant aux six sociétés portant exactement le même nom, et le seul actif local du cabinet. Gratuit.

**Le Planificateur de mots-clés**, qui donne enfin les volumes français réels sur les familles candidates. Gratuit, sans campagne, sans diffusion, compte ouvert en mode expert. C'est la donnée qui manque à toute cette étude.

**Les deux familles mesurées du plan de l'année**, qui sont l'investissement dont l'effet ne s'arrête pas quand on cesse de payer.

---

## 7. Les conditions datées qui rouvriront le dossier

Google Ads redevient une option le jour où les quatre conditions suivantes sont vraies ensemble. Pas avant, et sans négociation.

1. **La provenance est captée**, vérifiée par trois envois d'essai depuis trois appareils avec un `gclid` de test retrouvé intact dans le courriel reçu.
2. **Le relevé du Planificateur existe**, écrit et daté dans ce document, avec les volumes France des familles candidates. Si la famille visée totalise moins de 300 recherches mensuelles, le dossier reste fermé.
3. **Une offre à ticket suffisant a un prix public et une page d'atterrissage autonome**, formulaire inclus dans la page. Le seuil est 2400 euros, en dessous le modèle ne se referme pas.
4. **Au moins trois demandes entrantes ont été tracées par le circuit organique**, ce qui donne enfin un taux de transformation de référence pour calibrer une enchère.

La condition 4 est celle que le plan de l'année vise pour décembre. C'est aussi la seule qui ne s'achète pas.

**Une exception, et une seule.** Quelques euros par mois sur la requête de marque exacte « ace conseil » pourraient se défendre, face à cinq homonymes actifs et à un cabinet qui détient le domaine en `.fr` depuis 1997. Mais c'est une dépense défensive et non un canal d'acquisition : elle se décide séparément, après la fiche Google, qui traite le même problème gratuitement.
