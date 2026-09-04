/**
 * Reception du formulaire de contact, en fonction serverless Vercel.
 *
 * Pourquoi cette fonction existe : jusqu'ici le formulaire retombait sur un
 * lien mailto, qui ouvrait le logiciel de courrier du visiteur avec un
 * brouillon pre-rempli. Sur un ordinateur sans client mail configure, il ne se
 * passait rien du tout, et la demande etait perdue sans que personne le sache.
 *
 * Elle n'a aucune dependance : le site n'en a jamais eu, et le runtime Node de
 * Vercel fournit fetch nativement.
 *
 * Configuration, a poser dans les variables d'environnement du projet Vercel,
 * jamais dans ce depot :
 *   RESEND_API_KEY   cle de l'API Resend (obligatoire)
 *   CONTACT_TO       destinataire, par defaut contact@aceconseil.co
 *   CONTACT_FROM     expediteur verifie chez Resend, par defaut le sous-domaine
 *                    d'envoi du cabinet
 *
 * Si la cle est absente, la fonction repond 503 avec un message explicite :
 * la page invite alors le visiteur a appeler, plutot que de lui laisser croire
 * que son message est parti.
 */

const DESTINATAIRE = process.env.CONTACT_TO || 'contact@aceconseil.co';
const EXPEDITEUR = process.env.CONTACT_FROM || 'Site ACE Conseil <site@aceconseil.co>';
const SUJETS_ATTENDUS = new Set([
  'Agents IA', 'Automatisation', 'Site web', 'Visibilité',
  'Stratégie commerciale', 'Formation IA', 'AMO Immobilier', 'Autre',
]);

function texte(v, max) {
  return typeof v === 'string' ? v.trim().slice(0, max) : '';
}

function echapper(s) {
  return String(s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ erreur: 'Méthode non autorisée.' });
  }

  let corps = req.body;
  if (typeof corps === 'string') {
    try { corps = JSON.parse(corps); } catch (e) { corps = null; }
  }
  if (!corps || typeof corps !== 'object') {
    return res.status(400).json({ erreur: 'Requête illisible.' });
  }

  // Piege a robots : un champ invisible rempli signe une soumission automatique.
  // On repond 200 pour ne pas renseigner le robot sur sa detection.
  if (texte(corps.site_web, 200)) {
    return res.status(200).json({ ok: true });
  }

  const nom = texte(corps.nom, 120);
  const email = texte(corps.email, 180);
  const message = texte(corps.message, 5000);
  const societe = texte(corps.societe, 160);
  const telephone = texte(corps.telephone, 40);
  const sujet = SUJETS_ATTENDUS.has(texte(corps.sujet, 60)) ? texte(corps.sujet, 60) : 'Autre';

  if (!nom || !email || !message) {
    return res.status(400).json({ erreur: 'Nom, adresse électronique et message sont nécessaires.' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return res.status(400).json({ erreur: 'Adresse électronique invalide.' });
  }

  const cle = process.env.RESEND_API_KEY;
  if (!cle) {
    console.error('contact: RESEND_API_KEY absente, message non transmis');
    return res.status(503).json({
      erreur: "Le formulaire n'est pas encore relié. Appelez-nous ou écrivez à contact@aceconseil.co.",
    });
  }

  const lignes = [
    ['Nom', nom],
    ['Société', societe || 'non renseignée'],
    ['Adresse électronique', email],
    ['Téléphone', telephone || 'non renseigné'],
    ['Besoin', sujet],
  ];

  const html = `<div style="font-family:system-ui,sans-serif;line-height:1.6;color:#1B2A4A">
<h2 style="font-family:Georgia,serif;color:#1B2A4A">Demande depuis aceconseil.co</h2>
<table cellpadding="6" style="border-collapse:collapse">
${lignes.map(([k, v]) => `<tr><td style="color:#7A8499">${echapper(k)}</td><td><strong>${echapper(v)}</strong></td></tr>`).join('\n')}
</table>
<h3 style="color:#C9A24D">Message</h3>
<p style="white-space:pre-wrap">${echapper(message)}</p>
</div>`;

  const brut = lignes.map(([k, v]) => `${k} : ${v}`).join('\n') + '\n\nMessage :\n' + message;

  try {
    const reponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${cle}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: EXPEDITEUR,
        to: [DESTINATAIRE],
        reply_to: email,
        subject: `[Site] ${sujet} · ${nom}`,
        html,
        text: brut,
      }),
    });

    if (!reponse.ok) {
      const detail = await reponse.text();
      // On journalise le code et le detail du fournisseur, jamais le message du visiteur.
      console.error('contact: envoi refusé', reponse.status, detail.slice(0, 300));
      return res.status(502).json({
        erreur: "L'envoi n'a pas abouti. Appelez-nous ou écrivez à contact@aceconseil.co.",
      });
    }

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('contact: erreur réseau', e && e.message);
    return res.status(502).json({
      erreur: "L'envoi n'a pas abouti. Appelez-nous ou écrivez à contact@aceconseil.co.",
    });
  }
};
