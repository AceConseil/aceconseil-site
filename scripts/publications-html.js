#!/usr/bin/env node
/**
 * publications-html.js — Rend en HTML lisible les fichiers du dossier Drive
 * des publications LinkedIn.
 *
 * Pourquoi : ce dossier est synchronisé en local depuis Google Drive. Un
 * fichier markdown s'y ouvre dans un editeur de texte et affiche sa syntaxe
 * brute. Un fichier HTML s'ouvre dans le navigateur et se lit. Jennifer ouvre
 * ces fichiers pour copier des textes vers LinkedIn : la lisibilite est la
 * condition pour qu'ils servent.
 *
 * Chaque page est autonome, sans fichier externe : elle s'ouvre hors ligne,
 * depuis Drive comme depuis le Finder.
 *
 * Usage : node scripts/publications-html.js [--supprimer-md]
 */

const fs = require('fs');
const path = require('path');

const DRIVE = path.join(
  process.env.HOME,
  'Library/CloudStorage/GoogleDrive-contact@aceconseil.co/Mon Drive',
  'Pro/ACE - Prospection LinkedIn/publications'
);

const JOURS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

const PLAFOND = 3000; // limite de caracteres d'une publication LinkedIn

function ech(s) {
  return String(s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

function dateLongue(iso) {
  const [a, m, j] = iso.split('-').map(Number);
  const d = new Date(Date.UTC(a, m - 1, j));
  return `${JOURS[d.getUTCDay()]} ${j} ${MOIS[m - 1]} ${a}`;
}

/** Decoupe un fichier en son en-tete YAML et son corps. */
function lire(fichier) {
  const brut = fs.readFileSync(fichier, 'utf8');
  const m = brut.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) return { meta: {}, corps: brut.trim() };
  const meta = {};
  for (const ligne of m[1].split('\n')) {
    const p = ligne.match(/^([a-z_]+):\s*(.*)$/);
    if (p) meta[p[1]] = p[2].replace(/^"(.*)"$/, '$1').trim();
  }
  return { meta, corps: m[2].trim() };
}

/** Separe le texte a publier, les mots-diese et le premier commentaire. */
function decouper(corps) {
  const [avant, apres] = corps.split(/\*\*Premier commentaire :\*\*/);
  const commentaire = (apres || '').trim();
  let texte = avant.trim();
  let diese = '';
  const dm = texte.match(/\n(#[^\n]*)$/);
  if (dm) { diese = dm[1].trim(); texte = texte.slice(0, dm.index).trim(); }
  return { texte, diese, commentaire };
}

/** Rend le sous-ensemble de markdown que ces notes utilisent reellement. */
function enrichir(t) {
  const blocs = ech(t).split(/\n{2,}/);
  const out = [];
  for (let b of blocs) {
    b = b.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
         .replace(/`([^`]+)`/g, '<code>$1</code>');
    if (/^#{1,3} /.test(b)) { out.push(`<h2>${b.replace(/^#{1,3} /, '')}</h2>`); continue; }
    if (/^&gt; /.test(b)) {
      out.push(`<blockquote>${b.split('\n').map((l) => l.replace(/^&gt; /, '')).join('<br>')}</blockquote>`);
      continue;
    }
    if (/^\d+\. /.test(b)) {
      const li = b.split(/\n(?=\d+\. )/).map((l) => `<li>${l.replace(/^\d+\. /, '').replace(/\n\s+/g, ' ')}</li>`);
      out.push(`<ol>${li.join('')}</ol>`); continue;
    }
    if (/^- /.test(b)) {
      const li = b.split(/\n(?=- )/).map((l) => `<li>${l.replace(/^- /, '').replace(/\n\s+/g, ' ')}</li>`);
      out.push(`<ul>${li.join('')}</ul>`); continue;
    }
    out.push(`<p>${b.replace(/\n/g, ' ')}</p>`);
  }
  return out.join('\n');
}

const CSS = `
:root{--navy:#1B2A4A;--or:#C9A24D;--creme:#FEFDFB;--gris:#7A8499;--trait:#E6E2D8}
*{box-sizing:border-box}
body{margin:0;background:var(--creme);color:var(--navy);
  font:16px/1.65 "DM Sans",-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif}
.page{max-width:760px;margin:0 auto;padding:40px 24px 80px}
header{border-bottom:2px solid var(--or);padding-bottom:20px;margin-bottom:32px}
.marque{font:600 15px/1 Georgia,"Times New Roman",serif;letter-spacing:.5px}
.marque span{color:var(--or);font:400 10px/1 Helvetica,Arial,sans-serif;letter-spacing:3px}
h1{font:700 30px/1.2 "Playfair Display",Georgia,"Times New Roman",serif;margin:14px 0 6px}
.sous{color:var(--gris);font-size:14px;margin:0}
.etiquettes{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}
.et{font-size:12px;letter-spacing:.4px;padding:4px 10px;border-radius:999px;
  border:1px solid var(--trait);background:#fff;color:var(--gris)}
.et.ok{border-color:var(--or);color:#8A6D24;background:#FBF6EA}
.et.attention{border-color:#C0392B;color:#C0392B;background:#FCF0EE}
h2{font:700 19px/1.3 "Playfair Display",Georgia,serif;margin:40px 0 12px}
.bloc{background:#fff;border:1px solid var(--trait);border-radius:10px;padding:22px 24px;margin-bottom:10px}
.texte{white-space:pre-wrap;font-size:16px;line-height:1.7}
.diese{color:var(--or);font-weight:600;margin-top:18px}
.barre{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin:0 0 26px}
button{font:600 14px/1 inherit;padding:10px 16px;border-radius:8px;cursor:pointer;
  border:1px solid var(--navy);background:var(--navy);color:#fff}
button:hover{background:#26375C}
button.fait{background:#1E7A46;border-color:#1E7A46}
.compte{font-size:13px;color:var(--gris)}
.compte b{color:var(--navy)}
.compte.trop b{color:#C0392B}
ol,ul{padding-left:22px}ol li,ul li{margin:9px 0}
code{background:#F2EFE7;padding:2px 6px;border-radius:4px;font-size:14px}
.jours{list-style:none;padding:0}
.jours li{margin:0 0 10px}
.jours a{display:flex;justify-content:space-between;gap:14px;align-items:baseline;
  text-decoration:none;color:var(--navy);background:#fff;border:1px solid var(--trait);
  border-radius:10px;padding:15px 18px}
.jours a:hover{border-color:var(--or)}
.jours .j{font:700 16px/1.3 "Playfair Display",Georgia,serif}
.jours .a{color:var(--gris);font-size:13px;text-align:right;flex-shrink:0}
.jours .h{color:var(--gris);font-size:14px;margin-top:3px;display:block;font-weight:400}
blockquote{margin:0 0 14px;padding:12px 16px;border-left:3px solid var(--or);
  background:#FBF6EA;border-radius:0 8px 8px 0}
a{color:#8A6D24}
footer{margin-top:60px;padding-top:20px;border-top:1px solid var(--trait);
  color:var(--gris);font-size:13px}
@media print{button{display:none}body{background:#fff}}
`;

const JS = `
function copier(id, bouton){
  var t = document.getElementById(id).innerText;
  function fini(){ var v = bouton.textContent; bouton.textContent = 'Copié';
    bouton.classList.add('fait');
    setTimeout(function(){ bouton.textContent = v; bouton.classList.remove('fait'); }, 1600); }
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(t).then(fini, function(){ secours(t, fini); });
  } else { secours(t, fini); }
}
function secours(t, fini){
  var z = document.createElement('textarea');
  z.value = t; z.style.position = 'fixed'; z.style.opacity = '0';
  document.body.appendChild(z); z.select();
  try { document.execCommand('copy'); fini(); } catch(e) { alert('Copie impossible, sélectionnez le texte à la main.'); }
  document.body.removeChild(z);
}
`;

function page(titre, contenu) {
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>${ech(titre)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600&family=Playfair+Display:wght@700&display=swap" rel="stylesheet">
<style>${CSS}</style>
</head>
<body>
<div class="page">
<header>
  <p class="marque">ACE <span>CONSEIL</span></p>
  ${contenu.entete}
</header>
${contenu.corps}
<footer>Fichier préparé pour la publication. Le lien va toujours en premier commentaire, jamais dans le corps : une publication qui contient un lien sortant voit sa portée baisser.</footer>
</div>
<script>${JS}</script>
</body>
</html>`;
}

function pagePublication(meta, d, nom) {
  const n = d.texte.length + (d.diese ? d.diese.length + 2 : 0);
  const trop = n >= PLAFOND;
  const etats = {
    'pret-a-publier': ['ok', 'Prêt à publier'],
    'en-reserve': ['', 'En réserve'],
    'publie': ['', 'Publié'],
    'en-attente-de-redaction': ['attention', 'À rédiger'],
    'pas-de-publication': ['', 'Pas de publication'],
  };
  const [cl, lib] = etats[meta.statut] || ['', meta.statut || ''];

  const entete = `
  <h1>${ech(dateLongue(meta.date))}</h1>
  <p class="sous">Publication depuis le profil de ${ech(meta.auteur || 'Jennifer')}.</p>
  <div class="etiquettes">
    <span class="et ${cl}">${ech(lib)}</span>
    ${meta.pilier ? `<span class="et">${ech(meta.pilier)}</span>` : ''}
    <span class="et">${n} signes sur ${PLAFOND}</span>
  </div>`;

  const corps = `
<h2>Le post</h2>
<div class="bloc"><div class="texte" id="post">${ech(d.texte)}${d.diese ? `\n\n${ech(d.diese)}` : ''}</div></div>
<p class="barre">
  <button onclick="copier('post',this)">Copier le post</button>
  <span class="compte${trop ? ' trop' : ''}"><b>${n}</b> signes${trop ? ' — au-dessus du plafond de LinkedIn' : `, soit ${PLAFOND - n} de marge`}</span>
</p>

${d.commentaire ? `<h2>Le premier commentaire</h2>
<div class="bloc"><div class="texte" id="commentaire">${ech(d.commentaire)}</div></div>
<p class="barre">
  <button onclick="copier('commentaire',this)">Copier le commentaire</button>
  <span class="compte">À poster juste après la publication. C'est lui qui porte le lien.</span>
</p>` : ''}

<h2>La marche à suivre</h2>
<div class="bloc"><ol>
  <li>Copier le post et le publier depuis votre profil.</li>
  <li>Poster le premier commentaire dans la foulée.</li>
  <li>${meta.article ? `Vérifier que la page s'ouvre : <a href="https://aceconseil.co${ech(meta.article)}">aceconseil.co${ech(meta.article)}</a>` : 'Vérifier que le lien du commentaire s\'ouvre.'}</li>
  <li>Déplacer ce fichier dans <strong>parues/</strong>.</li>
</ol></div>`;

  return page(`${dateLongue(meta.date)} · ACE Conseil`, { entete, corps });
}

function pageNote(meta, corps) {
  const entete = `
  <h1>${meta.date ? ech(dateLongue(meta.date)) : 'Note'}</h1>
  <div class="etiquettes"><span class="et">${ech(meta.statut || 'note')}</span></div>`;
  return page(`${meta.date ? dateLongue(meta.date) : 'Note'} · ACE Conseil`,
    { entete, corps: `<div class="bloc">${enrichir(corps)}</div>` });
}

function sommaire(dossier, fiches) {
  const lignes = fiches.filter((f) => f.date).sort((a, b) => a.date.localeCompare(b.date)).map((f) => {
    const etat = f.statut === 'pret-a-publier' ? `${f.signes} signes`
      : f.statut === 'en-reserve' ? 'en réserve' : (f.statut || '');
    return `<li><a href="${ech(f.fichier)}">
      <span><span class="j">${ech(dateLongue(f.date))}</span>
      <span class="h">${ech(f.accroche)}</span></span>
      <span class="a">${ech(etat)}</span></a></li>`;
  }).join('\n');
  const entete = `
  <h1>Les publications à sortir</h1>
  <p class="sous">Une page par jour. Ouvrez celle du jour, copiez, publiez, puis postez le premier commentaire.</p>`;
  const corps = `<ul class="jours">\n${lignes}\n</ul>
<h2>Ce qu'il faut vérifier avant de publier</h2>
<div class="bloc"><ul>
  <li>Le texte parle en votre nom. Si une formule ne vous ressemble pas, changez-la : vous connaissez votre voix mieux que celui qui l'a écrite.</li>
  <li>La page vers laquelle le commentaire renvoie est bien en ligne. Ouvrez le lien avant de publier.</li>
  <li>Aucun nom de domaine ne traîne dans le corps du texte. LinkedIn le transforme en lien cliquable et le compte comme un lien sortant.</li>
</ul></div>`;
  fs.writeFileSync(path.join(dossier, 'index.html'), page('Les publications à sortir · ACE Conseil', { entete, corps }));
}

function convertir(dossier, supprimer) {
  if (!fs.existsSync(dossier)) return [];
  const faits = [];
  for (const nom of fs.readdirSync(dossier).filter((f) => f.endsWith('.md')).sort()) {
    const src = path.join(dossier, nom);
    const { meta, corps } = lire(src);
    const d = decouper(corps);
    const estPublication = meta.statut && ['pret-a-publier', 'en-reserve', 'publie'].includes(meta.statut)
      && !/^#\s/m.test(corps.split('\n')[0]);
    const html = estPublication ? pagePublication(meta, d, nom) : pageNote(meta, corps);
    if (/^SEMAINE-/.test(nom)) { if (supprimer) fs.unlinkSync(src); continue; }
    const dest = src.replace(/\.md$/, '.html');
    fs.writeFileSync(dest, html);
    if (supprimer) fs.unlinkSync(src);
    faits.push({
      nom: path.basename(dest), fichier: path.basename(dest), date: meta.date, statut: meta.statut,
      signes: estPublication ? d.texte.length + (d.diese ? d.diese.length + 2 : 0) : null,
      accroche: estPublication ? d.texte.split('\n')[0].slice(0, 78) : (corps.split('\n')[0].replace(/^#\s*/, '')),
    });
  }
  return faits;
}

const supprimer = process.argv.includes('--supprimer-md');
for (const sous of ['a-publier', 'parues']) {
  const dossier = path.join(DRIVE, sous);
  const faits = convertir(dossier, supprimer);
  if (sous === 'a-publier') sommaire(dossier, faits);
  console.log(`${sous} : ${faits.length} page(s)${sous === 'a-publier' ? ' + index.html' : ''}`);
  for (const f of faits) console.log(`   ${f.nom}${f.signes ? `  (${f.signes} signes)` : ''}`);
}
const racine = convertir(DRIVE, supprimer);
console.log(`racine : ${racine.length} page(s)`);
for (const f of racine) console.log(`   ${f.nom}`);
