# Guide de lancement aceconseil.co

Version du site : v2.0.2+ (branche `main`). Trois autres documents complètent celui-ci : `COMMENT_PUBLIER.md` (mémo rapide), `docs/PLAN_EDITORIAL.md` (les 10 premiers articles), `docs/PLAN_VISIBILITE.md` (stratégie complète).

---

## 1. Mettre le site en ligne (60 à 90 minutes, une seule fois)

### A. Pousser le code sur GitHub (10 min)

1. Sur github.com : « New repository », nom `aceconseil-site`, visibilité **privée**, sans README ni .gitignore (le repo local a déjà tout).
2. Dans le terminal :
   ```
   cd ~/Downloads/site_ace
   git remote add origin https://github.com/VOTRE-COMPTE/aceconseil-site.git
   git push -u origin main --tags
   git push origin refonte-2026-07
   ```
3. Vérifier sur GitHub que `index.html`, `content/`, `vercel.json` et `docs/` sont bien là.

### B. Déployer sur Vercel (15 min)

1. vercel.com → « Add New → Project » → importer `aceconseil-site` depuis GitHub.
2. Framework : « Other ». **Ne rien configurer d'autre** : `vercel.json` porte déjà la commande de build (`node scripts/build-blog.js`), le dossier de sortie (`public`), les redirections 301 et les en-têtes de sécurité.
3. « Deploy », puis ouvrir l'URL `*.vercel.app` générée et vérifier : la home, `/agents-ia`, `/mentions-legales`, l'ancienne URL `/ia` (doit rediriger vers `/#automatisation`).
4. Settings → Deployment Protection : vérifier que **rien ne protège la production** (pas de mot de passe, pas de Vercel Authentication). C'est un des suspects historiques de la non-indexation.

### C. Brancher le domaine (15 min, l'étape la plus importante)

1. Dans le nouveau projet : Settings → Domains → ajouter `aceconseil.co` puis `www.aceconseil.co`. S'ils sont rattachés à l'ancien projet, Vercel propose de les transférer : accepter.
2. **Règle absolue** : `aceconseil.co` (sans www) = domaine principal ; `www.aceconseil.co` = « Redirect to aceconseil.co » (308). Aujourd'hui c'est l'inverse, et c'est la cause n° 1 de la non-indexation du site.
3. Supprimer ou archiver l'ancien projet Vercel pour qu'il ne serve plus rien.
4. Vérifier dans le terminal :
   ```
   curl -sI https://aceconseil.co | head -1        # attendu : HTTP/2 200
   curl -sI https://www.aceconseil.co | head -3    # attendu : redirection 308 vers aceconseil.co
   ```

### D. Déclarer le site aux moteurs (25 min, le jour même)

Sans cette étape, le site est indexable mais Google ne sait pas qu'il existe. C'est elle qui met le moteur en route. DNS gérés chez Gandi, email sur Google Workspace : les instructions ci-dessous en tiennent compte.

#### D.1 Créer la propriété dans Search Console

1. Aller sur search.google.com/search-console, **connecté avec le compte Google qui gère contact@aceconseil.co** (le compte Workspace). Utiliser ce compte évite de tout refaire plus tard.
2. En haut à gauche, menu déroulant des propriétés → « Ajouter une propriété ».
3. Choisir le type **Domaine** (colonne de gauche), pas « Préfixe d'URL ». La propriété Domaine couvre d'un coup l'apex, le www, le http et le https : une seule vérification pour tout.
4. Saisir `aceconseil.co` (sans https, sans www) → Continuer.
5. Google affiche un **enregistrement TXT** à copier, de la forme `google-site-verification=xxxxxxxxxxxx`. Laisser cette fenêtre ouverte.

#### D.2 Poser l'enregistrement TXT chez Gandi

1. Se connecter sur admin.gandi.net → section « Domaine » → cliquer `aceconseil.co`.
2. Onglet **« Enregistrements DNS »** (DNS Records).
3. Bouter **« Ajouter »** un enregistrement :
   - **Type** : `TXT`
   - **Nom** : `@` (représente la racine du domaine)
   - **TTL** : laisser la valeur par défaut
   - **Valeur** : coller la chaîne fournie par Google (`google-site-verification=...`), exactement, telle quelle.
4. Enregistrer. Ce nouvel enregistrement **s'ajoute** aux TXT existants (le SPF `v=spf1...` de Google Workspace et le `brevo-code...`). Ne jamais supprimer ni écraser ces deux-là : ils font tourner votre messagerie et vos envois. On empile, on ne remplace pas.
5. Retourner dans la fenêtre Search Console et cliquer **« Valider »**. Gandi propage en général en quelques minutes ; si la validation échoue au premier essai, patienter 15 à 30 min et recliquer « Valider » (ne pas recréer la propriété).

> Alternative si le DNS vous intimide : dans Search Console, créer plutôt une propriété **Préfixe d'URL** `https://aceconseil.co/`, méthode **« Balise HTML »**. Google donne une balise `<meta name="google-site-verification" ...>` : la transmettre à l'équipe technique, qui l'ajoute dans le `<head>` du site (2 minutes, un push), puis cliquer « Valider ». Moins complet que la propriété Domaine, mais aucune manipulation DNS.

#### D.3 Soumettre le sitemap

1. Propriété validée, menu de gauche → **« Sitemaps ».**
2. Champ « Ajouter un sitemap » → saisir `sitemap.xml` (Google préfixe déjà `https://aceconseil.co/`) → Envoyer.
3. Statut attendu : « Réussite » (le nombre d'URL découvertes, 9, peut n'apparaître qu'au bout d'un jour).

#### D.4 Forcer la découverte des pages clés

1. Menu de gauche → **« Inspection de l'URL »** (ou barre de recherche en haut).
2. Saisir `https://aceconseil.co/` → Entrée. Au début, statut « L'URL n'est pas sur Google » : normal.
3. Cliquer **« Demander une indexation »** → Google met la page en file d'attente (« Indexation demandée »).
4. Répéter pour les pages prioritaires, une par une : `/agents-ia`, `/automatisation`, `/sites-web`. Inutile de le faire pour les 9 : le sitemap s'occupe du reste, la demande manuelle sert juste à accélérer les plus importantes.

#### D.5 Déclarer aussi à Bing

1. bing.com/webmasters, connecté avec le même compte.
2. **« Importer depuis Google Search Console »** : un clic reprend la propriété et le sitemap, sans refaire la vérification. Bing alimente Copilot et une partie de ChatGPT : ce n'est pas optionnel.

#### D.6 Ce qui se passe ensuite (et ce qui est normal)

- **Heures à quelques jours** : les pages passent de « non indexée » à « indexée ». C'est Google qui décide du rythme, on ne peut que demander.
- **Rapport « Pages »** (menu Indexation) : à surveiller une fois par semaine. Les anciennes URLs (`/ia`, `/amo`...) y apparaîtront en « Page avec redirection » : c'est correct et voulu, ne rien corriger.
- Le statut « Détectée, actuellement non indexée » est fréquent sur un domaine jeune : il se résorbe avec le temps, les liens entrants et la publication d'articles. Ne pas s'en alarmer les premières semaines.
- **Indexation n'est pas classement.** Être dans l'index est l'étape 1 ; remonter dans les résultats vient ensuite, via la fiche Google Business, les avis, les liens et le contenu (voir `docs/PLAN_VISIBILITE.md`).

### E. Contrôles finaux (10 min)

- Mobile : nav burger, calculateur, formulaire.
- Le numéro reste masqué jusqu'au clic sur « Appeler ».
- Le formulaire ouvre un email pré-rempli vers contact@aceconseil.co (mécanisme mailto voulu tant qu'aucun webhook n'est branché).
- `/mentions-legales` complète, sans marqueur.

---

## 2. Publier un article de blog (10 min par article, hors rédaction)

### Écrire

1. Dans le dossier du site, copier `content/blog/_modele.md` → `content/blog/AAAA-MM-JJ-mon-slug.md` (exemple : `2026-07-09-relance-devis-automatique.md`).
2. Remplir l'en-tête : `title`, `description` (≤ 160 caractères, c'est ce que Google affiche), `date`, `slug` (minuscules et tirets, il devient l'URL), `keywords`, `ville` si l'article est local.
3. Écrire en markdown : `##` pour les sections, listes `-`, `**gras**`, `[texte](url)` pour les liens, `![description utile](assets/mon-image.jpg)` pour les images (déposer le fichier image dans `assets/`). Une image réellement utile par article : consigne du guide Google.
4. Respecter les règles de la maison (rappel complet en bas de `docs/PLAN_EDITORIAL.md`) : vouvoiement, pas de tiret cadratin, pas de chiffres clients inventés.

### Tester en local (optionnel mais recommandé)

```
node scripts/build-blog.js
```
Puis double-cliquer sur `public/blog/mon-slug.html` pour voir le rendu exact.

### Mettre en ligne

```
git add .
git commit -m "Article : titre de l'article"
git push
```
Vercel reconstruit et publie automatiquement en ~1 minute.

### Au tout premier article seulement

Ouvrir `index.html`, chercher les trois blocs `<!-- BLOG : décommenter au 1er article -->` (nav, menu mobile, footer), retirer les balises de commentaire autour des liens, committer et pousser. Le lien « Blog » apparaît sur la home.

### Où retrouver les pages publiées

- L'article : `https://aceconseil.co/blog/mon-slug`
- La liste antéchronologique : `https://aceconseil.co/blog`
- Le flux RSS (généré automatiquement) : `https://aceconseil.co/blog/feed.xml`
- Le sitemap se met à jour tout seul à chaque build ; pour accélérer, demander l'indexation de l'article dans Search Console.

### Pages piliers (même mécanique)

Les 7 pages expertises vivent dans `content/pages/*.md` : modifier un fichier + `git push` = page mise à jour. Nouvelle page : copier `content/pages/_modele.md` (slugs réservés listés dans `COMMENT_PUBLIER.md`).

---

## 3. Les prestations d'ACE Conseil telles que présentées sur le site

| Prestation | Page dédiée | Promesse portée par le site |
|---|---|---|
| Agents IA sur mesure | `/agents-ia` | Les demandes entrantes reçoivent réponse, qualification et relance 24 h/24, sur vos outils, avec relais à l'humain au bon moment |
| Automatisation des process | `/automatisation` | Facturation, planning, CRM et messagerie se parlent ; relances automatiques ; fin de la double saisie et des soirées administratives |
| Formation IA | `/formation-ia` | Demi-journée ou journée sur les cas réels de l'entreprise ; l'équipe repart avec prompts, procédures et plan d'adoption |
| Sites web nouvelle génération | `/sites-web` | Un site conçu pour transformer les visites en appels, SEO local intégré, livré en semaines. Porte d'entrée : offre à 499 euros HT, seul prix affiché du site (home, section Offre) |
| Visibilité & prospection | `/visibilite-prospection` | Le bon assemblage de canaux par métier et par zone : fiche Google, contenu, prospection email/LinkedIn, suivi des demandes |
| Stratégie commerciale | `/strategie-commerciale` | Chiffrage du manque à gagner, offre claire, prix défendus, trames d'appel, portefeuille piloté |
| AMO Immobilier | `/amo-immobilier` | Jennifer Carrolo (10+ ans VEFA et marchés publics) défend les intérêts de l'acquéreur aux étapes clés : TMA, cloisons, pré-livraison, livraison, réserves |

Parcours de conversion de la home : hero avec fil d'activité → expertises (7 panneaux) → offre 499 → avantage IA → **Vos gains** (calculateur de manque à gagner + engagements) → méthode en 4 étapes → équipe → FAQ → contact (appel masqué + formulaire). Contact : uniquement téléphone (Jennifer) et formulaire/email.

---

## 4. Calendrier de lancement : 4 premières semaines

### Semaine 1 (dès lundi) : exister

- **Lundi** : mise en ligne complète (partie 1 de ce guide, étapes A à E) + Search Console + Bing.
- **Mardi** : fiche Google Business Profile complète : catégorie principale « Conseil en informatique », zone d'intervention, les 7 services décrits avec lien vers leur page dédiée, photos (portraits dans `assets/`), horaires, numéro. C'est le levier local n° 1.
- **Mercredi** : cohérence NAP : page entreprise LinkedIn à jour (lien site, description reprenant les 7 expertises), Pages Jaunes, annuaire CCI 77. Partout : même nom, même adresse (15 allée des Plantes, 77410 Annet-sur-Marne), même numéro.
- **Jeudi** : article n° 1 du plan éditorial (« Devis sans réponse : pourquoi vos relances n'arrivent jamais ») + activer le lien Blog + demander son indexation dans GSC.
- **Vendredi** : posts LinkedIn de lancement, un par profil (Jennifer : angle client ; Mateusz : angle « ce site est notre démonstration », lien vers le calculateur). La page entreprise relaie.

### Semaine 2 : les relais

- Article n° 2 (« Un agent IA dans une entreprise artisanale, heure par heure ») + post LinkedIn miroir.
- Inscription aux comparatifs où les IA puisent : Codeur, La Fabrique du Net, Sortlist.
- Prescripteurs : constituer la liste de 20 (10 experts-comptables du 77, 5 courtiers/CGP, 5 agences immobilières et notaires pour l'AMO). Envoyer les 5 premiers messages personnalisés avec proposition simple : réciprocité de recommandation + atelier offert à leurs clients.
- Candidature Activateur France Num si les conditions sont réunies (6 mois d'activité + références), sinon noter la date d'éligibilité.

### Semaine 3 : le terrain

- Article n° 3 (« Combien coûte une demande client perdue ? La méthode ») : le plus « citable » par les IA, relié au calculateur.
- Relances prescripteurs + premiers rendez-vous.
- Contacter CMA 77 et CCI 77 : proposer l'atelier « L'IA pour les artisans, sans blabla » (45 min, Jennifer, calculateur en support) pour la rentrée.
- Presse locale (La Marne, actu.fr 77) : court communiqué de lancement.

### Semaine 4 : mesurer et armer la suite

- Article n° 4 (« Facturation, planning, messagerie : en finir avec la triple saisie »).
- Premier bilan Search Console : pages indexées, impressions, requêtes. Fiche Google : vues et actions.
- Préparer le test Google Ads (lancement semaines 5-6) : budget 300 à 500 euros/mois, campagne 1 « création site internet artisan/TPE » vers `/#offre-site`, campagne 2 « automatisation devis/relances » vers `/automatisation`. Critère d'arrêt : coût par contact supérieur à la valeur d'un premier rendez-vous.
- Dès la première mission livrée : demander l'avis Google sous 48 h et préparer l'étude de cas (avec accord écrit).

### Rythme de croisière (à partir du mois 2)

- 3 articles/semaine (lundi, mercredi, vendredi), alimentés par la boucle LinkedIn → blog du plan éditorial : les posts qui performent deviennent les articles de la semaine suivante, chacun relié à sa page pilier.
- 3 à 4 posts LinkedIn/semaine/profil ; 24 h avant chaque rendez-vous, envoyer la page pilier concernée + le calculateur ; prospection directe prioritairement vers les PME de 10 à 50 personnes et les profils ayant réagi.
- 1 action prescripteur/semaine ; 1 post fiche Google/mois.
- Revue mensuelle (30 min) : GSC, fiche Google, appels et formulaires, avec la question rituelle à chaque premier contact : « comment nous avez-vous trouvés ? ».
- Jalons : M+1 site indexé et 4 articles ; M+3 10 articles, 5 avis Google, verdict Ads ; M+6 premières demandes entrantes organiques régulières.
