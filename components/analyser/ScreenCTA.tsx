'use client'
import type { AnalysisResult } from './AnalyserFlow'
import ScreenLayout from './ScreenLayout'

interface Props {
  result: AnalysisResult
  pricingUrl: string
}

export default function ScreenCTA({ result, pricingUrl }: Props) {
  return (
    <ScreenLayout step={6} totalSteps={6}>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-8">
        Récupérez tout le travail
      </p>

      <h2 className="text-xl font-bold text-gray-900 mb-2 leading-snug">
        Rapport personnalisé pour {result.name}
      </h2>

      <p className="text-sm text-gray-400 mb-8">
        {result.city} · {result.category}
      </p>

      <div className="mb-8">
        <span className="text-4xl font-bold text-gray-900">39€</span>
        <span className="text-sm text-gray-400 ml-2">une seule fois</span>
      </div>

      {/* Satisfait ou remboursé — encart mis en valeur */}
      <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 mb-6 flex items-center gap-3">
        <span className="text-sm font-bold text-[#16a34a] shrink-0">✓</span>
        <div>
          <p className="text-sm font-semibold text-gray-700">Satisfait ou remboursé</p>
          <p className="text-xs text-gray-400 mt-0.5">
            Si le rapport ne correspond pas à votre fiche, on vous rembourse.
          </p>
        </div>
      </div>

      <a
        href={pricingUrl}
        className="block w-full rounded-xl bg-[#16a34a] hover:bg-[#15803d] px-5 py-4 text-sm font-bold text-white text-center transition mb-3"
      >
        Récupérer mon rapport — 39€
      </a>

      <p className="text-xs text-gray-400 text-center">
        Livré sous 48h après vérification · Paiement sécurisé
      </p>
    </ScreenLayout>
  )
}
