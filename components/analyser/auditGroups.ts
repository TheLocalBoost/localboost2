import type { AnalysisResult } from './AnalyserFlow'

export interface AuditItem {
  label: string
  ok: boolean
}

export interface AuditGroup {
  title: string
  items: AuditItem[]
}

export function getAuditGroups(result: AnalysisResult): AuditGroup[] {
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
        { label: 'Note ≥ 3,5 / 5',                  ok: rating >= 3.5 },
        { label: 'Note ≥ 4,0 / 5',                  ok: rating >= 4.0 },
        { label: 'Note ≥ 4,3 / 5',                  ok: rating >= 4.3 },
        { label: 'Plus de 5 avis',                   ok: reviews > 5 },
        { label: 'Plus de 20 avis',                  ok: reviews > 20 },
        { label: 'Plus de 50 avis',                  ok: reviews > 50 },
        { label: 'Pas d\'avis ≤ 2 étoiles récents', ok: c.avisNegatifs !== false },
      ],
    },
    {
      title: 'Activité récente',
      items: [
        { label: 'Avis posté dans les 3 derniers mois',       ok: !!c.recentReview },
        { label: 'Avis récents avec réponse du propriétaire', ok: unanswered === 0 },
        { label: 'Niveau de prix renseigné sur la fiche',     ok: result.priceLevel !== null },
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
