'use client'
import type { AnalysisResult } from './AnalyserFlow'
import ScreenLayout from './ScreenLayout'

interface Props {
  result: AnalysisResult
  totalElements: number
  onNext: () => void
  onSkip: () => void
}

export default function ScreenLivrables({ result, totalElements, onNext, onSkip }: Props) {
  const unanswered = result.recentReviews?.length ?? 0

  const groups = [
    {
      title: 'Rendre votre fiche plus convaincante',
      items: [
        'Nouvelle description professionnelle',
        'Services rédigés pour votre fiche Google',
        'FAQ métier — 20 questions/réponses prêtes',
      ],
    },
    {
      title: 'Montrer que votre entreprise est active',
      items: [
        '12 publications prêtes à diffuser (3 mois — 1 par semaine)',
        'Calendrier de publication avec dates réelles',
        '20 idées de photos adaptées à votre métier',
      ],
    },
    {
      title: 'Donner confiance avant le premier appel',
      items: [
        unanswered > 0
          ? `${unanswered} réponse${unanswered > 1 ? 's' : ''} personnalisée${unanswered > 1 ? 's' : ''} à vos avis récents`
          : 'Réponses types pour vos avis récents',
        '30 réponses prêtes pour vos futurs avis (classées par situation)',
        "QR code collecte d'avis + script SMS",
      ],
    },
    {
      title: 'Gagner plusieurs heures',
      items: [
        'Guide de mise en ligne pas à pas',
        `Plan d'action personnalisé basé sur vos concurrents à ${result.city}`,
      ],
    },
  ]

  return (
    <ScreenLayout step={5} totalSteps={6} onSkip={onSkip} centered={false}>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-6">
        Ce que vous récupérez
      </p>

      <h2 className="text-xl font-bold text-gray-900 mb-2 leading-snug">
        {totalElements} éléments préparés pour {result.name}
      </h2>

      <p className="text-sm text-gray-400 mb-6">
        7 heures en manuel. <span className="font-semibold text-gray-600">0 de votre côté.</span>
      </p>

      <div className="space-y-5 mb-5">
        {groups.map((group, gi) => (
          <div key={gi}>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-1 mb-2">
              {group.title}
            </p>
            <ul className="space-y-1.5">
              {group.items.map((item, ii) => (
                <li
                  key={ii}
                  className="flex items-start gap-3 px-4 py-2.5 rounded-xl border border-gray-100 bg-white"
                >
                  <span className="text-[#16a34a] font-bold shrink-0 mt-0.5 text-sm">✓</span>
                  <p className="text-sm text-gray-700 leading-snug">{item}</p>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

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
