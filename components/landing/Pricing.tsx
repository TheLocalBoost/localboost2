const FEATURES = [
  'Post Google Business hebdomadaire par IA',
  'Réponses aux avis illimitées',
  'Score de visibilité hebdomadaire',
  'Email récap chaque lundi matin',
  'Collecte d\'avis automatisée',
  'Audit de fiche Google complet',
  'Vérification cohérence NAP (annuaires)',
  'Sans engagement — annulation en 1 clic',
]

export default function Pricing() {
  return (
    <section id="pricing" className="py-20 px-6 bg-white">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Un prix. Tout inclus.</h2>
          <p className="text-gray-500">Un seul client récupéré rembourse 6 mois d'abonnement.</p>
        </div>

        <div className="rounded-2xl border-2 border-blue-500 bg-white p-8 shadow-lg">

          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-xs font-semibold text-blue-700 mb-5">
            🔥 Prix de lancement — places limitées
          </div>

          {/* Ancrage ROI */}
          <div className="bg-red-50 border border-red-100 rounded-xl p-3 mb-6 text-sm text-center">
            <span className="text-red-600 font-semibold">Vous perdez ~150 à 450€/mois</span>
            <span className="text-gray-500"> en clients non trouvés sur Google.</span>
          </div>

          {/* Prix */}
          <div className="flex items-baseline justify-center gap-1 mb-1">
            <span className="text-5xl font-extrabold text-gray-900">29€</span>
            <span className="text-gray-400 text-lg">/mois</span>
          </div>
          <p className="text-center text-xs text-gray-400 mb-1">après 7 jours gratuits</p>
          <p className="text-center text-xs text-green-600 font-semibold mb-7">
            ✓ 0€ débité pendant l'essai
          </p>

          {/* Features */}
          <ul className="space-y-3 mb-8">
            {FEATURES.map(f => (
              <li key={f} className="flex items-start gap-2.5 text-sm text-gray-700">
                <span className="text-blue-500 shrink-0 mt-0.5 font-bold">✓</span>{f}
              </li>
            ))}
          </ul>

          <a
            href="/signup"
            className="block w-full rounded-xl bg-blue-600 py-4 text-sm font-bold text-white hover:bg-blue-700 transition text-center"
          >
            Démarrer 7 jours gratuits →
          </a>
          <p className="text-xs text-gray-400 text-center mt-3">
            Carte requise · 0€ débité avant J+7 · Résiliation en 1 clic
          </p>
        </div>

        {/* Garantie */}
        <div className="mt-5 bg-gray-50 rounded-xl p-4 text-center">
          <p className="text-sm text-gray-600">
            🛡️ <strong>Satisfait ou remboursé 30 jours.</strong> Si LocalBoost ne vous convient pas, on rembourse sans question.
          </p>
        </div>
      </div>
    </section>
  )
}
