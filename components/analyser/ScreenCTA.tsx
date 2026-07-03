'use client'
import type { AnalysisResult } from './AnalyserFlow'
import ScreenLayout from './ScreenLayout'

interface Props {
  result: AnalysisResult
  totalElements: number
  pricingUrl: string
  selectedPriority: string | null
}

const DELIVERABLES = [
  'Description Google optimisée',
  '12 publications prêtes (3 mois)',
  'Réponses personnalisées à vos avis',
  '30 modèles de réponses futures',
  'QR code collecte d\'avis + script SMS',
  'Plan d\'action basé sur vos concurrents',
  'Guide de mise en ligne',
]

const CTA_LABELS: Record<string, string> = {
  convince: 'Accéder à ma nouvelle présentation',
  reviews:  'Accéder aux réponses aux avis',
  publish:  'Accéder aux publications préparées',
  time:     'Accéder au rapport complet',
}

export default function ScreenCTA({ result, totalElements, pricingUrl, selectedPriority }: Props) {
  const ctaLabel = (selectedPriority && CTA_LABELS[selectedPriority]) ?? 'Accéder au rapport complet'
  return (
    <ScreenLayout>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
        Rapport généré aujourd&apos;hui
      </p>

      <h2 className="text-xl font-bold text-gray-900 mb-6 leading-snug">
        Rapport personnalisé pour {result.name}
      </h2>

      {/* Price block */}
      <div className="mb-6">
        <span className="text-4xl font-bold text-gray-900">39€</span>
        <p className="text-sm text-gray-400 mt-1">
          Une seule fois · Livré par email sous 48h
        </p>
      </div>

      {/* Deliverables */}
      <ul className="space-y-2.5 mb-5">
        {DELIVERABLES.map((item, i) => (
          <li key={i} className="flex items-center gap-3 text-sm text-gray-700">
            <span className="text-[#16a34a] font-bold shrink-0">✓</span>
            {item}
          </li>
        ))}
      </ul>

      <p className="text-xs text-gray-400 mb-8">
        {totalElements} éléments générés pour cet établissement
      </p>

      <a
        href={pricingUrl}
        className="block w-full rounded-xl bg-[#16a34a] hover:bg-[#15803d] px-5 py-4 text-sm font-bold text-white text-center transition"
      >
        {ctaLabel} — 39€
      </a>

      <p className="text-xs text-gray-400 text-center mt-3">
        Paiement sécurisé · Satisfait ou remboursé
      </p>
    </ScreenLayout>
  )
}
