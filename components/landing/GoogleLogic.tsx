export default function GoogleLogic() {
  return (
    <section className="py-20 px-6 bg-white">
      <div className="max-w-3xl mx-auto">

        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide text-center mb-3">
          La vérité sur Google Maps
        </p>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 text-center mb-4 leading-snug">
          Votre concurrent vous devance —<br className="hidden sm:block" />
          pas parce qu'il est meilleur, mais parce qu'il est <span className="text-green-600">plus actif</span>
        </h2>
        <p className="text-center text-gray-500 text-sm mb-12 max-w-xl mx-auto leading-relaxed">
          Google Maps n'affiche pas la meilleure fiche en haut. Il affiche la plus <strong>active</strong>. C'est son algorithme — pas une opinion.
        </p>

        {/* Pack local — visualisation */}
        <div className="rounded-2xl bg-gray-50 border border-gray-200 p-6 mb-10">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-5 text-center">
            Sur mobile, Google n'affiche que 3 résultats — le "Pack local"
          </p>
          <div className="space-y-2 max-w-xs mx-auto">
            <div className="flex items-center gap-3 bg-white rounded-xl border-2 border-green-400 px-4 py-3 shadow-sm">
              <span className="text-xs font-extrabold text-green-600 bg-green-50 rounded-full w-6 h-6 flex items-center justify-center shrink-0">1</span>
              <div className="flex-1 min-w-0">
                <div className="h-2.5 bg-gray-800 rounded w-3/4 mb-1.5" />
                <div className="h-2 bg-gray-300 rounded w-1/2" />
              </div>
              <span className="text-xs font-bold text-green-600 shrink-0">~70% des clics</span>
            </div>
            <div className="flex items-center gap-3 bg-white rounded-xl border border-gray-200 px-4 py-3">
              <span className="text-xs font-extrabold text-gray-400 bg-gray-50 rounded-full w-6 h-6 flex items-center justify-center shrink-0">2</span>
              <div className="flex-1 min-w-0">
                <div className="h-2.5 bg-gray-300 rounded w-2/3 mb-1.5" />
                <div className="h-2 bg-gray-200 rounded w-1/3" />
              </div>
              <span className="text-xs text-gray-400 shrink-0">~20%</span>
            </div>
            <div className="flex items-center gap-3 bg-white rounded-xl border border-gray-200 px-4 py-3">
              <span className="text-xs font-extrabold text-gray-400 bg-gray-50 rounded-full w-6 h-6 flex items-center justify-center shrink-0">3</span>
              <div className="flex-1 min-w-0">
                <div className="h-2.5 bg-gray-200 rounded w-1/2 mb-1.5" />
                <div className="h-2 bg-gray-100 rounded w-1/3" />
              </div>
              <span className="text-xs text-gray-400 shrink-0">~8%</span>
            </div>
            <div className="flex items-center gap-3 bg-gray-100 rounded-xl border border-dashed border-gray-200 px-4 py-3">
              <span className="text-xs font-extrabold text-gray-300 bg-gray-200 rounded-full w-6 h-6 flex items-center justify-center shrink-0">4+</span>
              <p className="text-xs text-gray-400 italic">Non affiché — invisible pour vos clients</p>
            </div>
          </div>
          <p className="text-xs text-gray-400 text-center mt-4">80% des recherches locales se font sur mobile</p>
        </div>

        {/* Les 3 signaux */}
        <p className="text-sm font-bold text-gray-900 text-center mb-6">
          Ce que Google mesure pour décider qui apparaît en position 1
        </p>
        <div className="grid sm:grid-cols-3 gap-4 mb-10">
          {[
            {
              n: '1',
              title: 'Activité récente',
              desc: 'Posts publiés, réponses aux avis, mises à jour de la fiche. Une fiche sans activité depuis 2-3 mois est considérée comme "abandonnée".',
              color: 'bg-red-50 border-red-100',
              badge: 'bg-red-100 text-red-700',
              badgeLabel: 'Le plus important',
            },
            {
              n: '2',
              title: 'Complétude',
              desc: 'Description, horaires, catégories, photos, services. Chaque champ vide est un signal négatif pour l\'algorithme.',
              color: 'bg-amber-50 border-amber-100',
              badge: 'bg-amber-100 text-amber-700',
              badgeLabel: 'Important',
            },
            {
              n: '3',
              title: 'Avis récents',
              desc: 'Nombre d\'avis, fraîcheur, et taux de réponse du propriétaire. Google favorise les fiches qui montrent de l\'engagement.',
              color: 'bg-blue-50 border-blue-100',
              badge: 'bg-blue-100 text-blue-700',
              badgeLabel: 'Important',
            },
          ].map(({ n, title, desc, color, badge, badgeLabel }) => (
            <div key={n} className={`rounded-2xl border p-5 ${color}`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-extrabold text-gray-500 bg-white rounded-full w-6 h-6 flex items-center justify-center border border-gray-200">{n}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${badge}`}>{badgeLabel}</span>
              </div>
              <p className="text-sm font-bold text-gray-900 mb-2">{title}</p>
              <p className="text-xs text-gray-600 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        {/* L'exemple concret */}
        <div className="rounded-2xl bg-gray-900 text-white p-6">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-4 text-center">Exemple réel — même ville, même métier</p>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="rounded-xl bg-green-900/40 border border-green-700/50 p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-extrabold text-green-400 bg-green-900/60 rounded-full w-5 h-5 flex items-center justify-center">1</span>
                <span className="text-xs font-bold text-green-400">Position 1 — ~70% des clics</span>
              </div>
              <p className="text-sm font-bold text-white mb-1">Plombier Martin</p>
              <p className="text-xs text-gray-400 mb-3">★ 3,9 · 41 avis</p>
              <ul className="space-y-1.5">
                <li className="flex items-center gap-2 text-xs text-green-300"><span>✓</span> Post publié il y a 4 jours</li>
                <li className="flex items-center gap-2 text-xs text-green-300"><span>✓</span> 9 réponses aux avis ce mois</li>
                <li className="flex items-center gap-2 text-xs text-green-300"><span>✓</span> Description complète</li>
              </ul>
            </div>
            <div className="rounded-xl bg-red-900/30 border border-red-700/40 p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-extrabold text-red-400 bg-red-900/40 rounded-full w-5 h-5 flex items-center justify-center">4</span>
                <span className="text-xs font-bold text-red-400">Position 4 — invisible</span>
              </div>
              <p className="text-sm font-bold text-white mb-1">Plomberie Dupont</p>
              <p className="text-xs text-gray-400 mb-3">★ 4,8 · 87 avis</p>
              <ul className="space-y-1.5">
                <li className="flex items-center gap-2 text-xs text-red-300"><span>✗</span> Dernier post : il y a 7 mois</li>
                <li className="flex items-center gap-2 text-xs text-red-300"><span>✗</span> 0 réponse aux avis récents</li>
                <li className="flex items-center gap-2 text-xs text-red-300"><span>✗</span> Description vide</li>
              </ul>
            </div>
          </div>
          <p className="text-xs text-gray-400 text-center mt-4">
            La note ne change rien. L'activité décide tout.
          </p>
        </div>

      </div>
    </section>
  )
}
