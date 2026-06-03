const FEATURES = [
  {
    icon: '📍',
    title: 'Un post Google rédigé par IA chaque semaine',
    desc: 'Adapté à votre métier, votre ville et la saison. Prêt à publier en 1 clic depuis votre tableau de bord.',
    exemple: '"Ce mois-ci, pose de carrelage à Bordeaux — résultat avant/après en photo. Devis gratuit sous 48h. 🔨"',
  },
  {
    icon: '⭐',
    title: 'Réponses aux avis prêtes à publier',
    desc: 'Collez un avis reçu → obtenez 3 réponses personnalisées → publiez en 1 clic. Plus jamais d\'avis sans réponse.',
    exemple: '"Merci beaucoup Mme Martin pour votre confiance ! C\'est une belle rénovation dont nous sommes fiers..."',
  },
  {
    icon: '📊',
    title: 'Vos actions prioritaires chaque semaine',
    desc: 'LocalBoost analyse votre fiche et vous dit exactement quoi faire en premier pour attirer plus de clients. Pas de jargon, juste des actions concrètes.',
    exemple: '"Cette semaine : ajoutez 3 photos et répondez à 2 avis — impact estimé +12% de clics."',
  },
  {
    icon: '📧',
    title: 'Rapport hebdomadaire chaque lundi',
    desc: 'Score de la semaine, contenu prêt, actions prioritaires. Tout dans un email clair, rien à apprendre.',
    exemple: '"Objet : Votre semaine LocalBoost — Post prêt + 2 réponses avis + 3 actions prioritaires"',
  },
]

export default function Modules() {
  return (
    <section id="features" className="py-20 px-6 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            Ce que LocalBoost fait pour vous chaque semaine
          </h2>
          <p className="text-gray-500">Concrètement. Pas de promesses vagues.</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          {FEATURES.map((f, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="text-2xl mb-3">{f.icon}</div>
              <h3 className="font-bold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed mb-3">{f.desc}</p>
              <p className="text-xs text-blue-700 bg-blue-50 rounded-lg px-3 py-2.5 italic leading-relaxed">
                Exemple : {f.exemple}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
