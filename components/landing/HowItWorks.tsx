const STEPS = [
  { n: '1', title: 'Créez votre compte et configurez votre commerce', time: '2 min', desc: 'Renseignez votre nom, ville et type d\'activité. L\'IA s\'adapte automatiquement à votre secteur.' },
  { n: '2', title: 'L\'IA analyse votre activité et génère votre contenu', time: '30 sec', desc: 'Post Google Business, réponses aux avis, score de visibilité — tout est prêt chaque semaine.' },
  { n: '3', title: 'Vous recevez tout par email — copiez-collez en 30 secondes', time: '0 effort', desc: 'Chaque lundi matin dans votre boîte mail. Aucune application à ouvrir, aucun outil à apprendre.' },
]

export default function HowItWorks() {
  return (
    <section className="py-20 px-6 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-3">
          Opérationnel en 3 minutes chrono
        </h2>
        <p className="text-gray-400 text-center mb-12">Pas de technique. Pas de formation. Juste des résultats.</p>

        <div className="space-y-6">
          {STEPS.map(({ n, title, time, desc }) => (
            <div key={n} className="flex gap-5 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <div className="shrink-0 w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg">
                {n}
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between gap-4">
                  <h3 className="font-semibold text-gray-900 text-[15px] leading-snug">{title}</h3>
                  <span className="shrink-0 text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">{time}</span>
                </div>
                <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
