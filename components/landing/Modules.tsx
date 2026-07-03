const FEATURES = [
  { icon: '📅', title: '1 post par semaine', sub: 'Rédigé pour votre métier et votre ville. Prêt à publier.' },
  { icon: '⭐', title: 'Réponses aux avis', sub: 'Personnalisées, prêtes à copier-coller.' },
  { icon: '📊', title: 'Priorités d\'action', sub: 'Ce qui a le plus d\'impact cette semaine, en clair.' },
  { icon: '📧', title: 'Rapport du lundi', sub: 'Score, contenu prêt, actions. Un email, rien à apprendre.' },
]

export default function Modules() {
  return (
    <section id="features" className="py-20 px-6 bg-white">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Comment ça marche</p>
          <h2 className="text-3xl font-extrabold text-gray-900 mb-3">
            Le travail d'une bonne fiche, préparé chaque semaine.
          </h2>
          <p className="text-gray-500">Vous publiez. LocalBoost prépare.</p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          {FEATURES.map(({ icon, title, sub }) => (
            <div key={title} className="bg-gray-50 rounded-2xl border border-gray-100 p-6">
              <p className="text-2xl mb-3">{icon}</p>
              <p className="font-bold text-gray-900 text-sm mb-1">{title}</p>
              <p className="text-xs text-gray-500 leading-relaxed">{sub}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
          <p className="text-3xl font-extrabold text-blue-600 mb-1">~5 min</p>
          <p className="text-sm text-gray-500">par semaine de votre côté pour tout publier</p>
        </div>
      </div>
    </section>
  )
}
