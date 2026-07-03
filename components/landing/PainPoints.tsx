const PROBLEMS = [
  {
    icon: '🕐',
    title: 'Horaires incorrects',
    impact: '8 à 15 appels perdus / mois',
  },
  {
    icon: '📸',
    title: 'Pas de photos récentes',
    impact: '5 à 10 appels perdus / mois',
  },
  {
    icon: '📅',
    title: 'Aucun post depuis 3 mois',
    impact: '10 à 20 appels perdus / mois',
  },
]

export default function PainPoints() {
  return (
    <section className="py-16 px-6 bg-gray-50 border-y border-gray-100">
      <div className="max-w-3xl mx-auto text-center">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Ce que votre fiche vous coûte</p>
        <h2 className="text-2xl font-extrabold text-gray-900 mb-10">Chaque problème non corrigé est un appel perdu.</h2>

        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          {PROBLEMS.map(({ icon, title, impact }) => (
            <div key={title} className="bg-white rounded-2xl border border-gray-100 p-6 text-center shadow-sm">
              <p className="text-3xl mb-3">{icon}</p>
              <p className="font-bold text-gray-900 text-sm mb-2">{title}</p>
              <p className="text-xs font-semibold text-red-500">{impact}</p>
            </div>
          ))}
        </div>

        <a
          href="/analyser"
          className="inline-block rounded-xl bg-green-500 px-8 py-4 text-sm font-bold text-white hover:bg-green-400 transition shadow-md"
        >
          Voir ce qui bloque ma fiche →
        </a>
        <p className="text-xs text-gray-400 mt-2">Gratuit · Résultat en 60 secondes</p>
      </div>
    </section>
  )
}
