import 'dotenv/config';
import axios from 'axios';

const SL = { boulangerie:'boulanger', plombier:'plombier', electricien:'électricien', coiffeur:'coiffeur',
  restaurant:'restaurant', garage:'garagiste', pharmacie:'pharmacie', hotel:'hôtel',
  fleuriste:'fleuriste', opticien:'opticien', dentiste:'dentiste', medecin:'médecin' };

const VARIANTS = [
  (nom, ville, s) => ({ subject: `votre fiche Google Maps`, body: `Bonjour,\n\nCe matin, quelqu'un a cherché "${SL[s]||s} à ${ville}" sur Google.\n\nVotre fiche est apparue — mais l'horaire affiché était faux. Le client a pensé que vous étiez fermé. Il est allé ailleurs.\n\nVous ne l'avez jamais su.\n\nC'est ce qui arrive quand la fiche Google d'un commerce est incomplète ou incorrecte. Et la plupart des patrons ne savent même pas que la leur a un problème.\n\nEn 30 secondes, vous pouvez voir le score de votre fiche. C'est gratuit, sans inscription.\n\nBonne journée,\nBrian` }),
  (nom, ville, s) => ({ subject: `votre fiche Google Maps`, body: `Bonjour,\n\nCe soir, quelqu'un a cherché un ${SL[s]||s} à ${ville} en urgence.\n\nIl a vu trois résultats sur Google Maps. Il a appelé le premier qui avait un numéro visible et des horaires à jour.\n\nPas le meilleur. Le premier qui inspirait confiance.\n\nSi la fiche de ${nom} n'est pas au niveau, vous perdez ces appels sans jamais le savoir.\n\nVérifiez votre score en 30 secondes, gratuitement :\n\nBrian` }),
  (nom, ville, s) => ({ subject: `votre fiche Google Maps`, body: `Bonjour,\n\nSamedi matin, quelqu'un cherche un ${SL[s]||s} à ${ville}.\n\nIl ouvre Google Maps. Il voit plusieurs résultats. Il regarde les photos, les horaires, les avis récents.\n\nEn 10 secondes, il a choisi. Pas sur la qualité — sur ce que la fiche lui a dit.\n\nEst-ce que la fiche de ${nom} lui aurait donné envie d'appeler ?\n\nVérifiez votre score en 30 secondes, gratuitement :\n\nBrian` }),
  (nom, ville, s) => ({ subject: `votre fiche Google Maps`, body: `Bonjour,\n\nQuelqu'un cherche un ${SL[s]||s} à ${ville} sur son téléphone.\n\nIl trouve votre fiche. Mais le numéro n'est pas cliquable, ou les horaires ne s'affichent pas correctement sur mobile.\n\nIl passe au résultat suivant.\n\nC'est ce qui arrive sur des milliers de fiches Google sans que le patron le sache.\n\nEn 30 secondes, vous pouvez voir si c'est le cas pour ${nom}. C'est gratuit :\n\nBrian` }),
  (nom, ville, s) => ({ subject: `votre fiche Google Maps`, body: `Bonjour,\n\nÀ ${ville}, un concurrent avec une moins bonne note que ${nom} apparaît avant vous sur Google Maps.\n\nCe n'est pas une question de qualité. C'est une question d'activité de fiche — publications, photos, réponses aux avis.\n\nGoogle favorise les fiches actives, pas les meilleures.\n\nEn 30 secondes, vous pouvez voir où en est votre fiche. C'est gratuit, sans inscription :\n\nBrian` }),
  (nom, ville, s) => ({ subject: `votre fiche Google Maps`, body: `Bonjour,\n\nQuand quelqu'un ne connaît pas encore ${nom}, votre fiche Google est sa première impression.\n\nAvant d'appeler, il regarde les photos, les avis récents, les horaires. En 10 secondes, il décide.\n\nSi la fiche est incomplète ou inactive, il cherche ailleurs — sans jamais vous contacter.\n\nVérifiez votre score en 30 secondes, gratuitement :\n\nBrian` }),
  (nom, ville, s) => ({ subject: `votre fiche Google Maps`, body: `Bonjour,\n\nCertains clients passent devant votre commerce, hésitent, puis vérifient votre fiche Google avant d'entrer.\n\nIls cherchent les horaires, les avis, une photo de l'intérieur. Si l'information est manquante ou ancienne, ils passent leur chemin.\n\nC'est une vente perdue à deux mètres de votre porte.\n\nEn 30 secondes, vous pouvez voir le score de votre fiche. C'est gratuit :\n\nBrian` }),
  (nom, ville, s) => ({ subject: `j'ai regardé votre fiche Google`, body: `Bonjour,\n\nJ'ai cherché votre commerce sur Google Maps il y a quelques jours.\n\nVotre fiche existe, mais elle a plusieurs points faibles qui font que vous apparaissez moins souvent que vos concurrents dans les résultats — parfois pas du tout.\n\nJe ne vends rien. J'ai juste créé un outil qui analyse les fiches Google en 30 secondes et donne un score avec les points à corriger.\n\nSi vous voulez savoir où vous en êtes :\n\nBrian` }),
  (nom, ville, s) => ({ subject: `j'ai regardé votre fiche Google`, body: `Bonjour,\n\nEn cherchant des ${SL[s]||s}s à ${ville} sur Google Maps, je suis tombé sur la fiche de ${nom}.\n\nJ'ai noté quelques points qui pourraient expliquer pourquoi vous n'apparaissez pas toujours en premiers résultats.\n\nJ'ai créé un outil gratuit qui analyse ça en 30 secondes. Pas de compte, pas de carte bancaire.\n\nSi vous êtes curieux :\n\nBrian` }),
  (nom, ville, s) => ({ subject: `j'ai regardé votre fiche Google`, body: `Bonjour,\n\nEst-ce que vous savez comment votre fiche Google apparaît quand quelqu'un cherche un ${SL[s]||s} à ${ville} ?\n\nJ'ai développé un outil qui analyse ça gratuitement en 30 secondes — score, points faibles, ce qui peut être amélioré.\n\nAucune inscription requise.\n\nBrian` }),
  (nom, ville, s) => ({ subject: `j'ai regardé votre fiche Google`, body: `Bonjour,\n\nJ'ai regardé la fiche Google de ${nom} cette semaine.\n\nCe qui m'a frappé : avec une fiche existante à ${ville}, vous devriez apparaître plus souvent dans les résultats locaux.\n\nIl y a probablement quelques points simples à corriger. J'ai un outil qui les identifie en 30 secondes, gratuitement.\n\nBrian` }),
  (nom, ville, s) => ({ subject: `j'ai regardé votre fiche Google`, body: `Bonjour,\n\nJe ne vous contacte pas pour vous vendre quelque chose.\n\nJ'ai regardé la fiche Google de ${nom} à ${ville}, et j'ai vu quelques points qui limitent votre visibilité dans les recherches locales.\n\nJ'ai créé un outil qui donne un score de fiche Google en 30 secondes. Gratuit, sans inscription.\n\nSi ça peut vous être utile :\n\nBrian` }),
  (nom, ville, s) => ({ subject: `votre fiche Google à ${ville}`, body: `Bonjour,\n\nVotre fiche Google a des points faibles qui font que ${nom} apparaît moins souvent que d'autres ${SL[s]||s}s dans les résultats à ${ville}.\n\nJ'ai un outil gratuit qui identifie ça en 30 secondes.\n\nBrian` }),
  (nom, ville, s) => ({ subject: `votre fiche Google à ${ville}`, body: `Bonjour,\n\nJe m'appelle Brian. J'ai créé un outil qui analyse les fiches Google des commerces locaux.\n\nJ'ai regardé la fiche de ${nom} à ${ville}. Il y a des améliorations possibles qui pourraient vous faire apparaître plus souvent dans les résultats Google.\n\nLe diagnostic est gratuit, prend 30 secondes, et ne nécessite aucune inscription.\n\nBrian` }),
  (nom, ville, s) => ({ subject: `7 clients sur 10 choisissent avant d'appeler`, body: `Bonjour,\n\nQuand quelqu'un a besoin d'un ${SL[s]||s} en urgence, il tape sur Google, il voit trois résultats, il appelle le premier qui inspire confiance.\n\nPas forcément le meilleur. Celui dont la fiche est complète, bien notée, avec des photos et les bons horaires.\n\nSi votre fiche Google n'est pas au niveau, vous perdez ces appels sans jamais le savoir.\n\nVérifiez votre score en 30 secondes, gratuitement :\n\nBrian` }),
  (nom, ville, s) => ({ subject: `le premier résultat Google capte 70% des appels`, body: `Bonjour,\n\nSur Google Maps, le premier résultat local capte la majorité des clics. Le deuxième et troisième se partagent le reste.\n\nCe n'est pas une question de qualité. C'est une question de fiche optimisée — horaires, photos, activité récente, réponses aux avis.\n\nSi ${nom} n'apparaît pas en première position à ${ville}, vous perdez des clients chaque semaine.\n\nVérifiez votre position en 30 secondes, gratuitement :\n\nBrian` }),
  (nom, ville, s) => ({ subject: `bien noté mais invisible sur Google Maps`, body: `Bonjour,\n\nC'est le cas le plus frustrant : un commerce avec de bons avis, mais une fiche inactive qui le fait passer derrière des concurrents moins bien notés.\n\nGoogle ne récompense pas la qualité. Il récompense l'activité.\n\nUne fiche sans publications récentes, sans photos récentes, sans réponses aux avis — elle descend dans les résultats, même avec 4,8 étoiles.\n\nEn 30 secondes, vous pouvez voir où en est ${nom} à ${ville}. C'est gratuit :\n\nBrian` }),
  (nom, ville, s) => ({ subject: `3 secondes pour décider`, body: `Bonjour,\n\nC'est le temps qu'un client passe sur votre fiche Google avant de décider d'appeler ou de passer au suivant.\n\nPhotos, note, horaires, nombre d'avis. Si l'un de ces éléments manque ou est incorrect, il continue de scroller.\n\nEn 30 secondes, vous pouvez voir le score de la fiche de ${nom} à ${ville} et ce qui peut être amélioré. Gratuitement :\n\nBrian` }),
  (nom, ville, s) => ({ subject: `comment vous apparaissez sur mobile`, body: `Bonjour,\n\n8 recherches locales sur 10 se font sur mobile. Les gens cherchent, ils voient les premiers résultats, ils appellent directement depuis Google — sans visiter de site web.\n\nSi la fiche de ${nom} n'est pas optimisée pour ces recherches à ${ville}, vous passez à côté de clients qui ne sauront jamais que vous existez.\n\nVérifiez votre visibilité mobile en 30 secondes, gratuitement :\n\nBrian` }),
  (nom, ville, s) => ({ subject: `votre fiche Google travaille (ou pas) pendant que vous dormez`, body: `Bonjour,\n\nLa nuit, le weekend, pendant que vous êtes occupé — votre fiche Google continue de recevoir des visites.\n\nSi elle est incomplète, les gens partent sans appeler.\nSi elle est optimisée, ils appellent.\n\nLa différence entre les deux se joue sur des détails simples à corriger.\n\nEn 30 secondes, vous pouvez voir l'état de la fiche de ${nom} à ${ville}. C'est gratuit :\n\nBrian` }),
];

const nom = 'Boulangerie Dupont', ville = 'Lyon', secteur = 'boulangerie';

for (let vid = 0; vid < VARIANTS.length; vid++) {
  const variant  = VARIANTS[vid](nom, ville, secteur);
  const auditUrl = `https://thelocalboost.fr/analyser?nom=${encodeURIComponent(nom)}&ville=${encodeURIComponent(ville)}&utm_source=outreach&utm_medium=email&utm_campaign=v${vid}`;
  const trackUrl = `https://thelocalboost.fr/api/track?vid=${vid}&url=${encodeURIComponent(auditUrl)}`;
  const paragraphs = variant.body.split('\n\n').map(p =>
    `<p style="font-size:15px;line-height:1.7;color:#1a1a1a;margin:0 0 16px;">${p.replace(/\n/g, '<br>')}</p>`
  ).join('\n');

  const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f9fafb;">
<tr><td align="center" style="padding:32px 16px;">
<table width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;background:#fff;border-radius:12px;overflow:hidden;">
<tr><td align="center" style="padding:28px 24px 20px;"><img src="https://www.thelocalboost.fr/logo.png.png" alt="LocalBoost" width="140" style="display:block;"/></td></tr>
<tr><td style="padding:0 32px 32px;">
<p style="font-size:11px;color:#9ca3af;margin:0 0 20px;">— Variante #${vid} —</p>
${paragraphs}
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0;">
<tr><td align="center"><a href="${trackUrl}" style="display:inline-block;background:#16a34a;color:#fff;font-weight:700;font-size:16px;padding:16px 36px;border-radius:8px;text-decoration:none;">Voir mon score Google &rarr;</a></td></tr>
</table>
</td></tr>
<tr><td style="background:#f3f4f6;padding:16px 32px;border-top:1px solid #e5e7eb;">
<p style="font-size:12px;color:#9ca3af;margin:0;">Vous avez reçu cet email car votre établissement est référencé publiquement. Pour ne plus en recevoir : <a href="mailto:contact@thelocalboost.fr" style="color:#9ca3af;">contact@thelocalboost.fr</a></p>
</td></tr>
</table></td></tr></table></body></html>`;

  await axios.post('https://api.brevo.com/v3/smtp/email', {
    sender: { name: process.env.SENDER_NAME, email: process.env.SENDER_EMAIL },
    to: [{ email: 'mandartbrian68@gmail.com', name: 'Brian' }],
    subject: `[v${vid}] ${variant.subject}`,
    htmlContent: html,
  }, { headers: { 'api-key': process.env.BREVO_API_KEY, 'Content-Type': 'application/json' } });

  console.log(`✅ v${vid} — ${variant.subject}`);
  await new Promise(r => setTimeout(r, 800));
}
console.log('\n✅ 20 variantes envoyées à mandartbrian68@gmail.com');
