const LOCALBOOST_FEATURES = [
  'Post Google Business généré chaque semaine par l\'IA',
  'Réponses automatiques à vos avis clients',
  'Score de visibilité suivi chaque semaine',
  'Email récap chaque lundi — copier-coller en 30 secondes',
]

const DEVISBOOST_FEATURES = [
  'Décrivez votre chantier en langage naturel',
  'Devis professionnel généré en 30 secondes',
  'PDF prêt à envoyer au client',
  'Relances automatiques si pas de réponse',
]

export default function Modules() {
  return (
    <section id="modules" className="py-20 px-6 bg-white">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-3">
          Deux outils. Une plateforme. Zéro prise de tête.
        </h2>
        <p className="text-gray-400 text-center mb-12">
          Choisissez le module qui vous correspond — ou les deux.
        </p>

        <div className="grid sm:grid-cols-2 gap-6">
          {/* LocalBoost */}
          <div className="rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <div className="bg-blue-600 px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">📍</span>
                <div>
                  <p className="text-xs font-medium text-blue-200 uppercase tracking-wide">Module 1</p>
                  <h3 className="font-bold text-white text-lg">LocalBoost</h3>
                </div>
              </div>
              <span className="text-sm font-medium text-blue-100">Visibilité Google</span>
            </div>
            <div className="p-6">
              <ul className="space-y-3 mb-6">
                {LOCALBOOST_FEATURES.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="text-blue-500 mt-0.5 shrink-0">✓</span>{f}
                  </li>
                ))}
              </ul>
              <div className="border-t border-gray-100 pt-5">
                <div className="flex items-baseline gap-1 mb-0.5">
                  <span className="text-3xl font-extrabold text-gray-900">59€</span>
                  <span className="text-gray-400">/mois</span>
                </div>

                <a
                  href="/signup"
                  className="block w-full rounded-xl bg-blue-600 py-3 text-center text-sm font-semibold text-white hover:bg-blue-700 transition"
                >
                  Essayer LocalBoost →
                </a>
              </div>
            </div>
          </div>

          {/* DevisBoost */}
          <div className="rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <div className="bg-green-600 px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">📋</span>
                <div>
                  <p className="text-xs font-medium text-green-200 uppercase tracking-wide">Module 2</p>
                  <h3 className="font-bold text-white text-lg">DevisBoost</h3>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 bg-white/20 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                Nouveau ✨
              </span>
            </div>
            <div className="p-6">
              <ul className="space-y-3 mb-6">
                {DEVISBOOST_FEATURES.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="text-green-500 mt-0.5 shrink-0">✓</span>{f}
                  </li>
                ))}
              </ul>
              <div className="border-t border-gray-100 pt-5">
                <div className="flex items-baseline gap-1 mb-0.5">
                  <span className="text-3xl font-extrabold text-gray-900">39€</span>
                  <span className="text-gray-400">/mois</span>
                </div>

                <a
                  href="/devisboost/dashboard"
                  className="block w-full rounded-xl bg-green-600 py-3 text-center text-sm font-semibold text-white hover:bg-green-700 transition"
                >
                  Essayer DevisBoost →
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
