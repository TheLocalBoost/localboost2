export default function GoogleLogic() {
  return (
    <section className="py-20 px-6 bg-white">
      <div className="max-w-2xl mx-auto text-center">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">La vérité sur Google Maps</p>
        <h2 className="text-3xl font-extrabold text-gray-900 mb-3 leading-snug">
          Votre concurrent vous devance —<br />
          pas parce qu&apos;il est meilleur, mais parce qu&apos;il est <span className="text-green-600">plus actif.</span>
        </h2>
        <p className="text-gray-500 mb-12">Google affiche la fiche la plus active, pas la mieux notée.</p>

        {/* Pack local */}
        <div className="rounded-2xl bg-gray-50 border border-gray-200 p-6 mb-10">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-5">Sur mobile, Google n&apos;affiche que 3 résultats</p>
          <div className="space-y-2 max-w-xs mx-auto">
            {[
              { n: '1', pct: '~70% des clics', active: true },
              { n: '2', pct: '~20%', active: false },
              { n: '3', pct: '~8%', active: false },
            ].map(({ n, pct, active }) => (
              <div key={n} className={`flex items-center gap-3 bg-white rounded-xl border px-4 py-3 ${active ? 'border-green-400' : 'border-gray-200'}`}>
                <span className={`text-xs font-extrabold rounded-full w-6 h-6 flex items-center justify-center shrink-0 ${active ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-400'}`}>{n}</span>
                <div className="flex-1">
                  <div className={`h-2.5 rounded mb-1 ${active ? 'bg-gray-800 w-3/4' : 'bg-gray-300 w-2/3'}`} />
                  <div className={`h-2 rounded ${active ? 'bg-gray-400 w-1/2' : 'bg-gray-200 w-1/3'}`} />
                </div>
                <span className={`text-xs font-bold shrink-0 ${active ? 'text-green-600' : 'text-gray-400'}`}>{pct}</span>
              </div>
            ))}
            <div className="flex items-center gap-3 bg-gray-100 rounded-xl border border-dashed border-gray-200 px-4 py-3">
              <span className="text-xs font-extrabold text-gray-300 bg-gray-200 rounded-full w-6 h-6 flex items-center justify-center shrink-0">4+</span>
              <p className="text-xs text-gray-400 italic">Invisible pour vos clients</p>
            </div>
          </div>
        </div>

        {/* 3 signaux */}
        <div className="grid sm:grid-cols-3 gap-4 mb-10">
          {[
            { n: '1', title: 'Activité récente', desc: 'Posts, réponses aux avis, mises à jour.', badge: 'Le plus important', color: 'bg-red-50 border-red-100', badgeColor: 'bg-red-100 text-red-700' },
            { n: '2', title: 'Complétude', desc: 'Description, horaires, catégories, photos.', badge: 'Important', color: 'bg-amber-50 border-amber-100', badgeColor: 'bg-amber-100 text-amber-700' },
            { n: '3', title: 'Avis récents', desc: 'Nombre, fraîcheur, taux de réponse.', badge: 'Important', color: 'bg-blue-50 border-blue-100', badgeColor: 'bg-blue-100 text-blue-700' },
          ].map(({ n, title, desc, badge, color, badgeColor }) => (
            <div key={n} className={`rounded-2xl border p-5 text-left ${color}`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-extrabold text-gray-500 bg-white rounded-full w-6 h-6 flex items-center justify-center border border-gray-200">{n}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${badgeColor}`}>{badge}</span>
              </div>
              <p className="text-sm font-bold text-gray-900 mb-1">{title}</p>
              <p className="text-xs text-gray-600">{desc}</p>
            </div>
          ))}
        </div>

        {/* Exemple avant/après */}
        <div className="rounded-2xl bg-gray-900 text-white p-6 text-left">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-4 text-center">Même ville, même métier</p>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="rounded-xl bg-green-900/40 border border-green-700/50 p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold text-green-400">#1 · ~70% des clics</span>
              </div>
              <p className="text-sm font-bold text-white mb-1">Plombier Martin</p>
              <p className="text-xs text-gray-400 mb-2">★ 3,9 · 41 avis</p>
              <div className="space-y-1">
                {['Post il y a 4 jours', '9 réponses aux avis', 'Description complète'].map((i, k) => (
                  <p key={k} className="text-xs text-green-300">✓ {i}</p>
                ))}
              </div>
            </div>
            <div className="rounded-xl bg-red-900/30 border border-red-700/40 p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold text-red-400">#4 · invisible</span>
              </div>
              <p className="text-sm font-bold text-white mb-1">Plomberie Dupont</p>
              <p className="text-xs text-gray-400 mb-2">★ 4,8 · 87 avis</p>
              <div className="space-y-1">
                {['Dernier post : 7 mois', '0 réponse aux avis', 'Description vide'].map((i, k) => (
                  <p key={k} className="text-xs text-red-300">✗ {i}</p>
                ))}
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-400 text-center mt-4">La note ne change rien. L&apos;activité décide tout.</p>
        </div>
      </div>
    </section>
  )
}
