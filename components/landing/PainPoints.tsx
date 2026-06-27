import { Clock, Camera, CalendarX } from 'lucide-react'

const PROBLEMS = [
  {
    Icon: Clock,
    badge: 'Très fréquent',
    badgeRed: true,
    title: 'Horaires incorrects ou absents',
    scenario: 'Un client cherche un plombier à 19h. Vos horaires affichent "fermé". Il appelle le concurrent.',
    calls: '8 à 15 appels perdus par mois',
    revenue: '400€ à 900€ non réalisés',
  },
  {
    Icon: Camera,
    badge: 'Fréquent',
    badgeRed: false,
    title: 'Aucune photo récente',
    scenario: 'Sans photo récente, votre fiche inspire moins confiance que celle du voisin. Le client choisit l\'autre.',
    calls: '5 à 10 appels perdus par mois',
    revenue: '250€ à 600€ non réalisés',
  },
  {
    Icon: CalendarX,
    badge: 'Très fréquent',
    badgeRed: true,
    title: 'Aucun post depuis plus de 3 mois',
    scenario: 'Google considère votre fiche comme abandonnée. Il la place en dessous de vos concurrents actifs.',
    calls: '10 à 20 appels perdus par mois',
    revenue: '500€ à 1 200€ non réalisés',
  },
]

export default function PainPoints() {
  return (
    <section className="py-16 px-6 bg-gray-50 border-y border-gray-100">
      <div className="max-w-5xl mx-auto">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide text-center mb-2">
          Ce que votre fiche Google vous coûte en ce moment
        </p>
        <p className="text-center text-gray-600 font-semibold text-base mb-10">
          Il n'existe pas de fiche Google bien tenue sans quelqu'un qui s'en occupe chaque semaine.
        </p>

        <div className="grid sm:grid-cols-3 gap-5">
          {PROBLEMS.map(({ Icon, badge, badgeRed, title, scenario, calls, revenue }) => (
            <div key={title} className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                  <Icon size={20} className="text-red-500" />
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${badgeRed ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                  {badge}
                </span>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 text-sm mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed italic">"{scenario}"</p>
              </div>

              <div className="mt-auto space-y-1.5 pt-3 border-t border-gray-50">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                  <p className="text-xs font-semibold text-gray-700">{calls}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                  <p className="text-xs font-semibold text-gray-700">{revenue}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-gray-400 text-center mt-5">
          Estimations basées sur un panier moyen artisan de 150€ à 300€ et les données Google Business Profile.
        </p>

        <div className="mt-8 text-center">
          <a
            href="/analyser"
            className="inline-block rounded-xl bg-green-500 px-8 py-4 text-sm font-bold text-white hover:bg-green-400 transition shadow-md"
          >
            Analyser ma fiche maintenant →
          </a>
          <p className="text-xs text-gray-400 mt-2">Résultat personnalisé · Données réelles</p>
        </div>
      </div>
    </section>
  )
}
