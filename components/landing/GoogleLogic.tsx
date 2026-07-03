// Élément signature de la page — la seule section visuellement audacieuse.
// Montre concrètement comment l'algorithme Google Maps classe les fiches.

export default function GoogleLogic() {
  return (
    <section className="py-24 px-6 bg-gray-50 border-y border-gray-100">
      <div className="max-w-2xl mx-auto">

        {/* Titre */}
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
          Comment fonctionne Google Maps
        </p>
        <h2 className="text-3xl font-bold text-gray-900 mb-3 leading-tight tracking-tight">
          Trois résultats.<br />Le reste est invisible.
        </h2>
        <p className="text-gray-500 mb-12 max-w-lg">
          Sur mobile, Google n&apos;affiche que 3 établissements avant
          &quot;Voir plus de résultats&quot;. Le premier capte environ 70&nbsp;% des clics.
          Le quatrième n&apos;existe pas pour vos clients.
        </p>

        {/* Visualisation Pack local — élément signature */}
        <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden mb-12 shadow-sm">

          {/* Barre de recherche simulée */}
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
            <div className="w-4 h-4 rounded-full bg-gray-200 shrink-0" />
            <div className="flex-1 bg-gray-100 rounded px-3 py-1.5 text-xs text-gray-400">
              plombier paris
            </div>
          </div>

          {/* Les 3 résultats */}
          <div className="divide-y divide-gray-100">
            {[
              { rank: 1, name: 'Plomberie Martin', rating: '4.2', reviews: 18, status: 'Actif — post il y a 3 jours', pct: '70 %', highlight: true },
              { rank: 2, name: 'Chauffage & Plomberie Est', rating: '4.5', reviews: 31, status: 'Actif', pct: '20 %', highlight: false },
              { rank: 3, name: 'Dépannage Express Paris', rating: '3.9', reviews: 8,  status: 'Actif', pct: '8 %', highlight: false },
            ].map(({ rank, name, rating, reviews, status, pct, highlight }) => (
              <div key={rank} className="flex items-center gap-4 px-4 py-3.5">
                <span className="text-xs font-bold text-gray-300 w-4 shrink-0">{rank}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{name}</p>
                  <p className="text-xs text-gray-400">{rating} · {reviews} avis · {status}</p>
                </div>
                <span className={`text-xs font-bold shrink-0 ${highlight ? 'text-[#16a34a]' : 'text-gray-300'}`}>
                  {pct}
                </span>
              </div>
            ))}

            {/* Position 4 — invisible */}
            <div className="flex items-center gap-4 px-4 py-3.5 bg-gray-50">
              <span className="text-xs font-bold text-gray-200 w-4 shrink-0">4</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-300 truncate">Votre établissement</p>
                <p className="text-xs text-gray-300">4.8 · 47 avis · Dernier post il y a 4 mois</p>
              </div>
              <span className="text-xs font-bold text-gray-300 shrink-0">invisible</span>
            </div>
          </div>
        </div>

        {/* Les 3 signaux — liste, pas grille */}
        <div className="space-y-6">
          <p className="text-sm font-semibold text-gray-900">
            Ce que Google mesure pour décider du classement :
          </p>
          {[
            { n: '01', label: 'Activité récente', desc: 'Publications, réponses aux avis, mises à jour. Une fiche sans activité depuis 2 mois est pénalisée — quelle que soit sa note.' },
            { n: '02', label: 'Complétude', desc: 'Description, catégories, horaires, photos. Chaque champ vide est un signal négatif.' },
            { n: '03', label: 'Engagement sur les avis', desc: 'Nombre d\'avis, fraîcheur, et taux de réponse. Les fiches qui répondent sont mieux classées.' },
          ].map(({ n, label, desc }) => (
            <div key={n} className="flex gap-5">
              <span className="text-xs font-bold text-gray-200 shrink-0 mt-0.5 w-6">{n}</span>
              <div>
                <p className="text-sm font-semibold text-gray-900 mb-1">{label}</p>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
