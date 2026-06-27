import Link from 'next/link'

const BUSINESS = {
  name: 'Plomberie Durand',
  city: 'Lyon',
  rating: 4.2,
  reviews: 38,
  score: 41,
}

const DESCRIPTION = `Plombier à Lyon depuis plus de 12 ans, Plomberie Durand intervient sur tous vos problèmes de plomberie en urgence ou sur rendez-vous. Dépannage fuite d'eau, remplacement chauffe-eau, débouchage canalisation, installation sanitaire — nous intervenons dans Lyon et sa périphérie (Lyon 1er au 9ème, Villeurbanne, Caluire, Vénissieux) en moins de 2h pour les urgences.

Notre équipe de plombiers certifiés RGE prend en charge les particuliers et les professionnels. Devis gratuit, travaux garantis, facturation transparente. Nous travaillons avec toutes les marques (Grohe, Hansgrohe, Chaffoteaux, Atlantic, Daikin) et intervenons sur les chaudières gaz, pompes à chaleur et systèmes de climatisation.

Contactez-nous au 04 78 XX XX XX pour une intervention rapide à Lyon.`

const POSTS = [
  {
    week: 1,
    text: `❄️ Hiver lyonnais : pensez à vérifier vos tuyaux avant les grands froids.

Une canalisation mal isolée peut geler et éclater — dégât des eaux garanti. Chez Plomberie Durand, on réalise un diagnostic complet de votre installation avant l'hiver pour éviter les mauvaises surprises.

Intervention rapide dans tout Lyon et Villeurbanne. Appelez-nous avant qu'il soit trop tard.

#Lyon #Plombier #PlomberieDurand`,
  },
  {
    week: 2,
    text: `🚨 Fuite d'eau à Lyon ? Chaque minute compte.

Une fuite non traitée peut causer des milliers d'euros de dégâts en quelques heures. Plomberie Durand intervient en urgence en moins de 2h dans tout Lyon — même le soir et le weekend.

Coupez l'arrivée d'eau principale, puis appelez-nous. On s'occupe du reste.

#UrgencePlombier #Lyon #PlomberieDurand`,
  },
  {
    week: 3,
    text: `💡 Le saviez-vous ? Un robinet qui goutte = 120 litres d'eau perdus par jour.

C'est 3 600€ de facture d'eau supplémentaire par an pour une fuite invisible. Un joint usé, un mécanisme de chasse d'eau défaillant — des réparations simples à moins de 80€ qui évitent des factures à 4 chiffres.

On passe chez vous dans la journée sur Lyon.

#Plomberie #EauEtEconomie #Lyon`,
  },
  {
    week: 4,
    text: `🏠 Vous renovez votre salle de bain à Lyon ?

Plomberie Durand prend en charge l'intégralité de vos travaux de plomberie : dépose de l'ancienne installation, redistribution des arrivées d'eau, pose douche à l'italienne, baignoire, meuble vasque. Devis gratuit sous 24h.

Nos réalisations récentes sur Lyon 6 et Caluire disponibles sur demande.

#SalleDeBain #Renovation #Lyon #PlomberieDurand`,
  },
]

const REVIEWS = [
  {
    author: 'Martine G.',
    rating: 5,
    text: 'Intervention rapide pour une fuite sous évier, très professionnel et prix honnête.',
    response: `Merci beaucoup Martine pour ce retour ! Contente que l'intervention ait pu être rapide — une fuite sous évier ça peut vite faire des dégâts. N'hésitez pas à nous rappeler pour tout futur besoin. À bientôt ! Plomberie Durand`,
  },
  {
    author: 'Jean-Pierre L.',
    rating: 4,
    text: 'Bon travail pour le remplacement du chauffe-eau, un peu long à arriver mais résultat impeccable.',
    response: `Merci Jean-Pierre pour votre retour et votre compréhension sur le délai d'intervention — les remplacements de chauffe-eau sont particulièrement demandés en ce moment. Ravi que le résultat soit à la hauteur. Bonne continuation ! Plomberie Durand`,
  },
  {
    author: 'Sophie M.',
    rating: 5,
    text: 'Excellent, ponctuel et efficace. Je recommande sans hésiter pour un débouchage urgent.',
    response: `Merci Sophie ! Un débouchage en urgence c'est jamais agréable, on est contents d'avoir pu intervenir rapidement. Merci pour votre confiance et à bientôt si besoin ! Plomberie Durand`,
  },
]

const QR_URL = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent('https://search.google.com/local/writereview?placeid=ChIJexample')}&color=1a1a1a&bgcolor=ffffff`

const PRIORITE = `Votre dernier post Google date de plus de 4 mois. Google classe votre fiche en dessous de vos 3 concurrents directs à Lyon qui publient chaque semaine. Publiez le Post 1 (ci-dessus) cette semaine — c'est le signal le plus rapide pour remonter dans le Pack local.`

export default function ExemplePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-2 text-xl font-bold text-gray-900 mb-6">
            <span>📍</span><span>LocalBoost</span>
          </Link>
          <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-4 py-1.5 mb-4">
            <span className="text-green-600 text-sm font-semibold">Exemple réel anonymisé</span>
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 mb-2">
            Voici exactement ce que vous recevrez
          </h1>
          <p className="text-gray-500 text-sm max-w-md mx-auto">
            Ce pack a été généré pour une vraie fiche Google. Chaque élément est personnalisé — nom, ville, concurrents, avis réels.
          </p>
        </div>

        {/* Situation initiale */}
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 mb-4">
          <p className="text-xs font-bold text-red-700 uppercase tracking-wide mb-3">Situation avant le pack</p>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-2xl font-extrabold text-red-600">{BUSINESS.score}</p>
              <p className="text-xs text-gray-500 mt-0.5">Score Google /100</p>
            </div>
            <div>
              <p className="text-2xl font-extrabold text-red-600">{BUSINESS.rating}★</p>
              <p className="text-xs text-gray-500 mt-0.5">{BUSINESS.reviews} avis</p>
            </div>
            <div>
              <p className="text-2xl font-extrabold text-red-600">#4</p>
              <p className="text-xs text-gray-500 mt-0.5">Position Google</p>
            </div>
          </div>
          <p className="text-xs text-red-600 text-center mt-3 font-medium">
            3 concurrents avec moins d'avis apparaissent avant {BUSINESS.name} à {BUSINESS.city}
          </p>
        </div>

        {/* Priorité semaine */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-4">
          <p className="text-xs font-bold text-amber-800 uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <span>📍</span> Action prioritaire cette semaine
          </p>
          <p className="text-sm text-amber-900 leading-relaxed">{PRIORITE}</p>
        </div>

        {/* Description */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-4">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <span>📍</span> Description Google optimisée
          </p>
          <p className="text-xs text-gray-400 mb-3">À coller dans Google Business → Infos → Description</p>
          <div className="bg-gray-50 rounded-xl border border-gray-100 px-4 py-4">
            <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-line">{DESCRIPTION}</p>
          </div>
          <p className="text-xs text-gray-400 mt-2 text-right">{DESCRIPTION.split(' ').length} mots</p>
        </div>

        {/* 4 Posts */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-4">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 flex items-center gap-1.5">
            <span>📍</span> 4 posts Google — 1 par semaine
          </p>
          <p className="text-xs text-gray-400 mb-4">Google Business → Ajouter une mise à jour → Copier/coller</p>
          <div className="space-y-3">
            {POSTS.map((post, i) => (
              <div key={i} className="bg-gray-50 rounded-xl border border-gray-100 p-4">
                <p className="text-xs font-bold text-gray-400 mb-2">Semaine {post.week}</p>
                <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-line">{post.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Réponses avis */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-4">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 flex items-center gap-1.5">
            <span>📍</span> Réponses aux avis clients
          </p>
          <p className="text-xs text-gray-400 mb-4">Une réponse personnalisée pour chaque avis récent</p>
          <div className="space-y-4">
            {REVIEWS.map((r, i) => (
              <div key={i} className="space-y-2">
                <div className="bg-gray-50 rounded-xl border border-gray-100 p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-gray-700">{r.author}</span>
                    <span className="text-xs text-amber-500">{'★'.repeat(r.rating)}</span>
                  </div>
                  <p className="text-xs text-gray-500 italic">"{r.text}"</p>
                </div>
                <div className="bg-green-50 rounded-xl border border-green-100 p-3 ml-4">
                  <p className="text-xs font-bold text-green-700 mb-1">Votre réponse</p>
                  <p className="text-xs text-gray-700 leading-relaxed">{r.response}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* QR Code */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-4 text-center">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 flex items-center gap-1.5 justify-center">
            <span>📍</span> QR code — collecte d'avis
          </p>
          <p className="text-xs text-gray-400 mb-4">À imprimer en caisse, sur vos factures ou votre vitrine</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={QR_URL} width={160} height={160} alt="QR code avis Google" className="mx-auto rounded-xl border border-gray-200" />
          <p className="text-xs text-gray-400 mt-3">Vos clients scannent → laissent un avis en 30 secondes</p>
        </div>

        {/* SMS Script */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 flex items-center gap-1.5">
            <span>📍</span> SMS à envoyer après chaque intervention
          </p>
          <p className="text-xs text-gray-400 mb-3">Copiez-collez depuis votre téléphone</p>
          <div className="bg-gray-50 rounded-xl border border-gray-100 p-4">
            <p className="text-sm text-gray-800 leading-relaxed">
              Bonjour [Prénom] ! C'est {BUSINESS.name}. Merci pour votre confiance 🙏 Si vous avez 30 secondes, un avis Google nous aiderait beaucoup : [lien QR code]
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gray-900 rounded-2xl p-6 text-center">
          <p className="text-white font-extrabold text-lg mb-1">Ce pack, pour votre fiche</p>
          <p className="text-gray-400 text-sm mb-5">
            Généré avec vos vraies données Google — note, avis, concurrents, ville.
          </p>
          <Link
            href="/analyser"
            className="inline-block bg-green-500 hover:bg-green-400 text-white font-extrabold text-base px-8 py-4 rounded-xl transition"
          >
            Analyser ma fiche — gratuit →
          </Link>
          <p className="text-gray-500 text-xs mt-3">Résultat en 30 secondes · Pack livré sous 48h pour 39€</p>
        </div>

        <p className="text-center text-xs text-gray-300 mt-6">
          LocalBoost · contact@thelocalboost.fr
        </p>
      </div>
    </div>
  )
}
