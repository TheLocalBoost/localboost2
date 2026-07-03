export default function Deliverables() {
  return (
    <section className="py-24 px-6 bg-white">
      <div className="max-w-2xl mx-auto">

        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
          Ce que vous recevez
        </p>
        <h2 className="text-3xl font-bold text-gray-900 mb-3 leading-tight tracking-tight">
          Votre dossier complet.<br />Livré en 48h.
        </h2>
        <p className="text-gray-500 mb-12">
          Préparé à partir des données réelles de votre fiche et de vos concurrents locaux.
          Prêt à publier — aucun travail de rédaction de votre côté.
        </p>

        <div className="border border-gray-100 rounded-xl overflow-hidden mb-10">
          {[
            { label: 'Description Google optimisée',          detail: 'Rédigée pour votre métier et votre ville. Prête à copier-coller.' },
            { label: '12 publications prêtes',                 detail: '3 mois de contenu. Saisonnières, conseils, actualité.' },
            { label: 'Réponses aux avis récents',              detail: 'Personnalisées par avis. Pas de modèles génériques.' },
            { label: '30 modèles de réponses réutilisables',   detail: 'Pour tous vos futurs avis — positifs, mitigés, négatifs.' },
            { label: 'QR code + script SMS collecte d\'avis',  detail: 'À afficher en boutique ou envoyer après chaque prestation.' },
            { label: 'Plan d\'action prioritaire',              detail: 'Basé sur l\'analyse de vos concurrents locaux réels.' },
            { label: 'Guide de mise en ligne',                 detail: 'Où cliquer, dans quel ordre. 10 minutes pour tout publier.' },
          ].map(({ label, detail }, i) => (
            <div
              key={i}
              className={`px-5 py-4 flex items-start gap-3 ${i > 0 ? 'border-t border-gray-100' : ''}`}
            >
              <span className="text-[#16a34a] font-bold shrink-0 mt-0.5 text-sm">✓</span>
              <div>
                <p className="text-sm font-medium text-gray-900">{label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{detail}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-6">
          <div>
            <p className="text-3xl font-bold text-gray-900">39€</p>
            <p className="text-xs text-gray-400 mt-1">Une seule fois · Satisfait ou remboursé 30 jours</p>
          </div>
          <a
            href="/analyser"
            className="rounded-lg bg-[#16a34a] hover:bg-[#15803d] px-6 py-3 text-sm font-semibold text-white transition"
          >
            Analyser ma fiche gratuitement →
          </a>
        </div>

      </div>
    </section>
  )
}
