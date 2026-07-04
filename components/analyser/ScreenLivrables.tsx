'use client'
import type { AnalysisResult } from './AnalyserFlow'
import ScreenLayout from './ScreenLayout'

interface Props {
  result: AnalysisResult
  totalElements: number
  onNext: () => void
}

const DELIVERABLES = [
  {
    label:  'Description Google optimisée',
    detail: 'Rédigée pour votre activité, votre ville et vos concurrents',
  },
  {
    label:  '12 publications prêtes (3 mois)',
    detail: 'À poster sur votre fiche, une par semaine, sans rédiger quoi que ce soit',
  },
  {
    label:  'Réponses personnalisées à vos avis',
    detail: 'Pour chaque avis récent resté sans réponse sur votre fiche',
  },
  {
    label:  '30 modèles de réponses futures',
    detail: 'Pour tous les types d\'avis que vous recevrez — positifs, négatifs, neutres',
  },
  {
    label:  'QR code + script de relance SMS',
    detail: 'Pour collecter des avis clients sans y penser',
  },
  {
    label:  'Plan d\'action basé sur vos concurrents',
    detail: null, // injected dynamically below with result.city
  },
  {
    label:  'Guide de mise en ligne',
    detail: 'Pas à pas, sans compétences techniques requises',
  },
]

export default function ScreenLivrables({ result, totalElements, onNext }: Props) {
  return (
    <ScreenLayout centered={false}>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-6">
        Ce que vous récupérez
      </p>

      <h2 className="text-xl font-bold text-gray-900 mb-6 leading-snug">
        {totalElements} éléments préparés pour {result.name}
      </h2>

      <ul className="space-y-2 mb-6">
        {DELIVERABLES.map((item, i) => (
          <li
            key={i}
            className="flex items-start gap-3 px-4 py-3 rounded-xl border border-gray-100 bg-white"
          >
            <span className="text-[#16a34a] font-bold shrink-0 mt-0.5">✓</span>
            <div>
              <p className="text-sm font-semibold text-gray-900">{item.label}</p>
              <p className="text-xs text-gray-400 mt-0.5 leading-snug">
                {i === 5
                  ? `Ce qui fait vraiment la différence dans votre secteur à ${result.city}`
                  : item.detail}
              </p>
            </div>
          </li>
        ))}
      </ul>

      <div className="rounded-xl bg-gray-50 border border-gray-200 px-4 py-3 mb-6">
        <p className="text-sm text-gray-600 leading-relaxed">
          Généré automatiquement à partir de vos données Google, relu par un humain, livré sous 48h.
        </p>
      </div>

      <button
        onClick={onNext}
        className="w-full rounded-xl bg-gray-900 px-5 py-4 text-sm font-bold text-white hover:bg-gray-800 transition"
      >
        Récupérer mon rapport — 39€
      </button>
    </ScreenLayout>
  )
}
