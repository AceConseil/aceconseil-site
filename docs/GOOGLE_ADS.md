# Plan média Google Ads : ACE Conseil

Préparé comme le livrerait un cabinet spécialisé : stratégie, structure de compte, ciblages, mots-clés, annonces prêtes à coller, budgets et seuils de décision. Les CPC sont des estimations France à valider dans le Keyword Planner à l'ouverture du compte (outil gratuit, menu Outils → Planification).

---

## 0. Le prérequis avant le premier euro : la mesure

Sans conversions mesurées, Google Ads dépense à l'aveugle et ses algorithmes n'apprennent rien. État actuel du site : aucun cookie (choix assumé), formulaire en mailto (invisible pour Ads). Plan de mesure en trois niveaux :

1. **Jour 1, sans toucher au site : le suivi d'appels Google.** Les extensions d'appel et campagnes d'appel utilisent un numéro de transfert Google : l'appel est compté comme conversion (réglage : durée minimale 40 secondes) sans aucun tag sur le site, donc sans cookie. C'est la conversion principale du compte, cohérente avec le parcours du site (l'appel à Jennifer).
2. **Jour 1, manuel : la question rituelle.** « Comment nous avez-vous trouvés ? » à chaque premier contact, consigné. C'est la vérité terrain qui recoupe les chiffres Ads.
3. **Semaine 2-3, recommandé : conversion formulaire.** Brancher `WEBHOOK_URL` (le formulaire cesse d'être mailto), rediriger vers une page `/merci`, et poser le tag Google Ads en Consent Mode v2 avec un bandeau minimal. Impact : une ligne à mettre à jour dans les mentions légales. Sans cette étape, seuls les appels comptent ; c'est acceptable pour le test, limitant pour l'échelle. (Implémentation possible sur demande : page /merci + endpoint.)

Toutes les URL finales portent des UTM (`?utm_source=google&utm_medium=cpc&utm_campaign=...`) : sans cookie, ils restent lisibles dans les demandes reçues et prêts pour un futur outil de mesure.

---

## 1. Priorisation des offres (toutes ne méritent pas d'Ads)

| Offre | Intention de recherche | Ticket | Verdict |
|---|---|---|---|
| Site professionnel 499 | Forte (« création site artisan ») | Faible mais prix affiché = arme | **Campagne 1, lancement** |
| Automatisation + Agents IA | Moyenne à forte, requêtes « douleur » | Élevé | **Campagne 2, lancement** |
| AMO VEFA | Très forte et très ciblée (« visite cloisons »), faible concurrence | Moyen | **Campagne 3, lancement** (la pépite) |
| Formation IA | Moyenne, cycles d'achat B2B | Moyen | Campagne 4, mois 2 si budget |
| Visibilité / prospection | Marché saturé d'agences, CPC élevés | Élevé | Non : canal organique et prescripteurs |
| Stratégie commerciale | Requêtes floues, faible intention | Élevé | Non : LinkedIn et contenu |

---

## 2. Structure du compte

Réseau de recherche uniquement (pas de Display ni Performance Max avant d'avoir 30+ conversions : les algorithmes sans données gaspillent). Langue française. Enchères : « Maximiser les clics » avec CPC max plafonné les 3 premières semaines, bascule en tCPA dès 15-20 conversions.

### Campagne 1 · SITE-499 (Search, France entière)

- **Cible** : artisans, indépendants et TPE sans site ou avec un site honteux. Décideur = le dirigeant lui-même, souvent sur mobile le soir.
- **Landing** : `https://aceconseil.co/#offre-site` (le prix de l'annonce doit se retrouver à l'atterrissage, c'est la seule section du site qui l'affiche). UTM : `utm_campaign=site-499`.
- **Calendrier** : 7 h-22 h, 7 j/7 (les artisans cherchent le soir et le dimanche).
- **Groupes d'annonces / mots-clés** (exact + expression) :
  - *Création artisan* : [création site internet artisan], "site internet artisan", [site internet pour artisan], "créer site artisan" · CPC estimé 1,5-3 €
  - *Création TPE/indépendant* : [création site internet petite entreprise], "site internet auto entrepreneur", [site vitrine tpe], "création site vitrine prix" · CPC 2-4 €
  - *Refonte* : "refaire son site internet", [refonte site vitrine], "site internet obsolète" · CPC 1,5-3 €
- **Annonces RSA** (titres ≤ 30 c, descriptions ≤ 90 c) :
  - Titres : « Site professionnel à 499 € HT » · « Prix unique, affiché, assumé » · « Livré en 7 jours ouvrés » · « Design, textes, mise en ligne » · « Site d'artisan qui convertit » · « Fait sonner votre téléphone » · « Sans abonnement caché » · « Une série de retours incluse »
  - Descriptions : « Page complète : design sur mesure, textes pour vos clients. 499 € HT, livrée en 7 jours. » · « Référencement local de base inclus. Vous restez propriétaire de tout. Appelez, on cadre en 20 minutes. » · « L'IA a réduit le coût de production d'un site. Nous répercutons la différence, pas la qualité. » · « Formulaire et numéro reliés à votre boîte mail. Affichage mobile impeccable. »
- **Extensions** : liens annexes (Voir l'offre 499 → /#offre-site · Notre méthode → /#methode · Exemples de ce qui est inclus → /sites-web · Nous appeler → /#contact), accroches (Prix unique affiché · Livraison 7 jours · Sans engagement · Propriété totale), extrait de site (Services : Design, Textes, Mise en ligne, Référencement local), **extension d'appel** aux heures ouvrées.

### Campagne 2 · AUTO-IA (Search, France entière)

- **Cible** : dirigeants de TPE/PME de 2 à 50 personnes noyés dans l'administratif ou qui perdent des demandes. Requêtes de douleur plus que de solution.
- **Landing par groupe** : `/automatisation` et `/agents-ia`. UTM : `utm_campaign=auto-ia`.
- **Groupes / mots-clés** :
  - *Relances & devis* (LP /automatisation) : "relance devis automatique", [logiciel relance client], "automatiser ses devis", "relance facture impayée automatique" · CPC 1-2,5 € (niche peu disputée, très forte intention)
  - *Automatisation TPE/PME* (LP /automatisation) : [automatisation entreprise], "automatiser tâches administratives", [automatisation pme], "connecter ses logiciels" · CPC 2-5 €
  - *Agents & secrétariat IA* (LP /agents-ia) : [agent ia entreprise], "ia pour pme", "secrétariat automatique", [répondre clients automatiquement], "chatbot devis artisan" · CPC 2-4,5 €
- **Annonces RSA** :
  - Titres : « Vos outils se parlent enfin » · « Relances envoyées sans vous » · « Fini la double saisie » · « Agent IA sur vos outils » · « Réponse à vos clients 24 h/24 » · « Diagnostic chiffré d'abord » · « Vous restez propriétaire » · « TPE, artisans et PME »
  - Descriptions : « Devis, factures, planning : l'information circule seule et les relances partent sans vous. » · « Un agent IA répond, qualifie et prépare vos devis avec vos règles. L'humain décide. » · « On chiffre d'abord ce que la situation vous coûte. Vous décidez avec les chiffres sous les yeux. » · « Appel de cadrage de 20 minutes, sans engagement. On vous dit franchement si ça vaut le coup. »
- **Extensions** : liens (Calculez votre manque à gagner → /#preuves · Les agents IA en détail → /agents-ia · L'automatisation en détail → /automatisation · Notre méthode → /#methode), accroches (Sur vos outils existants · Zéro abonnement imposé · Documentation incluse · Réponse sous 1 jour ouvré), extension d'appel.

### Campagne 3 · AMO-VEFA (Search, Île-de-France)

- **Cible** : particuliers acquéreurs en VEFA (25-50 ans, souvent primo-accédants) à l'approche d'une visite ou d'une livraison ; investisseurs. Urgence réelle, décision rapide, quasi aucun concurrent en Ads local.
- **Géo** : Île-de-France + zone de présence (rayon 60 km autour de Marne-la-Vallée en priorité d'enchère).
- **Landing** : `/amo-immobilier`. UTM : `utm_campaign=amo-vefa`.
- **Calendrier** : 8 h-21 h + week-end (les visites se préparent le week-end). Extension d'appel selon les disponibilités réelles de Jennifer.
- **Groupes / mots-clés** :
  - *Visites clés* : "visite cloisons vefa", [visite cloisons], "accompagnement visite cloisons", "pré livraison vefa" · CPC 0,5-1,5 €
  - *Livraison & réserves* : "livraison appartement neuf accompagnement", [réserves livraison vefa], "expert livraison vefa", "défauts appartement neuf livraison" · CPC 0,8-2 €
  - *AMO acquéreur* : [amo immobilier], "assistance maîtrise ouvrage particulier", "se faire accompagner achat vefa" · CPC 1-2,5 €
- **Annonces RSA** :
  - Titres : « N'y allez pas seul » · « Visite cloisons accompagnée » · « 10 ans d'expérience VEFA » · « Chaque réserve consignée » · « Livraison VEFA sereine » · « Vos intérêts, pas les leurs » · « Intervention Île-de-France » · « Appelez avant votre visite »
  - Descriptions : « À la livraison, ce qui n'est pas écrit n'existe pas. Nous vérifions et consignons tout. » · « Le promoteur livre chaque semaine, vous une fois. Soyez accompagné par un professionnel. » · « Travaux modificatifs, cloisons, pré-livraison, livraison, réserves : présence aux étapes qui engagent. » · « Premier échange de 20 minutes sans engagement pour situer votre opération et vos échéances. »
- **Extensions** : liens (Les moments où tout se joue → /amo-immobilier · Qui vous accompagne → /#equipe · Nous appeler → /#contact), accroches (10 ans VEFA et marchés publics · Présence aux visites · Tout est consigné par écrit · Sans engagement).

### Mots-clés négatifs (toutes campagnes, dès le jour 1)

gratuit, emploi, salaire, formation (sauf campagne 4), cours, stage, alternance, définition, wordpress, wix, template, logiciel gratuit, crack, avis (à surveiller), exemple pdf, mémoire, tuto, youtube. Pour AMO : promoteur (côté offre d'emploi), constructeur maison individuelle, CCMI (hors périmètre si non couvert). Revue des termes de recherche 2 fois/semaine les 3 premières semaines : c'est là que se gagne le budget.

---

## 3. Budgets, coûts et projections

### Scénario TEST recommandé : 20 €/jour, 8 semaines (~1 200 € au total)

| Campagne | Budget/jour | CPC moyen estimé | Clics/mois | Taux contact estimé* | Contacts/mois | Coût/contact |
|---|---|---|---|---|---|---|
| SITE-499 | 8 € | 2,20 € | ~110 | 4-6 % | 4-7 | 35-60 € |
| AUTO-IA | 7 € | 2,80 € | ~75 | 3-5 % | 2-4 | 55-105 € |
| AMO-VEFA | 5 € | 1,20 € | ~125 | 5-8 % | 6-10 | 15-25 € |

*Contacts = appels 40 s+ et formulaires. Hypothèses prudentes de sites B2B locaux ; vos chiffres réels remplaceront ces estimations dès la semaine 3.

**Lecture rentabilité** : un site 499 signé couvre ~10 jours de sa campagne ; une mission automatisation moyenne couvre plusieurs mois de tout le compte ; l'AMO est probablement votre meilleur coût/contact du marché francilien. Le test complet coûte moins qu'une seule mission moyenne : c'est le prix de la donnée.

### Scénario CROISSANCE (si les seuils sont atteints) : 40-50 €/jour (~1 350 €/mois)

Réallocation selon coût/contact réel, ajout campagne 4 Formation IA (LP /formation-ia, mots-clés "formation ia entreprise", "former équipe intelligence artificielle", CPC 3-6 €), passage en tCPA, extension géo AMO (grandes métropoles avec déplacement facturé ou visio documentaire).

### Seuils de décision (gates), à trancher sans état d'âme

- **J+14** : un mot-clé a dépensé 3× le CPC moyen sans clic qualifié → pause. CTR d'un groupe < 2 % → réécrire les annonces.
- **J+30** : coût/contact d'une campagne > 2× la cible ci-dessus → refonte du ciblage ou pause. Dans la cible → +50 % de budget sur la campagne gagnante.
- **J+60** : bilan global. Coût par rendez-vous obtenu comparé au canal LinkedIn ; on ne garde que ce qui bat votre coût d'acquisition actuel.

---

## 4. Check-list de lancement

1. Compte Google Ads sur le compte Workspace (contact@aceconseil.co), facturation, fuseau Paris, **désactiver les suggestions automatiques d'application** (auto-apply) : un cabinet ne laisse jamais Google modifier le compte seul.
2. Ne PAS accepter le « mode intelligent » : passer en mode expert dès la création.
3. Conversions : créer « Appels depuis annonces » (40 s) avant toute mise en ligne.
4. Créer les 3 campagnes ci-dessus, budgets 8/7/5, enchères Maximiser les clics avec CPC max 3,50 € (SITE), 4,50 € (AUTO-IA), 2,50 € (AMO).
5. Coller mots-clés, négatifs, RSA, extensions. Vérifier chaque URL finale avec ses UTM.
6. Semaine 1 : rapport des termes de recherche à J+3 et J+7, ajout de négatifs.
7. Rituel hebdo (30 min, vendredi, avec le relevé LinkedIn) : dépense, clics, CTR, contacts, termes de recherche, décisions notées dans ce fichier.

## 5. Ce qu'un cabinet vous facturerait, et ce qui reste chez vous

Setup équivalent : 600-900 € ; gestion mensuelle : 300-500 €/mois. Ce document remplace le setup. La gestion reste votre travail hebdomadaire (30-45 min) ; si un jour elle est déléguée, exiger l'accès propriétaire au compte et ce document comme cahier des charges.
