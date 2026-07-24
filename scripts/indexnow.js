#!/usr/bin/env node
/**
 * indexnow.js — Soumission IndexNow (Bing, Seznam, Naver, etc.)
 *
 * Lit sitemap.xml et soumet toutes les URLs à api.indexnow.org.
 * Google ignore IndexNow ; c'est gratuit pour les autres moteurs et
 * certains crawlers d'IA qui s'y alimentent.
 *
 * - Sur Vercel (env VERCEL présent) : s'exécute après le build
 *   (voir buildCommand dans vercel.json).
 * - En local : ignoré sauf appel explicite `node scripts/indexnow.js --force`.
 * - Ne fait jamais échouer le déploiement : toute erreur est loggée puis avalée.
 *
 * Le fichier de clé <clé>.txt est servi à la racine du site (copié dans
 * public/ par build-blog.js via STATIC_FILES).
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const ROOT = path.join(__dirname, '..');
const HOST = 'aceconseil.co';
const KEY = '750f5e47e9d41e60496334acbe3d3cf2';

if (!process.env.VERCEL && !process.argv.includes('--force')) {
  console.log('IndexNow : hors Vercel et sans --force, aucune soumission.');
  process.exit(0);
}

let sitemap;
try {
  sitemap = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
} catch (e) {
  console.log(`IndexNow : sitemap.xml introuvable (${e.message}), abandon silencieux.`);
  process.exit(0);
}

const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
if (!urls.length) {
  console.log('IndexNow : aucune URL dans le sitemap, abandon.');
  process.exit(0);
}

const payload = JSON.stringify({
  host: HOST,
  key: KEY,
  keyLocation: `https://${HOST}/${KEY}.txt`,
  urlList: urls,
});

const req = https.request(
  {
    hostname: 'api.indexnow.org',
    path: '/indexnow',
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(payload) },
    timeout: 10000,
  },
  (res) => {
    console.log(`IndexNow : ${urls.length} URLs soumises, réponse HTTP ${res.statusCode} (200/202 = accepté).`);
    process.exit(0);
  }
);
req.on('error', (e) => {
  console.log(`IndexNow : échec réseau ignoré (${e.message}).`);
  process.exit(0);
});
req.on('timeout', () => {
  console.log('IndexNow : délai dépassé, ignoré.');
  req.destroy();
  process.exit(0);
});
req.write(payload);
req.end();
