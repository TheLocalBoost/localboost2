const STEPS = [
  {
    n: '1',
    title: 'Analysez votre fiche gratuitement',
    time: '60 secondes',
    desc: 'Entrez le nom de votre commerce et votre ville. On récupère vos vraies données Google en temps réel : score, concurrents qui vous devancent, problèmes détectés, clients perdus estimés.',
    detail: 'Aucune inscription. Aucune carte bancaire. Juste la réalité de votre fiche Google.',
  },
  {
    n: '2',
    title: 'On génère votre pack d\'optimisation',
    time: 'Automatique — basé sur vos vraies données',
    desc: 'Dès votre paiement, notre système analyse votre fiche en profondeur, étudie vos concurrents, et génère un pack 100% personnalisé : description optimisée, posts, réponses aux avis. Rien de générique.',
    detail: 'Ce qu\'une agence fait en 2 semaines pour 300€ — on le fait en quelques minutes pour 39€.',
  },
  {
    n: '3',
    title: 'Vous recevez tout par email en 48h',
    time: 'Livraison sous 48h garantie',
    desc: 'Description Google prête à coller, 4 posts hebdomadaires, réponses personnalisées à vos avis, QR code pour collecter plus d\'avis, plan d\'action prioritaire. Vous publiez en 5 minutes depuis votre téléphone.',
    detail: 'Satisfait ou remboursé sous 30 jours — aucune question posée.',
  },
]

export default function HowItWorks() {
  return (
    <section id="comment-ca-marche" className="py-20 px-6 bg-white">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Comment ça marche</p>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            Simple. Rapide. Fait pour vous.
          </h2>
          <p className="text-gray-500">
            Pas de contrat. Pas de réunion. Pas de formation. Juste des résultats.
          </p>
        </div>

        <div className="space-y-4">
          {STEPS.map(({ n, title, time, desc, detail }) => (
            <div key={n} className="flex gap-3 sm:gap-5 bg-white rounded-2xl border border-gray-100 p-4 sm:p-6 shadow-sm">
              <div className="shrink-0 w-10 h-10 rounded-xl bg-green-500 text-white flex items-center justify-center font-extrabold text-lg">
                {n}
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <h3 className="font-bold text-gray-900 text-[15px] leading-snug">{title}</h3>
                  <span className="shrink-0 text-xs font-bold text-green-700 bg-green-50 px-2.5 py-1 rounded-full whitespace-nowrap">
                    {time}
                  </span>
                </div>
                <p className="text-sm text-gray-500 leading-relaxed mb-2">{desc}</p>
                <p className="text-xs text-green-800 bg-green-50 rounded-lg px-3 py-2 font-medium italic">{detail}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Comparaison agence */}
        <div className="mt-8 rounded-2xl bg-gray-50 border border-gray-100 overflow-hidden">
          <div className="grid grid-cols-2 divide-x divide-gray-200">
            <div className="p-5 text-center">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Agence traditionnelle</p>
              <p className="text-3xl font-extrabold text-red-500 mb-1">150-500€</p>
              <p className="text-xs text-gray-400">2 à 4 semaines de délai</p>
              <p className="text-xs text-gray-400 mt-1">Contrat annuel souvent imposé</p>
            </div>
            <div className="p-5 text-center bg-green-50">
              <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-3">LocalBoost</p>
              <p className="text-3xl font-extrabold text-green-600 mb-1">39€</p>
              <p className="text-xs text-gray-500">Livré en 48h</p>
              <p className="text-xs text-gray-500 mt-1">Sans engagement · Remboursé si insatisfait</p>
            </div>
          </div>
          <div className="px-5 py-3 border-t border-gray-200 text-center">
            <p className="text-xs text-gray-400">Même résultat. Prix divisé par 10. Délai divisé par 14.</p>
          </div>
        </div>

      </div>
    </section>
  )
}
