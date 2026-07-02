#!/usr/bin/env node
/**
 * prerender.js — Script de prerendering statique pour ACE Conseil
 * 
 * Ce script lit index.html (le monolithe SPA) et génère un fichier HTML
 * statique par route définie dans PAGE_SEO. Chaque page contient :
 *   - Le <head> complet avec les métadonnées SEO spécifiques à la page
 *   - Le contenu du template injecté directement dans le DOM (visible sans JS)
 *   - Tout le JS original pour que la navigation SPA continue de fonctionner
 * 
 * Usage : node prerender.js [chemin-vers-index.html]
 * Sortie : dossier ./public/ prêt à déployer sur Vercel
 */

const fs = require('fs');
const path = require('path');

// ── Configuration ──
const INPUT_FILE = process.argv[2] || path.join(__dirname, '..', 'index-2.html');
const OUTPUT_DIR = path.join(__dirname, 'public');

// ── Lecture du fichier source ──
console.log(`📄 Lecture de ${INPUT_FILE}...`);
const html = fs.readFileSync(INPUT_FILE, 'utf8');

// ── Extraction de PAGE_SEO ──
console.log('🔍 Extraction de PAGE_SEO...');
const seoMatch = html.match(/(?:var|let|const)\s+PAGE_SEO\s*=\s*\{[\s\S]*?\n\};/);
if (!seoMatch) {
  console.error('❌ Impossible de trouver PAGE_SEO dans le fichier source');
  process.exit(1);
}

// Évaluer PAGE_SEO de manière sécurisée
let PAGE_SEO;
try {
  const seoCode = seoMatch[0].replace(/(?:var|let|const)\s+PAGE_SEO\s*=\s*/, 'PAGE_SEO = ');
  const fn = new Function(`let PAGE_SEO; ${seoCode}; return PAGE_SEO;`);
  PAGE_SEO = fn();
} catch (e) {
  console.error('❌ Erreur lors du parsing de PAGE_SEO:', e.message);
  process.exit(1);
}

console.log(`   → ${Object.keys(PAGE_SEO).length} pages trouvées:`, Object.keys(PAGE_SEO).join(', '));

// ── Extraction des PAGE_TEMPLATES ──
console.log('🔍 Extraction des PAGE_TEMPLATES...');
const templateRegex = /PAGE_TEMPLATES\["([^"]+)"\]\s*=\s*`([\s\S]*?)`;/g;
const PAGE_TEMPLATES = {};
let match;
while ((match = templateRegex.exec(html)) !== null) {
  PAGE_TEMPLATES[match[1]] = match[2];
}
console.log(`   → ${Object.keys(PAGE_TEMPLATES).length} templates trouvés:`, Object.keys(PAGE_TEMPLATES).join(', '));

// ── Extraction des sections du HTML source ──
// On sépare : <head>, nav, mobile-menu, page-home, footer, cookie banner, scripts

// Extraire le <head> complet
const headMatch = html.match(/<head>([\s\S]*?)<\/head>/);
let headContent = headMatch ? headMatch[1] : '';

// ── Externalisation CSS & JS ──
console.log('📦 Externalisation CSS & JS...');
const crypto = require('crypto');

// 1. Extraire le CSS
const styleMatch = headContent.match(/<style[^>]*>([\s\S]*?)<\/style>/);
const cssContent = styleMatch ? styleMatch[1] : '';
const cssHash = crypto.createHash('md5').update(cssContent).digest('hex').slice(0, 8);
const cssFilename = `style.${cssHash}.css`;

// 2. Extraire les blocs JS du body
const bodyForScripts = html.match(/<body>([\s\S]*?)(?:<\/body>|$)/);
const bodyStr = bodyForScripts ? bodyForScripts[1] : '';
const scriptBlocks = [];
const scriptRegex = /<script>([\s\S]*?)<\/script>/g;
let scriptMatch;
while ((scriptMatch = scriptRegex.exec(bodyStr)) !== null) {
  if (scriptMatch[1].trim().length > 50) {
    scriptBlocks.push(scriptMatch[1]);
  }
}
const jsContent = scriptBlocks.join('\n\n// ═══════════════════════════════════════\n\n');
const jsHash = crypto.createHash('md5').update(jsContent).digest('hex').slice(0, 8);
const jsFilename = `app.${jsHash}.js`;

console.log(`   → ${cssFilename} (${(cssContent.length/1024).toFixed(0)} KB)`);
console.log(`   → ${jsFilename} (${(jsContent.length/1024).toFixed(0)} KB)`);

// 3. Remplacer dans le head: <style>...</style> → <link rel="stylesheet" href="/style.xxx.css">
headContent = headContent.replace(/<style[^>]*>[\s\S]*?<\/style>/, 
  `<link rel="stylesheet" href="/${cssFilename}">`);

// 4. Les fichiers seront écrits après la recréation du dossier public/
console.log('   → Fichiers prêts (écriture après reset du dossier)');

// Extraire le body content (de <body> à </body>, ou jusqu'à la fin si pas de </body>)
const bodyMatch = html.match(/<body>([\s\S]*?)(?:<\/body>|$)/);
const bodyContent = bodyMatch ? bodyMatch[1] : '';

// Extraire le skip-link (s'il existe)
const skipLinkMatch = bodyContent.match(/(<a[^>]*class="skip-link"[^>]*>.*?<\/a>)/);
const skipLinkHtml = skipLinkMatch ? skipLinkMatch[1] : '';

// Extraire la nav (avec ses attributs ARIA)
const navMatch = bodyContent.match(/(<nav[\s\S]*?<\/nav>)/);
const navHtml = navMatch ? navMatch[1] : '';

// Extraire le mobile menu
// On utilise un compteur de profondeur pour trouver la vraie fermeture
// au lieu d'un pattern </div></div></div> qui peut matcher trop loin
const mobileMenuStart = bodyContent.indexOf('<div class="mobile-menu"');
let mobileMenuHtml = '';
if (mobileMenuStart !== -1) {
  let depth = 0;
  let i = mobileMenuStart;
  let started = false;
  while (i < bodyContent.length) {
    if (bodyContent.slice(i).startsWith('<div')) {
      depth++;
      started = true;
      i += 4;
    } else if (bodyContent.slice(i).startsWith('</div>')) {
      depth--;
      i += 6;
      if (started && depth === 0) {
        mobileMenuHtml = bodyContent.slice(mobileMenuStart, i);
        break;
      }
    } else {
      i++;
    }
  }
}

// Extraire page-home (du début du wrapper jusqu'à /page-home)
const homeMatch = bodyContent.match(/(<div id="pages-wrapper"[\s\S]*?<\/div><!-- \/page-home -->)/);
const homeHtml = homeMatch ? homeMatch[1] : '';

// Extraire le page-container
const containerHtml = '  <div id="page-container"></div>\n</div><!-- /pages-wrapper -->';

// Extraire le footer (avec ses attributs ARIA)
const footerMatch = bodyContent.match(/(<footer[^>]*>[\s\S]*?<\/footer>)/);
const footerHtml = footerMatch ? footerMatch[1] : '';

// Extraire le cookie banner
const cookieBannerMatch = bodyContent.match(/(<!-- BANDEAU COOKIES -->[\s\S]*?)(?=<script|$)/);
const cookieBannerHtml = cookieBannerMatch ? cookieBannerMatch[1].trim() : '';

// Les scripts sont externalisés dans app.js
// On les remplace par une balise <script src="">
const allScripts = `<script src="/${jsFilename}" defer></script>`;

// ── Fonctions utilitaires ──

function updateHeadForPage(headHtml, pageId, seo) {
  let h = headHtml;
  
  // Remplacer le title
  h = h.replace(/<title>[^<]*<\/title>/, `<title>${seo.title}</title>`);
  
  // Remplacer meta description
  h = h.replace(
    /(<meta\s+name="description"\s+content=")[^"]*(")/,
    `$1${seo.description}$2`
  );
  
  // Remplacer canonical
  h = h.replace(
    /(<link\s+rel="canonical"\s+href=")[^"]*(")/,
    `$1https://aceconseil.co${seo.path}$2`
  );
  
  // Remplacer og:title
  h = h.replace(
    /(<meta\s+property="og:title"\s+content=")[^"]*(")/,
    `$1${seo.title}$2`
  );
  
  // Remplacer og:description
  h = h.replace(
    /(<meta\s+property="og:description"\s+content=")[^"]*(")/,
    `$1${seo.description}$2`
  );
  
  // Remplacer og:url
  h = h.replace(
    /(<meta\s+property="og:url"\s+content=")[^"]*(")/,
    `$1https://aceconseil.co${seo.path}$2`
  );
  
  // Ajouter og:image si absente
  if (!h.includes('og:image')) {
    h = h.replace(
      /(<meta\s+property="og:url"[^>]*>)/,
      `$1\n<meta property="og:image" content="https://aceconseil.co/og-image.png">\n<meta property="og:image:width" content="1200">\n<meta property="og:image:height" content="630">\n<meta property="og:image:alt" content="ACE Conseil — Plus de clients. Plus de temps.">`
    );
  }
  
  // Corriger l'ordre des preconnect (avant le CSS Google Fonts)
  // Déplacer les preconnect avant le lien fonts.googleapis.com
  h = h.replace(
    /(<link\s+href="https:\/\/fonts\.googleapis\.com\/css2[^"]*"[^>]*>)\s*(<link\s+rel="preconnect"\s+href="https:\/\/fonts\.googleapis\.com"[^>]*>)\s*(<link\s+rel="preconnect"\s+href="https:\/\/fonts\.gstatic\.com"[^>]*>)/,
    '$2\n$3\n$1'
  );
  
  return h;
}

function buildPageHtml(pageId, seo, isHome) {
  const updatedHead = updateHeadForPage(headContent, pageId, seo);
  
  let pageBody;
  
  if (isHome) {
    // Pour la homepage, le contenu est déjà dans le HTML
    pageBody = `
${skipLinkHtml}

${navHtml}

${mobileMenuHtml}

<main id="main-content">
${homeHtml}
${containerHtml}
</main>

${footerHtml}

${cookieBannerHtml}

${allScripts}`;
  } else {
    // Pour les pages internes, on injecte le template dans le DOM
    // Le page-home est caché, le template est injecté dans page-container
    const template = PAGE_TEMPLATES[pageId];
    if (!template) {
      console.warn(`   ⚠️ Pas de template pour "${pageId}", skip.`);
      return null;
    }
    
    // Modifier le home pour qu'il ne soit PAS actif
    // + retirer le H1 du home pour éviter les H1 multiples (SEO)
    const inactiveHome = homeHtml
      .replace('class="page active"', 'class="page"')
      .replace(/<h1[^>]*>[\s\S]*?<\/h1>/, '<!-- h1 retiré pour SEO (page interne) -->');
    
    // Préparer le contenu du template avec la classe active
    let activeTemplate = template
      .replace(/class="u-page-hidden"/, '')
      .replace(/class="page"/, 'class="page active"');
    
    // Si le template a un double class (bug dans le source), nettoyer
    activeTemplate = activeTemplate.replace(/class="page"\s+class="u-page-hidden"/, 'class="page active"');
    
    pageBody = `
${skipLinkHtml}

${navHtml}

${mobileMenuHtml}

<main id="main-content">
${inactiveHome}
  <div id="page-container">
    ${activeTemplate}
  </div>
</div><!-- /pages-wrapper -->
</main>

${footerHtml}

${cookieBannerHtml}

${allScripts}`;
  }
  
  return `<!DOCTYPE html>
<html lang="fr">
<head>
${updatedHead}
</head>
<body>
${pageBody}
</body>
</html>`;
}

// ── Génération des fichiers ──
console.log('\n🏗️  Génération des pages statiques...\n');

// Nettoyer/créer le dossier de sortie
if (fs.existsSync(OUTPUT_DIR)) {
  fs.rmSync(OUTPUT_DIR, { recursive: true });
}
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// Écrire les fichiers CSS et JS externalisés
fs.writeFileSync(path.join(OUTPUT_DIR, cssFilename), cssContent, 'utf8');
fs.writeFileSync(path.join(OUTPUT_DIR, jsFilename), jsContent, 'utf8');
console.log(`   → ${cssFilename} et ${jsFilename} écrits`);

const generated = [];
const skipped = [];

for (const [pageId, seo] of Object.entries(PAGE_SEO)) {
  const isHome = pageId === 'home';
  const pageHtml = buildPageHtml(pageId, seo, isHome);
  
  if (!pageHtml) {
    skipped.push(pageId);
    continue;
  }
  
  // Déterminer le chemin de sortie
  let outputPath;
  if (isHome) {
    outputPath = path.join(OUTPUT_DIR, 'index.html');
  } else {
    // Créer un dossier pour chaque route : /visibilite/index.html
    const routePath = seo.path.replace(/^\//, '');
    const dir = path.join(OUTPUT_DIR, routePath);
    fs.mkdirSync(dir, { recursive: true });
    outputPath = path.join(dir, 'index.html');
  }
  
  fs.writeFileSync(outputPath, pageHtml, 'utf8');
  const size = (Buffer.byteLength(pageHtml, 'utf8') / 1024).toFixed(1);
  console.log(`   ✅ ${pageId.padEnd(22)} → ${path.relative(OUTPUT_DIR, outputPath).padEnd(40)} (${size} Ko)`);
  generated.push(pageId);
}

// ── Génération de vercel.json ──
console.log('\n📦 Génération de vercel.json...');

const vercelConfig = {
  "cleanUrls": true,
  "trailingSlash": false,
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Content-Security-Policy", "value": "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self' https://www.google-analytics.com https://www.googletagmanager.com; frame-ancestors 'none'" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" }
      ]
    },
    {
      "source": "/style.(.*).css",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    },
    {
      "source": "/app.(.*).js",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    },
    {
      "source": "/og-image.png",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=2592000" }
      ]
    }
  ]
};

fs.writeFileSync(
  path.join(OUTPUT_DIR, 'vercel.json'),
  JSON.stringify(vercelConfig, null, 2),
  'utf8'
);

// ── Génération de robots.txt ──
console.log('🤖 Génération de robots.txt...');
fs.writeFileSync(
  path.join(OUTPUT_DIR, 'robots.txt'),
  'User-agent: *\nAllow: /\n\nSitemap: https://aceconseil.co/sitemap.xml\n',
  'utf8'
);

// ── Génération de sitemap.xml ──
console.log('🗺️  Génération de sitemap.xml...');
const sitemapPriorities = {
  home: { priority: '1.0', freq: 'weekly' },
  visibilite: { priority: '0.9', freq: 'monthly' },
  ia: { priority: '0.9', freq: 'monthly' },
  strategie: { priority: '0.9', freq: 'monthly' },
  capture: { priority: '0.9', freq: 'monthly' },
  formation: { priority: '0.8', freq: 'monthly' },
  amo: { priority: '0.8', freq: 'monthly' },
  blog: { priority: '0.8', freq: 'weekly' },
  about: { priority: '0.7', freq: 'monthly' },
  contact: { priority: '0.6', freq: 'monthly' },
  mentions: { priority: '0.2', freq: 'yearly' },
  confidentialite: { priority: '0.2', freq: 'yearly' },
};

// ── Sitemap sera généré dans la section async (avec les articles blog) ──

// ── Génération de og-image.png ──
// On copie l'image si elle existe à côté du script, sinon on crée un placeholder
const ogSrc = path.join(__dirname, 'og-image.png');
const ogDst = path.join(OUTPUT_DIR, 'og-image.png');
if (fs.existsSync(ogSrc)) {
  fs.copyFileSync(ogSrc, ogDst);
  console.log('🖼️  og-image.png copié depuis le dossier source');
} else {
  console.log('⚠️  og-image.png non trouvé à côté de prerender.js — pensez à le placer dans le dossier');
}

// ══════════════════════════════════════════════════════════
// ── BLOG AIRTABLE ──
// ══════════════════════════════════════════════════════════

const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN || '';
const AIRTABLE_BASE = process.env.AIRTABLE_BASE || 'appo1V4owmFFuDe6J';
const AIRTABLE_TABLE = process.env.AIRTABLE_TABLE || 'Blog';

async function fetchBlogArticles() {
  if (!AIRTABLE_TOKEN) {
    console.log('⚠️  AIRTABLE_TOKEN non défini — blog statique uniquement');
    return [];
  }

  console.log('\n📝 Récupération des articles depuis Airtable...');
  
  const allRecords = [];
  let offset = null;
  
  do {
    const url = new URL(`https://api.airtable.com/v0/${AIRTABLE_BASE}/${encodeURIComponent(AIRTABLE_TABLE)}`);
    url.searchParams.set('filterByFormula', '{Statut}="Publié"');
    url.searchParams.set('sort[0][field]', 'Date de publication');
    url.searchParams.set('sort[0][direction]', 'desc');
    if (offset) url.searchParams.set('offset', offset);
    
    let res;
    try {
      res = await fetch(url.toString(), {
        headers: { 'Authorization': `Bearer ${AIRTABLE_TOKEN}` }
      });
    } catch (fetchErr) {
      // Fallback: lire depuis fichier local (dev/test)
      const localFile = path.join(__dirname, 'test_articles.json');
      if (fs.existsSync(localFile)) {
        console.log('   → Fallback: lecture depuis test_articles.json');
        return JSON.parse(fs.readFileSync(localFile, 'utf8'));
      }
      console.error('   ❌ Fetch failed:', fetchErr.message);
      return [];
    }
    
    if (!res.ok) {
      console.error(`❌ Erreur Airtable: ${res.status} ${res.statusText}`);
      return [];
    }
    
    const data = await res.json();
    allRecords.push(...data.records);
    offset = data.offset || null;
  } while (offset);
  
  console.log(`   → ${allRecords.length} articles publiés trouvés`);
  return allRecords;
}

function markdownToHtml(md) {
  // Conversion Markdown simple sans dépendance externe
  let html = md;
  // Headings
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
  // Bold & italic
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  // Ordered lists
  html = html.replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>');
  // Unordered lists
  html = html.replace(/^[-*]\s+(.+)$/gm, '<li>$1</li>');
  // Wrap consecutive <li> in <ul> or <ol>
  html = html.replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul>$1</ul>');
  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  // Paragraphs (lines not already wrapped)
  html = html.replace(/^(?!<[hulo]|<li|<a)(.+)$/gm, '<p>$1</p>');
  // Clean up empty lines
  html = html.replace(/<p><\/p>/g, '');
  return html;
}

const CAT_LABELS = {
  ia: 'Automatisation IA',
  acquisition: 'Acquisition & Visibilité',
  strategie: 'Stratégie Commerciale',
  formation: 'Formation'
};

const CAT_ICONS = {
  ia: '⚡',
  acquisition: '📡',
  strategie: '📈',
  formation: '🎓'
};

function buildArticlePage(article, headTemplate) {
  const f = article.fields;
  const slug = f['Slug'] || '';
  const titre = f['Titre'] || 'Sans titre';
  const categorie = f['Catégorie'] || 'ia';
  const catLabel = CAT_LABELS[categorie] || categorie;
  const auteur = f['Auteur'] || 'ACE Conseil';
  const date = f['Date de publication'] || '';
  const chapeau = f['Chapô'] || '';
  const contenu = f['Contenu'] || '';
  const metaDesc = f['Meta description'] || chapeau.slice(0, 155);
  const tempsLecture = f['Temps de lecture'] || 5;
  
  const dateFormatted = date ? new Date(date).toLocaleDateString('fr-FR', { 
    year: 'numeric', month: 'long', day: 'numeric' 
  }) : '';
  
  const contenuHtml = markdownToHtml(contenu);
  
  // Build head with article-specific SEO
  let articleHead = headTemplate;
  articleHead = articleHead.replace(/<title>[^<]*<\/title>/, `<title>${titre} | ACE Conseil</title>`);
  articleHead = articleHead.replace(
    /(<meta\s+name="description"\s+content=")[^"]*(")/,
    `$1${metaDesc}$2`
  );
  articleHead = articleHead.replace(
    /(<link\s+rel="canonical"\s+href=")[^"]*(")/,
    `$1https://aceconseil.co/blog/${slug}$2`
  );
  articleHead = articleHead.replace(
    /(<meta\s+property="og:title"\s+content=")[^"]*(")/,
    `$1${titre} | ACE Conseil$2`
  );
  articleHead = articleHead.replace(
    /(<meta\s+property="og:description"\s+content=")[^"]*(")/,
    `$1${metaDesc}$2`
  );
  articleHead = articleHead.replace(
    /(<meta\s+property="og:url"\s+content=")[^"]*(")/,
    `$1https://aceconseil.co/blog/${slug}$2`
  );
  
  // JSON-LD Article schema
  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": titre,
    "description": metaDesc,
    "author": { "@type": "Person", "name": auteur },
    "publisher": { "@type": "Organization", "name": "ACE Conseil" },
    "datePublished": date,
    "url": `https://aceconseil.co/blog/${slug}`,
    "mainEntityOfPage": `https://aceconseil.co/blog/${slug}`
  });
  
  const articleBody = `
${skipLinkHtml}

${navHtml}

${mobileMenuHtml}

<main id="main-content">
<article class="page active" style="display:block;visibility:visible;height:auto;overflow:visible;max-height:none;position:relative;left:0;top:0;width:100%">
  <section class="page-hero" style="background:var(--navy)">
    <div class="nav-spacer"></div>
    <div class="page-hero-grid"></div>
    <div class="page-hero-glow"></div>
    <div class="page-hero-inner">
      <div class="section-tag">${catLabel}</div>
      <h1>${titre}</h1>
      <p>${chapeau}</p>
      <div style="display:flex;align-items:center;gap:16px;margin-top:24px;font-size:13px;color:rgba(254,253,251,0.5)">
        <span>${auteur}</span>
        <span style="opacity:0.3">·</span>
        <span>${dateFormatted}</span>
        <span style="opacity:0.3">·</span>
        <span>${tempsLecture} min de lecture</span>
      </div>
    </div>
  </section>

  <section class="section" style="background:var(--cream)">
    <div class="section-inner" style="max-width:780px">
      <div class="article-content" style="font-size:16px;line-height:1.85;color:var(--navy)">
        ${contenuHtml}
      </div>
      <div style="margin-top:60px;padding-top:40px;border-top:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:20px">
        <button onclick="showPage('blog')" class="btn-primary"><span>← Retour au blog</span></button>
        <button onclick="showPage('capture', {source:'blog-article', badge:'Audit gratuit', titre:'Discutons de votre situation.'})" class="btn-gold">Réserver un audit gratuit →</button>
      </div>
    </div>
  </section>

  <section class="cta-section">
    <div class="cta-rings"><div class="cta-ring cta-ring-1"></div><div class="cta-ring cta-ring-2"></div><div class="cta-ring cta-ring-3"></div></div>
    <div class="section-tag center">Travaillons ensemble</div>
    <h2>Un audit de 30 minutes<br>pour voir si <em>on peut vous aider.</em></h2>
    <p>On analyse votre situation. Si on peut aider, on vous dit comment. Sinon, on vous dit pourquoi — et vers qui aller.</p>
    <div class="cta-actions"><button onclick="showPage('capture')" class="btn-gold">Prendre rendez-vous →</button></div>
    <div class="cta-note">Gratuit · Sans engagement · Réponse sous 48h</div>
  </section>
</article>
</main>

${footerHtml}

${cookieBannerHtml}

${allScripts}`;

  return `<!DOCTYPE html>
<html lang="fr">
<head>
${articleHead}
<script type="application/ld+json">${jsonLd}</script>
</head>
<body>
${articleBody}
</body>
</html>`;
}

// ── Main async flow ──
(async () => {
  const articles = await fetchBlogArticles();
  const blogArticleUrls = [];
  
  if (articles.length > 0) {
    console.log('📄 Génération des pages articles...');
    
    for (const article of articles) {
      const slug = article.fields['Slug'];
      if (!slug) {
        console.warn(`   ⚠️ Article "${article.fields['Titre']}" sans slug, ignoré`);
        continue;
      }
      
      const articleDir = path.join(OUTPUT_DIR, 'blog', slug);
      fs.mkdirSync(articleDir, { recursive: true });
      
      const articleHtml = buildArticlePage(article, headContent);
      fs.writeFileSync(path.join(articleDir, 'index.html'), articleHtml, 'utf8');
      
      const size = (Buffer.byteLength(articleHtml, 'utf8') / 1024).toFixed(1);
      console.log(`   ✅ blog/${slug}/index.html (${size} Ko)`);
      
      blogArticleUrls.push(`https://aceconseil.co/blog/${slug}`);
    }
  }
  
  // ── Regénérer le sitemap avec les articles ──
  console.log('\n🗺️  Génération de sitemap.xml...');
  let sitemapXml2 = '<?xml version="1.0" encoding="UTF-8"?>\n';
  sitemapXml2 += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  for (const [pageId, seo] of Object.entries(PAGE_SEO)) {
    if (pageId === 'contact-formation') continue;
    const sp = sitemapPriorities[pageId] || { priority: '0.5', freq: 'monthly' };
    const loc = pageId === 'home' ? 'https://aceconseil.co/' : `https://aceconseil.co${seo.path}`;
    sitemapXml2 += `  <url>\n    <loc>${loc}</loc>\n    <priority>${sp.priority}</priority>\n    <changefreq>${sp.freq}</changefreq>\n  </url>\n`;
  }
  // Ajouter les articles de blog au sitemap
  for (const articleUrl of blogArticleUrls) {
    sitemapXml2 += `  <url>\n    <loc>${articleUrl}</loc>\n    <priority>0.7</priority>\n    <changefreq>monthly</changefreq>\n  </url>\n`;
  }
  sitemapXml2 += '</urlset>\n';
  fs.writeFileSync(path.join(OUTPUT_DIR, 'sitemap.xml'), sitemapXml2, 'utf8');
  const totalUrls = Object.keys(PAGE_SEO).length - 1 + blogArticleUrls.length;
  console.log(`   → ${totalUrls} URLs dans le sitemap (dont ${blogArticleUrls.length} articles)`);

  // ── Résumé ──
  console.log('\n' + '═'.repeat(60));
  console.log(`✅ ${generated.length} pages + ${blogArticleUrls.length} articles générés dans ${OUTPUT_DIR}/`);
  if (skipped.length > 0) {
    console.log(`⚠️  ${skipped.length} pages ignorées (pas de template): ${skipped.join(', ')}`);
  }
  console.log('═'.repeat(60));
  console.log('\n📋 Prochaines étapes :');
  console.log('   1. Le dossier public/ contient les fichiers à déployer');
  console.log('   2. Sur Vercel, configurer "Output Directory" → public');
  console.log('   3. Sur Vercel, ajouter la variable AIRTABLE_TOKEN');
  console.log('\n🚀 Prêt pour le déploiement !\n');
})();
