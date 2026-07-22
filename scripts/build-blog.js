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

const STATIC_FILES = ['index.html', 'mentions-legales.html', 'merci.html', 'robots.txt', 'og-image.png'];

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
    author: { '@type': 'Organization', name: 'ACE Conseil' },
    publisher: { '@type': 'Organization', name: 'ACE Conseil', url: SITE },
  };
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
