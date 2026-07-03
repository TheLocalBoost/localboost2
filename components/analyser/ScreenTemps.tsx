'use client'
import ScreenLayout from './ScreenLayout'

interface Props {
  onNext: () => void
}

const MANUAL_ITEMS = [
  'Rédiger une description (45 min)',
  '12 publications mensuelles (3h)',
  'Réponses aux avis (1h)',
  'Plan d\'action (30 min)',
]

const LOCALBOOST_ITEMS = [
  'Description optimisée',
  '12 publications prêtes',
  'Réponses aux avis',
  'Plan d\'action prioritaire',
]

export default function ScreenTemps({ onNext }: Props) {
  return (
    <ScreenLayout>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-6">
        En perspective
      </p>

      <h2 className="text-xl font-bold text-gray-900 mb-8 leading-snug">
        Combien de temps cela représente ?
      </h2>

      <div className="grid grid-cols-2 gap-3 mb-6">
        {/* Manual column */}
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-center gap-2 mb-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              En manuel
            </p>
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-4">≈ 7 heures</p>
          <ul className="space-y-2">
            {MANUAL_ITEMS.map((item, i) => (
              <li key={i} className="text-xs text-gray-500 leading-snug">
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* LocalBoost column */}
        <div className="rounded-xl border border-[#16a34a] bg-[#f0fdf4] p-4">
          <div className="flex items-center gap-2 mb-3">
            <p className="text-xs font-semibold text-[#16a34a] uppercase tracking-wide">
              LocalBoost
            </p>
          </div>
          <p className="text-2xl font-bold text-[#16a34a] mb-4">Quelques secondes</p>
          <ul className="space-y-2">
            {LOCALBOOST_ITEMS.map((item, i) => (
              <li key={i} className="flex items-center gap-1.5 text-xs text-gray-700 leading-snug">
                <span className="text-[#16a34a] font-bold shrink-0">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <p className="text-sm text-gray-400 mb-8">
        Les mêmes éléments, préparés à partir de vos données réelles.
      </p>

      <button
        onClick={onNext}
        className="w-full rounded-xl bg-gray-900 px-5 py-4 text-sm font-bold text-white hover:bg-gray-800 transition"
      >
        Accéder au rapport →
      </button>
    </ScreenLayout>
  )
}
