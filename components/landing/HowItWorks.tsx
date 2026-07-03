const STEPS = [
  {
    n: '1',
    title: 'Diagnostic gratuit en 60 secondes',
    desc: 'Entrez le nom de votre commerce. On analyse votre fiche, vos concurrents, et on identifie ce qui vous fait perdre des appels.',
    badge: '60 secondes',
  },
  {
    n: '2',
    title: 'Votre dossier est préparé',
    desc: 'Description, 12 publications, réponses aux avis, plan d\'action. Tout est personnalisé — rien de générique.',
    badge: 'Quelques secondes',
  },
  {
    n: '3',
    title: 'Vous recevez tout par email',
    desc: 'Prêt à publier. Vous mettez en ligne en moins de 10 minutes.',
    badge: 'Livré en 48h',
  },
]

export default function HowItWorks() {
  return (
    <section id="comment-ca-marche" className="py-20 px-6 bg-white">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Comment ça marche</p>
          <h2 className="text-3xl font-extrabold text-gray-900">Simple. Rapide. Fait pour vous.</h2>
        </div>

        <div className="space-y-4 mb-10">
          {STEPS.map(({ n, title, desc, badge }) => (
            <div key={n} className="flex gap-4 bg-gray-50 rounded-2xl p-5">
              <div className="shrink-0 w-10 h-10 rounded-xl bg-green-500 text-white flex items-center justify-center font-extrabold text-lg">
                {n}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between gap-3 mb-1">
                  <p className="font-bold text-gray-900 text-sm">{title}</p>
                  <span className="shrink-0 text-xs font-bold text-green-700 bg-green-100 px-2.5 py-1 rounded-full">{badge}</span>
                </div>
                <p className="text-sm text-gray-500">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-2xl bg-white border border-gray-100 overflow-hidden shadow-sm">
          <div className="grid grid-cols-2 divide-x divide-gray-100">
            <div className="p-5 text-center">
              <p className="text-xs font-semibold text-gray-400 mb-3">Agence</p>
              <p className="text-2xl font-extrabold text-red-500 mb-1">150–500€</p>
              <p className="text-xs text-gray-400">2 à 4 semaines</p>
            </div>
            <div className="p-5 text-center bg-green-50">
              <p className="text-xs font-semibold text-green-700 mb-3">LocalBoost</p>
              <p className="text-2xl font-extrabold text-green-600 mb-1">39€</p>
              <p className="text-xs text-gray-500">48h · sans contrat</p>
            </div>
          </div>
          <p className="text-xs text-gray-400 text-center py-3 border-t border-gray-100">Même résultat. Prix divisé par 10.</p>
        </div>
      </div>
    </section>
  )
}
