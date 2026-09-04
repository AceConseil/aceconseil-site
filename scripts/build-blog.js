#!/usr/bin/env node
/**
 * build-blog.js — Build statique du site ACE Conseil
 *
 * - Copie les pages statiques (home, mentions légales, robots, og-image)
 *   dans ./public/
 * - Génère /blog/<slug>.html pour chaque fichier content/blog/*.md
 *   (les fichiers préfixés par "_" sont ignorés)
 * - Génère /blog/index.html (liste antéchronologique) dès qu'il existe
 *   au moins un article
 * - Régénère sitemap.xml (racine du repo + public/)
 *
 * Usage : node scripts/build-blog.js
 * Aucune dépendance externe.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const CONTENT_DIR = path.join(ROOT, 'content', 'blog');
const TEMPLATE_FILE = path.join(ROOT, 'templates', 'article.html');
const OUT = path.join(ROOT, 'public');
const SITE = 'https://aceconseil.co';

const STATIC_FILES = ['index.html', 'mentions-legales.html', 'merci.html', 'robots.txt', 'og-image.png',
  '750f5e47e9d41e60496334acbe3d3cf2.txt', // clé IndexNow (voir scripts/indexnow.js)
    'favicon.svg', 'favicon.ico'];

const PAGES_DIR = path.join(ROOT, 'content', 'pages');
const PAGE_TEMPLATE_FILE = path.join(ROOT, 'templates', 'page.html');
// Slugs interdits pour les pages dédiées : fichiers réservés et sources de
// redirections 301 de vercel.json (la redirection gagnerait sur la page).
const RESERVED_SLUGS = new Set(['index', 'mentions-legales', 'merci', 'blog', 'assets',
  'ia', 'visibilite', 'strategie', 'formation', 'amo', 'a-propos', 'equipe',
  'about', 'audit', 'contact', 'contact-formation', 'confidentialite']);

// ── Front-matter ──

function parseFrontMatter(raw, filename) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) throw new Error(`${filename} : front-matter YAML manquant (bloc --- ... ---)`);
  const meta = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z_][\w-]*)\s*:\s*(.*)$/);
    if (!kv) continue;
    let value = kv[2].trim();
    if (/^".*"$/.test(value) || /^'.*'$/.test(value)) value = value.slice(1, -1);
    if (/^\[.*\]$/.test(value)) {
      value = value.slice(1, -1).split(',').map((s) => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean).join(', ');
    }
    meta[kv[1]] = value;
  }
  return { meta, body: m[2] };
}

function validateMeta(meta, filename) {
  for (const key of ['title', 'description', 'date', 'slug']) {
    if (!meta[key]) throw new Error(`${filename} : champ front-matter obligatoire manquant : ${key}`);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(meta.date)) throw new Error(`${filename} : date invalide (attendu AAAA-MM-JJ) : ${meta.date}`);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(meta.slug)) throw new Error(`${filename} : slug invalide (minuscules, chiffres, tirets) : ${meta.slug}`);
  if (meta.description.length > 160) {
    console.warn(`   ⚠️ ${filename} : description de ${meta.description.length} caractères (max recommandé : 160)`);
  }
}

function validatePageMeta(meta, filename) {
  for (const key of ['title', 'description', 'slug']) {
    if (!meta[key]) throw new Error(`${filename} : champ front-matter obligatoire manquant : ${key}`);
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(meta.slug)) throw new Error(`${filename} : slug invalide (minuscules, chiffres, tirets) : ${meta.slug}`);
  if (RESERVED_SLUGS.has(meta.slug)) throw new Error(`${filename} : slug réservé (fichier existant ou source de redirection 301) : ${meta.slug}`);
  if (meta.date && !/^\d{4}-\d{2}-\d{2}$/.test(meta.date)) throw new Error(`${filename} : date invalide (attendu AAAA-MM-JJ) : ${meta.date}`);
  if (meta.description.length > 160) {
    console.warn(`   ⚠️ ${filename} : description de ${meta.description.length} caractères (max recommandé : 160)`);
  }
}

// ── Widgets interactifs pour articles ──
// Dans un article : une ligne `::widget nom-du-widget::` insère le bloc HTML
// correspondant. Le CSS/JS de chaque widget vit dans templates/article.html.
// Sans JavaScript, chaque widget affiche son état complet (contenu déplié).
const ARTICLE_WIDGETS = {
  'relance-timeline': `<div class="wg wg-relance" aria-label="La séquence de relance, avec des exemples de messages">
  <p class="wg-title"><span class="wg-pulse"></span>La séquence, avec des exemples à adapter</p>
  <p class="wg-hint">Touchez chaque étape pour afficher le message type.</p>
  <div class="wg-step open" data-step="1">
    <button class="wg-head" type="button" aria-expanded="true"><span class="wg-day">J+2</span><span class="wg-name">Le message de disponibilité</span><span class="wg-chev"></span></button>
    <div class="wg-body"><p>« Bonjour [Prénom], je voulais simplement m'assurer que le devis vous est bien parvenu. Si un point mérite d'être précisé, je suis joignable en fin de journée. Bonne journée à vous. »</p></div>
  </div>
  <div class="wg-step open" data-step="2">
    <button class="wg-head" type="button" aria-expanded="true"><span class="wg-day">J+7</span><span class="wg-name">Le message utile</span><span class="wg-chev"></span></button>
    <div class="wg-body"><p>« Bonjour [Prénom], en reprenant votre dossier, je me suis dit que [une précision sur un poste du devis, une option possible, une contrainte de planning à anticiper]. Si vous souhaitez en parler, je peux vous appeler demain en fin de matinée. »</p></div>
  </div>
  <div class="wg-step open" data-step="3">
    <button class="wg-head" type="button" aria-expanded="true"><span class="wg-day">J+15</span><span class="wg-name">Le message de clôture</span><span class="wg-chev"></span></button>
    <div class="wg-body"><p>« Bonjour [Prénom], sans retour de votre part d'ici vendredi, je libérerai le créneau réservé pour votre chantier et je classerai le dossier. Un simple mot suffit pour le garder ouvert. »</p></div>
  </div>
</div>`,
  'calc-mini': `<div class="wg wg-calc" aria-label="Calculez votre manque à gagner avec vos chiffres">
  <p class="wg-title"><span class="wg-pulse"></span>Faites le calcul avec vos chiffres</p>
  <div class="wgc-field">
    <label for="wgc-d">Demandes perdues ou traitées trop tard, par semaine <output id="wgc-od">3</output></label>
    <input type="range" id="wgc-d" min="0" max="15" step="1" value="3">
  </div>
  <div class="wgc-field">
    <label for="wgc-v">Valeur moyenne d'une vente ou d'une mission <output id="wgc-ov">1 500 euros</output></label>
    <input type="range" id="wgc-v" min="200" max="20000" step="100" value="1500">
  </div>
  <div class="wgc-field">
    <label for="wgc-c">Sur dix demandes traitées à temps, combien signent ? <output id="wgc-oc">3 sur 10</output></label>
    <input type="range" id="wgc-c" min="1" max="10" step="1" value="3">
  </div>
  <p class="wgc-result">≈ <strong id="wgc-total">70 200</strong> euros par an</p>
  <p class="wg-hint">Estimation faite avec vos réglages. Le premier appel sert à vérifier ce montant, poste par poste.</p>
</div>`,
  'agent-journee': `<div class="wg wg-agent" aria-label="La journée d'un agent IA, heure par heure">
  <p class="wg-title"><span class="wg-pulse"></span>La journée de votre agent, heure par heure</p>
  <p class="wg-hint">Touchez chaque étape pour la dérouler.</p>
  <div class="wg-step open" data-step="1">
    <button class="wg-head" type="button" aria-expanded="true"><span class="wg-day">22 h 41</span><span class="wg-name">Demande reçue</span><span class="wg-chev"></span></button>
    <div class="wg-body"><p>Un prospect remplit le formulaire de votre site. Vous dormez. L'agent, lui, est réveillé.</p></div>
  </div>
  <div class="wg-step open" data-step="2">
    <button class="wg-head" type="button" aria-expanded="true"><span class="wg-day">22 h 42</span><span class="wg-name">Lue et qualifiée</span><span class="wg-chev"></span></button>
    <div class="wg-body"><p>L'agent lit, comprend, classe. Il pose par écrit les questions qui manquent, surface, commune, délai, avec vos mots.</p></div>
  </div>
  <div class="wg-step open" data-step="3">
    <button class="wg-head" type="button" aria-expanded="true"><span class="wg-day">07 h 30</span><span class="wg-name">Dossier prêt</span><span class="wg-chev"></span></button>
    <div class="wg-body"><p>À votre réveil, vous n'ouvrez pas un message brut : vous ouvrez un client qualifié, les éléments du devis déjà réunis. Votre premier geste de la journée est un geste utile.</p></div>
  </div>
  <div class="wg-step open" data-step="4">
    <button class="wg-head" type="button" aria-expanded="true"><span class="wg-day">J+3</span><span class="wg-name">Relance programmée</span><span class="wg-chev"></span></button>
    <div class="wg-body"><p>Le devis part sans réponse ? La relance suit toute seule, avec votre ton, et s'arrête dès que le client répond.</p></div>
  </div>
</div>`,
  'maitrise-ia-reperes': `<div class="wg wg-agent" aria-label="La maîtrise de l'IA, en quatre repères">
  <p class="wg-title"><span class="wg-pulse"></span>La maîtrise de l'IA, en 4 repères</p>
  <p class="wg-hint">Touchez chaque repère pour le déplier.</p>
  <div class="wg-step open" data-step="1">
    <button class="wg-head" type="button" aria-expanded="true"><span class="wg-day">1</span><span class="wg-name">Savoir ce que l'outil fait vraiment</span><span class="wg-chev"></span></button>
    <div class="wg-body"><p>Et ce qu'il ne fait pas. Un outil d'IA n'est ni infaillible ni magique : connaître son périmètre réel évite les mauvaises surprises.</p></div>
  </div>
  <div class="wg-step open" data-step="2">
    <button class="wg-head" type="button" aria-expanded="true"><span class="wg-day">2</span><span class="wg-name">Connaître ses limites, donc vérifier</span><span class="wg-chev"></span></button>
    <div class="wg-body"><p>Un outil se trompe, invente parfois. La règle tient en un mot : on relit et on vérifie ce qu'il produit avant de s'en servir.</p></div>
  </div>
  <div class="wg-step open" data-step="3">
    <button class="wg-head" type="button" aria-expanded="true"><span class="wg-day">3</span><span class="wg-name">Protéger les informations sensibles</span><span class="wg-chev"></span></button>
    <div class="wg-body"><p>Savoir quelles données on peut confier à un outil, et lesquelles jamais. C'est le point le plus souvent négligé, et le plus coûteux.</p></div>
  </div>
  <div class="wg-step open" data-step="4">
    <button class="wg-head" type="button" aria-expanded="true"><span class="wg-day">4</span><span class="wg-name">Garder la décision humaine</span><span class="wg-chev"></span></button>
    <div class="wg-body"><p>L'IA prépare, propose, accélère. Elle ne décide pas à votre place sur ce qui engage l'entreprise ou le client.</p></div>
  </div>
</div>`,
  'facture-emission-reception': `<div class="wg wg-agent" aria-label="Facture électronique : émettre ou recevoir, deux calendriers">
  <p class="wg-title"><span class="wg-pulse"></span>Émettre ou recevoir : deux calendriers</p>
  <p class="wg-hint">Touchez chaque ligne pour la déplier.</p>
  <div class="wg-step open" data-step="1">
    <button class="wg-head" type="button" aria-expanded="true"><span class="wg-day">2026</span><span class="wg-name">Recevoir : toutes les entreprises</span><span class="wg-chev"></span></button>
    <div class="wg-body"><p>Dès le 1er septembre 2026, sans aucune exception de taille, vous devez pouvoir recevoir une facture électronique. C'est ça qui vous concerne dans quelques semaines.</p></div>
  </div>
  <div class="wg-step open" data-step="2">
    <button class="wg-head" type="button" aria-expanded="true"><span class="wg-day">2026</span><span class="wg-name">Émettre : grandes entreprises et ETI</span><span class="wg-chev"></span></button>
    <div class="wg-body"><p>Les grandes entreprises et les entreprises de taille intermédiaire doivent aussi émettre leurs factures en électronique dès le 1er septembre 2026.</p></div>
  </div>
  <div class="wg-step open" data-step="3">
    <button class="wg-head" type="button" aria-expanded="true"><span class="wg-day">2027</span><span class="wg-name">Émettre : PME et micro-entreprises</span><span class="wg-chev"></span></button>
    <div class="wg-body"><p>C'est le fameux « 2027 » que beaucoup retiennent. Il ne concerne que l'émission, et seulement les petites structures. La réception, elle, reste fixée à septembre 2026.</p></div>
  </div>
</div>`,
  'checklist-site': `<div class="wg wg-check" aria-label="Auto-diagnostic : votre site coche-t-il les 7 cases ?">
  <p class="wg-title"><span class="wg-pulse"></span>Votre site coche-t-il les 7 cases ?</p>
  <p class="wg-hint">Cochez ce que votre site fait déjà, sans indulgence.</p>
  <ul class="wgk-list">
    <li><label class="wgk-item"><input type="checkbox" class="wgk-box"><span class="wgk-txt">Mon activité et ma zone sont claires d'emblée.</span></label></li>
    <li><label class="wgk-item"><input type="checkbox" class="wgk-box"><span class="wgk-txt">On peut m'appeler d'un toucher, depuis chaque page.</span></label></li>
    <li><label class="wgk-item"><input type="checkbox" class="wgk-box"><span class="wgk-txt">Mes textes parlent d'abord du client.</span></label></li>
    <li><label class="wgk-item"><input type="checkbox" class="wgk-box"><span class="wgk-txt">Mes preuves affichées sont toutes vérifiables.</span></label></li>
    <li><label class="wgk-item"><input type="checkbox" class="wgk-box"><span class="wgk-txt">Mon formulaire tient en trois champs.</span></label></li>
    <li><label class="wgk-item"><input type="checkbox" class="wgk-box"><span class="wgk-txt">Mon site reste net et lisible sur téléphone.</span></label></li>
    <li><label class="wgk-item"><input type="checkbox" class="wgk-box"><span class="wgk-txt">Mon site s'affiche en moins de trois secondes.</span></label></li>
  </ul>
  <div class="wgk-bar"><span></span></div>
  <div class="wgk-result">
    <p class="wgk-score"><strong class="wgk-n">0</strong> / 7 éléments en place</p>
    <p class="wgk-verdict wgk-v">Cochez les cases ci-dessus pour situer votre site.</p>
  </div>
  <div class="wgk-bands" hidden>
    <span class="wgk-band" data-min="0" data-max="2">Votre site ressemble à une vitrine sans en avoir la fonction : il informe peut-être, mais il ne fait pas appeler. Le bon côté : ces manques se corrigent vite, souvent en repartant d'une base propre. Vingt minutes avec Jennifer, cofondatrice, suffisent pour situer le chantier.</span>
    <span class="wgk-band" data-min="3" data-max="4">Les fondations sont là, mais plusieurs cases non cochées laissent partir des demandes. Reprenez-les une à une : ce sont elles qui vous coûtent des appels. Notre page sites web détaille la méthode pour les reboucher.</span>
    <span class="wgk-band" data-min="5" data-max="6">Votre site convertit déjà, il lui manque peu pour être vraiment efficace. Traitez la ou les cases restantes plutôt que de tout refaire : le gain est concret pour un effort mesuré.</span>
    <span class="wgk-band" data-min="7" data-max="7">Les sept éléments sont réunis : votre site est construit pour faire sonner le téléphone. Gardez-le rapide et à jour, et vérifiez qu'il apparaît bien quand on cherche votre métier et votre ville.</span>
  </div>
</div>`,
  'checklist-controle-ia': `<div class="wg wg-check" aria-label="Auto-diagnostic : seriez-vous tranquille en cas de contrôle ?">
  <p class="wg-title"><span class="wg-pulse"></span>Un contrôle demain : seriez-vous tranquille ?</p>
  <p class="wg-hint">Cochez ce qui est déjà en place chez vous.</p>
  <ul class="wgk-list">
    <li><label class="wgk-item"><input type="checkbox" class="wgk-box"><span class="wgk-txt">L'inventaire des outils d'IA utilisés chez nous est fait.</span></label></li>
    <li><label class="wgk-item"><input type="checkbox" class="wgk-box"><span class="wgk-txt">Des règles simples sont posées par écrit : confidentialité, vérification, décision humaine.</span></label></li>
    <li><label class="wgk-item"><input type="checkbox" class="wgk-box"><span class="wgk-txt">Les personnes concernées ont été formées, sur nos cas réels.</span></label></li>
  </ul>
  <div class="wgk-bar"><span></span></div>
  <div class="wgk-result">
    <p class="wgk-score"><strong class="wgk-n">0</strong> / 3 en place</p>
    <p class="wgk-verdict wgk-v">Cochez les cases ci-dessus pour situer votre entreprise.</p>
  </div>
  <div class="wgk-bands" hidden>
    <span class="wgk-band" data-min="0" data-max="0">Vous découvririez le sujet le jour où la question se pose. Rien d'insurmontable : l'inventaire se fait en vingt minutes, et l'essentiel tient en une demi-journée. Le bon moment pour commencer, c'est cette semaine.</span>
    <span class="wgk-band" data-min="1" data-max="1">Le premier pas est fait. Posez maintenant les règles par écrit, ou formez l'équipe : c'est ce qui transforme une intention en réponse montrable.</span>
    <span class="wgk-band" data-min="2" data-max="2">Il ne manque qu'une pièce. Complétez-la, et vous pourrez répondre « oui, voici » le jour où la question se pose.</span>
    <span class="wgk-band" data-min="3" data-max="3">Vous êtes du bon côté : vous pouvez montrer la formation et les règles. Gardez-les à jour quand un nouvel outil entre dans l'entreprise.</span>
  </div>
</div>`,
  'checklist-pret-a-recevoir': `<div class="wg wg-check" aria-label="Auto-diagnostic : prêt à recevoir vos factures électroniques en septembre ?">
  <p class="wg-title"><span class="wg-pulse"></span>Prêt à recevoir en septembre ?</p>
  <p class="wg-hint">Cochez ce qui est déjà réglé chez vous.</p>
  <ul class="wgk-list">
    <li><label class="wgk-item"><input type="checkbox" class="wgk-box"><span class="wgk-txt">Je sais quelle plateforme agréée recevra mes factures.</span></label></li>
    <li><label class="wgk-item"><input type="checkbox" class="wgk-box"><span class="wgk-txt">Mon logiciel de comptabilité ou de facturation y est relié.</span></label></li>
    <li><label class="wgk-item"><input type="checkbox" class="wgk-box"><span class="wgk-txt">Mon expert-comptable est au courant de mon choix.</span></label></li>
  </ul>
  <div class="wgk-bar"><span></span></div>
  <div class="wgk-result">
    <p class="wgk-score"><strong class="wgk-n">0</strong> / 3 en place</p>
    <p class="wgk-verdict wgk-v">Cochez les cases ci-dessus pour situer votre entreprise.</p>
  </div>
  <div class="wgk-bands" hidden>
    <span class="wgk-band" data-min="0" data-max="0">La rentrée approche, mais tout se règle encore vite. Commencez par la question à votre logiciel actuel : c'est souvent le chemin le plus court.</span>
    <span class="wgk-band" data-min="1" data-max="1">Le sujet est lancé. Verrouillez le branchement : une plateforme choisie mais pas reliée à vos outils ne reçoit rien.</span>
    <span class="wgk-band" data-min="2" data-max="2">Il ne reste qu'une case. Fermez-la avant la rentrée, et la réception ne sera qu'une formalité.</span>
    <span class="wgk-band" data-min="3" data-max="3">Vous êtes prêt à recevoir. Reste l'étape qui rapporte : brancher le tri, le rapprochement et les relances sur votre organisation.</span>
  </div>
</div>`,
  'checklist-triple-saisie': `<div class="wg wg-check" aria-label="Auto-diagnostic : votre entreprise fait-elle la navette entre ses outils ?">
  <p class="wg-title"><span class="wg-pulse"></span>Votre entreprise fait-elle la navette ?</p>
  <p class="wg-hint">Cochez ce qui vous arrive régulièrement.</p>
  <ul class="wgk-list">
    <li><label class="wgk-item"><input type="checkbox" class="wgk-box"><span class="wgk-txt">Je retape les lignes du devis dans la facture.</span></label></li>
    <li><label class="wgk-item"><input type="checkbox" class="wgk-box"><span class="wgk-txt">Je recopie des rendez-vous de la messagerie vers le planning.</span></label></li>
    <li><label class="wgk-item"><input type="checkbox" class="wgk-box"><span class="wgk-txt">Je ressaisis les coordonnées client d'un outil à l'autre.</span></label></li>
    <li><label class="wgk-item"><input type="checkbox" class="wgk-box"><span class="wgk-txt">Ma paperasse se fait le soir ou le week-end.</span></label></li>
    <li><label class="wgk-item"><input type="checkbox" class="wgk-box"><span class="wgk-txt">Une erreur de recopie m'a déjà coûté du temps ou de l'argent.</span></label></li>
  </ul>
  <div class="wgk-bar"><span></span></div>
  <div class="wgk-result">
    <p class="wgk-score"><strong class="wgk-n">0</strong> / 5 symptômes</p>
    <p class="wgk-verdict wgk-v">Cochez les cases ci-dessus pour situer votre entreprise.</p>
  </div>
  <div class="wgk-bands" hidden>
    <span class="wgk-band" data-min="0" data-max="0">Peu de navette chez vous : votre organisation est déjà bien branchée. Gardez ce réflexe quand un nouvel outil arrive.</span>
    <span class="wgk-band" data-min="1" data-max="2">Une ou deux flèches à couper. Ce sont des branchements simples, souvent réglés en quelques jours : commencez par le plus fréquent.</span>
    <span class="wgk-band" data-min="3" data-max="4">La navette est installée dans votre quotidien. La carte de vos outils, en trente minutes, vous dira quels branchements récupèrent l'essentiel.</span>
    <span class="wgk-band" data-min="5" data-max="5">Vous êtes le coursier de vos logiciels, et vos soirées le paient. Le bon côté : l'essentiel de ce qui se recopie peut se brancher. Il y a beaucoup à récupérer.</span>
  </div>
</div>`,
  'demi-journee-ai-act': `<div class="wg wg-agent" aria-label="La demi-journée de mise en conformité AI Act, heure par heure">
  <p class="wg-title"><span class="wg-pulse"></span>La demi-journée, heure par heure</p>
  <p class="wg-hint">Touchez chaque étape pour la dérouler.</p>
  <div class="wg-step open" data-step="1">
    <button class="wg-head" type="button" aria-expanded="true"><span class="wg-day">1re h</span><span class="wg-name">L'inventaire des outils</span><span class="wg-chev"></span></button>
    <div class="wg-body"><p>Quels outils d'IA, utilisés par qui, pour quoi faire. Trois colonnes sur une feuille, y compris les outils que l'équipe a adoptés seule.</p></div>
  </div>
  <div class="wg-step open" data-step="2">
    <button class="wg-head" type="button" aria-expanded="true"><span class="wg-day">2e h</span><span class="wg-name">La note interne</span><span class="wg-chev"></span></button>
    <div class="wg-body"><p>Confidentialité, vérification, décision humaine, signalement. Une page, datée, signée, connue de toute l'équipe.</p></div>
  </div>
  <div class="wg-step open" data-step="3">
    <button class="wg-head" type="button" aria-expanded="true"><span class="wg-day">3-4e h</span><span class="wg-name">La formation sur vos cas</span><span class="wg-chev"></span></button>
    <div class="wg-body"><p>Vos documents, vos demandes clients, vos règles. Ce que l'outil fait bien, où il se trompe, et comment chacun applique la note interne dès le lendemain.</p></div>
  </div>
  <div class="wg-step open" data-step="4">
    <button class="wg-head" type="button" aria-expanded="true"><span class="wg-day">Traces</span><span class="wg-name">Ce que vous gardez</span><span class="wg-chev"></span></button>
    <div class="wg-body"><p>L'inventaire, la note datée, la date et les participants de la session. De quoi répondre « oui, voici » si la question se pose un jour.</p></div>
  </div>
</div>`,
  'configs-reception-facture': `<div class="wg wg-agent" aria-label="Les trois configurations pour recevoir ses factures électroniques">
  <p class="wg-title"><span class="wg-pulse"></span>Votre configuration, votre geste</p>
  <p class="wg-hint">Touchez le cas qui vous ressemble.</p>
  <div class="wg-step open" data-step="1">
    <button class="wg-head" type="button" aria-expanded="true"><span class="wg-day">Cas 1</span><span class="wg-name">Un logiciel de gestion récent</span><span class="wg-chev"></span></button>
    <div class="wg-body"><p>Une question à votre éditeur : « à quelle plateforme agréée serez-vous raccordé pour la réception, et que dois-je activer ? ». Souvent, une case à cocher suffit.</p></div>
  </div>
  <div class="wg-step open" data-step="2">
    <button class="wg-head" type="button" aria-expanded="true"><span class="wg-day">Cas 2</span><span class="wg-name">Excel, papier ou vieux logiciel</span><span class="wg-chev"></span></button>
    <div class="wg-body"><p>Un compte directement chez une plateforme agréée, comme une boîte de réception dédiée. Vos outils actuels, eux, ne bougent pas.</p></div>
  </div>
  <div class="wg-step open" data-step="3">
    <button class="wg-head" type="button" aria-expanded="true"><span class="wg-day">Cas 3</span><span class="wg-name">L'expert-comptable gère tout</span><span class="wg-chev"></span></button>
    <div class="wg-body"><p>Une conversation avant la rentrée : qui reçoit, sur quelle plateforme, et comment vous accédez à vos pièces. Le cabinet a probablement déjà sa solution.</p></div>
  </div>
</div>`,
  'checklist-facture-datee': `<div class="wg wg-check" aria-label="Auto-diagnostic : où en êtes-vous de la checklist facture électronique ?">
  <p class="wg-title"><span class="wg-pulse"></span>Où en êtes-vous ?</p>
  <p class="wg-hint">Cochez ce qui est déjà fait chez vous.</p>
  <ul class="wgk-list">
    <li><label class="wgk-item"><input type="checkbox" class="wgk-box"><span class="wgk-txt">J'ai situé ma configuration : logiciel, Excel ou cabinet.</span></label></li>
    <li><label class="wgk-item"><input type="checkbox" class="wgk-box"><span class="wgk-txt">La question de la plateforme est posée à mon éditeur ou mon cabinet.</span></label></li>
    <li><label class="wgk-item"><input type="checkbox" class="wgk-box"><span class="wgk-txt">Le calendrier est clair pour moi : réception 2026, émission 2027.</span></label></li>
    <li><label class="wgk-item"><input type="checkbox" class="wgk-box"><span class="wgk-txt">Le raccordement à la plateforme est activé.</span></label></li>
    <li><label class="wgk-item"><input type="checkbox" class="wgk-box"><span class="wgk-txt">Mon inscription à l'annuaire est confirmée.</span></label></li>
    <li><label class="wgk-item"><input type="checkbox" class="wgk-box"><span class="wgk-txt">Une facture test a été reçue et ouverte.</span></label></li>
    <li><label class="wgk-item"><input type="checkbox" class="wgk-box"><span class="wgk-txt">On sait qui traite les factures reçues, et où elles vont.</span></label></li>
  </ul>
  <div class="wgk-bar"><span></span></div>
  <div class="wgk-result">
    <p class="wgk-score"><strong class="wgk-n">0</strong> / 7 actions faites</p>
    <p class="wgk-verdict wgk-v">Cochez les cases ci-dessus pour situer votre préparation.</p>
  </div>
  <div class="wgk-bands" hidden>
    <span class="wgk-band" data-min="0" data-max="2">Tout tient encore largement : commencez par situer votre configuration, c'est trente minutes cette semaine. Le reste suivra dans l'ordre.</span>
    <span class="wgk-band" data-min="3" data-max="4">La moitié du chemin est faite. La suite se joue chez votre éditeur ou votre plateforme : posez la question sans attendre, les réponses ralentissent à la mi-août.</span>
    <span class="wgk-band" data-min="5" data-max="6">Presque prêt. Fermez la ou les cases restantes avant le 25 août, et la rentrée sera un non-événement.</span>
    <span class="wgk-band" data-min="7" data-max="7">Vous êtes prêt à recevoir. L'étape d'après, celle qui rapporte : brancher le tri, le rapprochement et les relances sur votre organisation.</span>
  </div>
</div>`,
  'checklist-locaux-pro': `<div class="wg wg-check" aria-label="Auto-diagnostic : votre projet de locaux est-il cadré ?">
  <p class="wg-title"><span class="wg-pulse"></span>Votre projet de locaux est-il cadré ?</p>
  <p class="wg-hint">Cochez ce qui est déjà vérifié et écrit, pas ce qui a été dit à l'oral.</p>
  <ul class="wgk-list">
    <li><label class="wgk-item"><input type="checkbox" class="wgk-box"><span class="wgk-txt">La puissance électrique réellement disponible est écrite au contrat, pas supposée.</span></label></li>
    <li><label class="wgk-item"><input type="checkbox" class="wgk-box"><span class="wgk-txt">La charge au sol admissible est connue, et compatible avec vos machines ou votre stock.</span></label></li>
    <li><label class="wgk-item"><input type="checkbox" class="wgk-box"><span class="wgk-txt">La hauteur libre est mesurée là où vos équipements passent, pas au milieu de la pièce.</span></label></li>
    <li><label class="wgk-item"><input type="checkbox" class="wgk-box"><span class="wgk-txt">Le tableau de répartition des travaux entre bailleur et preneur est annexé et chiffré.</span></label></li>
    <li><label class="wgk-item"><input type="checkbox" class="wgk-box"><span class="wgk-txt">L'accès des véhicules de livraison a été testé au gabarit réel, pas sur un plan.</span></label></li>
    <li><label class="wgk-item"><input type="checkbox" class="wgk-box"><span class="wgk-txt">Le classement en établissement recevant du public et l'accessibilité sont tranchés par écrit.</span></label></li>
    <li><label class="wgk-item"><input type="checkbox" class="wgk-box"><span class="wgk-txt">La ventilation et l'extraction correspondent à votre activité, pas à celle du précédent occupant.</span></label></li>
    <li><label class="wgk-item"><input type="checkbox" class="wgk-box"><span class="wgk-txt">Le délai de raccordement fibre est confirmé par l'opérateur, pas estimé.</span></label></li>
    <li><label class="wgk-item"><input type="checkbox" class="wgk-box"><span class="wgk-txt">Le calendrier prévoit une marge entre la réception des travaux et votre emménagement.</span></label></li>
    <li><label class="wgk-item"><input type="checkbox" class="wgk-box"><span class="wgk-txt">La fin de l'ancien bail laisse un recouvrement, pas un pari sur la date.</span></label></li>
  </ul>
  <div class="wgk-bar"><span></span></div>
  <div class="wgk-result">
    <p class="wgk-score"><strong class="wgk-n">0</strong> / 10 points vérifiés</p>
    <p class="wgk-verdict wgk-v">Cochez les cases ci-dessus pour situer votre projet.</p>
  </div>
  <div class="wgk-bands" hidden>
    <span class="wgk-band" data-min="0" data-max="3">Le projet est encore ouvert, et c'est une bonne nouvelle : le cadrage avant signature est le rendez-vous le moins cher et le plus rentable. Reprenez la liste dans l'ordre avant d'engager quoi que ce soit.</span>
    <span class="wgk-band" data-min="4" data-max="6">Les bases sont posées, mais il reste des angles morts. Chacun de ces points se règle encore par un écrit aujourd'hui, et devient un devis supplémentaire une fois le bail signé.</span>
    <span class="wgk-band" data-min="7" data-max="9">Dossier solide. Traitez les cases restantes avant la signature ou la réception, ce sont précisément celles qui se découvrent au pire moment.</span>
    <span class="wgk-band" data-min="10" data-max="10">Votre opération est cadrée. Le point de vigilance se déplace vers la réception : des réserves précises au procès-verbal, et la retenue de garantie tenue jusqu'à leur levée.</span>
  </div>
</div>`,
  'test-boucle-reponse': `<div class="wg wg-check" aria-label="Auto-diagnostic : votre boucle de réponse tient-elle ?">
  <p class="wg-title"><span class="wg-pulse"></span>Votre boucle de réponse tient-elle ?</p>
  <p class="wg-hint">Ne cochez que ce que vous avez vérifié vous-même, téléphone en main. Pas ce que vous croyez avoir configuré.</p>
  <ul class="wgk-list">
    <li><label class="wgk-item"><input type="checkbox" class="wgk-box"><span class="wgk-txt">Je me suis fait écrire et appeler cette semaine depuis un numéro absent de mes contacts, et j'ai noté ce qui revenait.</span></label></li>
    <li><label class="wgk-item"><input type="checkbox" class="wgk-box"><span class="wgk-txt">Un message envoyé sur WhatsApp hors de mes horaires déclenche bien une réponse automatique, vérifié en vrai.</span></label></li>
    <li><label class="wgk-item"><input type="checkbox" class="wgk-box"><span class="wgk-txt">Cette réponse annonce un délai de rappel que je tiens réellement, et pas un délai de politesse.</span></label></li>
    <li><label class="wgk-item"><input type="checkbox" class="wgk-box"><span class="wgk-txt">Elle donne une porte de sortie explicite pour les vraies urgences : un numéro et une consigne claire.</span></label></li>
    <li><label class="wgk-item"><input type="checkbox" class="wgk-box"><span class="wgk-txt">Elle demande deux ou trois informations utiles : commune, nature des travaux, date souhaitée.</span></label></li>
    <li><label class="wgk-item"><input type="checkbox" class="wgk-box"><span class="wgk-txt">Mes horaires et mon adresse sont renseignés dans mon profil WhatsApp Business.</span></label></li>
    <li><label class="wgk-item"><input type="checkbox" class="wgk-box"><span class="wgk-txt">Mon annonce de messagerie vocale dit mon métier, ma commune, ce qu'il faut laisser et sous quel délai je rappelle.</span></label></li>
    <li><label class="wgk-item"><input type="checkbox" class="wgk-box"><span class="wgk-txt">J'ai testé le cas sans réseau ou téléphone éteint : une demande atteint quand même quelqu'un.</span></label></li>
    <li><label class="wgk-item"><input type="checkbox" class="wgk-box"><span class="wgk-txt">Les demandes reçues sortent du fil WhatsApp et finissent dans un endroit unique : carnet, tableau ou logiciel de devis.</span></label></li>
    <li><label class="wgk-item"><input type="checkbox" class="wgk-box"><span class="wgk-txt">Je peux dire, pour la semaine écoulée, combien de demandes sont entrées et combien ont eu une vraie réponse humaine.</span></label></li>
  </ul>
  <div class="wgk-bar"><span></span></div>
  <div class="wgk-result">
    <p class="wgk-score"><strong class="wgk-n">0</strong> / 10 points vérifiés</p>
    <p class="wgk-verdict wgk-v">Cochez les cases ci-dessus pour situer votre boucle.</p>
  </div>
  <div class="wgk-bands" hidden>
    <span class="wgk-band" data-min="0" data-max="3">Aujourd'hui, une demande qui tombe pendant un chantier a de bonnes chances de disparaître sans laisser de trace. Geste suivant : faites-vous écrire et appeler cet après-midi par un numéro inconnu, et notez ce qui revient et en combien de temps.</span>
    <span class="wgk-band" data-min="4" data-max="6">La moitié de la boucle tient, et c'est presque toujours la même moitié qui manque. Geste suivant : réécrivez votre message d'absence pour qu'il n'annonce qu'un seul délai, celui que vous tenez vraiment, avec une porte d'urgence.</span>
    <span class="wgk-band" data-min="7" data-max="9">Boucle solide. Geste suivant : traitez le cas hors réseau. Le message d'absence WhatsApp ne part que si votre téléphone a Internet, alors qu'une annonce de messagerie et un renvoi d'appel se jouent côté opérateur. Vérifiez-le une fois, en mode avion.</span>
    <span class="wgk-band" data-min="10" data-max="10">Votre boucle tient, y compris quand vous êtes injoignable. Le point de vigilance se déplace après le devis envoyé : c'est là que le silence reprend, et c'est une autre mécanique, celle de la relance.</span>
  </div>
</div>`,
  'quatre-appels-avant-septembre': `<div class="wg wg-agent" aria-label="Les quatre appels à passer avant le 1er septembre">
  <p class="wg-title"><span class="wg-pulse"></span>Les quatre appels à passer avant le 1er septembre</p>
  <p class="wg-hint">Touchez chaque appel pour voir quoi demander, mot pour mot.</p>
  <div class="wg-step open" data-step="1">
    <button class="wg-head" type="button" aria-expanded="true"><span class="wg-day">1</span><span class="wg-name">À votre éditeur ou à votre plateforme</span><span class="wg-chev"></span></button>
    <div class="wg-body"><p>« À quelle plateforme agréée suis-je raccordé pour recevoir mes factures fournisseurs, et pouvez-vous me confirmer par écrit les adresses de réception déclarées dans l'annuaire ? » Si vous n'avez ni logiciel de gestion ni cabinet équipé, ouvrez directement un compte chez une plateforme de la liste officielle publiée sur impots.gouv.fr. Sans réponse sous quarante-huit heures, relancez : la mi-août tourne en effectif réduit.</p></div>
  </div>
  <div class="wg-step open" data-step="2">
    <button class="wg-head" type="button" aria-expanded="true"><span class="wg-day">2</span><span class="wg-name">À votre négoce de matériaux</span><span class="wg-chev"></span></button>
    <div class="wg-body"><p>« À partir de quelle date vos factures partiront-elles par plateforme agréée, et quelles coordonnées utilisez-vous pour m'adresser une facture ? » Ajoutez la question qui évite la mauvaise surprise : « continuez-vous à m'envoyer un double par mail pendant la transition ? ». C'est cette réponse qui vous dit si vous allez recevoir des doublons, et pendant combien de temps.</p></div>
  </div>
  <div class="wg-step open" data-step="3">
    <button class="wg-head" type="button" aria-expanded="true"><span class="wg-day">3</span><span class="wg-name">À votre cabinet comptable</span><span class="wg-chev"></span></button>
    <div class="wg-body"><p>Trois questions à poser ensemble. « Recevez-vous mes factures fournisseurs à ma place ? » « Ai-je un accès en lecture à mon nom, et sous quel délai les pièces y sont-elles visibles ? » « Que devient mon adresse de réception si nous arrêtons de travailler ensemble ? » Les réponses tiennent en trois lignes, mais elles doivent être écrites.</p></div>
  </div>
  <div class="wg-step open" data-step="4">
    <button class="wg-head" type="button" aria-expanded="true"><span class="wg-day">4</span><span class="wg-name">À afficher au bureau, pour qui traite les factures</span><span class="wg-chev"></span></button>
    <div class="wg-body"><p>La seule étape qui ne soit pas un appel, et la seule que personne ne fera à votre place. Trois lignes, affichées : « Chaque mardi matin, ouvrir la boîte de réception des factures fournisseurs. Rapprocher chaque facture de son bon de livraison signé sur le chantier. Si une facture arrive deux fois, par la plateforme et par mail, payer celle de référence et marquer l'autre en doublon. »</p></div>
  </div>
</div>`,
  'checklist-dossier-numerique-77': `<div class="wg wg-check" aria-label="Auto-diagnostic : votre dossier tient-il debout avant le premier appel ?">
  <p class="wg-title"><span class="wg-pulse"></span>Votre dossier tient-il debout avant le premier appel ?</p>
  <p class="wg-hint">Ces neuf points sont ceux qu'on vous demandera en rendez-vous, et ceux qui décident de votre éligibilité. Cochez ce qui est déjà écrit, pas ce que vous croyez savoir.</p>
  <ul class="wgk-list">
    <li><label class="wgk-item"><input type="checkbox" class="wgk-box"><span class="wgk-txt">Je peux dire en une phrase le problème à régler, sans nommer ni un outil ni un site.</span></label></li>
    <li><label class="wgk-item"><input type="checkbox" class="wgk-box"><span class="wgk-txt">J'ai chiffré en euros ce que ce problème me coûte sur une année.</span></label></li>
    <li><label class="wgk-item"><input type="checkbox" class="wgk-box"><span class="wgk-txt">Je connais mon effectif exact et ma forme juridique : entreprise individuelle ou société.</span></label></li>
    <li><label class="wgk-item"><input type="checkbox" class="wgk-box"><span class="wgk-txt">Je sais si mon entreprise a plus de trois ans d'existence.</span></label></li>
    <li><label class="wgk-item"><input type="checkbox" class="wgk-box"><span class="wgk-txt">Je sais si je relève de la CCI ou de la CMA, et je peux nommer mon fonds de formation (AGEFICE, FAFCEA, OPCO).</span></label></li>
    <li><label class="wgk-item"><input type="checkbox" class="wgk-box"><span class="wgk-txt">J'ai fixé un budget maximum avant d'appeler qui que ce soit.</span></label></li>
    <li><label class="wgk-item"><input type="checkbox" class="wgk-box"><span class="wgk-txt">Pour chaque aide qu'on m'a citée, j'ai ouvert la page officielle et lu sa date de mise à jour.</span></label></li>
    <li><label class="wgk-item"><input type="checkbox" class="wgk-box"><span class="wgk-txt">J'ai demandé par écrit le prix et le reste à charge de chaque accompagnement proposé.</span></label></li>
    <li><label class="wgk-item"><input type="checkbox" class="wgk-box"><span class="wgk-txt">Mon rendez-vous gratuit à la CCI ou à la CMA est pris, avec une date.</span></label></li>
  </ul>
  <div class="wgk-bar"><span></span></div>
  <div class="wgk-result">
    <p class="wgk-score"><strong class="wgk-n">0</strong> / 9 points prêts</p>
    <p class="wgk-verdict wgk-v">Cochez les cases ci-dessus pour situer votre dossier.</p>
  </div>
  <div class="wgk-bands" hidden>
    <span class="wgk-band" data-min="0" data-max="2">Vous partiriez à l'aveugle, et c'est exactement ce que cherche un vendeur pressé. Commencez par la case 2 : une semaine de relevé de vos demandes entrantes suffit à sortir un montant annuel. Tout le reste se décide à partir de ce chiffre.</span>
    <span class="wgk-band" data-min="3" data-max="5">Le besoin est là, le dossier ne l'est pas encore. Complétez d'abord les cases 3, 4 et 5 : effectif, forme juridique, ancienneté et fonds de formation décident à eux seuls de presque toutes les éligibilités, et se vérifient en dix minutes.</span>
    <span class="wgk-band" data-min="6" data-max="8">Vous pouvez décrocher le téléphone. Posez le Bilan Numérique Express de la CCI 77 ou le rendez-vous visibilité de la CMA cette semaine, et servez-vous des cases restantes comme ordre du jour du rendez-vous.</span>
    <span class="wgk-band" data-min="9" data-max="9">Dossier complet. La question n'est plus de trouver une aide, c'est de choisir le premier chantier et de le mesurer à trente jours. C'est le bon moment pour un avis extérieur, chez nous ou ailleurs.</span>
  </div>
</div>`,
  'perimetre-ia-apres-report': `<div class="wg wg-check" aria-label="Ce que vous pouvez affirmer aujourd'hui, texte en main">
  <p class="wg-title"><span class="wg-pulse"></span>Ce que vous pouvez affirmer aujourd'hui, texte en main</p>
  <p class="wg-hint">Neuf points vérifiables. Ne cochez que ce que vous pouvez montrer ou constater, pas ce que vous supposez.</p>
  <ul class="wgk-list">
    <li><label class="wgk-item"><input type="checkbox" class="wgk-box"><span class="wgk-txt">Je peux lister les outils d'IA réellement utilisés chez nous, et par qui.</span></label></li>
    <li><label class="wgk-item"><input type="checkbox" class="wgk-box"><span class="wgk-txt">Aucun de nos outils ne classe ni ne note automatiquement des candidatures.</span></label></li>
    <li><label class="wgk-item"><input type="checkbox" class="wgk-box"><span class="wgk-txt">Aucun de nos outils n'attribue les tâches ni n'évalue un salarié à partir de son comportement ou de traits personnels.</span></label></li>
    <li><label class="wgk-item"><input type="checkbox" class="wgk-box"><span class="wgk-txt">Aucun de nos outils de recrutement ou de gestion du personnel n'établit de profil des candidats ou des salariés, pour prévoir leur comportement, leurs performances ou leur fiabilité.</span></label></li>
    <li><label class="wgk-item"><input type="checkbox" class="wgk-box"><span class="wgk-txt">Quand un agent conversationnel répond à notre place, il indique qu'il n'est pas humain.</span></label></li>
    <li><label class="wgk-item"><input type="checkbox" class="wgk-box"><span class="wgk-txt">Les images, sons ou vidéos que nous diffusons et qui ont été générés ou manipulés sont signalés comme tels.</span></label></li>
    <li><label class="wgk-item"><input type="checkbox" class="wgk-box"><span class="wgk-txt">Si nous publions des textes destinés à informer le public sur un sujet d'intérêt général, ils sont relus et une personne en assume la responsabilité éditoriale.</span></label></li>
    <li><label class="wgk-item"><input type="checkbox" class="wgk-box"><span class="wgk-txt">Nos règles d'usage de l'IA sont écrites, datées et connues de l'équipe.</span></label></li>
    <li><label class="wgk-item"><input type="checkbox" class="wgk-box"><span class="wgk-txt">Notre dernière session de formation ou de sensibilisation est datée, avec la liste des présents.</span></label></li>
  </ul>
  <div class="wgk-bar"><span></span></div>
  <div class="wgk-result">
    <p class="wgk-score"><strong class="wgk-n">0</strong> / 9 points démontrables</p>
    <p class="wgk-verdict wgk-v">Cochez les cases ci-dessus pour situer votre entreprise.</p>
  </div>
  <div class="wgk-bands" hidden>
    <span class="wgk-band" data-min="0" data-max="2">Vous ne savez pas encore où vous vous situez, et le report n'y change rien. Commencez par la case 1 : l'inventaire des outils réellement utilisés chez vous, y compris ceux que personne n'a validés. Vingt minutes suffisent, et il commande tout le reste.</span>
    <span class="wgk-band" data-min="3" data-max="5">Vos usages sont probablement hors du périmètre reporté, mais vous ne pourriez pas le démontrer. Traitez les cases 2, 3 et 4 en priorité : ce sont les seules qui décident si l'un de vos outils relève du haut risque, et elles se vérifient auprès de votre éditeur.</span>
    <span class="wgk-band" data-min="6" data-max="8">Il reste une ou deux pièces à écrire ou à dater, et peut-être un point de bascule non tranché. Vérifiez d'abord que les cases 2, 3 et 4 sont cochées : si l'une ne l'est pas, un de vos outils relève probablement de l'annexe III, et le reste passe au second plan.</span>
    <span class="wgk-band" data-min="9" data-max="9">Vous pouvez répondre pièces à l'appui, et pas seulement de mémoire. Reprenez ces neuf points chaque fois qu'un nouvel outil entre dans l'entreprise : c'est là que les situations changent sans prévenir.</span>
  </div>
</div>`,
  'cinq-situations-au-comptoir': `<div class="wg wg-agent" aria-label="Cinq clients au comptoir, cinq circuits différents">
  <p class="wg-title"><span class="wg-pulse"></span>Cinq clients au comptoir, cinq circuits différents</p>
  <p class="wg-hint">Touchez chaque situation pour voir ce qui change, et ce qui ne change pas.</p>
  <div class="wg-step open" data-step="1">
    <button class="wg-head" type="button" aria-expanded="true"><span class="wg-day">1</span><span class="wg-name">Un particulier paie et repart</span><span class="wg-chev"></span></button>
    <div class="wg-body"><p>Côté comptoir, rien ne change : la facture n'est pas obligatoire, le ticket reste un ticket. Le travail à prévoir est dans votre caisse, pas dans votre geste de vente. À partir du 1er septembre 2027, ce qui remonte à l'administration est le total de la journée par taux de TVA, base hors taxes et montant de TVA. Aucun nom, aucune adresse, aucun article, aucun moyen de paiement. Vous n'avez rien de nouveau à demander au client.</p></div>
  </div>
  <div class="wg-step open" data-step="2">
    <button class="wg-head" type="button" aria-expanded="true"><span class="wg-day">2</span><span class="wg-name">Le costume, et sa retouche</span><span class="wg-chev"></span></button>
    <div class="wg-body"><p>La retouche facturée avec le costume qu'elle adapte est accessoire : l'ensemble reste une vente de bien, et un seul flux de données est dû. Vendue seule, la même retouche devient une prestation de services, pour laquelle la TVA est exigible à l'encaissement : un second flux s'ajoute, celui des données de paiement, sauf option pour le paiement de la taxe d'après les débits. À vérifier avec votre éditeur : votre caisse distingue-t-elle biens et services, ou tout est-il codé en « vente » ?</p></div>
  </div>
  <div class="wg-step open" data-step="3">
    <button class="wg-head" type="button" aria-expanded="true"><span class="wg-day">3</span><span class="wg-name">Un professionnel achète pour son entreprise</span><span class="wg-chev"></span></button>
    <div class="wg-body"><p>La facture est obligatoire entre professionnels, et un ticket de caisse ordinaire, qui n'identifie pas l'acheteur, ne lui ouvre pas droit à déduction de TVA. Sous 150 euros hors taxes, une facture simplifiée suffit si elle porte les mentions requises. Jusqu'au 1er septembre 2027, cette facture peut rester en papier ou en PDF. Prenez dès maintenant l'habitude de demander son SIREN et de l'enregistrer : c'est la donnée qui manquera le jour où la facture devra partir par plateforme. Et retenez qu'un PDF envoyé par mail n'est pas une facture électronique au sens de la réforme.</p></div>
  </div>
  <div class="wg-step open" data-step="4">
    <button class="wg-head" type="button" aria-expanded="true"><span class="wg-day">4</span><span class="wg-name">Il revient trois jours plus tard</span><span class="wg-chev"></span></button>
    <div class="wg-body"><p>Le client réglé au comptoir demande une facture au nom de sa société. Vous ne pouvez pas la refuser. La difficulté est que la vente a déjà été enregistrée comme une vente à un particulier. Aujourd'hui, aucune conséquence déclarative. À partir de 2027, la même vente ne pourra pas rester dans vos totaux et partir en facture : il faudra corriger l'un ou l'autre, et les textes ne disent pas encore par quel geste. La question à poser à votre éditeur : ma caisse sait-elle retrouver un ticket et le transformer en facture ?</p></div>
  </div>
  <div class="wg-step open" data-step="5">
    <button class="wg-head" type="button" aria-expanded="true"><span class="wg-day">5</span><span class="wg-name">Une association achète du matériel</span><span class="wg-chev"></span></button>
    <div class="wg-body"><p>La facture reste obligatoire. Mais si l'association n'est pas assujettie à la TVA, la vente ne relève pas de la facture électronique : elle reste dans le e-reporting, comme une vente à un particulier. La seule question à poser est donc « êtes-vous assujettie à la TVA ? », et la réponse détermine le circuit. Vous n'avez pas à trancher pour elle : c'est à l'association de le savoir et de vous le dire.</p></div>
  </div>
</div>`,
  'quatre-crans-facture-bloquee': `<div class="wg wg-agent" aria-label="Si le paiement reste bloqué : les quatre crans, dans l'ordre">
  <p class="wg-title"><span class="wg-pulse"></span>Si le paiement reste bloqué : les quatre crans, dans l'ordre</p>
  <p class="wg-hint">Touchez chaque cran pour voir quoi écrire, et ce qu'il coûte.</p>
  <div class="wg-step open" data-step="1">
    <button class="wg-head" type="button" aria-expanded="true"><span class="wg-day">1</span><span class="wg-name">La relance qui cite la réponse 19</span><span class="wg-chev"></span></button>
    <div class="wg-body"><p>Par courriel, en gardant la trace. Reprenez le message donné plus haut, joignez le guide pratique de démarrage de la DGFiP, et rappelez l'échéance convenue. C'est le seul cran qui ne coûte rien à la relation commerciale. Commencez toujours par lui, y compris quand le blocage vous paraît de mauvaise foi : beaucoup de notes de service ont été écrites sans avoir lu la réponse 19.</p></div>
  </div>
  <div class="wg-step open" data-step="2">
    <button class="wg-head" type="button" aria-expanded="true"><span class="wg-day">2</span><span class="wg-name">La mise en demeure chiffrée</span><span class="wg-chev"></span></button>
    <div class="wg-body"><p>En recommandé avec accusé de réception. Rappelez le délai convenu, puis les deux montants qui courent. Les pénalités de retard d'abord : le II de l'article L441-10 du code de commerce précise qu'elles sont exigibles sans qu'un rappel soit nécessaire, au taux convenu ou, à défaut, au taux de refinancement de la Banque centrale européenne majoré de dix points. L'indemnité forfaitaire de quarante euros pour frais de recouvrement ensuite, due par facture en retard et sans justificatif, fixée par l'article D441-5. Ce cran a un coût commercial réel : prenez-le en connaissance de cause.</p></div>
  </div>
  <div class="wg-step open" data-step="3">
    <button class="wg-head" type="button" aria-expanded="true"><span class="wg-day">3</span><span class="wg-name">Le Médiateur des entreprises, ou la répression des fraudes</span><span class="wg-chev"></span></button>
    <div class="wg-body"><p>La saisine du Médiateur des entreprises est gratuite et se fait en ligne sur economie.gouv.fr. Elle est confidentielle, et c'est son intérêt principal quand vous comptez continuer à travailler avec ce client. En parallèle, un manquement aux délais de paiement peut être signalé à la répression des fraudes, qui prononce des amendes administratives publiées, au titre de l'article L441-16 du code de commerce. Nous ne pouvons vous promettre aucun délai : ces deux voies servent surtout quand la relance et la mise en demeure sont restées sans effet.</p></div>
  </div>
  <div class="wg-step open" data-step="4">
    <button class="wg-head" type="button" aria-expanded="true"><span class="wg-day">4</span><span class="wg-name">Le juge, quand la créance n'est pas contestée</span><span class="wg-chev"></span></button>
    <div class="wg-body"><p>Deux procédures existent lorsque l'obligation de payer n'est pas sérieusement contestable : l'injonction de payer, rapide et sans débat contradictoire au départ, aux articles 1405 et suivants du code de procédure civile, et le référé-provision devant le président du tribunal de commerce, à l'article 873 alinéa 2 du même code. À examiner avec votre conseil, en pesant le montant en jeu, les frais engagés et ce qu'il reste de la relation commerciale.</p></div>
  </div>
</div>`,
  'preuves-trajectoire-conformite': `<div class="wg wg-check" aria-label="Ce que vous pourriez montrer si l'administration vous appelle">
  <p class="wg-title"><span class="wg-pulse"></span>Ce que vous pourriez montrer si l'administration vous appelle</p>
  <p class="wg-hint">Neuf pièces, dont sept reprises de la liste de la réponse 27 du guide de la DGFiP. Ne cochez que ce que vous pouvez produire, daté.</p>
  <ul class="wgk-list">
    <li><label class="wgk-item"><input type="checkbox" class="wgk-box"><span class="wgk-txt">Je peux nommer la solution par laquelle je vais recevoir mes factures fournisseurs : logiciel de gestion, logiciel de comptabilité, expert-comptable, banque ou prestataire.</span></label></li>
    <li><label class="wgk-item"><input type="checkbox" class="wgk-box"><span class="wgk-txt">J'ai vérifié, et pas seulement supposé, que cette solution passe bien par une plateforme agréée.</span></label></li>
    <li><label class="wgk-item"><input type="checkbox" class="wgk-box"><span class="wgk-txt">Un contrat, un devis, une souscription ou une confirmation d'ouverture de compte existe à mon nom chez une plateforme agréée.</span></label></li>
    <li><label class="wgk-item"><input type="checkbox" class="wgk-box"><span class="wgk-txt">J'ai conservé les échanges écrits avec mon éditeur, mon cabinet comptable, ma banque ou mon prestataire, avec leur date.</span></label></li>
    <li><label class="wgk-item"><input type="checkbox" class="wgk-box"><span class="wgk-txt">Une date de raccordement ou de déploiement m'a été communiquée par écrit.</span></label></li>
    <li><label class="wgk-item"><input type="checkbox" class="wgk-box"><span class="wgk-txt">Je sais lesquelles de mes factures fournisseurs arrivent déjà par voie électronique, et lesquelles arrivent encore par mail ou sur papier.</span></label></li>
    <li><label class="wgk-item"><input type="checkbox" class="wgk-box"><span class="wgk-txt">Les tests ou paramétrages réalisés ou programmés sont notés quelque part, avec leur date.</span></label></li>
    <li><label class="wgk-item"><input type="checkbox" class="wgk-box"><span class="wgk-txt">Les messages d'erreur, rejets et tickets d'assistance sont conservés plutôt que supprimés.</span></label></li>
    <li><label class="wgk-item"><input type="checkbox" class="wgk-box"><span class="wgk-txt">La consigne donnée à l'équipe est écrite et datée : qui ouvre la boîte de réception, quel jour, et que fait-on d'une facture reçue deux fois.</span></label></li>
  </ul>
  <div class="wgk-bar"><span></span></div>
  <div class="wgk-result">
    <p class="wgk-score"><strong class="wgk-n">0</strong> / 9 pièces disponibles</p>
    <p class="wgk-verdict wgk-v">Cochez les cases ci-dessus pour savoir ce que vous pourriez produire aujourd'hui.</p>
  </div>
  <div class="wgk-bands" hidden>
    <span class="wgk-band" data-min="0" data-max="2">Vous n'avez pas encore de trace. C'est le seul point à traiter cette semaine, et il ne demande aucune décision technique : un courriel à votre éditeur ou à votre cabinet comptable, demandant par quelle plateforme agréée vous allez recevoir vos factures. Envoyé aujourd'hui, il coche la case 4 immédiatement, puis les cases 1 et 2 dès que la réponse arrive.</span>
    <span class="wgk-band" data-min="3" data-max="5">La démarche est engagée et vous pourriez le montrer, mais rien ne dit encore quand elle aboutit. Réclamez une date écrite à votre prestataire, c'est la case 5, et notez le jour de votre demande. Une réponse qui tarde se documente aussi : la relance vaut preuve.</span>
    <span class="wgk-band" data-min="6" data-max="8">Votre dossier tient debout. Ce qui manque relève de l'organisation interne plutôt que du raccordement : la consigne à l'équipe, les tickets conservés, le tri entre les factures qui arrivent déjà par plateforme et les autres. C'est aussi ce qui vous évitera de payer deux fois la même facture cet automne.</span>
    <span class="wgk-band" data-min="9" data-max="9">Vous pouvez répondre pièces à l'appui, et pas de mémoire. Rangez ces éléments au même endroit que vos pièces comptables, et redatez-les à chaque étape franchie : la trajectoire se juge sur sa continuité, pas sur un instantané.</span>
  </div>
</div>`,
  'quatre-questions-chiffre-ia': `<div class="wg wg-agent" aria-label="Les quatre questions à poser devant un chiffre sur l'IA">
  <p class="wg-title"><span class="wg-pulse"></span>Devant un chiffre sur l'IA, quatre questions</p>
  <p class="wg-hint">Touchez chaque question. Elles se posent en trente secondes, sur n'importe quelle étude.</p>
  <div class="wg-step open" data-step="1">
    <button class="wg-head" type="button" aria-expanded="true"><span class="wg-day">Q1</span><span class="wg-name">Qui a répondu, et qui a décidé de répondre ?</span><span class="wg-chev"></span></button>
    <div class="wg-body"><p>Dans un sondage, l'institut choisit qui il interroge et insiste auprès de ceux qui n'ont pas envie de parler. Dans une consultation ouverte, les répondants se présentent d'eux-mêmes. Cherchez le mot « échantillon » : s'il est absent, la phrase « X pour cent des TPE françaises » n'est pas permise.</p></div>
  </div>
  <div class="wg-step open" data-step="2">
    <button class="wg-head" type="button" aria-expanded="true"><span class="wg-day">Q2</span><span class="wg-name">Le pourcentage porte sur quoi, exactement ?</span><span class="wg-chev"></span></button>
    <div class="wg-body"><p>Sur les répondants, ou sur la population ? Un pourcentage peut ne désigner que les votes exprimés sur une seule proposition, par les seuls participants qui l'ont vue passer. C'est très loin d'un pourcentage d'entrepreneurs français, et rien ne le signale au lecteur.</p></div>
  </div>
  <div class="wg-step open" data-step="3">
    <button class="wg-head" type="button" aria-expanded="true"><span class="wg-day">Q3</span><span class="wg-name">De quelle étude parle-t-on, au juste ?</span><span class="wg-chev"></span></button>
    <div class="wg-body"><p>Plusieurs travaux vont circuler cet automne sous la même signature. La consultation ouverte fermée le 7 septembre 2026, le 82e baromètre Bpifrance Le Lab publié le 13 janvier 2026 sur 4 722 réponses exploitées et redressées, et l'étude Bpifrance Le Lab de 1 209 dirigeants publiée le 17 juin 2025, qui porte sur les PME et les ETI et non sur les TPE. Demandez laquelle avant de discuter du chiffre.</p></div>
  </div>
  <div class="wg-step open" data-step="4">
    <button class="wg-head" type="button" aria-expanded="true"><span class="wg-day">Q4</span><span class="wg-name">Qui a commandé l'étude, et que vend-on au bout ?</span><span class="wg-chev"></span></button>
    <div class="wg-body"><p>L'enquête qui ferme lundi comporte une question sur la connaissance des dispositifs d'accompagnement de ses propres commanditaires. C'est légitime pour piloter une offre publique, et cela se sait avant de lire les résultats. Posez la même question à tout prestataire qui vous présente un chiffre.</p></div>
  </div>
</div>`,
  'questions-prestataire-ia': `<div class="wg wg-agent" aria-label="Les quatre questions à poser à tout prestataire IA avant de signer">
  <p class="wg-title"><span class="wg-pulse"></span>Les 4 questions à poser avant de signer</p>
  <p class="wg-hint">Touchez chaque question. Un prestataire sérieux y répond sans détour.</p>
  <div class="wg-step open" data-step="1">
    <button class="wg-head" type="button" aria-expanded="true"><span class="wg-day">Q1</span><span class="wg-name">Que se passe-t-il si nous arrêtons ?</span><span class="wg-chev"></span></button>
    <div class="wg-body"><p>Vous devez rester propriétaire de ce qui est installé, avec la documentation pour continuer sans le prestataire. Sinon, vous louez une boîte noire.</p></div>
  </div>
  <div class="wg-step open" data-step="2">
    <button class="wg-head" type="button" aria-expanded="true"><span class="wg-day">Q2</span><span class="wg-name">Sur quels outils cela fonctionne-t-il ?</span><span class="wg-chev"></span></button>
    <div class="wg-body"><p>La bonne réponse part de vos outils actuels, sans migration imposée. Méfiance si tout commence par un changement de logiciel.</p></div>
  </div>
  <div class="wg-step open" data-step="3">
    <button class="wg-head" type="button" aria-expanded="true"><span class="wg-day">Q3</span><span class="wg-name">Qui forme l'équipe, et sur quoi ?</span><span class="wg-chev"></span></button>
    <div class="wg-body"><p>Sur vos cas réels, pas sur un support générique. Un outil que l'équipe ne maîtrise pas finit abandonné.</p></div>
  </div>
  <div class="wg-step open" data-step="4">
    <button class="wg-head" type="button" aria-expanded="true"><span class="wg-day">Q4</span><span class="wg-name">Comment mesure-t-on le gain ?</span><span class="wg-chev"></span></button>
    <div class="wg-body"><p>Un chiffre avant, un chiffre après, comparés à trente jours. Sans mesure, pas de décision.</p></div>
  </div>
</div>`,
  'checklist-fiche-google': `<div class="wg wg-check" aria-label="Auto-diagnostic : votre fiche Google est-elle complète ?">
  <p class="wg-title"><span class="wg-pulse"></span>Votre fiche est-elle complète ?</p>
  <p class="wg-hint">Ouvrez votre fiche et cochez ce qui est déjà en place.</p>
  <ul class="wgk-list">
    <li><label class="wgk-item"><input type="checkbox" class="wgk-box"><span class="wgk-txt">Mon nom commercial est exact, sans mots-clés ajoutés.</span></label></li>
    <li><label class="wgk-item"><input type="checkbox" class="wgk-box"><span class="wgk-txt">Ma catégorie principale dit mon métier, pas mon secteur.</span></label></li>
    <li><label class="wgk-item"><input type="checkbox" class="wgk-box"><span class="wgk-txt">Ma zone desservie correspond à mes interventions réelles.</span></label></li>
    <li><label class="wgk-item"><input type="checkbox" class="wgk-box"><span class="wgk-txt">Mes horaires sont à jour, congés compris.</span></label></li>
    <li><label class="wgk-item"><input type="checkbox" class="wgk-box"><span class="wgk-txt">Mon numéro et mon site sont ceux de mes devis.</span></label></li>
    <li><label class="wgk-item"><input type="checkbox" class="wgk-box"><span class="wgk-txt">J'ai au moins cinq photos récentes : chantiers, visage, véhicule.</span></label></li>
    <li><label class="wgk-item"><input type="checkbox" class="wgk-box"><span class="wgk-txt">Ma description dit ce que je fais, où et pour qui.</span></label></li>
  </ul>
  <div class="wgk-bar"><span></span></div>
  <div class="wgk-result">
    <p class="wgk-score"><strong class="wgk-n">0</strong> / 7 champs en place</p>
    <p class="wgk-verdict wgk-v">Cochez les cases ci-dessus pour situer votre fiche.</p>
  </div>
  <div class="wgk-bands" hidden>
    <span class="wgk-band" data-min="0" data-max="2">Votre fiche existe, mais elle ne travaille pas encore pour vous. Une fiche complète et exacte a plus de chances d'apparaître parmi les trois fiches affichées sur la carte. Comptez une heure pour tout reprendre, en commençant par le nom, la catégorie et les horaires.</span>
    <span class="wgk-band" data-min="3" data-max="4">La base est posée. Les champs qui manquent sont souvent ceux qui rassurent le plus : les photos réelles et la description. Comptez une demi-heure pour la description, et votre prochain chantier pour les photos.</span>
    <span class="wgk-band" data-min="5" data-max="6">Fiche solide. Terminez les derniers champs, puis passez aux avis : demandez-en un après chaque intervention réussie.</span>
    <span class="wgk-band" data-min="7" data-max="7">Votre fiche est complète. Le travail porte maintenant sur les avis : en obtenir régulièrement, et répondre à chacun, y compris aux mauvais.</span>
  </div>
</div>`,
};

// ── Markdown minimal (suffisant pour des articles rédigés à la main) ──

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function mdToHtml(md) {
  // Blocs de code ``` mis de côté avant tout traitement
  const fences = [];
  let src = md.replace(/```([^\n]*)\n([\s\S]*?)```/g, (_, _lang, code) => {
    fences.push(`<pre><code>${escapeHtml(code.replace(/\s+$/, ''))}</code></pre>`);
    return `\u0000FENCE${fences.length - 1}\u0000`;
  });

  // Widgets : la ligne ::widget nom:: devient un bloc HTML protégé
  src = src.replace(/^::widget ([a-z0-9-]+)::$/gm, (_, name) => {
    if (!ARTICLE_WIDGETS[name]) throw new Error(`Widget inconnu : ${name} (disponibles : ${Object.keys(ARTICLE_WIDGETS).join(', ')})`);
    fences.push(ARTICLE_WIDGETS[name]);
    return `\u0000FENCE${fences.length - 1}\u0000`;
  });

  src = escapeHtml(src);

  // Inline
  src = src
    .replace(/`([^`\n]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*\n]+)\*/g, '<em>$1</em>')
    .replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, '<img src="$2" alt="$1" loading="lazy">')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2">$1</a>');

  const out = [];
  let list = null; // 'ul' | 'ol'
  const closeList = () => { if (list) { out.push(`</${list}>`); list = null; } };

  for (const block of src.split(/\n{2,}/)) {
    const lines = block.split('\n').map((l) => l.trimEnd()).filter((l) => l.trim() !== '');
    if (!lines.length) continue;

    const first = lines[0].trim();

    if (/^\u0000FENCE\d+\u0000$/.test(first)) { closeList(); out.push(first); continue; }
    if (/^###\s/.test(first)) { closeList(); out.push(`<h3>${first.replace(/^###\s+/, '')}</h3>`); continue; }
    if (/^##\s/.test(first)) { closeList(); out.push(`<h2>${first.replace(/^##\s+/, '')}</h2>`); continue; }
    if (/^#\s/.test(first)) { closeList(); out.push(`<h2>${first.replace(/^#\s+/, '')}</h2>`); continue; }
    if (/^&gt;\s?/.test(first)) {
      closeList();
      out.push(`<blockquote><p>${lines.map((l) => l.replace(/^&gt;\s?/, '')).join(' ')}</p></blockquote>`);
      continue;
    }
    if (lines.every((l) => /^[-*]\s+/.test(l.trim()))) {
      closeList(); out.push('<ul>');
      for (const l of lines) out.push(`<li>${l.trim().replace(/^[-*]\s+/, '')}</li>`);
      out.push('</ul>');
      continue;
    }
    if (lines.every((l) => /^\d+\.\s+/.test(l.trim()))) {
      closeList(); out.push('<ol>');
      for (const l of lines) out.push(`<li>${l.trim().replace(/^\d+\.\s+/, '')}</li>`);
      out.push('</ol>');
      continue;
    }
    closeList();
    out.push(`<p>${lines.join('<br>')}</p>`);
  }
  closeList();

  return out.join('\n').replace(/\u0000FENCE(\d+)\u0000/g, (_, i) => fences[Number(i)])
    // Les articles vivent sous /blog/ : les images du contenu passent en absolu
    .replace(/src="assets\//g, 'src="/assets/');
}

// ── Rendu ──

function escAttr(s) {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function render(template, map) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    if (!(key in map)) throw new Error(`Placeholder inconnu dans le template : {{${key}}}`);
    return map[key];
  });
}

function formatDateFr(iso) {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString('fr-FR', {
    year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC',
  });
}

function breadcrumbLd(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem', position: i + 1, name: it.name, item: it.url,
    })),
  };
}

function buildArticle(article, template) {
  const { meta, html } = article;
  const canonical = `${SITE}/blog/${meta.slug}`;
  const articleLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: meta.title,
    description: meta.description,
    datePublished: meta.date,
    url: canonical,
    mainEntityOfPage: canonical,
    author: {
      '@type': 'Person',
      name: meta.auteur || 'Mateusz Myja',
      jobTitle: 'Cofondateur, ACE Conseil',
      worksFor: { '@type': 'Organization', name: 'ACE Conseil', url: SITE },
    },
    publisher: { '@type': 'Organization', name: 'ACE Conseil', url: SITE },
  };
  // dateModified n'est posee que lorsqu'un article a reellement ete corrige,
  // via le champ `updated:` du front-matter. Jamais automatiquement.
  if (meta.updated) articleLd.dateModified = meta.updated;
  if (meta.keywords) articleLd.keywords = meta.keywords;
  if (meta.ville) articleLd.contentLocation = { '@type': 'Place', name: meta.ville };
  const jsonLd = [articleLd, breadcrumbLd([
    { name: 'Accueil', url: `${SITE}/` },
    { name: 'Blog', url: `${SITE}/blog` },
    { name: meta.title, url: canonical },
  ])];

  return render(template, {
    TITLE: escAttr(meta.title),
    DESCRIPTION: escAttr(meta.description),
    KEYWORDS: escAttr(meta.keywords || ''),
    CANONICAL: canonical,
    DATE_ISO: meta.date,
    DATE_FR: formatDateFr(meta.date),
    CONTENT: html,
    JSONLD: JSON.stringify(jsonLd),
  });
}

// Signatures animées : un effet distinct par page pilier, injecté selon le slug.
// CSS/JS porté par templates/page.html ; sans JS ou en mouvement réduit,
// chaque effet retombe sur un état statique complet.
const PAGE_FX = {
  'agents-ia': `<div class="fx" aria-hidden="true">
  <p class="fx-title"><span class="fx-live"></span>L'agent en action</p>
  <div class="fx-msg fx-in"><strong>Client · 22 h 41</strong>Bonjour, vous intervenez à Lagny pour une réfection de toiture ?</div>
  <div class="fx-msg fx-out"><strong>Votre agent · 22 h 42</strong><span class="fx-typing">Bonjour ! Oui, nous intervenons à Lagny. Pour préparer votre devis : quelle surface approximative, et quel type de couverture ?</span><span class="fx-caret"></span></div>
  <p class="fx-note">Réponse rédigée et envoyée en votre nom, selon vos règles.</p>
</div>`,
  'automatisation': `<div class="fx" aria-hidden="true">
  <p class="fx-title"><span class="fx-live"></span>L'information circule seule</p>
  <div class="fx-node n1">Devis accepté</div>
  <div class="fx-pipe p1"><span></span></div>
  <div class="fx-node n2">Facture créée</div>
  <div class="fx-pipe p2"><span></span></div>
  <div class="fx-node n3">Relance programmée</div>
  <p class="fx-note">Zéro ressaisie entre vos outils.</p>
</div>`,
  'formation-ia': `<div class="fx" aria-hidden="true">
  <p class="fx-title"><span class="fx-live"></span>Votre équipe repart avec</p>
  <div class="fx-ck done">Prompts métier testés en séance</div>
  <div class="fx-ck done">Procédures écrites, pas à pas</div>
  <div class="fx-ck done">Limites claires : quoi confier, quoi vérifier</div>
  <div class="fx-ck done">Plan d'adoption pour l'équipe</div>
  <p class="fx-note">Mesuré au lundi suivant, pas à l'applaudimètre.</p>
</div>`,
  'sites-web': `<div class="fx" aria-hidden="true">
  <p class="fx-title"><span class="fx-live"></span>Votre site prend forme</p>
  <div class="fx-browser"><span></span><span></span><span></span></div>
  <div class="fx-canvas">
    <div class="fx-sk sk1"></div>
    <div class="fx-sk sk2"></div>
    <div class="fx-sk sk3"></div>
    <div class="fx-sk sk4"></div>
    <div class="fx-btn">Appeler</div>
  </div>
  <p class="fx-note">Construit pour faire sonner le téléphone.</p>
</div>`,
  'visibilite-prospection': `<div class="fx" aria-hidden="true">
  <p class="fx-title"><span class="fx-live"></span>Votre zone, vos clients</p>
  <div class="fx-radar-zone">
    <span class="fx-center"></span>
    <span class="fx-ring r1"></span><span class="fx-ring r2"></span><span class="fx-ring r3"></span>
    <span class="fx-spot s1"></span><span class="fx-spot s2"></span><span class="fx-spot s3"></span><span class="fx-spot s4"></span>
  </div>
  <p class="fx-note">Être trouvé au bon endroit, au bon moment.</p>
</div>`,
  'strategie-commerciale': `<div class="fx" aria-hidden="true">
  <p class="fx-title"><span class="fx-live"></span>Le système qui monte</p>
  <div class="fx-bargroup">
    <div class="fx-bar" style="--h:34%"><i></i><em>Offre claire</em></div>
    <div class="fx-bar" style="--h:58%"><i></i><em>Prix défendu</em></div>
    <div class="fx-bar" style="--h:78%"><i></i><em>Suivi tenu</em></div>
    <div class="fx-bar" style="--h:96%"><i></i><em>Signatures</em></div>
  </div>
</div>`,
  'amo-immobilier': `<div class="fx" aria-hidden="true">
  <p class="fx-title"><span class="fx-live"></span>Vos intérêts, à chaque étape</p>
  <div class="fx-tl-wrap">
    <span class="fx-tl-bar"><i></i></span>
    <div class="fx-tl-step t1">Travaux modificatifs</div>
    <div class="fx-tl-step t2">Visite cloisons</div>
    <div class="fx-tl-step t3">Pré-livraison</div>
    <div class="fx-tl-step t4">Livraison</div>
    <div class="fx-tl-step t5">Réserves levées</div>
  </div>
</div>`,
};

function buildPage(page, template) {
  const { meta, html } = page;
  const canonical = `${SITE}/${meta.slug}`;
  const serviceLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: meta.title,
    description: meta.description,
    url: canonical,
    areaServed: 'FR',
    provider: { '@type': 'Organization', name: 'ACE Conseil', url: SITE, telephone: '+33665704793' },
  };
  const jsonLd = [serviceLd, breadcrumbLd([
    { name: 'Accueil', url: `${SITE}/` },
    { name: meta.title, url: canonical },
  ])];

  const fx = PAGE_FX[meta.slug] || '';
  return render(template, {
    TITLE: escAttr(meta.title),
    DESCRIPTION: escAttr(meta.description),
    KEYWORDS: escAttr(meta.keywords || ''),
    CANONICAL: canonical,
    EYEBROW: escAttr(meta.eyebrow || 'Expertise ACE Conseil'),
    LEDE: escAttr(meta.lede || meta.description),
    FX: fx,
    FX_CLASS: fx ? ' has-fx' : '',
    CONTENT: html,
    JSONLD: JSON.stringify(jsonLd),
  });
}

function rfc822(iso) {
  return new Date(`${iso}T12:00:00Z`).toUTCString();
}

function escXml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function buildRss(articles) {
  const items = articles.map((a) => `    <item>
      <title>${escXml(a.meta.title)}</title>
      <link>${SITE}/blog/${a.meta.slug}</link>
      <guid isPermaLink="true">${SITE}/blog/${a.meta.slug}</guid>
      <pubDate>${rfc822(a.meta.date)}</pubDate>
      <description>${escXml(a.meta.description)}</description>
    </item>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Blog ACE Conseil</title>
    <link>${SITE}/blog</link>
    <description>Conseils concrets pour TPE, artisans et PME : intelligence artificielle, automatisation, visibilité et stratégie commerciale.</description>
    <language>fr</language>
${items}
  </channel>
</rss>
`;
}

function buildBlogIndex(articles) {
  const cards = articles.map((a) => `
      <a class="card" href="/blog/${a.meta.slug}">
        <p class="card-date"><time datetime="${a.meta.date}">${formatDateFr(a.meta.date)}</time></p>
        <h2>${escAttr(a.meta.title)}</h2>
        <p class="card-desc">${escAttr(a.meta.description)}</p>
        <span class="card-more">Lire l'article <span>→</span></span>
      </a>`).join('\n');

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Blog · ACE Conseil</title>
<meta name="description" content="Conseils concrets pour TPE, artisans et PME : intelligence artificielle, automatisation, visibilité et stratégie commerciale.">
<meta name="robots" content="index, follow, max-image-preview:large">
<link rel="canonical" href="${SITE}/blog">
<meta property="og:type" content="website">
<meta property="og:title" content="Blog · ACE Conseil">
<meta property="og:description" content="Conseils concrets pour TPE, artisans et PME : intelligence artificielle, automatisation, visibilité et stratégie commerciale.">
<meta property="og:url" content="${SITE}/blog">
<meta property="og:image" content="${SITE}/og-image.png">
<link rel="alternate" type="application/rss+xml" title="Blog ACE Conseil" href="${SITE}/blog/feed.xml">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='12' fill='%231B2A4A'/%3E%3Ctext x='32' y='44' font-family='Georgia,serif' font-size='34' font-weight='700' fill='%23C9A24D' text-anchor='middle'%3EA%3C/text%3E%3C/svg%3E">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap" rel="stylesheet">
<style>
:root{--navy:#1B2A4A;--navy-deep:#111D33;--gold:#C9A24D;--gold-light:#E2C47A;--cream:#FEFDFB;--muted:#7A8499;--muted-light:#A8B0C0;--border:rgba(27,42,74,.1);--border-gold:rgba(201,162,77,.22)}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'DM Sans',sans-serif;font-weight:300;background:var(--cream);color:var(--navy);line-height:1.7;-webkit-font-smoothing:antialiased}
::selection{background:var(--gold);color:var(--navy-deep)}
a{color:inherit}
.wrap{width:min(1180px,92%);margin:0 auto}
.nav{background:var(--navy-deep);height:76px;display:flex;align-items:center}
.nav .wrap{display:flex;align-items:center;justify-content:space-between;gap:24px}
.logo{display:flex;align-items:baseline;gap:10px;text-decoration:none;color:var(--cream)}
.logo-ace{font-family:'Playfair Display',serif;font-weight:700;font-size:1.5rem;letter-spacing:.02em}
.logo-sep{width:1px;height:20px;background:var(--gold);align-self:center}
.logo-conseil{font-size:.72rem;font-weight:500;letter-spacing:.34em;text-transform:uppercase;color:var(--gold)}
.nav-back{font-size:.88rem;color:var(--muted-light);text-decoration:none;transition:color .3s}
.nav-back:hover{color:var(--gold-light)}
.head{background:var(--navy-deep);color:var(--cream);padding:clamp(56px,7vw,90px) 0}
.eyebrow{font-size:12px;font-weight:500;letter-spacing:.24em;text-transform:uppercase;color:var(--gold);display:flex;align-items:center;gap:14px}
.eyebrow::before{content:"";width:34px;height:1px;background:var(--gold)}
h1{font-family:'Playfair Display',Georgia,serif;font-weight:600;font-size:clamp(2.1rem,4.4vw,3.2rem);margin:22px 0 0}
.head p.lede{max-width:52ch;color:var(--muted-light);margin-top:16px}
.list{padding:clamp(56px,7vw,90px) 0 clamp(80px,10vw,120px);display:grid;gap:0;max-width:820px}
.card{display:block;text-decoration:none;padding:34px 0;border-bottom:1px solid var(--border)}
.card-date{font-size:.8rem;letter-spacing:.14em;text-transform:uppercase;color:var(--muted)}
.card h2{font-family:'Playfair Display',Georgia,serif;font-weight:600;font-size:1.5rem;line-height:1.25;margin:10px 0;transition:color .3s}
.card:hover h2{color:var(--gold)}
.card-desc{color:var(--muted);max-width:62ch}
.card-more{display:inline-flex;gap:9px;margin-top:14px;font-size:.9rem;font-weight:500;color:var(--gold)}
.footer{background:var(--navy-deep);color:var(--muted-light);border-top:1px solid rgba(201,162,77,.14);padding:44px 0}
.footer .wrap{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:20px}
.footer-legal{font-size:.82rem}
.footer-links{display:flex;gap:26px;font-size:.85rem}
.footer-links a{text-decoration:none;color:var(--muted-light);transition:color .3s}
.footer-links a:hover{color:var(--gold-light)}
</style>
</head>
<body>
<nav class="nav">
  <div class="wrap">
    <a class="logo" href="/" aria-label="ACE Conseil, retour à l'accueil">
      <span class="logo-ace">ACE</span><span class="logo-sep"></span><span class="logo-conseil">Conseil</span>
    </a>
    <a class="nav-back" href="/">← Retour à l'accueil</a>
  </div>
</nav>
<header class="head">
  <div class="wrap">
    <p class="eyebrow">Blog</p>
    <h1>Conseils concrets, sans jargon.</h1>
    <p class="lede">Intelligence artificielle, automatisation, visibilité et stratégie commerciale, appliquées aux TPE, artisans et PME.</p>
  </div>
</header>
<main class="wrap">
  <div class="list">
${cards}
  </div>
</main>
<footer class="footer">
  <div class="wrap">
    <a class="logo" href="/" aria-label="ACE Conseil">
      <span class="logo-ace" style="font-size:1.15rem">ACE</span><span class="logo-sep" style="height:15px"></span><span class="logo-conseil" style="font-size:.62rem">Conseil</span>
    </a>
    <p class="footer-legal">ACE Conseil SAS · SIRET 999&nbsp;417&nbsp;967&nbsp;00018 · Marne-la-Vallée · © 2026</p>
    <nav class="footer-links">
      <a href="/blog">Blog</a>
      <a href="tel:+33665704793" data-tel-reveal aria-label="Afficher le numéro puis appeler"><span class="tel-label">Appeler</span></a>
      <a href="mailto:contact@aceconseil.co">contact@aceconseil.co</a>
      <a href="/mentions-legales">Mentions légales</a>
    </nav>
  </div>
</footer>
<script>
/* Le numéro n'apparaît qu'au clic ; sans JavaScript le lien appelle directement. */
(function(){
  document.querySelectorAll("[data-tel-reveal]").forEach(function(a){
    a.addEventListener("click", function(ev){
      if(a.getAttribute("data-revealed")){ return; }
      ev.preventDefault();
      a.setAttribute("data-revealed","1");
      var t = a.querySelector(".tel-label") || a;
      var d = a.getAttribute("data-tel-reveal") || "06 65 70 47 93";
      t.textContent = d.replace(/ /g, "\\u00A0");
      a.setAttribute("aria-label", "Appeler le " + d);
    });
  });
})();
</script>
</body>
</html>
`;
}

function buildSitemap(articles, pages) {
  const today = new Date().toISOString().slice(0, 10);
  const urls = [
    { loc: `${SITE}/`, lastmod: today },
    { loc: `${SITE}/mentions-legales`, lastmod: today },
  ];
  for (const p of pages) urls.push({ loc: `${SITE}/${p.meta.slug}`, lastmod: p.meta.date || today });
  if (articles.length > 0) {
    urls.push({ loc: `${SITE}/blog`, lastmod: articles[0].meta.date });
    for (const a of articles) urls.push({ loc: `${SITE}/blog/${a.meta.slug}`, lastmod: a.meta.date });
  }
  const body = urls.map((u) => `  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${u.lastmod}</lastmod>\n  </url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}

// ── Main ──

function main() {
  console.log('🏗️  Build ACE Conseil');

  // 1. Lecture des articles
  const articles = [];
  if (fs.existsSync(CONTENT_DIR)) {
    const files = fs.readdirSync(CONTENT_DIR)
      .filter((f) => f.endsWith('.md') && !f.startsWith('_'))
      .sort();
    for (const file of files) {
      const raw = fs.readFileSync(path.join(CONTENT_DIR, file), 'utf8');
      const { meta, body } = parseFrontMatter(raw, file);
      validateMeta(meta, file);
      articles.push({ file, meta, html: mdToHtml(body.trim()) });
    }
  }
  articles.sort((a, b) => (a.meta.date < b.meta.date ? 1 : a.meta.date > b.meta.date ? -1 : a.file < b.file ? 1 : -1));
  const slugs = new Set();
  for (const a of articles) {
    if (slugs.has(a.meta.slug)) throw new Error(`Slug en double : ${a.meta.slug}`);
    slugs.add(a.meta.slug);
  }

  // 1 bis. Lecture des pages dédiées (piliers SEO)
  const pages = [];
  if (fs.existsSync(PAGES_DIR)) {
    const files = fs.readdirSync(PAGES_DIR)
      .filter((f) => f.endsWith('.md') && !f.startsWith('_'))
      .sort();
    for (const file of files) {
      const raw = fs.readFileSync(path.join(PAGES_DIR, file), 'utf8');
      const { meta, body } = parseFrontMatter(raw, file);
      validatePageMeta(meta, file);
      pages.push({ file, meta, html: mdToHtml(body.trim()) });
    }
  }
  const pageSlugs = new Set();
  for (const p of pages) {
    if (pageSlugs.has(p.meta.slug)) throw new Error(`Slug de page en double : ${p.meta.slug}`);
    pageSlugs.add(p.meta.slug);
  }

  // 2. Dossier de sortie
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });

  // 3. Pages statiques
  for (const file of STATIC_FILES) {
    const src = path.join(ROOT, file);
    if (!fs.existsSync(src)) throw new Error(`Fichier statique manquant : ${file}`);
    fs.copyFileSync(src, path.join(OUT, file));
  }
  console.log(`   → ${STATIC_FILES.length} fichiers statiques copiés dans public/`);

  // 3 bis. Assets (photos, images)
  const assetsDir = path.join(ROOT, 'assets');
  if (fs.existsSync(assetsDir)) {
    fs.mkdirSync(path.join(OUT, 'assets'), { recursive: true });
    let nb = 0;
    for (const f of fs.readdirSync(assetsDir)) {
      if (f.startsWith('.')) continue;
      fs.copyFileSync(path.join(assetsDir, f), path.join(OUT, 'assets', f));
      nb++;
    }
    console.log(`   → ${nb} asset${nb > 1 ? 's' : ''} copié${nb > 1 ? 's' : ''} dans public/assets/`);
  }

  // 4. Pages dédiées (piliers SEO)
  // Deux sorties : public/ (déployée, liens propres /slug) et la racine du
  // repo (aperçu local type fichier : liens réécrits en relatif slug.html,
  // même principe que sitemap.xml). En prod, seuls les fichiers de public/
  // sont servis ; Vercel redirige de toute façon slug.html vers /slug.
  if (pages.length > 0) {
    const pageTemplate = fs.readFileSync(PAGE_TEMPLATE_FILE, 'utf8');
    const slugSet = pages.map((p) => p.meta.slug);
    const versAperçu = (html) => {
      let out = html;
      for (const s of slugSet) out = out.split(`href="/${s}"`).join(`href="${s}.html"`);
      out = out.split('href="/mentions-legales"').join('href="mentions-legales.html"');
      out = out.split('href="/#').join('href="index.html#');
      out = out.split('href="/"').join('href="index.html"');
      out = out.split('src="/assets/').join('src="assets/');
      return out;
    };
    for (const p of pages) {
      let html = buildPage(p, pageTemplate);
      // Pas d'articles publiés : ne pas annoncer un flux RSS qui n'existe pas
      if (articles.length === 0) html = html.replace(/^.*rel="alternate".*feed\.xml.*\n/m, '');
      fs.writeFileSync(path.join(OUT, `${p.meta.slug}.html`), html, 'utf8');
      fs.writeFileSync(path.join(ROOT, `${p.meta.slug}.html`), versAperçu(html), 'utf8');
      console.log(`   ✅ ${p.meta.slug}.html (public/ + racine pour aperçu)`);
    }
  } else {
    console.log('   → 0 page dédiée (content/pages/ vide)');
  }

  // 5. Articles
  if (articles.length > 0) {
    const template = fs.readFileSync(TEMPLATE_FILE, 'utf8');
    fs.mkdirSync(path.join(OUT, 'blog'), { recursive: true });
    for (const a of articles) {
      fs.writeFileSync(path.join(OUT, 'blog', `${a.meta.slug}.html`), buildArticle(a, template), 'utf8');
      console.log(`   ✅ blog/${a.meta.slug}.html`);
    }
    fs.writeFileSync(path.join(OUT, 'blog', 'index.html'), buildBlogIndex(articles), 'utf8');
    fs.writeFileSync(path.join(OUT, 'blog', 'feed.xml'), buildRss(articles), 'utf8');
    console.log(`   ✅ blog/index.html + blog/feed.xml (${articles.length} article${articles.length > 1 ? 's' : ''})`);
  } else {
    console.log('   → 0 article publié : /blog non généré (lien nav en commentaire)');
  }

  // 6. Sitemap (racine + public)
  const sitemap = buildSitemap(articles, pages);
  fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), sitemap, 'utf8');
  fs.writeFileSync(path.join(OUT, 'sitemap.xml'), sitemap, 'utf8');
  console.log(`   → sitemap.xml régénéré (${2 + pages.length + (articles.length ? articles.length + 1 : 0)} URLs)`);

  console.log('✅ Build terminé sans erreur.');
}

main();
