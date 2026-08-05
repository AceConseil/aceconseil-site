# La Gérance d'agents : le plan de l'offre

Document de référence, conçu en août 2026 à partir de deux sources (le modèle économique « managed agents » de Sidecar aux États-Unis, la mécanique technique Hermes Agent + Composio) passées au crible de quatre angles (offre et prix, opérations et stack, risques et conformité, lancement commercial) puis d'une consolidation adverse. Les chiffres rejetés comme irréalistes ont été écartés ; ce qui suit est la version arbitrée.

**L'idée en une phrase** : ACE installe un employé numérique chez le client, le surveille, le répare et le fait progresser, avec un rapport hebdomadaire des heures réellement gagnées ; le client reste propriétaire de tout et peut partir à tout moment.

---

## 1. Pourquoi c'est une offre ACE (et pas une mode copiée)

- **Le registre de valeur, c'est « on montre, on ne promet pas » incarné.** Chaque semaine, le client reçoit la liste des tâches accomplies par son agent, en heures et en euros, selon une grille d'équivalences qu'il a lui-même validée par écrit. Aucune promesse : une mesure, continue, chez lui.
- **La gérance réversible, c'est « vous restez propriétaire » prolongé.** Le mot « gérance » dit exactement la relation : un mandat de gestion sur un bien qui reste la propriété du client, révocable à tout moment. Jennifer peut l'expliquer avec sa légitimité immobilière : un gérant d'immeuble ne devient jamais propriétaire de l'immeuble.
- **Elle répond au vrai blocage constaté en rendez-vous.** « Trop cher » voulait souvent dire « trop d'un coup ». La gérance étale le coût en mensualités qu'un artisan compare à ce qu'il connaît : un mi-temps administratif à 1000 à 1300 euros par mois chargés. La gérance complète en coûte environ un quart.
- **Elle emballe ce qu'ACE sait déjà faire.** La construction d'agents (méthode existante), la formation IA (obligation de maîtrise de l'article 4, incluse d'office dans toute gérance : c'est un bouclier juridique et un argument de vente), et la culture du diagnostic chiffré (le calculateur devient l'outil de qualification).

**Règle d'articulation** : l'offre actuelle « construction + transfert » ne change pas et reste l'offre par défaut. Le transfert complet a lieu dans tous les cas, gérance souscrite ou non. La gérance se propose au moment du transfert, jamais avant, jamais comme condition (exception assumée : les 3 pilotes du lancement).

---

## 2. L'offre et la grille

Un seul palier commercial au lancement (les déclinaisons Veille et Coaching attendront des preuves), plus un tarif de maintien.

### Ce que la Gérance comprend (par agent, par mois)

- Surveillance quotidienne automatique (agent en vie, connexions valides, tâches récurrentes exécutées) et réparation, objectif interne sous 24 h ouvrées, jamais promis comme SLA.
- Mises à jour techniques (modèles, connecteurs, sécurité).
- Registre de valeur avec rapport hebdomadaire.
- Groupe WhatsApp à trois (client + agent + ACE) : le client apprend en voyant ACE parler à l'agent, ACE voit où le client bute.
- Un appel mensuel de 30 minutes (revue du registre, coaching, tâche suivante).
- Une amélioration par mois incluse (ajuster un flux, ajouter une tâche récurrente, transformer un bon résultat en compétence réutilisable).
- La note d'usage interne et le lien avec la formation ACE (article 4 de l'AI Act) : inclus d'office.
- Le dossier de reprise tenu à jour en continu (accès, procédures, comment surveiller soi-même).

### La grille (HT, par agent)

| Brique | Prix pilote (3 clients max, garanti 12 mois) | Prix plein (cible de travail) |
|---|---|---|
| Installation complète (construction + mise en gérance) | 490 euros | 1490 euros |
| Mise en gérance seule d'un agent déjà construit par ACE | 490 euros | 490 euros |
| Bilan d'un agent construit ailleurs | 390 euros, puis devis | 390 euros, puis devis |
| Gérance mensuelle | 190 euros/mois | 290 euros/mois |
| Tarif de maintien (suspension, 2 mois max/an) | 90 euros/mois | 90 euros/mois |

- Le prix pilote s'annonce une seule fois, avec le prix plein écrit à côté (règle maison des remises : une raison vraie, pas de rabais répété).
- L'infrastructure est **au nom et à la charge du client** : 30 à 80 euros par mois annoncés dès la proposition (VPS OVH France ~8 euros, Composio palier gratuit, LLM sur la clé du client), avec clause d'alerte si l'usage dépasse la fourchette. C'est la preuve matérielle de la propriété.
- Rien n'est jamais offert : offrir la mise en gérance reviendrait à offrir 12 à 15 heures de travail dans un cabinet de 2 personnes.
- Conditions : **sans engagement, préavis de 30 jours par simple email**, documentation et accès remis sous 15 jours, appel de passation de 60 minutes inclus, zéro frais de sortie. La réversibilité est le différenciateur : elle s'affiche.
- Aucun prix sur le site (règle maison, seule l'offre 499 y échappe) : la grille se donne en proposition personnelle, à côté du manque à gagner chiffré du prospect.

### La règle de qualification (opposable, à dire à voix haute)

On n'installe pas de gérance si le manque à gagner mensuel chiffré au calculateur n'atteint pas **3 fois l'abonnement** (soit ~870 euros par mois au prix plein), le taux horaire du client étant figé par écrit lors du diagnostic. En dessous, on oriente vers la formation ou le site 499, et on le dit.

---

## 3. Le déroulé client

1. **Diagnostic** : calculateur, taux horaire figé par écrit, choix d'un flux unique à confier d'abord (le chantier unique : souvent le traitement des demandes entrantes ou une rédaction récurrente).
2. **Installation** (12 à 15 heures de travail réel) : VPS au nom du client, agent, connexions Composio (OAuth, jamais de mot de passe en clair), compte email dédié séparé du principal, règles et approbations, groupe WhatsApp à trois dès le jour 1.
3. **Interview de voix** (30 minutes) : l'agent interroge le dirigeant sur son style, ses formulations, ses interdits, et enregistre une compétence « votre voix » pour rédiger en son nom (devis, emails, réponses).
4. **Grille d'équivalences validée par écrit** : combien de minutes vaut chaque type de tâche, selon le client, pas selon ACE.
5. **Croisière** : rapports hebdomadaires, appel mensuel, améliorations, et le réflexe qui fait progresser : chaque bon résultat devient une compétence réutilisable ; chaque sortie utile va dans un fichier lisible (Excel, Sheets), jamais seulement dans la mémoire interne de l'agent.

---

## 4. La stack technique (arbitrée)

| Brique | Choix | Pourquoi |
|---|---|---|
| Agent | Hermes Agent (open source, MIT) auto-hébergé | Mémoire et compétences persistantes, tâches planifiées en langage naturel, passerelles WhatsApp/Telegram/Email |
| Hébergement | **VPS européen dédié par client, OVH France par défaut** (~8 euros/mois) | Résidence des données en France, au nom du client. **Hermes Cloud est interdit** : politique de confidentialité de Nous Research autorisant la divulgation pour entraînement, préversion sans SLA |
| Connexions | Composio (compte au nom du client) | OAuth sécurisé vers Gmail/Drive/Agenda, palier gratuit de 20 000 appels/mois suffisant au départ |
| Modèles | Routage Claude : Haiku 4.5 (routinier), Sonnet (cheval de trait), Opus (ponctuel), sur la clé API du client | 15 à 30 euros/mois en usage modéré, 80 à 110 en intensif ; budgeter au tarif plein (le tarif de lancement de Sonnet expire le 31 août) |
| Mémoire | SQLite natif d'abord ; Honcho (~2 dollars/million de tokens) seulement quand le volume le justifie | Pas de complexité avant le besoin |
| Surveillance | Heartbeat 30 min, redémarrage automatique avant alerte humaine, canal Telegram interne ACE | « Réparé avant que vous le remarquiez », objectif interne détection < 15 min, résolution < 4 h ouvrées, jamais contractuel |
| Sécurité | Email dédié, moindre privilège, approbations obligatoires sur les actions irréversibles (emails externes, suppressions, paiements), journalisation 12 mois | L'humain décide, la machine exécute |

**Canaux** : WhatsApp par défaut pour le groupe client (le canal réel des artisans français), Telegram réservé à la supervision interne. Aucun document contenant des données personnelles dans les messageries.

**Charge et capacité (hypothèses à chronométrer dès le pilote 1, c'est la plus grosse inconnue du modèle)** : budget 5 heures par client et par mois en croisière (8 les deux premiers mois), seuil d'alerte à 8 heures après le deuxième mois. Capacité retenue : **10 à 12 clients sans embauche, 3 onboardings par mois maximum**. Condition de tenue : Jennifer formée aux incidents de niveau 1 (runbook + 2 heures), sinon le plafond est fictif et une semaine de vacances de Mateusz devient un risque contractuel.

---

## 5. Conformité et garde-fous

ACE devient **sous-traitant au sens de l'article 28 du RGPD** (accès aux emails du client, donc aux données de ses propres clients). Les 5 garde-fous contractuels indispensables, avant tout pilote payant :

1. **DPA annexé au contrat** (y compris pour les pilotes) : liste des sous-traitants ultérieurs (Composio, fournisseur LLM, hébergeur), clause de non-entraînement sur les données du client, notification de violation sous 24 heures.
2. **Clause de responsabilité** : obligation de moyens, plafond à 12 mois de redevances, exclusion des dommages indirects.
3. **Annexe des actions irréversibles** soumises à approbation humaine, journalisation conservée 12 mois.
4. **Clause de réversibilité** : résiliation à tout moment, préavis 30 jours, remise sous 15 jours, zéro frais, propriété du client dès le premier jour.
5. **Clause registre de valeur** : chiffres indicatifs validés par le client, aucune garantie de résultat, aucun usage en communication ACE sans accord écrit.

**AI Act** : le client est déployeur ; la note d'usage et le lien avec la formation ACE (article 4) sont inclus d'office dans toute gérance. C'est cohérent avec tout le contenu déjà publié, et un argument de vente.

**Ce qu'on ne promet jamais** : une disponibilité de 100 %, zéro erreur, une « conformité clé en main », des économies garanties. Et le chiffre américain des « 63 heures la première semaine » est interdit partout, y compris en rendez-vous : anecdote invérifiable d'un autre marché.

**À vérifier avant le premier pilote payant (bloquants)** : confirmation écrite de l'assureur RC pro (prestations numériques, dommages immatériels, extension cyber, 500 à 1500 euros/an si absente) ; relecture forfaitaire par un avocat du contrat d'une page, du DPA et du terme « gérance ».

---

## 6. Le lancement (6 semaines, 10 août au 18 septembre)

### Le message pilote (WhatsApp, du portable de celui qui connaît le contact)

> Bonjour [Prénom], c'est Mateusz, d'ACE Conseil. Nous préparons un nouveau service : un agent IA que nous installons chez vous, que nous surveillons et réparons nous-mêmes, avec un point ensemble chaque mois. Chaque semaine, vous recevez la liste de ce qu'il a fait, en heures et en euros. Avant d'ouvrir l'offre, nous cherchons deux ou trois entreprises pilotes. En échange de vos retours, l'installation est à 490 euros HT au lieu de 1490, et l'abonnement à 190 euros HT par mois, garanti un an. Vous restez propriétaire de tout et vous pouvez arrêter quand vous voulez. Dix minutes au téléphone cette semaine pour voir si ça colle à votre activité ?

**Cibles, par ordre** : 1) les prospects passés bloqués sur le prix avec un flux déjà identifié ; 2) les clients existants à volume administratif visible ; 3) le réseau Seine-et-Marne (relances de devis, factures par email, journaux de chantier). 3 messages en semaine 1, un seul rappel, jamais deux.

### Les 6 semaines en bref

- **S1 (10-14/08)** : assureur + avocat missionnés (bloquants) ; Mateusz monte la stack de référence **chez ACE même** (dogfooding : l'agent d'ACE tient son propre registre) ; liste des 10 candidats ; 3 messages envoyés.
- **S2 (17-21/08)** : appels de qualification au calculateur (règle des 3×), signature du pilote 1 sous réserve assureur/avocat ; formation de Jennifer aux incidents ; article « Ce que fait vraiment un agent géré, semaine par semaine ».
- **S3 (24-28/08)** : installation pilote 1 (semaine lourde, chronométrage de chaque heure), vérification des DPA de la chaîne de sous-traitance ; premier rapport hebdomadaire réel ; signature pilote 2 ; article « Le registre de valeur ».
- **S4 (31/08-4/09)** : installation pilote 2 ; bilan de charge du pilote 1 ; recalcul des coûts LLM au tarif plein ; rédaction de l'étage « Après la mise en service : deux chemins » sur /agents-ia (pas de page dédiée) ; article AI Act « qui surveille vos agents au quotidien ? ».
- **S5 (7-11/09)** : publication de l'étage /agents-ia + post LinkedIn + post fiche Google le même jour ; relances des prospects bloqués sur le prix avec la gérance comme troisième issue ; campagne AUTO-IA seulement si le suivi d'appels est en place.
- **S6 (14-18/09)** : premiers points mensuels ; pilote 3 signé seulement si la charge tient ; **go/no-go le vendredi 18**.

### Le go/no-go du 18 septembre (mesurable à cette date)

- 2 à 3 pilotes installés sur 8 à 10 contacts (≥ 25 % d'acceptation).
- Charge ≤ 2 heures par semaine et par agent après le premier mois.
- Ratio du registre ≥ 3 fois l'abonnement, au taux horaire du client.
- Les pilotes lisent leur rapport et savent citer une tâche accomplie.

**Le signal qui tue l'offre** : rapports non lus, plus de 3 interventions correctives par semaine après un mois, ou un départ motivé par « ça ne vaut pas l'abonnement ». Repli acté d'avance : le transfert complet reste l'offre unique, la gérance redevient de l'accompagnement ponctuel facturé à l'acte.

**Point de contrôle 2 (fin novembre)** : rétention des pilotes au cap des 3 mois, charge stabilisée sous 5 heures/mois, confirmation ou révision du prix plein de 290 euros avec les verbatims. C'est là que se joue la décision d'industrialiser, pas le 18 septembre.

---

## 7. Les décisions qui vous appartiennent (avec recommandation)

1. **Statut stratégique** : lisseur de trésorerie ou futur pilier avec embauche ? Recommandation : lisseur pendant 12 mois ; à ~58 euros de l'heure implicites, la gérance ne justifie pas de sacrifier des missions de conseil. Embauche seulement à 10 clients rentables et charge maîtrisée.
2. **Assurance RC pro** : à lancer en semaine 1, bloquant, seul le dirigeant peut le faire.
3. **Relecture juridique** (contrat, DPA, le mot « gérance ») : oui, en forfait, avant le pilote 1.
4. **Prix plein de 290 euros** : cible de travail, à trancher fin septembre avec les verbatims des appels ; rien n'est publié d'ici là.
5. **Cannibalisation** : la gérance ne se propose pas comme alternative d'étalement à une mission complète (hors pilotes). À revoir selon la trésorerie.
6. **Hébergeur** : OVH France par défaut (« données en France » vaut les 2 euros d'écart avec Hetzner).
7. **Répartition interne** : former Jennifer aux incidents de niveau 1 dès la semaine 2, sinon le plafond de capacité est fictif.
8. **Affichage d'un prix indicatif sur le site** : non ; revoir après 5 clients au prix plein.
