'use client'
import ScreenLayout from './ScreenLayout'

interface Props {
  city: string
  category: string
  onNext: () => void
}

export default function ScreenEnjeu({ city, category, onNext }: Props) {
  return (
    <ScreenLayout>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-6">
        Ce que ça représente
      </p>

      <h2 className="text-xl font-bold text-gray-900 mb-8 leading-snug">
        Votre fiche Google est souvent le premier contact avec un client —
        avant votre site, avant votre vitrine, avant le bouche-à-oreille.
      </h2>

      <div className="space-y-4 mb-10">
        <div className="border-l-2 border-gray-200 pl-4">
          <p className="text-sm text-gray-700 leading-relaxed">
            Sur mobile, Google Maps n&apos;affiche que 3 résultats pour
            &quot;{category} {city}&quot;. Le reste est invisible.
          </p>
        </div>
        <div className="border-l-2 border-gray-200 pl-4">
          <p className="text-sm text-gray-700 leading-relaxed">
            L&apos;algorithme valorise autant l&apos;activité de la fiche que la qualité
            perçue — publications récentes, réponses aux avis, description à jour.
          </p>
        </div>
        <div className="border-l-2 border-[#16a34a] pl-4">
          <p className="text-sm text-gray-700 leading-relaxed">
            Un concurrent avec une note inférieure à la vôtre peut vous devancer
            simplement parce qu&apos;il publie régulièrement.
          </p>
        </div>
      </div>

      <button
        onClick={onNext}
        className="w-full rounded-xl bg-gray-900 px-5 py-4 text-sm font-bold text-white hover:bg-gray-800 transition"
      >
        Personnaliser mon rapport →
      </button>
    </ScreenLayout>
  )
}
