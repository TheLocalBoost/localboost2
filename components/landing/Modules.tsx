const FEATURES = [
  {
    icon: '📍',
    title: 'Un post Google rédigé chaque semaine',
    without: 'Trouver une idée, rédiger, formater, publier — 30 min minimum',
    desc: 'Adapté à votre métier, votre ville et la saison. Prêt à publier en 1 clic depuis votre tableau de bord.',
    exemple: '"Pose de carrelage à Bordeaux — résultat avant/après en photo. Devis gratuit sous 48h."',
  },
  {
    icon: '⭐',
    title: 'Réponses aux avis prêtes à publier',
    without: 'Relire l\'avis, trouver les bons mots, répondre — 15 min par avis',
    desc: 'Chaque avis reçoit une réponse personnalisée, prête à copier-coller. Plus jamais d\'avis sans réponse.',
    exemple: '"Merci beaucoup Mme Martin ! Ravi que la rénovation vous ait plu, à bientôt..."',
  },
  {
    icon: '📊',
    title: 'Priorités d\'action chaque semaine',
    without: 'Analyser sa fiche soi-même, comprendre quoi faire — 20 min hebdo',
    desc: 'LocalBoost analyse votre fiche et vous dit exactement quoi faire en premier, avec l\'impact estimé.',
    exemple: '"Cette semaine : ajoutez 3 photos et répondez à 2 avis — pour recevoir plus d\'appels cette semaine."',
  },
  {
    icon: '📧',
    title: 'Rapport hebdomadaire chaque lundi',
    without: 'Aucun équivalent possible sans y passer du temps',
    desc: 'Score de la semaine, contenu prêt, actions prioritaires. Tout dans un email clair, rien à apprendre.',
    exemple: '"Objet : Votre semaine LocalBoost — Post prêt + 2 réponses avis + 3 actions prioritaires"',
  },
]

export default function Modules() {
  return (
    <section id="features" className="py-20 px-6 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            Le travail qu'une bonne fiche exige — préparé chaque semaine pour vous
          </h2>
          <p className="text-gray-500">
            Concrètement. Ce que vous feriez vous-même, versus ce que LocalBoost prépare.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {FEATURES.map((f, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="text-2xl mb-3">{f.icon}</div>
              <h3 className="font-bold text-gray-900 mb-2">{f.title}</h3>
              <div className="flex items-start gap-2 mb-3 rounded-lg bg-red-50 px-3 py-2">
                <span className="text-red-400 text-xs shrink-0 mt-0.5">✗</span>
                <p className="text-xs text-red-600">Seul : {f.without}</p>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed mb-3">{f.desc}</p>
              <p className="text-xs text-blue-700 bg-blue-50 rounded-lg px-3 py-2.5 italic leading-relaxed">
                {f.exemple}
              </p>
            </div>
          ))}
        </div>

        {/* Résumé total */}
        <div className="mt-8 bg-white rounded-2xl border border-gray-100 p-6">
          <div className="grid grid-cols-2 gap-6 text-center">
            <div>
              <p className="text-3xl font-extrabold text-blue-600">~5 min</p>
              <p className="text-xs text-gray-500 mt-1">par semaine de votre côté<br/>pour tout publier</p>
            </div>
            <div>
              <p className="text-3xl font-extrabold text-gray-900">52×</p>
              <p className="text-xs text-gray-500 mt-1">par an, sans exception<br/>votre fiche reste active</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
