# Plan d'action visibilité ACE Conseil

Principe : le SEO et les citations par les IA paient en 6 à 12 mois ; la fiche Google, les avis et les prescripteurs paient en semaines. On mène les deux de front, mais on ne juge pas le premier avec l'horizon du second.

Constat de départ (mis à jour après retour terrain, juillet 2026) : LinkedIn **fonctionne** pour ACE : beaucoup de contacts et de rendez-vous obtenus. Le point de rupture n'est pas le canal, c'est la conversion au moment du prix. LinkedIn reste donc un pilier de l'acquisition ; le travail porte sur deux fronts : industrialiser ce qui marche (la boucle posts → articles, section 16) et armer le passage du prix (préparation des rendez-vous avec le site, chantier pilote, offres de reconquête : voir `docs/RELANCE_PRIX.md`).

## Semaine 1 : fondations techniques (bloquant, ~2 h)

1. Vercel : définir `aceconseil.co` (apex) comme domaine principal, redirection www → apex. Aujourd'hui l'apex fait une 307 vers www alors que les canonicals disent l'inverse : c'est LA cause de non-indexation.
2. Google Search Console : vérifier la propriété (DNS TXT), soumettre `sitemap.xml`, demander l'indexation de la home et de `/mentions-legales`.
3. Bing Webmaster Tools : même chose (Bing alimente ChatGPT).
4. Après le merge de la refonte : re-demander l'indexation. Les anciennes URLs apparaîtront en « redirection » dans GSC, c'est normal.

## Semaines 1-2 : exister localement (le levier le plus rentable)

5. Fiche Google Business Profile complète : catégories (conseil en informatique / marketing), zone d'intervention, les 7 services décrits, photos (les portraits sont dans `assets/`), lien vers le site, numéro. Publier 1 post/mois minimum.
6. Citations cohérentes (même nom, adresse, téléphone partout) : page entreprise LinkedIn, PagesJaunes, annuaires CCI 77 et CMA 77.
7. Process avis Google systématique : à chaque fin de mission, message type envoyé sous 48 h avec le lien direct d'avis. Objectif : 5 avis à M+3, 15 à M+12. C'est la seule preuve sociale publique compatible avec la règle « zéro promesse gratuite », parce qu'elle est réelle.
8. France Num : dès 6 mois d'activité et 2-3 références, candidater comme Activateur (validation DGE, dossier : guide sur francenum.gouv.fr). Page annuaire officielle + lien .gouv. Des concurrents directs y sont déjà.

## Mois 1-2 : prescripteurs et réseau local (en complément de LinkedIn)

9. Prescripteurs prioritaires : experts-comptables du 77 (ils ont la confiance des TPE et voient leurs pertes de temps), courtiers et CGP, agences immobilières et notaires pour l'AMO. Offre claire de partenariat : réciprocité de recommandation, voire atelier offert à leurs clients. Objectif : 10 rendez-vous prescripteurs, 3 partenariats actifs.
10. Réseaux : CCI 77 et CMA 77 (événements, permanences numériques), clubs d'entreprises Marne-la-Vallée / Val d'Europe, un chapitre BNI en test 3 mois.
11. Atelier « L'IA pour les artisans, sans blabla » (45 min) à proposer à la CMA/CCI : Jennifer en position d'experte, le calculateur du site en support, l'offre 499 en porte d'entrée. Un atelier trimestriel suffit.

## Mois 2-3 : test payant ciblé

12. Google Ads local, budget test 300 à 500 euros/mois sur 2 mois : campagne 1 « création site internet artisan / TPE » vers `/#offre-site` (le prix affiché est un avantage concurrentiel en annonce) ; campagne 2 « automatisation devis / relance clients » vers la page dédiée `/automatisation` dès qu'elle est publiée. Critère de poursuite : coût par appel ou formulaire < valeur d'un premier rendez-vous. Sinon on coupe sans état d'âme.

## En continu : contenu et citations IA

13. Blog : 1 à 2 articles/semaine selon `docs/PLAN_EDITORIAL.md`. Format pensé pour Google ET pour les IA : réponse directe en intro, listes, chiffres sourcés, FAQ. Le flux RSS `/blog/feed.xml` est généré automatiquement.
14. Pages dédiées : publier progressivement les 7 piliers (`agents-ia`, `automatisation`, `formation-ia`, `sites-web`, `visibilite-prospection`, `strategie-commerciale`, `amo-immobilier`) via `content/pages/`, puis décommenter les liens dans les panneaux de la home. Rythme conseillé : 1 page tous les 15 jours, en commençant par `automatisation` et `sites-web`.
15. Être là où les IA puisent : demander l'inscription aux comparatifs d'agences (Codeur, La Fabrique du Net, Sortlist), presse locale 77 (communiqué de lancement), 2-3 interventions en podcast artisanat/BTP dans l'année.
16. LinkedIn, pilier d'acquisition : la boucle posts → articles → rendez-vous.
    - **Poster** : 3 à 4 posts/semaine par profil. Jennifer : terrain, AMO, relation client, coulisses des missions. Mateusz : démonstrations concrètes (avant/après d'une automatisation, capture du calculateur, extrait du fil d'activité du site). Chaque post porte sur UNE des 7 compétences du site.
    - **Mesurer** : chaque vendredi, 15 minutes : relever impressions, commentaires et messages privés de la semaine. Les 3 posts qui ressortent deviennent les 3 articles de la semaine suivante (méthode détaillée dans `docs/PLAN_EDITORIAL.md`).
    - **Recycler** : chaque article publié redonne 2 posts (l'angle principal + une objection traitée en commentaire), avec lien vers l'article. La page entreprise relaie tout.
    - **Convertir** : 24 h avant chaque rendez-vous obtenu, envoyer au prospect le lien de la page pilier concernée et le calculateur (« préparez vos chiffres, on les vérifie ensemble »). Le rendez-vous commence alors sur la valeur chiffrée, pas sur le tarif. En cas de blocage prix malgré tout : playbook `docs/RELANCE_PRIX.md` (chantier pilote, paiement échelonné, offre d'entrée site).
    - Prospection directe : maintenue, priorité aux PME de 10 à 50 personnes et aux profils ayant réagi aux posts.

## Étude de cas : le déclencheur de tout

17. Dès les 3 premières missions : étude de cas avec accord écrit du client (contexte, ce qui a été installé, verbatim). C'est la pièce qui manque au site, aux posts LinkedIn, aux dossiers prescripteurs et à la candidature France Num. La règle reste : aucun chiffre non prouvable.

## Mesure et rituel

- Hebdomadaire (15 min) : demandes reçues (appels + formulaires) et leur source déclarée (« comment nous avez-vous trouvés ? » à chaque premier échange).
- Mensuel (30 min) : Search Console (impressions, clics, requêtes), vues et actions de la fiche Google, avis obtenus, articles publiés vs prévus.
- Option technique disponible sur demande : compteur de clics « Appeler » et d'envois de formulaire sans cookie, pour objectiver sans renier la promesse « zéro cookie ».

## Jalons réalistes

- M+1 : site indexé, fiche Google en ligne, 4 articles publiés, 10 prescripteurs contactés.
- M+3 : 10-12 articles, 2 pages dédiées, 5 avis Google, 1 atelier donné, verdict Google Ads.
- M+6 : 7 pages dédiées publiées, premières impressions GSC hors marque, 3 partenariats prescripteurs actifs, 1 étude de cas publiée.
- M+12 : le site et la fiche Google deviennent la première source de demandes entrantes, devant la prospection sortante.
