'use client'
import ScreenLayout from './ScreenLayout'

interface Props {
  onNext: () => void
  onSkip: () => void
}

const MANUAL_ITEMS = [
  { task: 'Rédiger la description Google', time: '45 min' },
  { task: '12 publications (3 mois)', time: '4 h' },
  { task: 'Répondre aux avis + 30 modèles', time: '1 h 30' },
  { task: 'Mise en ligne sur Google', time: '45 min' },
]

export default function ScreenTemps({ onNext, onSkip }: Props) {
  return (
    <ScreenLayout step={2} totalSteps={5} onSkip={onSkip} centered={false}>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-6">
        Ce que cela représente
      </p>

      <h2 className="text-xl font-bold text-gray-900 mb-6 leading-snug">
        Combien de temps cela représente ?
      </h2>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            En manuel
          </p>
          <p className="text-2xl font-bold text-gray-900 mb-4">≈ 7 h</p>
          <ul className="space-y-2.5">
            {MANUAL_ITEMS.map((item, i) => (
              <li key={i} className="text-xs leading-snug">
                <span className="text-gray-600">{item.task}</span>
                <span className="block text-gray-400 font-medium">{item.time}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-[#16a34a] bg-[#f0fdf4] p-4">
          <p className="text-xs font-semibold text-[#16a34a] uppercase tracking-wide mb-3">
            LocalBoost
          </p>
          <p className="text-2xl font-bold text-[#16a34a] mb-4">0 h</p>
          <p className="text-xs text-gray-600 leading-relaxed">
            Généré automatiquement à partir de vos données Google, relu par un humain, livré sous 48h.
          </p>
        </div>
      </div>

      <p className="text-sm text-gray-500 leading-relaxed mb-8">
        Vous pourriez le faire vous-même — mais entre la description, les 12 publications et les 30 modèles de réponses, ce sont plusieurs heures que vous récupérez déjà faites.
      </p>

      <button
        onClick={onNext}
        className="w-full rounded-xl bg-gray-900 px-5 py-4 text-sm font-bold text-white hover:bg-gray-800 transition"
      >
        Voir comment nous l'avons déjà résolu →
      </button>
    </ScreenLayout>
  )
}
