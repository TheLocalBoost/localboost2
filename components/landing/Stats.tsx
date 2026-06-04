import { Users, Phone, TrendingDown, Activity } from 'lucide-react'

interface Props {
  signupCount: number
}

// Stat 1 alimentée dynamiquement via props signupCount
const getStats = (signupCount: number) => [
  {
    Icon: Users,
    value: signupCount > 0 ? `${signupCount}` : '—',
    label: 'artisans ont analysé leur fiche sur LocalBoost',
    source: null,
    dynamic: true,
  },
  {
    Icon: Phone,
    value: '2×',
    label: 'plus d\'appels pour les fiches avec posts hebdomadaires',
    source: 'Google Business Profile',
    dynamic: false,
  },
  {
    Icon: Activity,
    value: '3 à 9',
    label: 'appels perdus par mois détectés en moyenne lors d\'une analyse',
    source: null,
    dynamic: false,
  },
  {
    Icon: TrendingDown,
    value: '−40%',
    label: 'de clics perdus en 3 mois pour une fiche inactive',
    source: 'BrightLocal 2024',
    dynamic: false,
  },
]

export default function Stats({ signupCount }: Props) {
  const stats = getStats(signupCount)

  return (
    <section className="py-16 px-6 bg-white border-y border-gray-100">
      <div className="max-w-4xl mx-auto">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide text-center mb-8">
          Ce que les données montrent
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {stats.map(({ Icon, value, label, source, dynamic }) => (
            <div key={label} className="bg-gray-50 rounded-2xl border border-gray-100 p-5 flex flex-col gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                <Icon size={18} className="text-blue-600" />
              </div>
              <div>
                <p className={`text-3xl font-extrabold leading-none mb-1 ${dynamic && signupCount === 0 ? 'text-gray-300' : 'text-gray-900'}`}>
                  {value}
                </p>
                <p className="text-xs text-gray-500 leading-relaxed">{label}</p>
              </div>
              {source && (
                <p className="text-xs text-gray-400 mt-auto">Source : {source}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
