'use client'

const INCLUDES = [
  'Description Google optimisée pour votre métier et votre ville',
  '4 posts Google hebdomadaires — prêts à copier-coller',
  'Réponses personnalisées à vos avis clients',
  'QR code pour collecter plus d\'avis — à imprimer',
  'Plan d\'action prioritaire basé sur vos vrais concurrents',
  'Script SMS pour demander des avis après chaque prestation',
]

export default function Pricing() {
  return (
    <section id="pricing" className="py-20 px-6 bg-white">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-10">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Tarif</p>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Simple. Une fois. 39€.</h2>
          <p className="text-gray-500">Pas d'abonnement. Pas de contrat. Vous payez une fois, vous recevez tout.</p>
        </div>

        <div className="rounded-2xl border-2 border-green-500 bg-white p-8 shadow-xl">
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-5xl font-extrabold text-gray-900">39€</span>
            <span className="text-gray-400">une seule fois</span>
          </div>
          <p className="text-sm text-gray-500 mb-6">Livré par email sous 48h · Satisfait ou remboursé sous 30 jours</p>

          <ul className="space-y-3 mb-8">
            {INCLUDES.map(f => (
              <li key={f} className="flex items-start gap-2.5 text-sm text-gray-700">
                <span className="text-green-500 shrink-0 mt-0.5 font-bold">✓</span>{f}
              </li>
            ))}
          </ul>

          <a
            href="/analyser"
            className="block w-full rounded-xl bg-green-500 hover:bg-green-400 py-4 text-base font-extrabold text-white transition text-center shadow-lg shadow-green-100"
          >
            Analyser ma fiche gratuitement →
          </a>
          <p className="text-xs text-gray-400 text-center mt-2">L'analyse est gratuite · Vous payez seulement si vous voulez le pack</p>

          <div className="mt-6 pt-5 border-t border-gray-100">
            <div className="flex items-center justify-around gap-2">
              <div className="text-center">
                <p className="text-xs font-bold text-gray-700">vs Agence</p>
                <p className="text-xs text-gray-400">150-500€ · 2-4 semaines</p>
              </div>
              <div className="text-gray-200 text-xl">→</div>
              <div className="text-center">
                <p className="text-xs font-bold text-green-700">LocalBoost</p>
                <p className="text-xs text-gray-400">39€ · 48h · sans contrat</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-2xl bg-amber-50 border border-amber-200 px-5 py-4 text-center">
          <p className="text-sm font-bold text-amber-800">★ Satisfait ou remboursé — 30 jours</p>
          <p className="text-xs text-amber-700 mt-1">Si vous ne voyez pas de différence sur votre fiche dans les 30 jours, remboursement intégral. Aucune question posée.</p>
        </div>

        <p className="text-center text-xs text-gray-300 mt-8">
          LocalBoost · Entreprise française · SIREN 105 578 884 · contact@thelocalboost.fr
        </p>
      </div>
    </section>
  )
}
