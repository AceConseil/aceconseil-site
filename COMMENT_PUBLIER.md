# Publier un article

1. Copier `content/blog/_modele.md` → `content/blog/AAAA-MM-JJ-mon-slug.md` (le `_modele.md` n'est jamais publié).
2. Remplir le front-matter (`title`, `description` ≤ 160 caractères, `date`, `slug`, `keywords`, `ville` en option) et écrire l'article en markdown.
3. `git add . && git commit -m "Article : mon titre" && git push` → en ligne sur `/blog/mon-slug` en ~1 minute.

Au premier article : décommenter les liens `<!-- BLOG : décommenter au 1er article -->` dans `index.html` (nav, menu mobile, footer).

Test local : `node scripts/build-blog.js` puis ouvrir `public/blog/mon-slug.html`.
