# Publier un article

1. Copier `content/blog/_modele.md` → `content/blog/AAAA-MM-JJ-mon-slug.md` (le `_modele.md` n'est jamais publié).
2. Remplir le front-matter (`title`, `description` ≤ 160 caractères, `date`, `slug`, `keywords`, `ville` en option) et écrire l'article en markdown.
3. `git add . && git commit -m "Article : mon titre" && git push` → en ligne sur `/blog/mon-slug` en ~1 minute.

Au premier article : décommenter les liens `<!-- BLOG : décommenter au 1er article -->` dans `index.html` (nav, menu mobile, footer). Le flux RSS `/blog/feed.xml` est généré automatiquement.

# Publier une page dédiée (pilier SEO)

1. Copier `content/pages/_modele.md` → `content/pages/mon-slug.md` (front-matter : `title`, `description`, `slug`, `eyebrow`, `lede`, `keywords`, `date`).
2. Le build refuse les slugs réservés (anciennes URLs redirigées : `ia`, `visibilite`, `strategie`, `formation`, `amo`...). Slugs prévus : `agents-ia`, `automatisation`, `formation-ia`, `sites-web`, `visibilite-prospection`, `strategie-commerciale`, `amo-immobilier`.
3. `git push` → en ligne sur `/mon-slug`. Puis décommenter le lien `<!-- PAGE DÉDIÉE -->` du panneau correspondant dans `index.html`.

Test local : `node scripts/build-blog.js` puis ouvrir `public/`. Voir `docs/PLAN_EDITORIAL.md` pour les 10 premiers articles.
