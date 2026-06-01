const FEATURES = [
  {
    icon: '📍',
    title: 'Un post Google Business chaque semaine',
    desc: 'L\'IA génère un post adapté à votre activité, votre ville et la saison. Vous copiez-collez en 30 secondes sur Google Business.',
    exemple: '"Ce mois-ci, pose de carrelage à Bordeaux — résultat avant/après en photo. Devis gratuit sous 48h. 🔨"',
  },
  {
    icon: '⭐',
    title: 'Réponses aux avis prêtes à publier',
    desc: 'Collez un avis reçu → obtenez 3 réponses personnalisées et professionnelles → publiez en 1 clic. Plus jamais d\'avis sans réponse.',
    exemple: '"Merci beaucoup Mme Martin pour votre confiance ! C\'est une belle rénovation dont nous sommes fiers..."',
  },
  {
    icon: '📊',
    title: 'Score de visibilité suivi chaque semaine',
    desc: 'Suivez l\'évolution de votre fiche Google en temps réel. Comparez-vous à vos concurrents directs dans votre ville.',
    exemple: 'Score 34 → 78 en 30 jours. Position Google Maps : #4 → #2.',
  },
  {
    icon: '📧',
    title: 'Tout dans votre boîte mail le lundi matin',
    desc: 'Aucune application à installer, aucun outil à apprendre. Votre contenu de la semaine arrive directement par email.',
    exemple: '"Objet : Votre semaine LocalBoost — Post prêt + 2 réponses avis + score 78/100 ▲+5"',
  },
]

export default function Modules() {
  return (
    <section id="features" className="py-20 px-6 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            Ce que vous recevez chaque semaine
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
