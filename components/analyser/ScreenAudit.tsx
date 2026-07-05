'use client'
import type { AnalysisResult } from './AnalyserFlow'
import ScreenLayout from './ScreenLayout'

interface Props {
  result: AnalysisResult
  onNext: () => void
  onSkip: () => void
}

interface AuditItem {
  label: string
  ok: boolean
}

interface AuditGroup {
  title: string
  items: AuditItem[]
}

function getAuditGroups(result: AnalysisResult): AuditGroup[] {
  const c          = result.criteria ?? {}
  const photos     = result.photos ?? 0
  const rating     = result.rating ?? 0
  const reviews    = result.reviews ?? 0
  const unanswered = result.recentReviews?.length ?? 0
  const topComp    = result.competitors?.[0] ?? null

  const compsWithRating = (result.competitors ?? []).filter(x => x.rating > 0)
  const avgRating = compsWithRating.length
    ? compsWithRating.reduce((a, x) => a + x.rating, 0) / compsWithRating.length
    : null
  const avgReviews = (result.competitors ?? []).length
    ? Math.round((result.competitors ?? []).reduce((a, x) => a + x.reviewCount, 0) / (result.competitors ?? []).length)
    : null
  const betterCount = (result.competitors ?? []).filter(x => x.estimatedScore > result.score).length

  return [
    {
      title: 'Fiche complète',
      items: [
        { label: 'Nom d\'établissement renseigné',  ok: c.nom !== false },
        { label: 'Adresse complète',                 ok: c.adresse !== false },
        { label: 'Numéro de téléphone',              ok: !!c.telephone },
        { label: 'Site web lié à la fiche',          ok: !!c.site },
        { label: 'Horaires d\'ouverture renseignés', ok: !!c.horaires },
        { label: 'Établissement actif (non fermé)',  ok: !result.isClosed },
      ],
    },
    {
      title: 'Description',
      items: [
        { label: 'Description présente sur la fiche',    ok: !!c.description },
        { label: 'Description ≥ 100 caractères',         ok: !!(c.descriptionOk ?? c.description) },
        { label: 'Ville mentionnée dans la description', ok: !!c.descriptionOk },
      ],
    },
    {
      title: 'Photos',
      items: [
        { label: 'Au moins 1 photo',   ok: photos >= 1 },
        { label: 'Au moins 5 photos',  ok: photos >= 5 },
        { label: 'Au moins 10 photos', ok: photos >= 10 },
        { label: 'Au moins 15 photos', ok: photos >= 15 },
        { label: 'Au moins 20 photos', ok: photos >= 20 },
      ],
    },
    {
      title: 'Réputation',
      items: [
        { label: 'Note ≥ 3,5 / 5',                   ok: rating >= 3.5 },
        { label: 'Note ≥ 4,0 / 5',                   ok: rating >= 4.0 },
        { label: 'Note ≥ 4,3 / 5',                   ok: rating >= 4.3 },
        { label: 'Plus de 5 avis',                    ok: reviews > 5 },
        { label: 'Plus de 20 avis',                   ok: reviews > 20 },
        { label: 'Plus de 50 avis',                   ok: reviews > 50 },
        { label: 'Pas d\'avis ≤ 2 étoiles récents',  ok: c.avisNegatifs !== false },
      ],
    },
    {
      title: 'Activité récente',
      items: [
        { label: 'Avis posté dans les 3 derniers mois',           ok: !!c.recentReview },
        { label: 'Avis récents avec réponse du propriétaire',     ok: unanswered === 0 },
        { label: 'Niveau de prix renseigné sur la fiche',         ok: result.priceLevel !== null },
      ],
    },
    {
      title: 'Concurrence locale',
      items: [
        {
          label: topComp ? `Note supérieure à ${topComp.name}` : 'Note supérieure au concurrent #1',
          ok:    topComp ? rating >= topComp.rating : true,
        },
        {
          label: 'Note supérieure à la moyenne locale',
          ok:    avgRating != null ? rating >= avgRating : true,
        },
        {
          label: topComp ? `Plus d'avis que ${topComp.name}` : 'Plus d\'avis que le concurrent #1',
          ok:    topComp ? reviews >= topComp.reviewCount : true,
        },
        {
          label: 'Plus d\'avis que la moyenne locale',
          ok:    avgReviews != null ? reviews >= avgReviews : true,
        },
        {
          label: 'Score global supérieur au concurrent #1',
          ok:    topComp ? result.score >= topComp.estimatedScore : true,
        },
        {
          label: 'Position estimée dans le top 2 local',
          ok:    betterCount <= 1,
        },
      ],
    },
  ]
}

export default function ScreenAudit({ result, onNext, onSkip }: Props) {
  const groups   = getAuditGroups(result)
  const allItems = groups.flatMap(g => g.items)
  const okCount  = allItems.filter(i => i.ok).length
  const total    = allItems.length
  const failCount = total - okCount

  return (
    <ScreenLayout step={1} totalSteps={6} onSkip={onSkip} centered={false}>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
        Audit complet — {result.name}
      </p>

      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-3xl font-bold text-gray-900">{okCount}</span>
        <span className="text-sm text-gray-400">/ {total} critères validés</span>
      </div>
      {failCount > 0 && (
        <p className="text-sm text-red-500 font-medium mb-6">
          {failCount} point{failCount > 1 ? 's' : ''} à corriger
        </p>
      )}
      {failCount === 0 && (
        <p className="text-sm text-[#16a34a] font-medium mb-6">
          Fiche complète
        </p>
      )}

      <div className="space-y-6 mb-8">
        {groups.map((group) => {
          const groupOk   = group.items.filter(i => i.ok).length
          const groupFail = group.items.length - groupOk
          return (
            <div key={group.title}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {group.title}
                </p>
                <p className={`text-xs font-medium ${groupFail > 0 ? 'text-red-400' : 'text-[#16a34a]'}`}>
                  {groupOk}/{group.items.length}
                </p>
              </div>
              <ul className="space-y-1.5">
                {group.items.map((item, i) => (
                  <li key={i} className="flex items-center gap-2.5">
                    <span
                      className={`shrink-0 text-xs font-bold leading-none w-3 ${
                        item.ok ? 'text-[#16a34a]' : 'text-red-500'
                      }`}
                    >
                      {item.ok ? '✓' : '✗'}
                    </span>
                    <span
                      className={`text-sm leading-snug ${
                        item.ok ? 'text-gray-700' : 'text-gray-500'
                      }`}
                    >
                      {item.label}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>

      <button
        onClick={onNext}
        className="w-full rounded-xl bg-gray-900 px-5 py-4 text-sm font-bold text-white hover:bg-gray-800 transition"
      >
        Voir les points à corriger →
      </button>
    </ScreenLayout>
  )
}
