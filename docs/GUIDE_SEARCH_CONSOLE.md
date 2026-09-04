# Search Console : le guide complet

Écrit le 4 septembre 2026, avec les éléments réels de votre configuration : domaine `aceconseil.co`, DNS chez Gandi, site hébergé sur Vercel.

Comptez quarante minutes en tout, dont une attente de propagation. Vous pouvez fermer l'onglet entre les étapes.

## Pourquoi maintenant, en deux phrases

Vous publiez depuis deux mois sans aucun retour. Google distingue deux états qui se ressemblent de l'extérieur et qui appellent des remèdes opposés, et le seul endroit où lire lequel vous concerne est la Search Console.

Une précision d'honnêteté : Google écrit lui-même que la Search Console n'est **pas** requise pour être indexé. Ne l'installez pas en espérant un déclic. Installez-la parce que c'est le seul endroit où votre question a une réponse.

---

## Étape 1. Créer la propriété, en mode Domaine (10 minutes)

Allez sur `https://search.google.com/search-console`, connectez-vous avec le compte Google du cabinet, celui qui porte déjà la fiche Google Business.

Deux types de propriété vous sont proposés. **Choisissez celui de gauche, « Domaine »**, et tapez `aceconseil.co` sans `https`, sans `www`, sans barre oblique.

Pourquoi celui-là plutôt que « Préfixe d'URL » : le mode Domaine couvre d'un coup `aceconseil.co`, `www.aceconseil.co`, le `http` et le `https`, et tous les sous-domaines. Vous ne le referez jamais. Le mode préfixe vous obligerait à créer et surveiller quatre propriétés distinctes.

Google vous affiche alors **un enregistrement TXT** à ajouter, de la forme `google-site-verification=` suivi d'une longue chaîne. Laissez cet onglet ouvert.

---

## Étape 2. Ajouter l'enregistrement chez Gandi (10 minutes)

Vos DNS sont gérés par Gandi. Connectez-vous sur `https://admin.gandi.net`, ouvrez le domaine `aceconseil.co`, puis l'onglet **Enregistrements DNS**.

**L'avertissement le plus important de ce guide.** Vous avez déjà deux enregistrements TXT sur le domaine :

- `v=spf1 include:_spf.google.com ~all`, qui autorise Google à envoyer vos emails ;
- `brevo-code:880e0d80ecf434b9c94045d06be4109b`, qui rattache votre compte Brevo.

**Ajoutez un troisième enregistrement. N'en modifiez et n'en remplacez aucun.** Si vous écrasez la ligne SPF, vos emails partiront en indésirable dès le lendemain. C'est l'erreur classique, et elle se répare mal.

Cliquez donc sur **Ajouter un enregistrement**, puis :

| Champ | Valeur |
|---|---|
| Type | `TXT` |
| Nom | `@` (le domaine racine, parfois affiché vide chez Gandi) |
| Valeur | La chaîne complète fournie par Google, guillemets compris si Gandi les demande |
| TTL | Laissez la valeur par défaut |

Enregistrez. Puis retournez sur l'onglet Search Console et cliquez sur **Valider**.

Si la validation échoue, ce n'est probablement pas une erreur de votre part : la propagation DNS prend de quelques minutes à quelques heures. Réessayez dans une heure. Le bouton reste disponible, rien n'est perdu.

---

## Étape 3. Soumettre le plan du site (2 minutes)

Une fois la propriété validée, dans le menu de gauche : **Sitemaps**.

Dans le champ, tapez seulement `sitemap.xml` et envoyez. L'adresse complète est `https://aceconseil.co/sitemap.xml` et elle contient aujourd'hui 33 adresses.

Le statut passera à « Réussite » en quelques minutes ou quelques heures. Cela signifie que Google a lu le fichier, pas qu'il a indexé les pages. Ne confondez pas les deux.

---

## Étape 4. Attendre, puis lire le rapport (2 à 7 jours)

Les données de couverture n'apparaissent pas immédiatement. Comptez deux à sept jours avant que le rapport soit exploitable.

Quand elles arrivent, ouvrez **Indexation** puis **Pages**. Vous verrez deux nombres, les pages indexées et les pages non indexées, puis la liste des motifs.

**C'est ce motif qui décide de tout le reste de votre plan.** Notez lequel domine pour vos articles :

**« Détectée, actuellement non indexée »**
Google connaît l'adresse mais n'est pas venu la lire. C'est un problème de priorité d'exploration. Le remède est la découverte et les liens entrants : la candidature Activateur France Num, l'annuaire de votre agglomération, les liens depuis votre page d'accueil vers vos articles.

**« Explorée, actuellement non indexée »**
Google est venu, a lu, et n'a pas retenu la page. C'est un problème d'arbitrage sur la valeur perçue. Les liens n'y changeront presque rien. Le remède porte sur le contenu : chaque article doit contenir au moins un élément que personne d'autre ne peut écrire, un chiffre issu d'un dossier réel, un cas anonymisé avec son montant, une capture d'un outil que vous utilisez, un refus d'un organisme et sa raison.

Ces deux diagnostics appellent des remèdes opposés. Jusqu'à présent nous choisissions à l'aveugle.

---

## Étape 5. Inspecter quatre articles précis (10 minutes)

Le rapport donne une tendance, l'inspection donne une certitude. Utilisez la barre de recherche en haut, celle qui dit « Inspecter une URL », et collez ces quatre adresses, une par une :

```
https://aceconseil.co/blog/relance-devis-automatique
https://aceconseil.co/blog/ai-act-article-4-maitrise-ia
https://aceconseil.co/blog/fiche-google-business-artisan
https://aceconseil.co/blog/locaux-professionnels-rendez-vous-decisifs
```

Elles sont choisies pour être étalées dans le temps, du 6 juillet au 7 août. Si les plus anciennes sont indexées et pas les récentes, c'est une question de délai. Si aucune ne l'est après deux mois, c'est autre chose.

Pour chacune, notez la phrase affichée en haut et la date de la dernière exploration, si elle existe.

---

## Étape 6. Demander l'indexation, mais de trois articles seulement (5 minutes)

Sur la page d'inspection d'une URL, un bouton **Demander l'indexation** place l'adresse dans une file prioritaire.

**N'en demandez pas vingt-trois.** Le quota journalier n'est pas publié, et Google écrit noir sur blanc que redemander la même adresse plusieurs fois n'accélère rien. Demander en masse ne fait que consommer le quota.

Choisissez les trois plus proches d'une vente. Aujourd'hui, ce sont ceux du fil facture électronique, dont l'échéance vient de tomber et sur lesquels vous avez le contenu le plus solide :

```
https://aceconseil.co/blog/facture-electronique-client-ne-peut-pas-imposer
https://aceconseil.co/blog/facture-electronique-pas-pret-ce-que-vous-risquez
https://aceconseil.co/blog/facture-electronique-checklist-dirigeant
```

Google précise que demander une exploration ne garantit ni l'indexation ni un délai. C'est une file, pas un bouton magique.

---

## Étape 7. Bing Webmaster Tools, dans la foulée (10 minutes)

Ne sautez pas cette étape. Bing vous connaît déjà : entre le 9 et le 30 août, il est passé de quatre à sept adresses connues, et vous ne l'avez appris que parce que je suis allé le mesurer à la main.

Bing sert aussi Yahoo, DuckDuckGo et Ecosia, et alimente la recherche web de Copilot. Et votre site envoie déjà des notifications IndexNow à Bing à chaque mise en ligne, sans que vous puissiez en voir le résultat.

Allez sur `https://www.bing.com/webmasters`, connectez-vous, et choisissez **Importer depuis Google Search Console**. C'est le chemin le plus court : la propriété et le plan du site sont repris automatiquement.

Puis, dans **Soumettre des URL**, envoyez les adresses de vos articles qui ne sont pas encore connues. Bing accepte plusieurs centaines de soumissions par jour, et c'est le gain le plus probable de tout ce guide à court terme.

---

## Ce que vous ferez ensuite, selon ce que vous aurez lu

Revenez me voir avec le motif dominant du rapport. Selon la réponse, deux plans différents s'ouvrent :

- **« Détectée »** : je prépare la candidature Activateur France Num, seul lien gratuit que le diagnostic a pu vérifier comme suivi depuis un domaine en `.gouv.fr`, et le référencement dans l'annuaire de votre agglomération.
- **« Explorée »** : nous reprenons les cinq articles les plus proches d'une vente pour y placer de la matière de terrain, et nous changeons la règle d'écriture pour les suivants.

## Le rituel, une fois installé

Le premier lundi de chaque mois, quinze minutes : le nombre de pages indexées, les requêtes qui ramènent des impressions sans clic, et les nouvelles erreurs. Rien d'autre. Les données de la Search Console ne remontent pas avant sa date de création, ce qui est une raison de plus de ne pas repousser.
