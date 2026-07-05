'use client'
import type { AnalysisResult } from './AnalyserFlow'
import ScreenLayout from './ScreenLayout'

interface Props {
  result: AnalysisResult
  totalElements: number
  onNext: () => void
  onSkip: () => void
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
    detail: "Pour tous les types d'avis que vous recevrez — positifs, négatifs, neutres",
  },
  {
    label:  "QR code + script de relance SMS",
    detail: "Pour collecter des avis clients sans y penser",
  },
  {
    label:  "Plan d'action basé sur vos concurrents",
    detail: null,
  },
  {
    label:  'Guide de mise en ligne',
    detail: 'Pas à pas, sans compétences techniques requises',
  },
]

export default function ScreenLivrables({ result, totalElements, onNext, onSkip }: Props) {
  return (
    <ScreenLayout step={5} totalSteps={6} onSkip={onSkip} centered={false}>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-6">
        Ce que vous récupérez
      </p>

      <h2 className="text-xl font-bold text-gray-900 mb-2 leading-snug">
        {totalElements} éléments préparés pour {result.name}
      </h2>

      {/* Time recap */}
      <p className="text-sm text-gray-400 mb-6">
        7 heures en manuel. <span className="font-semibold text-gray-600">0 de votre côté.</span>
      </p>

      <ul className="space-y-2 mb-5">
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

      {/* Prominent no-tech-skills line */}
      <div className="rounded-xl border border-[#16a34a] bg-[#f0fdf4] px-4 py-3 mb-6 flex items-center gap-3">
        <span className="text-[#16a34a] font-bold text-base shrink-0">✓</span>
        <p className="text-sm font-semibold text-[#16a34a]">
          Aucune compétence technique requise — tout est prêt à copier-coller.
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
