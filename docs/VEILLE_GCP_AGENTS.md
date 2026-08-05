# Veille : la pile agents de Google Cloud, et ce qu'elle change pour la Gérance

Note de veille du 5 août 2026. Question posée : les offres d'agents de Google Cloud sont-elles une alternative à notre stack (Hermes Agent auto-hébergé sur VPS OVH France + Composio + API Claude) ? Recherche menée sous quatre angles (produits, prix, RGPD, comparaison) puis consolidée en confrontant les chercheurs entre eux.

**Réponse courte : non, c'est un non-sujet comme infrastructure.** Mais la recherche a trouvé plus important que Google : une faille dans notre propre promesse commerciale, corrigée dans le document d'offre.

## Ce que Google propose (état au 5 août 2026)

La gamme a été renommée deux fois en dix-huit mois (Agentspace vers Gemini Enterprise en octobre 2025, Vertex AI vers Gemini Enterprise Agent Platform en avril 2026). Les briques :

| Brique | Ce que c'est | Verdict pour nous |
|---|---|---|
| **Agent Runtime** (ex-Agent Engine) | L'hébergement managé de l'agent, chez Google | Non : verrouillage opérationnel (identité IAM, registre d'outils, audit ne suivent pas le client), incompatible avec notre clause de réversibilité |
| **ADK** (Agent Development Kit) | La boîte à outils pour écrire un agent, en open source Apache 2.0 | **La seule brique intéressante** : s'auto-héberge sur notre VPS, pilote Claude, ne change rien à nos promesses. À garder comme plan B |
| **Memory Bank / Sessions** | La mémoire longue de l'agent, gérée par Google | Non : aucun format d'export documenté. La mémoire est la valeur accumulée du client, on ne la met pas là où on ne sait pas la reprendre |
| **Agent Gateway** | Les connexions OAuth (concurrent de Composio) | Non, mais instructif : Google traite la garde des jetons OAuth comme une brique d'infrastructure, pas comme un service tiers gratuit. À méditer sur Composio |
| **Gemini Enterprise** (ex-Agentspace) | L'assistant d'entreprise vendu au siège | C'est le seul front concurrentiel réel (voir plus bas) |

## Pourquoi c'est un non-sujet

**Le coût n'est pas le sujet.** Pour un agent d'artisan (400 interactions par mois), les deux piles coûtent à peu près la même chose : environ 42 à 47 euros par mois chez nous, environ 38 à 42 euros chez Google (le palier gratuit couvre le calcul, mais plus de 90 % de la facture est de toute façon constituée des jetons du modèle, identiques des deux côtés). L'écart vaut le prix du VPS, soit **1,4 à 2,5 % d'une facture à 490 euros**. Ce n'est pas un critère de décision.

**La complexité, si.** Un VPS, une image, une sauvegarde d'un côté ; quinze compteurs facturés séparément sans plafond de dépense ferme de l'autre. Le palier gratuit de Google est par compte et non par projet : le mutualiser entre clients l'épuise, le préserver impose un compte de facturation par client, ouvert par le client lui-même. Pour deux personnes non spécialistes, c'est une compétence à acquérir sans revenu associé et une surface d'erreur de facturation nouvelle.

**La résidence n'est pas meilleure.** La présence de la région Paris pour les briques agents n'a pas pu être tranchée (pages rendues en JavaScript, illisibles). Peu importe : la couche modèle domine, et elle est hors UE dans les deux cas (voir ci-dessous). À noter au passage, documenté par Google : l'ancrage Search et Maps n'offre aucune garantie de résidence et « il n'est pas possible de désactiver le stockage de ces informations ».

## La vraie trouvaille : notre promesse « données en France » était incomplète

Vérifié sur la documentation officielle d'Anthropic le 5 août 2026 : l'API Claude de première main est **globale par défaut**, et la seule option de résidence proposée est `inference_geo: "us"` (avec une majoration de 10 %). **Il n'existe pas d'option « Europe » en première main.**

Autrement dit : nos fichiers, notre mémoire et nos sauvegardes sont bien en France sur le VPS du client, mais **le texte envoyé au modèle est traité hors de France**. Écrire « vos données restent en France » sans distinguer les deux serait faux, et vérifiable en trente secondes par un client curieux ou un concurrent.

**La formulation correcte, désormais dans le document d'offre** : l'hébergement est en France (vérifiable, opposable) ; l'inférence, c'est-à-dire le traitement par le modèle, se fait aujourd'hui hors de l'Union européenne, chez un fournisseur engagé par contrat à ne pas entraîner ses modèles sur les données clients.

**Les deux voies de rattrapage** (à instruire avant la première signature, si un client l'exige) : les endpoints régionaux ou multi-régions de Claude servis par Google Cloud ou par Amazon Bedrock, avec une majoration de 10 %. C'est la seule raison pour laquelle Google Cloud pourrait entrer dans notre stack : comme fournisseur d'inférence européenne, pas comme hébergeur d'agents.

## Deux échéances budgétaires vérifiées

1. **Le tarif de Claude Sonnet 5 augmente le 1er septembre 2026** : de 2 / 10 à 3 / 15 dollars par million de jetons (tarif d'introduction expirant le 31 août). Notre poste modèle prend 50 %.
2. **Le tokenizer des modèles récents produit environ 30 % de jetons en plus pour le même texte.** Si l'on migre depuis un modèle plus ancien, le surcoût cumulé approche 95 %. À mesurer sur l'agent d'ACE pendant le rodage, avant de figer un prix de vente.

## Le seul front où Google mérite une réponse préparée

**Gemini Enterprise, vendu au siège** (à partir d'environ 21 dollars par utilisateur et par mois) : une TPE de dix personnes est à environ 180 euros contre nos 290 puis 490. Un prospect peut poser la question.

La réponse n'est pas le prix, c'est :
- le paramétrage sur mesure sur ses outils et ses règles, pas un assistant générique ;
- la propriété : tout est à son nom, il part quand il veut avec sa documentation ;
- aucun prérequis Google Workspace ;
- un humain nommé au bout du fil, qui répare avant qu'il ne s'en aperçoive ;
- et, à préciser si la question vient : l'édition d'entrée de Gemini Enterprise n'inclut pas la résidence des données.

## Quand Google redeviendrait un sujet

Trois cas, tous identifiables à l'avance :
1. Si une offre « Google opéré en France sous droit français » (type S3NS) publiait une grille incluant l'orchestration d'agents : elle dépasserait alors notre propre promesse.
2. Si un client réglementé exigeait une traçabilité, un audit et une identité par agent qu'un VPS nu ne produit pas.
3. Si le volume devenait tel que l'exploitation manuelle de N agents coûterait plus cher en temps humain que la complexité de GCP : pas avant plusieurs dizaines de clients.

## Ce qu'il faut retenir, et ce qui est plus urgent que Google

La phrase à dire en rendez-vous : « nous avons regardé, ils ne savent pas héberger votre agent en France, et nous ne facturons pas à la seconde de processeur ».

Trois urgences avant la première signature, toutes plus pressantes que ce dossier :
1. **Corriger le discours sur la résidence** (fait, voir le document d'offre).
2. **Obtenir de Composio par écrit** : son contrat de sous-traitance, la localisation de stockage des jetons OAuth, sa liste de sous-traitants ultérieurs. Sans cela, notre registre de traitements est incomplet.
3. **Recalculer la marge avant le 1er septembre**, tarifs et tokenizer compris.
