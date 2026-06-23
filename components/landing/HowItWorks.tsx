const STEPS = [
  {
    n: '1',
    title: 'Configurez votre commerce en 3 minutes — une seule fois',
    time: '3 min · une fois',
    desc: 'Nom, ville, type d\'activité. LocalBoost comprend votre métier et prépare du contenu adapté à votre secteur, votre ville et la saison.',
    detail: 'Exemple : "Plombier à Lyon, urgences fuites et rénovation salle de bain" — c\'est tout ce qu\'il faut.',
  },
  {
    n: '2',
    title: 'LocalBoost travaille pendant que vous travaillez',
    time: 'Chaque lundi dans votre tableau de bord',
    desc: 'Post Google rédigé et prêt à publier, réponses personnalisées pour vos nouveaux avis, actions concrètes pour recevoir plus d\'appels — tout dans votre tableau de bord chaque lundi.',
    detail: 'Pendant que vous êtes sur chantier, LocalBoost a préparé votre contenu de la semaine.',
  },
  {
    n: '3',
    title: 'Vous publiez en 30 secondes. C\'est tout.',
    time: '≈ 5 min / semaine',
    desc: 'Vous copiez votre post sur Google Business, vous publiez les réponses aux avis préparées. C\'est le seul moment où vous intervenez.',
    detail: 'Résultat : fiche active chaque semaine · vous remontez sur Google · des clients qui appellent.',
  },
]

export default function HowItWorks() {
  return (
    <section id="how" className="py-20 px-6 bg-white">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            Comment LocalBoost fonctionne
          </h2>
          <p className="text-gray-500">
            Vous faites votre métier. LocalBoost prépare tout — vous publiez en 5 min.
          </p>
        </div>

        <div className="space-y-4">
          {STEPS.map(({ n, title, time, desc, detail }) => (
            <div key={n} className="flex gap-3 sm:gap-5 bg-white rounded-2xl border border-gray-100 p-4 sm:p-6 shadow-sm">
              <div className="shrink-0 w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-extrabold text-lg">
                {n}
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <h3 className="font-bold text-gray-900 text-[15px] leading-snug">{title}</h3>
                  <span className="shrink-0 text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full whitespace-nowrap">
                    {time}
                  </span>
                </div>
                <p className="text-sm text-gray-500 leading-relaxed mb-2">{desc}</p>
                <p className="text-xs text-blue-700 bg-blue-50 rounded-lg px-3 py-2 font-medium italic">{detail}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Récapitulatif temps */}
        <div className="mt-8 rounded-2xl bg-gray-50 border border-gray-100 p-5">
          <div className="flex items-center justify-between gap-4">
            <div className="text-center flex-1">
              <p className="text-sm text-gray-500 mb-1">Sans LocalBoost</p>
              <p className="text-2xl font-extrabold text-red-500">2h30/semaine</p>
              <p className="text-xs text-gray-400 mt-1">de travail régulier</p>
            </div>
            <div className="text-3xl text-gray-300">→</div>
            <div className="text-center flex-1">
              <p className="text-sm text-gray-500 mb-1">Avec LocalBoost</p>
              <p className="text-2xl font-extrabold text-blue-600">5 min/semaine</p>
              <p className="text-xs text-gray-400 mt-1">pour publier, c'est tout</p>
            </div>
          </div>
          <p className="text-xs text-gray-400 text-center mt-4 border-t border-gray-200 pt-3">
            Votre fiche n'est jamais inactive — peu importe votre emploi du temps.
          </p>
        </div>

      </div>
    </section>

  )
}
