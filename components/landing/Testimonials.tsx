const TESTIMONIALS = [
  {
    name: 'Marc D.',
    metier: 'Plombier · Bordeaux',
    avatar: '🔧',
    text: 'En 3 semaines j\'ai eu 5 nouveaux appels qui m\'ont dit "je vous ai trouvé sur Google". Avant LocalBoost, ça n\'arrivait jamais.',
    stars: 5,
  },
  {
    name: 'Sophie L.',
    metier: 'Coiffeuse · Nantes',
    avatar: '✂️',
    text: 'Je passais 2h par semaine à chercher quoi poster. Maintenant ça arrive tout seul le lundi matin. Je copie-colle en 30 secondes.',
    stars: 5,
  },
  {
    name: 'Ahmed B.',
    metier: 'Restaurateur · Lyon',
    avatar: '🍽️',
    text: 'Mon score est passé de 41 à 76 en un mois. Les réservations en ligne ont augmenté. Je recommande à tous les resto du quartier.',
    stars: 5,
  },
]

export default function Testimonials() {
  return (
    <section className="py-16 px-6 bg-white">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-2">Ce qu'ils disent</p>
          <h2 className="text-2xl font-bold text-gray-900">Des artisans comme vous, en France</h2>
        </div>

        <div className="grid sm:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <div key={i} className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
              <div className="flex items-center gap-1 mb-3">
                {Array.from({ length: t.stars }).map((_, j) => (
                  <span key={j} className="text-amber-400 text-sm">★</span>
                ))}
              </div>
              <p className="text-sm text-gray-700 leading-relaxed mb-4">"{t.text}"</p>
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-lg">{t.avatar}</div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                  <p className="text-xs text-gray-400">{t.metier}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Trust bar */}
        <div className="mt-10 grid grid-cols-3 gap-4 text-center border-t border-gray-100 pt-8">
          {[
            { val: '100+', label: 'artisans actifs' },
            { val: '4.8/5', label: 'note moyenne' },
            { val: '0€', label: 'débité les 7 premiers jours' },
          ].map((item, i) => (
            <div key={i}>
              <p className="text-2xl font-extrabold text-blue-600">{item.val}</p>
              <p className="text-xs text-gray-500 mt-0.5">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
