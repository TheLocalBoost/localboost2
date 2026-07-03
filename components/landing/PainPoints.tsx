export default function PainPoints() {
  return (
    <section className="py-24 px-6 bg-white">
      <div className="max-w-2xl mx-auto">

        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
          Ce que votre fiche vous coûte
        </p>
        <h2 className="text-3xl font-bold text-gray-900 mb-3 leading-tight tracking-tight">
          Chaque problème non corrigé<br />
          est un appel qui part ailleurs.
        </h2>
        <p className="text-gray-500 mb-12">
          Les clients ne cherchent pas plus loin — ils appellent le premier résultat qui inspire confiance.
        </p>

        <div className="space-y-0 border border-gray-100 rounded-xl overflow-hidden">
          {[
            {
              problem: 'Aucun post depuis plus de 2 mois',
              consequence: 'Google considère la fiche abandonnée et la descend dans les résultats.',
              freq: 'Très fréquent',
            },
            {
              problem: 'Description absente ou générique',
              consequence: 'Le visiteur ne comprend pas ce que vous faites. Il passe au suivant.',
              freq: 'Fréquent',
            },
            {
              problem: 'Avis sans réponse',
              consequence: 'Signal négatif pour l\'algorithme. Signal négatif pour le client.',
              freq: 'Très fréquent',
            },
          ].map(({ problem, consequence, freq }, i) => (
            <div key={i} className={`px-5 py-5 ${i > 0 ? 'border-t border-gray-100' : ''}`}>
              <div className="flex items-start justify-between gap-4 mb-1">
                <p className="text-sm font-semibold text-gray-900">{problem}</p>
                <span className="text-xs text-gray-400 shrink-0 pt-0.5">{freq}</span>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed">{consequence}</p>
            </div>
          ))}
        </div>

        <div className="mt-10">
          <a
            href="/analyser"
            className="inline-block rounded-lg bg-gray-900 px-6 py-3 text-sm font-semibold text-white hover:bg-gray-700 transition"
          >
            Voir l&apos;état de ma fiche →
          </a>
          <p className="text-xs text-gray-400 mt-3">Gratuit · Résultat personnalisé en 60 secondes</p>
        </div>

      </div>
    </section>
  )
}
