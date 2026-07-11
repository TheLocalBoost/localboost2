'use client'
import type { AnalysisResult } from './AnalyserFlow'
import ScreenLayout from './ScreenLayout'
import { track } from '@/lib/track'

interface Props {
  result: AnalysisResult
  totalElements: number
  contactUrl: string
  email: string
}

export default function ScreenLivrables({ result, totalElements, contactUrl, email }: Props) {
  const unanswered = result.recentReviews?.length ?? 0

  // Point d'entrée unique du pipeline de vente — écrit la demande en base
  // immédiatement au clic (keepalive: survit à la navigation vers /contact).
  // Fire-and-forget volontaire : la demande est déjà en base côté serveur dès
  // que la requête part, la navigation ne doit jamais attendre la réponse.
  function notifyReportRequested() {
    try {
      fetch('/api/report-requested', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
        body: JSON.stringify({
          nom:   result.name,
          ville: result.city,
          secteur: result.category,
          email: email || null,
          score: result.score,
          completenessPercent: result.completeness?.percent ?? null,
          placeId: result.placeId ?? null,
        }),
      }).catch(() => {})
    } catch { /* ne bloque jamais le clic du prospect */ }
  }

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
      title: 'Rendre votre fiche visible et complète',
      items: [
        '20 idées de photos adaptées à votre métier — +42% de demandes d\'itinéraire avec des photos (source : Google)',
        `Fiche complète à ${result.completeness?.percent ?? 0}% — cliquée jusqu'à 7x plus souvent une fois complète (source : Google)`,
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
    <ScreenLayout step={4} totalSteps={5} centered={false}>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-6">
        Ce que vous récupérez
      </p>

      <h2 className="text-xl font-bold text-gray-900 mb-2 leading-snug">
        {totalElements} éléments préparés pour {result.name}
      </h2>

      <p className="text-sm text-gray-400 mb-6">
        3 heures en manuel. <span className="font-semibold text-gray-600">0 de votre côté.</span>
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

      <a
        href={contactUrl}
        onClick={() => {
          track('cta_click_contact', { name: result.name, city: result.city })
          notifyReportRequested()
        }}
        className="block w-full rounded-xl bg-gray-900 px-5 py-4 text-sm font-bold text-white hover:bg-gray-800 transition text-center"
      >
        Contactez-nous pour recevoir votre rapport →
      </a>
    </ScreenLayout>
  )
}
