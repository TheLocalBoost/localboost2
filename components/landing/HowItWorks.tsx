const STEPS = [
  {
    n: '1',
    title: 'Vous configurez votre commerce en 3 minutes',
    time: '3 min — une fois',
    desc: 'Nom, ville, type d\'activité. LocalBoost comprend votre métier et génère du contenu adapté à votre secteur.',
    example: '→ "Plombier à Lyon, spécialiste rénovation salle de bain"',
  },
  {
    n: '2',
    title: 'Chaque lundi, votre contenu arrive dans votre boîte mail',
    time: 'Automatique, chaque semaine',
    desc: 'Un post Google Business rédigé par IA, des réponses prêtes pour vos avis, et votre score de visibilité de la semaine.',
    example: '→ "Votre post du lundi : Intervention rapide ce week-end pour une fuite sous l\'évier..."',
  },
  {
    n: '3',
    title: 'Vous copiez-collez en 30 secondes sur Google Business',
    time: '30 sec / semaine',
    desc: 'Aucune application. Aucune formation. Vous ouvrez votre email, vous copiez, vous collez sur Google Business. C\'est tout.',
    example: '→ Résultat : fiche active, score en hausse, clients qui appellent',
  },
]

export default function HowItWorks() {
  return (
    <section id="how" className="py-20 px-6 bg-white">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            Opérationnel en 3 minutes
          </h2>
          <p className="text-gray-500">Pas de technique. Pas de formation. Juste votre email du lundi.</p>
        </div>

        <div className="space-y-4">
          {STEPS.map(({ n, title, time, desc, example }) => (
            <div key={n} className="flex gap-5 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
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
                <p className="text-xs text-blue-700 bg-blue-50 rounded-lg px-3 py-2 font-medium">{example}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <a
            href="/signup"
            className="inline-block rounded-xl bg-blue-600 px-8 py-4 text-sm font-bold text-white hover:bg-blue-700 transition"
          >
            Démarrer mon essai gratuit →
          </a>
          <p className="text-xs text-gray-400 mt-2">0€ pendant 7 jours · Sans engagement · Annulation en 1 clic</p>
        </div>
      </div>
    </section>
  )
}
