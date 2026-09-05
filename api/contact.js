/**
 * Reception du formulaire de contact, en fonction serverless Vercel.
 *
 * Pourquoi cette fonction existe : jusqu'ici le formulaire retombait sur un
 * lien mailto, qui ouvrait le logiciel de courrier du visiteur avec un
 * brouillon pre-rempli. Sur un ordinateur sans client mail configure, il ne se
 * passait rien du tout, et la demande etait perdue sans que personne le sache.
 *
 * Le message part par SMTP depuis notre propre boite Google Workspace. Aucun
 * prestataire supplementaire n'intervient : les donnees des prospects restent
 * chez l'hebergeur qui traite deja l'integralite de notre courrier, ce qui
 * evite d'ajouter un sous-traitant au registre et aux mentions legales.
 *
 * Configuration, a poser dans les variables d'environnement du projet Vercel,
 * jamais dans ce depot :
 *   SMTP_USER       adresse complete du compte expediteur
 *   SMTP_PASSWORD   mot de passe d'application Google, 16 caracteres
 *   CONTACT_TO      destinataire, par defaut SMTP_USER
 *   SMTP_HOST       par defaut smtp.gmail.com
 *   SMTP_PORT       par defaut 465
 *
 * Sans identifiants, la fonction repond 503 avec un message explicite : la
 * page invite alors a appeler, plutot que de laisser croire que le message
 * est parti.
 */

const nodemailer = require('nodemailer');

// Cles de provenance acceptees. Toute autre cle est ignoree : le formulaire est
// public, on ne recopie pas dans un courriel ce qu'un inconnu y aurait glisse.
const PROVENANCE_ATTENDUE = [
  'gclid', 'gbraid', 'wbraid', 'msclkid',
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
];

const SUJETS_ATTENDUS = new Set([
  'Agents IA', 'Automatisation', 'Site web', 'Visibilité',
  'Stratégie commerciale', 'Formation IA', 'AMO Immobilier', 'Autre',
]);

function texte(v, max) {
  return typeof v === 'string' ? v.trim().slice(0, max) : '';
}

function lireProvenance(brut) {
  if (!brut || typeof brut !== 'object') return [];
  const out = [];
  for (const cle of PROVENANCE_ATTENDUE) {
    const v = texte(brut[cle], 200);
    if (v) out.push([cle, v]);
  }
  return out;
}

function echapper(s) {
  return String(s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

// Le transporteur est cree une seule fois et reutilise entre deux invocations
// tant que le conteneur reste chaud : cela evite de renegocier TLS a chaque envoi.
let transporteur = null;
function obtenirTransporteur(user, pass) {
  if (transporteur) return transporteur;
  const port = Number(process.env.SMTP_PORT || 465);
  transporteur = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port,
    secure: port === 465,
    auth: { user, pass },
  });
  return transporteur;
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

  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  if (!user || !pass) {
    console.error('contact: identifiants SMTP absents, message non transmis');
    return res.status(503).json({
      erreur: "Le formulaire n'est pas encore relié. Appelez-nous ou écrivez à contact@aceconseil.co.",
    });
  }

  const provenance = lireProvenance(corps.provenance);
  const referent = texte(corps.referent, 300);
  const page = texte(corps.page, 200);

  const lignes = [
    ['Nom', nom],
    ['Société', societe || 'non renseignée'],
    ['Adresse électronique', email],
    ['Téléphone', telephone || 'non renseigné'],
    ['Besoin', sujet],
  ];

  // Bloc de provenance : sépare visuellement ce que la personne a écrit de ce
  // que la page a observé. Vide et absent quand rien n'a été capté.
  const tracage = [];
  if (provenance.length) tracage.push(...provenance);
  if (referent) tracage.push(['Venu de', referent]);
  if (page && page !== '/') tracage.push(['Page du formulaire', page]);

  const html = `<div style="font-family:system-ui,sans-serif;line-height:1.6;color:#1B2A4A">
<h2 style="font-family:Georgia,serif;color:#1B2A4A">Demande depuis aceconseil.co</h2>
<table cellpadding="6" style="border-collapse:collapse">
${lignes.map(([k, v]) => `<tr><td style="color:#7A8499">${echapper(k)}</td><td><strong>${echapper(v)}</strong></td></tr>`).join('\n')}
</table>
<h3 style="color:#C9A24D">Message</h3>
<p style="white-space:pre-wrap">${echapper(message)}</p>
${tracage.length ? `<h3 style="color:#C9A24D">Provenance</h3>
<table cellpadding="6" style="border-collapse:collapse">
${tracage.map(([k, v]) => `<tr><td style="color:#7A8499">${echapper(k)}</td><td>${echapper(v)}</td></tr>`).join('\n')}
</table>` : '<p style="color:#7A8499;font-size:.9em">Aucune provenance captée : accès direct, ou arrivée par une autre page du site.</p>'}
<p style="color:#7A8499;font-size:.9em">Répondre à ce message écrit directement à ${echapper(email)}.</p>
</div>`;

  const brut = lignes.map(([k, v]) => `${k} : ${v}`).join('\n')
    + '\n\nMessage :\n' + message
    + (tracage.length ? '\n\nProvenance :\n' + tracage.map(([k, v]) => `${k} : ${v}`).join('\n') : '\n\nProvenance : aucune captée.');

  const destinataire = process.env.CONTACT_TO || user;

  try {
    const info = await obtenirTransporteur(user, pass).sendMail({
      // Google impose que l'expediteur soit le compte authentifie ou un de ses
      // alias verifies : on garde donc l'adresse du compte et on place celle du
      // prospect en reponse, pour repondre d'un seul geste.
      from: `"Site ACE Conseil" <${user}>`,
      to: destinataire,
      replyTo: `"${nom.replace(/"/g, '')}" <${email}>`,
      subject: `[Site] ${sujet} · ${nom}`,
      text: brut,
      html,
    });

    // Le serveur de messagerie peut accepter la connexion et refuser le
    // destinataire sans lever d'erreur. Sans ce controle, la fonction repondait
    // « envoye » alors que rien n'etait parti, ce qui est arrive le 5 septembre.
    const accepte = Array.isArray(info && info.accepted) ? info.accepted : [];
    const refuse = Array.isArray(info && info.rejected) ? info.rejected : [];
    if (!accepte.length || refuse.length) {
      console.error('contact: destinataire refusé', JSON.stringify({ accepte, refuse, reponse: info && info.response }));
      return res.status(502).json({
        erreur: "L'envoi n'a pas abouti. Appelez-nous ou écrivez à contact@aceconseil.co.",
      });
    }

    // L'identifiant permet de retrouver le message dans les journaux Google.
    console.log('contact: remis', JSON.stringify({ id: info.messageId, accepte, reponse: info.response }));
    return res.status(200).json({ ok: true });
  } catch (e) {
    // On journalise le motif du refus, jamais le contenu du message du visiteur.
    console.error('contact: envoi refusé', (e && e.code) || '', (e && e.message) || '');
    return res.status(502).json({
      erreur: "L'envoi n'a pas abouti. Appelez-nous ou écrivez à contact@aceconseil.co.",
    });
  }
};
