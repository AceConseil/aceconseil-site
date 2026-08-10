# Vos articles sont-ils référencés ? Note de diagnostic

**Date : 9 août 2026. Objet : état réel de l'indexation d'aceconseil.co et suite à donner.**

---

## 1. La réponse en trois phrases

Non : au 9 août 2026, vos 15 articles ne sont pas visibles dans les résultats de recherche, un seul sur quinze a été retrouvé dans un index de moteur (Bing), et aucun ne ressort chez Google sur une phrase exacte tirée de son propre texte. Non, le travail n'est pas perdu : les articles existent, ils sont techniquement irréprochables, rien dans votre site ne les empêche d'être indexés, et le jour où la découverte et la crédibilité du domaine se débloquent, ils entrent dans l'index tels quels sans réécriture. Mais il faut le dire aussi franchement : ce travail n'a encore rien produit, il n'a jamais été mesuré, et tant qu'aucun instrument de mesure n'est installé, ni vous ni personne ne peut piloter la suite autrement qu'à la croyance.

---

## 2. Ce qui est établi, et ce qu'on ne peut pas savoir

### Ce qui est mesuré

| Constat | Preuve | Certitude |
|---|---|---|
| Bing connaît 4 URL sur les 25 de votre sitemap, soit 16 % | Requête `site:aceconseil.co` sur `https://search.yahoo.com/search?p=site%3Aaceconseil.co` (Yahoo est alimenté par Bing). Page 2 vide, la liste est donc complète | Établi |
| Ces 4 URL sont : la page d'accueil, /sites-web, /amo-immobilier, et **un seul article**, /blog/facture-electronique-2026-reception-obligatoire | Même mesure | Établi |
| Bing a réellement lu cet article, il ne s'est pas contenté d'enregistrer l'adresse | Le résultat affiche le titre exact, la description mot pour mot de votre fichier source et la bonne date de publication (16 juillet 2026) | Établi |
| Brave, qui a son propre robot et son propre index, ne connaît que votre page d'accueil | `https://search.brave.com/search?q=site%3Aaceconseil.co` renvoie un seul résultat. Quatre phrases exactes tirées de quatre articles différents : zéro occurrence | Établi |
| Mojeek, index totalement indépendant, n'a jamais exploré le domaine | `https://www.mojeek.com/search?q=site%3Aaceconseil.co` affiche « Results 0 to 0 from 0 » | Établi |
| Common Crawl n'a capturé aucune URL du domaine sur ses trois derniers passages (mai, juin, juillet 2026) | `https://index.commoncrawl.org/CC-MAIN-2026-30-index?url=aceconseil.co%2F*` renvoie « No Captures found » | Établi |
| Aucune cause technique n'explique cette absence | robots.txt en autorisation totale avec sitemap déclaré, sitemap valide à 25 adresses avec des dates différenciées, balise canonique correcte, directive « index, follow » sur chaque page | Établi |
| Aucun traitement différencié des robots. Le serveur renvoie exactement le même fichier à Googlebot, à Bingbot et à un navigateur, à l'octet près (30 578 octets sur /blog/relance-devis-automatique), et le texte est lisible sans JavaScript | Sept agents testés le 9 août sur le même article, tous en code 200, contenu identique | Établi |
| Aucun signe de sanction | Un site pénalisé perd aussi sa page d'accueil et son nom de marque. La vôtre ressort correctement chez Google, Bing et Brave | Probable, mais solide |
| Le chemin interne fonctionne, mais il est mince : l'accueil pointe vers /blog, /blog liste les 15 articles, et **l'accueil ne pointe vers aucun article** | Extraction des liens de la page d'accueil : 1 lien vers /blog, zéro lien vers un article | Établi |
| Les liens de l'accueil vers vos 7 pages de service passent tous par une redirection inutile (agents-ia.html vers /agents-ia) | Lecture du fichier index.html et test des codes HTTP | Établi |
| Vos articles ne portent aucun nom d'auteur, aucune date de mise à jour, et le site ne déclare aucun lien vers vos profils (propriété `sameAs` absente partout) | Lecture de scripts/build-blog.js ligne 504 : `author: { '@type': 'Organization', name: 'ACE Conseil' }`. Aucune occurrence de `sameAs` ni de `dateModified` dans le dépôt | Établi |
| IndexNow, qui tourne à chaque mise en ligne, ne parle pas à Google. Google n'a jamais adopté ce protocole | Liste officielle des moteurs participants sur `https://www.indexnow.org/faq` : Bing, Yandex, Naver, Seznam, Yep, Amazon. Pas Google | Établi |

### Une correction à faire sur vos propres chiffres

Le dossier de départ décrit des articles de 900 à 1300 mots. **C'est faux.** Comptage direct des 15 fichiers dans `content/blog` : de 481 à 1113 mots, médiane 659. Onze articles sur quinze sont sous 730 mots. Ce n'est pas grave en soi, mais cela change la façon dont il faut parler du corpus : vous n'avez pas quinze dossiers de fond, vous avez quinze notes courtes. Sur des sujets aussi couverts que la facture électronique 2026, c'est un point à connaître avant de conclure quoi que ce soit sur la qualité.

### Ce qu'on ne peut pas savoir aujourd'hui, et pourquoi

**Je n'ai pas pu lire l'index de Google directement.** Toutes les voies automatisées se heurtent à des protections anti-robots : Google renvoie une page de vérification, Bing un défi à résoudre, DuckDuckGo une page d'anomalie, Ecosia un refus, Qwant une protection DataDome. Je ne les ai pas contournées et je ne le ferai pas. La conclusion « articles non indexés par Google » repose donc sur votre test manuel par phrase exacte, plus la convergence de Brave, Mojeek et Common Crawl. C'est une déduction solide, ce n'est pas une lecture directe. Je préfère le nommer.

**Surtout, la question décisive reste sans réponse.** Google distingue deux états qui se ressemblent de l'extérieur et qui n'ont rien à voir :

- « Détectée, actuellement non indexée » : Google connaît l'adresse et n'est pas venu la lire. Problème de priorité d'exploration. Les liens entrants aident réellement.
- « Explorée, actuellement non indexée » : Google est venu, a lu, et n'a pas retenu la page. Problème d'arbitrage sur la valeur perçue. Les liens ne changent presque rien.

Ces deux diagnostics appellent des remèdes opposés. Le seul endroit où lire lequel des deux vous concerne est Google Search Console, et vous n'en avez pas. C'est le trou du dossier, et il se comble en vingt minutes.

---

## 3. Le diagnostic : pourquoi on en est là

### Ce qui relève du temps incompressible, et qu'aucune action ne raccourcit

Votre domaine a neuf mois. Vos articles ont entre deux jours et cinq semaines au moment du test. Google écrit lui-même que l'exploration seule peut prendre « de quelques jours à quelques semaines » (`https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl`), et l'indexation vient après. Google écrit aussi, noir sur blanc, qu'il ne garantit ni l'exploration ni l'indexation, même pour une page parfaitement conforme.

Autrement dit : **une part de ce que vous lisez comme un échec est de la latence normale.** Déclarer aujourd'hui que la publication ne sert à rien serait une erreur de mesure. Le « bac à sable » de six à neuf mois dont parlent certains prestataires n'existe pas comme mécanisme formel, Google l'a toujours nié, mais une période d'évaluation de la confiance accordée à un jeune domaine, elle, est communément observée. Ce n'est pas réparable, c'est à traverser.

### Ce qui est réparable, et tout de suite

**Réparable en vingt minutes : vous n'avez aucun instrument.** Pas de Search Console, pas de Bing Webmaster Tools, pas de statistiques de fréquentation. Vous publiez trois fois par semaine depuis cinq semaines sans aucun retour. Ce n'est pas un problème de référencement, c'est un problème de pilotage, et c'est celui qui rend tous les autres indécidables. À noter : Google écrit explicitement que Search Console n'est **pas** requis pour être indexé (`https://support.google.com/webmasters/answer/9128668`). Ne l'installez donc pas en espérant un déclic. Installez-le parce que c'est le seul endroit où la question que vous posez a une réponse.

**Réparable en une soirée : votre maillage interne ne redistribue rien.** Votre page d'accueil est la seule page connue de Google, Bing et Brave à la fois. C'est votre unique porte d'entrée. Et elle ne pointe vers aucun article. Vos quinze articles dépendent tous d'une seule page intermédiaire, /blog, et ne sont reliés entre eux presque nulle part, alors que vous avez quatre articles sur la facture électronique et trois sur l'AI Act qui devraient former deux blocs cohérents. C'est le seul levier de découverte qui ne dépend de personne d'autre que vous.

**Réparable en deux ou trois heures : votre signal d'auteur est vide.** Vos articles sont signés par une organisation, jamais par une personne. Pour un cabinet de deux personnes dont l'argument est l'expertise de Mateusz et de Jennifer, c'est exactement le signal d'expérience vécue que vous laissez inexploité. Le 16 juillet 2026, John Mueller a décrit le contenu qui échoue à être indexé comme celui dont le lecteur se dit que n'importe qui aurait pu l'écrire (Search Off the Record, rapporté par `https://www.searchenginejournal.com/google-explains-seo-connection-of-site-quality-to-non-indexed-pages/582683/`). Vous êtes le contraire de cela, et vous ne le dites nulle part.

**Réparable, mais lentement : vous n'avez aucun lien entrant.** C'est un fait de votre dossier, pas une déduction. Une précision honnête : l'argument « trois robots indépendants ne vous connaissent pas, donc vous avez zéro lien » ne tient pas complètement. La Wayback Machine récupère une partie de ses données de Common Crawl, ce ne sont pas deux témoins séparés, et Mojeek plafonne autour de 5 milliards de pages à dominante anglophone. Un site français de 25 adresses serait absent de ces index même avec dix liens entrants. **Leur absence prouve votre obscurité, elle ne prouve pas la causalité.** Le zéro lien reste un fait, et c'est un handicap réel, mais il ne faut pas le vendre comme la cause unique et démontrée.

### Ce qui est plus inconfortable

Votre profil correspond à celui que Google a explicitement décrit comme surveillé en 2026 : domaine récent, sans notoriété, quinze articles courts publiés en trente-deux jours, dont quatre très proches sur la facture électronique et trois sur l'AI Act, sur des sujets déjà largement couverts. Les recherches sur vos titres exacts font remonter des concurrents installés sur le même angle (upstrategia.fr sur la relance de devis, codeyourweb.fr et web-du-leon.bzh sur la fiche Google pour artisan). Mueller a déclaré le 16 juillet 2026 que lorsque les systèmes doutent de la qualité d'un site pris dans son ensemble, ils réduisent à la fois l'exploration et l'indexation. Ce n'est pas une accusation, c'est une hypothèse concurrente de celle des liens, et elle a exactement le même statut : non vérifiée, faute d'instrument.

---

## 4. Le plan, par ordre de rapport entre effet et effort

Vous êtes deux. La règle de ce tableau : rien ne commence tant que les trois premières lignes ne sont pas faites, parce qu'elles conditionnent l'utilité de tout le reste.

### Bloc 1 : cette semaine, gratuit, effet certain sur la connaissance

| # | Action | Effort | Délai d'effet (ordre de grandeur) | Ce que ça change | Certitude |
|---|---|---|---|---|---|
| 1 | Créer la propriété Search Console sur `https://search.google.com/search-console`, en mode **Domaine**, par enregistrement TXT au DNS. Puis y soumettre `https://aceconseil.co/sitemap.xml` | 20 min, une seule fois | Vérification immédiate. Premières données de couverture sous 2 à 7 jours | Vous cessez de deviner. Le mode Domaine couvre www et non-www d'un coup, vous ne le referez jamais. L'historique ne remonte pas avant la date de création, d'où l'intérêt de ne pas attendre | Établi |
| 2 | Créer le compte Bing Webmaster Tools sur `https://www.bing.com/webmasters`, par import direct depuis Search Console une fois celle-ci active | 10 min | Données sous quelques jours | Vous mesurez enfin l'index que votre IndexNow alimente depuis des mois sans retour. Bing sert aussi Yahoo, DuckDuckGo, Ecosia, et alimente la recherche web de Copilot | Établi |
| 3 | Ouvrir le rapport « Indexation des pages » et **noter quel motif domine** pour vos articles : « Détectée, actuellement non indexée » ou « Explorée, actuellement non indexée ». Confirmer avec l'inspection d'URL sur quatre articles étalés dans le temps : relance-devis-automatique (6 juillet), ai-act-article-4-maitrise-ia (14 juillet), fiche-google-business-artisan (31 juillet), locaux-professionnels-rendez-vous-decisifs (7 août) | 20 min | Immédiat une fois les données là | **Cette lecture décide de tout le reste de ce plan.** « Détectée » : le sujet est la découverte et les liens. « Explorée » : le sujet est la valeur perçue et le contenu | Établi |

### Bloc 2 : dans la foulée, gratuit, effet probable mais sans garantie

| # | Action | Effort | Délai (ordre de grandeur) | Ce que ça change | Certitude |
|---|---|---|---|---|---|
| 4 | Dans Bing Webmaster Tools, soumettre les 14 articles absents via « Soumettre des URL » | 15 min | Quelques jours à 2 semaines | C'est le gain le plus probable du lot. Bing vous connaît déjà, a lu un de vos articles correctement, et accepte plusieurs centaines de soumissions par jour | Établi que le canal fonctionne. Le résultat reste probable, pas garanti |
| 5 | Dans Search Console, demander l'indexation de 3 à 5 articles seulement, les plus proches d'une vente. Commencez par facture-electronique-checklist-dirigeant et recevoir-facture-electronique-sans-tout-changer, dont le sujet a une échéance au 1er septembre 2026 | 15 min | Quelques jours à quelques semaines par adresse | Vous placez ces adresses dans une file d'exploration prioritaire. **Ne demandez pas les quinze** : le quota journalier n'est pas publié, et Google écrit que redemander la même adresse plusieurs fois n'accélère rien | Établi, y compris pour la limite : « Requesting a crawl does not guarantee that inclusion in search results will happen instantly or even at all » |
| 6 | Corriger les 7 liens de l'accueil vers les pages de service : remplacer `agents-ia.html`, `automatisation.html`, `formation-ia.html`, `sites-web.html`, `visibilite-prospection.html`, `strategie-commerciale.html`, `amo-immobilier.html` par `/agents-ia`, `/automatisation`, etc. | 10 min | Immédiat au prochain déploiement | Effet faible, annoncé comme tel. Vous supprimez une redirection sur vos sept pages les plus commerciales et vous alignez le maillage sur vos adresses canoniques. À faire parce que c'est dix minutes | Établi que le défaut existe. Effet supposé faible |

### Bloc 3 : cette semaine ou la suivante, sous votre contrôle total

| # | Action | Effort | Délai (ordre de grandeur) | Ce que ça change | Certitude |
|---|---|---|---|---|---|
| 7 | Ajouter sur la page d'accueil un bloc « Nos dernières analyses » avec 4 liens directs vers des articles. Et croiser vos deux familles thématiques entre elles : les 4 articles facture électronique se citent mutuellement, les 3 articles AI Act aussi. Portez le nombre de liens entre articles de 1 à 3 ou 4, avec des libellés descriptifs | 2 à 3 h | Quelques semaines | Vos articles passent de deux clics à un clic de la seule page réellement indexée partout. C'est le seul signal d'importance interne que vous puissiez encore émettre sans dépendre de personne | Le défaut est établi par mesure. L'effet est probable, d'ampleur inconnue |
| 8 | Signer les articles. Dans `scripts/build-blog.js` ligne 504, remplacer l'auteur Organization par une Person nommée (Mateusz pour l'IA, l'automatisation et le web, Jennifer pour l'AMO). Ajouter une signature visible en tête d'article, un champ `dateModified` mis à jour uniquement lors d'une correction réelle, et une propriété `sameAs` sur la page d'accueil listant votre fiche Google Business et votre page LinkedIn | 2 à 3 h | Quelques semaines pour la prise en compte | Vous émettez un signal d'expérience vécue et vous reliez trois choses aujourd'hui dispersées : le site, la fiche locale, les personnes. Effet indirect sur l'indexation, effet direct sur la conversion des visiteurs déjà présents | Le manque est établi. L'effet sur l'indexation est probable et modeste |
| 9 | Renommer les 4 à 6 titres de section réellement opaques, sans rien ajouter. « La formule » devient « La formule pour chiffrer une demande perdue », « Et ensuite » devient « Par où commencer une fois le montant connu ». Ne touchez pas aux 70 autres, ils font déjà leur travail | 20 min | Inconnu | Rendement faible et honnêtement annoncé comme tel. **N'ajoutez aucun bloc de texte sous les titres** : sur des articles de 660 mots, cela produirait du remplissage visible | Faible. À faire parce que c'est vingt minutes, pas parce que c'est un levier |

### Bloc 4 : ce mois-ci, la seule action de netlinking que je peux vous garantir vérifiée

| # | Action | Effort | Délai (ordre de grandeur) | Ce que ça change | Certitude |
|---|---|---|---|---|---|
| 10 | Candidater comme **Activateur France Num** sur `https://extranet.francenum.gouv.fr`. Conditions : plus de six mois d'activité (vous en avez neuf), SIRET, logo, périmètre Seine-et-Marne / Île-de-France, adresse du site | 2 à 3 h de dossier | 3 à 4 semaines d'instruction par la Direction générale des entreprises, puis publication de la fiche sous 24 h | **C'est le seul lien gratuit que j'ai pu vérifier par mesure directe comme étant un lien suivi, depuis un domaine en .gouv.fr.** Sur la fiche d'un concurrent implanté à Magny-le-Hongre (`https://www.francenum.gouv.fr/activateurs/netsulting`), la page est en « index, follow » et le lien vers le site du prestataire ne porte aucun attribut restrictif. Il n'y a que 57 activateurs en Seine-et-Marne sur 4 841 en France | Établi par mesure |

Deux points de vigilance sur cette candidature, tous deux vérifiés :

- **Prérequis bloquant** : le site doit avoir des mentions légales accessibles depuis la page d'accueil, incluant le traitement des données personnelles. J'ai vérifié : le lien existe en pied de page (`index.html` ligne 933) et la page mentionne les données. Relisez-la avant d'envoyer, un refus vous coûte le délai d'instruction.
- **Piège de réputation** : « Activateur » n'est ni un label ni une certification. Le seul terme autorisé en communication est « référencé ». Écrire « labellisé » ou « certifié » peut entraîner la suppression du compte (article 8 de la charte). Pour un cabinet qui vend de l'honnêteté, c'est exactement le genre d'erreur à ne pas commettre.

### Bloc 5 : à faire seulement si le rapport d'indexation dit « Détectée, actuellement non indexée »

| # | Action | Effort | Délai (ordre de grandeur) | Ce que ça change |
|---|---|---|---|---|
| 11 | Adhérer à l'ACEM, association des chefs d'entreprises de Marne-la-Vallée (`https://www.helloasso.com/associations/association-des-chefs-d-entreprises-marne-la-valle/adhesions/adherer-a-l-acem`), puis demander à `permanence@acem.net` l'inscription à l'annuaire avec l'adresse du site | Quelques heures, plus une cotisation dont je n'ai pas pu vérifier le montant | 2 à 6 semaines | Lien suivi vérifié par mesure sur `https://acem.net/entreprises/` : page en « index, follow », 63 liens vers des sites de membres sans attribut restrictif. Surtout : un accès direct à des dirigeants de TPE et PME du secteur, ce qui justifie l'adhésion à soi seul |
| 12 | Faire référencer l'établissement dans l'annuaire économique de votre agglomération : `https://entreprises.agglo-pvm.fr` pour Paris-Vallée de la Marne, ou `https://www.valdeuropeagglo.fr/annuaire-des-entreprises-du-val-deurope/` pour le Val d'Europe. Passez par le service développement économique | 1 h | 2 à 8 semaines | Lien suivi vérifié par mesure (`https://entreprises.agglo-pvm.fr/etablissements/6338-acem`, lien sortant sans attribut restrictif). Faible en volume, propre, sans risque |

### Bloc 6 : à faire seulement si le rapport dit « Explorée, actuellement non indexée »

Dans ce cas, les liens ne sont pas la réponse et il ne faut pas y consacrer de temps. Le travail porte sur la valeur perçue de vos pages, et il s'applique **aux 15 articles déjà en ligne**, pas aux futurs. Règle simple, applicable dès le prochain article et rétroactivement sur les cinq articles les plus proches d'une vente : aucun article ne part sans au moins un élément que personne d'autre ne peut écrire. Un chiffre issu d'un dossier réel, un cas client anonymisé avec le montant et le délai, une capture d'un outil que vous utilisez, un refus d'un organisme et sa raison. Vous produisez cette matière gratuitement en faisant votre métier, contrairement à une agence. C'est votre seul avantage structurel et il n'apparaît nulle part dans le corpus actuel.

Une honnêteté sur les limites : votre stock de faits de terrain est fini. À neuf mois d'activité, vous avez peut-être quinze à vingt éléments réellement utilisables. Placez-les sur les cinq ou six pages qui comptent, pas un par semaine jusqu'à épuisement.

### Ce que je ne vous recommande pas, alors que ça figurait dans les pistes envisagées

- **Ne réduisez pas la cadence de trois articles par semaine pour des raisons de référencement.** Il n'existe aucun mécanisme documenté par lequel publier moins ferait indexer davantage un site de 25 adresses. Google réserve explicitement la question du budget d'exploration aux sites de plus de 10 000 pages à mise à jour quotidienne, et écrit que si votre site n'a pas un grand nombre de pages qui changent vite, ce guide ne vous concerne pas (`https://developers.google.com/search/docs/crawling-indexing/large-site-managing-crawl-budget`). La position constante de Google est aussi que la fréquence de publication n'est pas un facteur de classement. Si vous ralentissez un jour, que ce soit parce que le rythme vous épuise ou parce que vous préférez financer la différenciation. Dites-le comme tel, ce n'est pas une mesure de référencement.
- **Ne proposez pas d'atelier à la CCI Seine-et-Marne en espérant un lien.** Vérification faite sur sa propre page d'événement du 9 avril 2026 : la CCI nomme son intervenant extérieur et ne pose aucun lien vers lui ni vers sa société. Une chambre consulaire cite, elle ne lie pas. Et la CCI 77 vend exactement votre ligne de services (ateliers fiche Google Business, création de site par IA, coaching digital) : vous demanderiez à un concurrent direct une tribune gratuite devant sa propre base de prospects. Si vous voulez malgré tout intervenir, faites-le pour les rendez-vous obtenus dans la salle, jugez l'action au nombre de contacts qualifiés, et visez plutôt les clubs d'experts-comptables, les associations de gestion agréée, ou les services développement économique des agglomérations, qui lient plus volontiers.
- **Ne proposez pas d'échange d'articles avec des cabinets d'experts-comptables.** « Je te publie si tu me publies » est nommément visé par les règles anti-spam de Google, qui citent les échanges de liens excessifs et les articles invités à ancre optimisée. Le risque de sanction est faible à cette échelle, mais le lien obtenu est construit pour ne rien transmettre. Et l'arithmétique ne fonctionne pas : les taux de réponse observés en prospection à froid pour un article invité tournent autour de 8 à 12 %, ce qui donne moins d'un lien attendu pour cinq contacts. Si vous voulez écrire ailleurs, faites-le sans contrepartie et acceptez le lien tel qu'il vient.
- **N'achetez aucun service d'indexation instantanée.** Ces offres reposent sur l'Indexing API de Google, dont la documentation restreint l'usage aux pages d'offres d'emploi et d'événements en direct (`https://developers.google.com/search/apis/indexing-api/v3/quickstart`). Les soumissions hors périmètre sont ignorées.

---

## 5. La place des réseaux sociaux

Vous prévoyez des agents qui publieraient automatiquement sur X, Facebook et Instagram, tout en disant que votre priorité est la visibilité des articles. Ces deux choses ne se rejoignent pas, et voici précisément pourquoi.

### Ce que ça n'apportera pas

**Aucun de ces réseaux ne transmet d'autorité vers votre site.** Mesures directes du 9 août 2026 :

- LinkedIn : les liens portent l'attribut `nofollow` (qui indique à Google de ne pas transmettre de crédit) **et** passent par un redirecteur interne. Le lien vu par Google ne pointe même pas sur votre domaine.
- Facebook : les liens sortants passent par `l.facebook.com/l.php`, et le fichier robots.txt de Facebook interdit explicitement ce chemin à Googlebot. La chaîne est coupée avant d'atteindre votre site.
- X : tous les liens passent par le raccourcisseur t.co, qui ne fait pas une redirection classique mais renvoie une page en code 200 avec une redirection en JavaScript. La destination réelle est masquée.
- Instagram : aucune adresse n'est cliquable dans une légende de publication. Un article y est structurellement inexploitable.

**Et surtout, la découverte n'est pas votre problème.** Votre sitemap est valide, IndexNow tourne, votre page d'accueil est indexée. Google connaît déjà vos 25 adresses. Ajouter un canal de découverte à un site dont la découverte fonctionne ne change rien à la sélection, qui est le vrai blocage.

Une correction que je dois faire au passage, parce qu'elle circule et qu'elle est fausse : republier vos articles sur les réseaux sociaux **ne vous exposera pas à une sanction Google pour contenu dupliqué**. Il n'existe pas de pénalité de ce type. Le seul risque réel est côté plateforme : X interdit explicitement dans ses règles d'automatisation les publications substantiellement similaires répétées (`https://help.x.com/en/rules-and-policies/x-automation`), ce qui est exactement ce que produirait un agent relayant trois articles par semaine avec le même gabarit.

### Ce que ça peut apporter

Un canal de trafic direct, de la reconnaissance de nom, et des recherches sur votre marque. Ce n'est pas rien, mais cela ne répond pas à la question que vous posez.

Un point souvent ignoré, et qui mérite d'être dit : **LinkedIn est cité par les moteurs de réponse**. L'étude Semrush de janvier et février 2026 (325 000 requêtes, 89 000 adresses LinkedIn citées) mesure LinkedIn cité dans environ 14 % des réponses de ChatGPT Search, 13 % de Google AI Mode, 5 % de Perplexity. Les formats repris sont les articles longs et les publications de 50 à 300 mots, pas les accroches de deux lignes. C'est le seul réseau de la liste pour lequel une mesure documente un taux de citation en réponse générative sur des sujets professionnels.

### L'ordre que je recommande

1. **X : abandonnez.** Trois raisons cumulatives. Votre cible n'y est pas : France Num, dans son enquête du 18 mars 2026, ne fait même pas figurer X dans la hiérarchie des plateformes utilisées par les entreprises françaises. Les liens y sont masqués derrière t.co. Et les règles d'automatisation de X sanctionnent précisément ce qu'un agent de republication produirait. C'est le seul risque de restriction de compte identifié dans tout ce dossier, pour un gain que je n'arrive pas à décrire.
2. **LinkedIn : la seule plateforme qui justifie un agent.** Gardez vos trois publications par semaine mais changez la mécanique : mettez l'idée complète dans le corps du texte, format substantiel de 300 à 600 mots, et placez le lien en premier commentaire plutôt que dans la publication. La dégradation de portée des publications contenant un lien externe est largement observée mais n'est pas confirmée par LinkedIn : je vous la donne comme probable, pas comme établie. Le test coûte trois publications.
3. **Facebook : oui, mais manuellement, et pas pour le référencement.** Facebook reste la première plateforme des entreprises françaises. Mais l'automatisation vers les groupes est impossible depuis avril 2024, Meta ayant supprimé la permission correspondante. Or les groupes locaux d'artisans et de BTP sont précisément l'endroit où votre cible se trouve, et c'est justement la partie non automatisable. Ne créez pas de page d'entreprise : elle ne servirait pas l'objectif et créerait une dette d'entretien visible. Rejoignez deux ou trois groupes locaux avec un profil personnel identifié, plafonnez à vingt minutes deux fois par semaine, répondez aux questions concrètes, et ne mentionnez le site que quand il répond exactement à la question. Traitez cela comme de la prospection et comme un moyen d'apprendre le vocabulaire réel des artisans (utile pour écrire vos prochains articles), jamais comme du référencement. Si au bout de six semaines il n'en sort ni conversation ni demande, arrêtez sans regret.
4. **Instagram : reportez.** N'y allez que si Jennifer produit réellement des photos de chantiers, de locaux et de dossiers AMO. Un compte alimenté par un agent avec des visuels génériques d'article ne produira ni trafic ni crédibilité et consommera du temps chaque semaine.

### L'exception à sortir du report, une demi-journée, une fois

Créez les profils, renseignez-y l'adresse du site, et ajoutez ces adresses plus celle de votre fiche Google Business dans la propriété `sameAs` de vos données structurées (action 8 du tableau). Ce n'est ni du netlinking, ni payant, ni sanctionnable. **Cela ne fera indexer aucun article, et il faut le dire tel quel.** Mais un domaine de neuf mois souffre de n'exister nulle part ailleurs sur le web, et c'est le seul signal hors site que vous pouvez vous donner honnêtement à ce stade.

### Un problème de nom, qu'il faut régler avant de générer de la notoriété

« ACE Conseil » est un nom encombré en France : plusieurs sociétés homonymes, et surtout **un aceconseil.fr actif**, cabinet établi, jumeau du vôtre à une extension près. Tant que ce sera le cas, un artisan à qui vous parlez dans un groupe et qui tape « ace conseil » dans Google atterrira une partie du temps chez quelqu'un d'autre. Décidez d'une formulation systématique, « ACE Conseil Marne-la-Vallée » ou « ACE Conseil 77 », et employez-la partout, y compris à l'oral. C'est gratuit et cela conditionne l'utilité de tout effort de notoriété.

---

## 6. Ce qu'il faut arrêter de croire

**« Search Console va débloquer l'indexation. »** Non. Google écrit lui-même : vous n'avez pas besoin de Search Console pour figurer dans les résultats. C'est un instrument de mesure et un canal de signalement, pas une condition d'entrée. Installez-le pour savoir, pas pour déclencher.

**« Le sitemap n'est pas soumis à Google. »** Il l'est déjà. Google documente exactement deux méthodes : Search Console, ou la directive Sitemap dans robots.txt. Votre robots.txt contient cette ligne. L'ancien mécanisme de notification par adresse a été supprimé fin 2023. Search Console n'ajoutera pas un canal, elle ajoutera la visibilité sur ce canal.

**« IndexNow va faire indexer les articles chez Google. »** Non. Google ne participe pas au protocole, la liste officielle des moteurs participants est Bing, Yandex, Naver, Seznam, Yep et Amazon (`https://www.indexnow.org/faq`). Votre installation n'est pas mal faite, elle s'adresse simplement à un autre public que celui que vous visiez. Ce n'est pas perdu pour autant : l'index Bing alimente la recherche web de Copilot et une partie de ChatGPT, ce qui a une valeur d'argumentaire pour un cabinet qui vend des agents.

**« Le budget d'exploration est le problème. »** Non, et il ne le sera jamais à votre taille. Google réserve explicitement cette question aux sites de plus d'un million de pages, ou de plus de 10 000 pages à rafraîchissement quotidien. Vous avez 25 adresses. Toute recommandation d'optimisation du budget d'exploration sur ce site serait du remplissage.

**« Il faut optimiser les balises priority et changefreq du sitemap. »** Google les ignore, c'est écrit dans sa documentation. Redemander plusieurs fois l'indexation de la même adresse n'accélère rien non plus, c'est écrit aussi.

**« Il faut créer un fichier llms.txt pour les IA. »** Non, et vous êtes déjà dans le bon état (vos adresses /llms.txt et /llms-full.txt renvoient une erreur 404, c'est correct). Google a documenté en juin 2026 que ce fichier n'a aucun effet, ni positif ni négatif, et que la recherche l'ignore. John Mueller le compare à la balise meta keywords. Une modélisation de SE Ranking a même trouvé que la variable dégradait la prédiction des citations.

**« Il faut bloquer les robots d'entraînement des IA. »** Pas dans votre situation. Le blocage se justifie pour un éditeur qui monétise son contenu, pas pour un cabinet de neuf mois qui cherche à se faire connaître. Être absent des modèles signifie n'être jamais proposé quand un dirigeant demande qui peut l'accompagner sur la facture électronique en Seine-et-Marne. Votre réglage actuel, autorisation totale, est le bon : j'ai vérifié que sept robots différents (GPTBot, OAI-SearchBot, ClaudeBot, Claude-SearchBot, bingbot, Googlebot, Google-Extended) reçoivent tous le même fichier complet en code 200. À noter au passage : bloquer Google-Extended n'aurait aucun effet sur les AI Overviews, Google écrit que ce jeton n'affecte ni l'inclusion ni le classement dans la recherche.

**« Les publications sur la fiche Google Business font découvrir les articles. »** Non. Une publication n'est vue que par quelqu'un qui a déjà trouvé la fiche, donc, pour un cabinet B2B sans notoriété, par quelqu'un qui tape votre nom. Le seul test contrôlé public (Sterling Sky, trois fiches, 441 mots-clés suivis par fiche sur neuf semaines) ne relève aucune progression de classement attribuable aux publications, et une baisse sur une fiche. Le contenu d'une publication n'entre pas dans l'index web de Google. Gardez une publication par semaine si vous le voulez, en réutilisant le chapeau et l'image déjà produits, mais comptez-la comme de la diffusion, pas comme du référencement.

**« Les annuaires SEO gratuits apportent des liens. »** Ces listes sont le vestige d'une technique morte depuis 2012. S'y inscrire massivement construit un profil de liens artificiel, ce qui est le risque de sanction le plus courant pour un domaine jeune. Valeur : nulle à négative. Même chose pour les places de marché d'agences (Sortlist, Codeur, La Fabrique du Net) : Sortlist sert d'ailleurs une page en « noindex, nofollow » aux robots non autorisés, vérifié le 9 août. Si vous les utilisez un jour, budgétez-les comme achat de contacts commerciaux et jugez-les au coût par rendez-vous obtenu, jamais au nombre de liens.

**« La Chambre de métiers va nous référencer. »** Peu probable. La CMA recense les entreprises immatriculées au Répertoire des métiers. Le conseil est une activité commerciale ou libérale, pas artisanale. Le plan qui prévoyait « annuaires CCI 77 et CMA 77 » reposait sur une hypothèse fausse. L'Annuaire des Entreprises de France de la CCI est par ailleurs alimenté automatiquement depuis les données du registre du commerce : on ne s'y inscrit pas et on n'y ajoute pas de lien.

**« Le référencement local va porter les articles. »** Non, ce sont deux systèmes distincts. La fiche alimente le pack local et Maps, le blog dépend du référencement organique. Sur le pack local, la proximité géographique pèse à elle seule autour de 55 % du classement (étude Whitespark 2026). Pour un cabinet dont les clients ne cherchent pas « conseil près de chez moi » mais un sujet précis, c'est un canal secondaire. Ce qui vaut l'effort sur la fiche, ce sont les avis clients, pas les publications.

---

## 7. Comment mesurer à partir de maintenant

Le principe : deux personnes ne peuvent pas tenir un tableau de bord hebdomadaire. Ce qui suit tient en une quinzaine de minutes par mois.

### Chaque mois, le premier lundi, environ 15 minutes

| Indicateur | Où le lire | Point de départ au 9 août 2026 |
|---|---|---|
| Nombre d'URL indexées par Google | Search Console, rapport « Indexation des pages », ligne « Pages indexées » | Inconnu (probablement 1 à 3) |
| Répartition entre « Détectée, actuellement non indexée » et « Explorée, actuellement non indexée » | Même rapport, section « Pourquoi des pages ne sont pas indexées » | Inconnu, c'est la donnée qui manque |
| Nombre d'URL connues de Bing | Requête `site:aceconseil.co` sur `https://search.yahoo.com`, comptage manuel, page 2 comprise | **4 sur 25** |
| Test de phrase exacte sur Google | Rechercher entre guillemets : « Une fiche à moitié vide inspire autant confiance qu'une vitrine à moitié éteinte » | **Zéro résultat du domaine** |
| Recherches de découverte sur la fiche Google Business | Onglet Performances de la fiche | Inconnu |

Notez ces cinq lignes dans un fichier, une ligne par mois. C'est votre référence, et c'est reproductible à la main, sans outil, sans compte payant, sans se heurter à une protection anti-robot.

### Un indicateur avancé, quelques minutes par mois

Le passage des robots précède la citation et l'indexation de plusieurs semaines. Sur Vercel, vérifiez ce que votre offre vous donne comme accès aux journaux d'accès (la rétention est limitée sur l'offre gratuite, un renvoi de journaux peut être nécessaire, à contrôler avant de compter dessus) et regardez si Googlebot, Bingbot, PerplexityBot, OAI-SearchBot et ClaudeBot passent sur les adresses en /blog/. C'est un signal binaire et déterministe, disponible bien avant qu'un résultat soit visible.

### Le test de citation par les assistants : trimestriel, pas hebdomadaire

Ne le lancez pas tant que Search Console n'a pas confirmé une indexation : avant, la réponse est connue d'avance et vous mesureriez un zéro déjà établi. Une fois l'indexation acquise, faites une session de 90 minutes par trimestre : dix questions réelles de client, posées trois fois chacune, sur deux familles seulement (une adossée à Bing, ChatGPT ou Copilot mais pas les deux puisqu'ils partagent le même index, et une adossée à Google, Gemini). Notez un taux de citation sur 30 tirages, pas un oui ou non.

Une honnêteté sur la méthode : trois tirages restent sous les seuils que la recherche sur ce sujet considère comme exploitables. Le travail de référence sur la question (`https://arxiv.org/pdf/2604.07585`) attribue près de 35 % de la variance totale au simple fait de reposer la même question, contre 1,5 % à l'identité de la marque. Autrement dit, une réponse isolée ne veut rien dire. Cet exercice sert à détecter un basculement franc de zéro vers autre chose que zéro, rien de plus, et il faut le présenter comme tel.

### Les seuils de décision

**À 30 jours (9 septembre 2026)** : le rapport d'indexation de Search Console doit avoir tranché entre « Détectée » et « Explorée ». Si vous avez cette donnée, le diagnostic est fait et le bloc 5 ou le bloc 6 du plan s'active. Si à cette date Search Console n'est toujours pas installée, c'est le seul point d'échec qui compte, et il n'a rien à voir avec le référencement.

**À 30 jours également** : le compteur Bing doit avoir bougé. Vous êtes à 4 sur 25, vous aurez soumis 14 adresses manuellement dans un outil qui accepte plusieurs centaines de soumissions par jour, sur un moteur qui a déjà correctement lu un de vos articles. **Si ce chiffre n'a pas franchement augmenté, quelque chose ne va pas dans une hypothèse de ce dossier et il faut revenir dessus.** C'est le seul point de contrôle à trente jours dont je considère le résultat comme largement prévisible.

**À 60 jours (début octobre 2026)** : le test de phrase exacte sur Google doit renvoyer votre article. S'il ne le fait toujours pas alors que Search Console affiche « Détectée » et que les liens France Num et ACEM sont en place, la thèse du déficit de liens est affaiblie et il faut reporter l'effort sur la différenciation du contenu. S'il ne le fait pas alors que Search Console affiche « Explorée », vous savez déjà que le sujet est éditorial et le débat est clos.

**À 90 jours (début novembre 2026)** : décision sur la fiche Google Business. Si les recherches de découverte restent sous une vingtaine par mois, actez que le canal local est structurellement mince pour ce métier, passez à un entretien trimestriel, et remettez le temps sur les avis clients et les demandes d'indexation.

**Sur les liens entrants** : si trois ou quatre mentions extérieures ont été obtenues et que le nombre de pages indexées n'a pas bougé au bout de trois mois, arrêtez l'effort au lieu de le prolonger par habitude. C'est le point où beaucoup de cabinets continuent à démarcher pendant un an sans jamais vérifier.

---

## Ce que je ne vous promets pas

Aucune de ces actions ne garantit l'indexation. Google l'écrit lui-même : « Google doesn't guarantee that it will crawl, index, or serve your page, even if your page follows the Google Search Essentials. » Tous les délais de ce document sont des ordres de grandeur issus de la documentation officielle ou d'observations de terrain, pas des engagements. Aucun éditeur de moteur ne publie de délai d'indexation.

Ce que je peux affirmer avec certitude, en revanche : aujourd'hui vous travaillez sans instrument, sur un site techniquement sain, avec quinze articles prêts à être indexés et personne pour vous dire pourquoi ils ne le sont pas. Les vingt minutes d'enregistrement TXT au DNS qui ouvrent Search Console sont la seule action de tout ce document dont le rendement soit certain. Tout le reste en découle.