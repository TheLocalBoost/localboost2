export default function HowItWorks() {
  return (
    <section id="comment-ca-marche" className="py-24 px-6 bg-gray-50 border-y border-gray-100">
      <div className="max-w-2xl mx-auto">

        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
          Comment ça marche
        </p>
        <h2 className="text-3xl font-bold text-gray-900 mb-16 leading-tight tracking-tight">
          Trois étapes.<br />Aucune réunion.
        </h2>

        <div className="space-y-12">
          {[
            {
              n: '01',
              title: 'Diagnostic en 60 secondes',
              desc: 'Entrez le nom de votre commerce. On analyse votre fiche Google, vos concurrents locaux, et ce qui vous fait perdre de la visibilité.',
            },
            {
              n: '02',
              title: 'Le dossier est préparé',
              desc: 'Description optimisée, 12 publications prêtes, réponses aux avis, plan d\'action. Tout est basé sur vos vraies données — rien de générique.',
            },
            {
              n: '03',
              title: 'Vous recevez tout par email',
              desc: 'Sous 48h. Prêt à publier directement dans votre fiche Google. Guide de mise en ligne inclus.',
            },
          ].map(({ n, title, desc }) => (
            <div key={n} className="flex gap-8">
              <span className="text-4xl font-bold text-gray-100 shrink-0 leading-none select-none">{n}</span>
              <div className="pt-1">
                <p className="text-base font-semibold text-gray-900 mb-2">{title}</p>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 pt-10 border-t border-gray-200">
          <div className="flex items-baseline gap-6">
            <div>
              <p className="text-2xl font-bold text-gray-200 line-through">150–500€</p>
              <p className="text-xs text-gray-400 mt-1">En agence · 2 à 4 semaines</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">39€</p>
              <p className="text-xs text-gray-400 mt-1">LocalBoost · 48h · sans contrat</p>
            </div>
          </div>
        </div>

      </div>
    </section>
  )
}
