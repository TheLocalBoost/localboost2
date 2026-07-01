const ITEMS = [
  {
    icon: '📝',
    title: 'Description Google optimisée',
    desc: 'Rédigée pour votre métier et votre ville. Prête à publier directement dans votre fiche Google en quelques minutes.',
  },
  {
    icon: '📅',
    title: '12 publications — 1 par semaine pendant 3 mois',
    desc: 'Saisonnières, conseils, promotions, témoignages... Votre fiche reste active 3 mois sans que vous ayez à y penser.',
  },
  {
    icon: '⭐',
    title: 'Réponses personnalisées à vos avis',
    desc: 'Chaque réponse cite le prénom du client et un détail de son avis. Plus 10 modèles réutilisables pour vos futurs avis.',
  },
  {
    icon: '📲',
    title: 'QR code collecte d\'avis + script SMS',
    desc: 'À afficher en boutique ou à envoyer après chaque prestation. Vos clients laissent un avis en 30 secondes.',
  },
  {
    icon: '🎯',
    title: 'Plan d\'action concurrentiel',
    desc: 'Basé sur l\'analyse de vos vrais concurrents locaux. Les priorités concrètes pour dépasser ceux qui vous devancent.',
  },
  {
    icon: '📋',
    title: 'Guide de mise en ligne pas à pas',
    desc: 'Tout mettre en ligne en moins de 10 minutes. Instructions claires, dans le bon ordre.',
  },
]

export default function Deliverables() {
  return (
    <section className="py-20 px-6 bg-gray-50 border-y border-gray-100">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Ce que vous recevez</p>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            Votre pack complet livré par email en 48h
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            Tout ce qu'une agence prépare en 2 semaines pour 300€ — généré à partir de vos vraies données Google, personnalisé pour votre commerce.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          {ITEMS.map(({ icon, title, desc }) => (
            <div key={title} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <span className="text-2xl shrink-0">{icon}</span>
                <div>
                  <p className="font-bold text-gray-900 text-sm mb-1">{title}</p>
                  <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-2xl bg-green-50 border border-green-200 p-6 text-center">
          <p className="text-green-800 font-bold text-lg mb-1">Tout ça pour 39€ — livré en 48h</p>
          <p className="text-green-700 text-sm mb-4">Satisfait ou remboursé sous 30 jours · Sans engagement · Sans inscription</p>
          <a
            href="/analyser"
            className="inline-block rounded-xl bg-green-500 hover:bg-green-400 px-8 py-3.5 text-base font-extrabold text-white transition shadow-lg"
          >
            Analyser ma fiche gratuitement →
          </a>
          <p className="text-xs text-green-600 mt-3">L'analyse est gratuite. Vous décidez après.</p>
        </div>
      </div>
    </section>
  )
}
