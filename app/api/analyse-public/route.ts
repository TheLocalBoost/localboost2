import { NextRequest, NextResponse } from 'next/server'

const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY!

const GOOGLE_TYPE_MAP: Record<string, string> = {
  plumber: 'plombier', electrician: 'electricien', hair_care: 'coiffeur',
  beauty_salon: 'coiffeur', bakery: 'boulanger', restaurant: 'restaurateur',
  food: 'restaurateur', painter: 'peintre', flooring_store: 'carreleur',
  general_contractor: 'artisan', roofing_contractor: 'artisan', plumbing: 'plombier',
  car_repair: 'garagiste', locksmith: 'serrurier', physiotherapist: 'kine',
  dentist: 'dentiste', doctor: 'medecin', pharmacy: 'pharmacie',
  lodging: 'hotel', florist: 'fleuriste', optician: 'opticien',
}

function detectCategory(types: string[], commerceName: string): string {
  for (const t of types) { if (GOOGLE_TYPE_MAP[t]) return GOOGLE_TYPE_MAP[t] }
  const n = commerceName.toLowerCase()
  for (const [key] of Object.entries(GOOGLE_TYPE_MAP)) { if (n.includes(key)) return GOOGLE_TYPE_MAP[key] }
  return 'artisan'
}

function extractCity(address: string): string {
  const parts = address.split(',').map(s => s.trim())
  const cityPart = parts.find(p => /^\d{5}\s+\w/.test(p))
  if (cityPart) return cityPart.replace(/^\d{5}\s+/, '').trim()
  return parts[parts.length - 2] ?? parts[0] ?? ''
}

function competitorScore(rating: number, reviewCount: number): number {
  return Math.min(72, Math.round((rating / 5 * 40) + (Math.min(reviewCount, 100) / 100 * 32)))
}

function hasRecentReview(reviews: any[]): boolean {
  if (!reviews?.length) return false
  const sixMonthsAgo = Date.now() / 1000 - 180 * 86400
  return reviews.some(r => r.time > sixMonthsAgo)
}

const SECTOR_VALUE: Record<string, number> = {
  plombier: 250, electricien: 220, serrurrier: 180, garagiste: 300,
  coiffeur: 45, restaurateur: 28, boulanger: 18, pharmacie: 35,
  hotel: 120, fleuriste: 60, opticien: 350, dentiste: 180, medecin: 50,
  kine: 60, artisan: 200,
}

const POSITION_CTR: Record<number, number> = { 1: 0.35, 2: 0.17, 3: 0.10, 4: 0.05 }

function estimatePosition(score: number, competitors: Competitor[]): number {
  const betterCount = competitors.filter(c => c.estimatedScore > score).length
  return Math.min(betterCount + 1, 4)
}

export interface ProblemItem {
  text: string
  calls: number
  revenue: number
}

export interface Competitor {
  name: string; vicinity: string; rating: number; reviewCount: number; estimatedScore: number
}

function generateRichProblems(
  p: any,
  criteria: Record<string, boolean>,
  competitors: Competitor[],
  category: string,
  score: number
): { problems: ProblemItem[]; lostCalls: number; lostRevenue: number } {
  const items: ProblemItem[] = []

  const myRating       = p.rating ?? 0
  const myReviews      = p.user_ratings_total ?? 0
  const myPhotos       = p.photos?.length ?? 0
  const avgCompReviews = competitors.length
    ? Math.round(competitors.reduce((a, c) => a + c.reviewCount, 0) / competitors.length)
    : null
  const topCompReviews = competitors.length
    ? Math.max(...competitors.map(c => c.reviewCount))
    : null
  const avgCompRating  = competitors.filter(c => c.rating > 0).length
    ? parseFloat((competitors.filter(c => c.rating > 0).reduce((a, c) => a + c.rating, 0) / competitors.filter(c => c.rating > 0).length).toFixed(1))
    : null
  const lastReviewAge  = (p.reviews ?? [])[0]?.relative_time_description ?? null

  const position           = estimatePosition(score, competitors)
  const myCTR              = POSITION_CTR[position] ?? 0.03
  const topCTR             = POSITION_CTR[1]
  const baseMonthlySearches = 80
  const myMonthlyClicks    = Math.round(baseMonthlySearches * myCTR)
  const topMonthlyClicks   = Math.round(baseMonthlySearches * topCTR)
  const lostClicks         = Math.max(0, topMonthlyClicks - myMonthlyClicks)
  const callRate           = 0.35
  const lostCalls          = Math.round(lostClicks * callRate)
  const sectorValue        = SECTOR_VALUE[category] ?? 200
  const convRate           = 0.60
  const lostRevenue        = Math.round(lostCalls * convRate * sectorValue)

  function rev(calls: number) { return Math.round(calls * convRate * sectorValue) }

  // Fiche fermée — critique
  if (p.business_status === 'CLOSED_PERMANENTLY') {
    items.unshift({
      text: 'CRITIQUE — Votre fiche Google affiche votre établissement comme définitivement fermé. Aucun client ne vous appellera.',
      calls: Math.round(myMonthlyClicks * callRate),
      revenue: Math.round(myMonthlyClicks * callRate * convRate * sectorValue),
    })
  } else if (p.business_status === 'CLOSED_TEMPORARILY') {
    items.unshift({
      text: 'Votre fiche Google indique que votre établissement est temporairement fermé. Les clients passent chez le concurrent.',
      calls: Math.round(myMonthlyClicks * callRate * 0.5),
      revenue: Math.round(myMonthlyClicks * callRate * 0.5 * convRate * sectorValue),
    })
  }

  // Position vs concurrents
  if (position > 1) {
    const topComp = competitors.find(c => c.estimatedScore > score)
    items.push({
      text: topComp
        ? `Votre fiche apparaît en position estimée #${position} sur Google Maps — ${topComp.name} vous devance. Le premier résultat capte 3× plus d'appels que le troisième.`
        : `Votre fiche apparaît en position estimée #${position} sur Google Maps. Le premier résultat capte 3× plus de clics que le troisième.`,
      calls: lostCalls,
      revenue: lostRevenue,
    })
  }

  // Avis vs concurrents
  if (avgCompReviews !== null && myReviews < avgCompReviews) {
    const gap      = avgCompReviews - myReviews
    const gapRatio = Math.min(gap / avgCompReviews, 0.25)
    const c        = Math.max(Math.round(baseMonthlySearches * gapRatio * 0.4 * callRate), 2)
    items.push({
      text: `Vous avez ${myReviews} avis, vos concurrents en ont ${avgCompReviews} en moyenne (jusqu'à ${topCompReviews}). Google classe en priorité les fiches avec le plus d'avis récents.`,
      calls: c,
      revenue: rev(c),
    })
  } else if (!criteria.avis20) {
    items.push({
      text: `Vous avez ${myReviews} avis Google. En dessous de 20, votre fiche est peu mise en avant dans les résultats locaux.`,
      calls: 3,
      revenue: rev(3),
    })
  } else if (avgCompReviews !== null && myReviews < avgCompReviews * 1.5) {
    items.push({
      text: `Vous avez ${myReviews} avis. Votre concurrent le mieux référencé en a ${topCompReviews} — plus d'avis = meilleur classement Google.`,
      calls: 2,
      revenue: rev(2),
    })
  }

  // Note
  if (!criteria.note4) {
    const c = Math.max(Math.round(myMonthlyClicks * 0.40 * callRate), 2)
    items.push({
      text: avgCompRating && avgCompRating > myRating
        ? `Votre note est ${myRating}/5, vos concurrents ont ${avgCompRating}/5 en moyenne. En dessous de 4.0, 60% des clients ne vous contactent pas.`
        : `Votre note est ${myRating}/5. En dessous de 4.0, la majorité des clients choisissent un concurrent directement.`,
      calls: c,
      revenue: Math.round(c * sectorValue),
    })
  } else if (avgCompRating && myRating < avgCompRating) {
    items.push({
      text: `Votre note est ${myRating}/5, vos concurrents ont ${avgCompRating}/5 en moyenne. Même au-dessus de 4.0, chaque dixième de point influence le classement.`,
      calls: 1,
      revenue: rev(1),
    })
  }

  // Avis récents
  if (!criteria.recentReview) {
    items.push({
      text: lastReviewAge
        ? `Votre dernier avis date de ${lastReviewAge}. Google rétrograde les fiches sans activité récente — les clients voient d'abord vos concurrents actifs.`
        : `Aucun avis dans les 6 derniers mois. Une fiche inactive perd des positions indépendamment de sa note.`,
      calls: 3,
      revenue: rev(3),
    })
  }

  // Photos
  if (!criteria.photos) {
    const c = Math.max(Math.round(myMonthlyClicks * 0.25 * callRate), 2)
    items.push({
      text: `Vous avez ${myPhotos} photo${myPhotos !== 1 ? 's' : ''}. Les fiches avec 10+ photos reçoivent 35% de clics supplémentaires — Google les favorise dans les résultats locaux.`,
      calls: c,
      revenue: rev(c),
    })
  } else if (myPhotos < 10) {
    items.push({
      text: `Vous avez ${myPhotos} photos. Passer à 10+ augmente le taux de clic de 35% en moyenne selon les données Google Business.`,
      calls: 2,
      revenue: rev(2),
    })
  }

  // Téléphone
  if (!criteria.telephone) {
    items.push({
      text: 'Aucun numéro de téléphone sur votre fiche — les clients ne peuvent pas vous appeler directement depuis Google Maps.',
      calls: 5,
      revenue: rev(5),
    })
  }

  // Horaires
  if (!criteria.horaires) {
    items.push({
      text: 'Vos horaires ne sont pas renseignés — Google ne peut pas indiquer si vous êtes ouvert, ce qui génère des hésitations et coûte des visites.',
      calls: 4,
      revenue: rev(4),
    })
  }

  // Description
  if (!criteria.description) {
    items.push({
      text: "Votre fiche n'a pas de description — Google comprend moins bien votre activité et vous positionne moins bien dans les recherches locales.",
      calls: 2,
      revenue: rev(2),
    })
  }

  // Site web
  if (!criteria.site) {
    items.push({
      text: "Aucun site web lié à votre fiche — vous paraissez moins établi face aux concurrents qui en ont un, et Google pénalise ce manque de signal.",
      calls: 1,
      revenue: rev(1),
    })
  }

  // Garantir minimum 3 problèmes
  if (items.length < 3 && criteria.avis20 && myReviews < 50) {
    items.push({
      text: `Vous avez ${myReviews} avis. Les fiches avec 50+ avis dominent les premières positions sur votre secteur.`,
      calls: 2,
      revenue: rev(2),
    })
  }
  if (items.length < 3) {
    items.push({
      text: "Votre fiche n'a pas eu de nouvelles publications Google récemment. Les fiches actives (posts, Q&A répondus) bénéficient d'un meilleur référencement local.",
      calls: 2,
      revenue: rev(2),
    })
  }

  return { problems: items.slice(0, 6), lostCalls, lostRevenue }
}

export async function POST(req: NextRequest) {
  const { commerce_name, city } = await req.json()
  if (!commerce_name || !city) return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })

  // 1. Textsearch
  const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(`${commerce_name} ${city}`)}&language=fr&region=fr&key=${GOOGLE_API_KEY}`
  const searchData = await fetch(searchUrl).then(r => r.json())
  const results: any[] = searchData.results ?? []
  const place = results[0]
  if (!place) return NextResponse.json({ error: 'Établissement introuvable. Vérifiez le nom exact sur Google Maps.' }, { status: 404 })

  // 2. Détails
  const fields = [
    'name', 'rating', 'user_ratings_total', 'photos', 'formatted_address',
    'formatted_phone_number', 'international_phone_number', 'opening_hours',
    'website', 'editorial_summary', 'types', 'business_status', 'url',
    'reviews', 'price_level', 'vicinity', 'place_id', 'geometry',
  ].join(',')

  const detailUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=${fields}&language=fr&key=${GOOGLE_API_KEY}`
  const detailData = await fetch(detailUrl).then(r => r.json())
  const p = detailData.result ?? {}

  // 3. Catégorie et ville (avant generateRichProblems)
  const types    = (p.types ?? place.types ?? []) as string[]
  const category = detectCategory(types, commerce_name)
  const cityOut  = p.formatted_address ? extractCity(p.formatted_address) : city

  // 4. Statut activité
  const isClosed = p.business_status === 'CLOSED_PERMANENTLY' || p.business_status === 'CLOSED_TEMPORARILY'

  // 5. Audit critères
  const recentReview = hasRecentReview(p.reviews ?? [])
  const hasSchedule  = !!(p.opening_hours?.periods?.length)

  const criteria: Record<string, boolean> = {
    nom:          !!p.name,
    adresse:      !!p.formatted_address,
    telephone:    !!p.formatted_phone_number,
    horaires:     hasSchedule,
    site:         !!p.website,
    description:  !!p.editorial_summary?.overview,
    photos:       (p.photos?.length ?? 0) >= 5,
    avis20:       (p.user_ratings_total ?? 0) >= 20,
    note4:        (p.rating ?? 0) >= 4.0,
    recentReview,
  }

  const score = Math.round((Object.values(criteria).filter(Boolean).length / Object.keys(criteria).length) * 100)

  // 6. Concurrents
  const competitors: Competitor[] = results.slice(1, 3)
    .filter(r => r.name && r.place_id !== place.place_id)
    .map(r => ({
      name:           r.name,
      vicinity:       r.formatted_address ?? r.vicinity ?? city,
      rating:         r.rating ?? 0,
      reviewCount:    r.user_ratings_total ?? 0,
      estimatedScore: competitorScore(r.rating ?? 0, r.user_ratings_total ?? 0),
    }))

  // 7. Problèmes enrichis avec impact individuel
  const { problems, lostCalls, lostRevenue } = generateRichProblems(p, criteria, competitors, category, score)

  // 8. Impact global (pour le bloc résumé)
  const missedClicks  = Math.round((100 - score) * 1.8)
  const missedClients = Math.round(missedClicks * 0.15)
  const missedRevenue = missedClients * 200

  // 9. Données annexes
  const recentReviews = (p.reviews ?? []).slice(0, 3).map((r: any) => ({
    author:  r.author_name ?? '',
    rating:  r.rating ?? 0,
    text:    r.text ?? '',
    time:    r.relative_time_description ?? '',
  }))
  const weekdayHours: string[] = p.opening_hours?.weekday_text ?? []
  const openNow: boolean | null = p.opening_hours?.open_now ?? null

  return NextResponse.json({
    found:    true,
    name:     p.name ?? commerce_name,
    address:  p.formatted_address ?? '',
    city:     cityOut,
    category,
    score,
    reviews:  p.user_ratings_total ?? 0,
    rating:   p.rating ?? 0,
    photos:   p.photos?.length ?? 0,
    problems,
    criteria,
    businessStatus:  p.business_status ?? 'OPERATIONAL',
    isClosed,
    openNow,
    weekdayHours,
    recentReviews,
    priceLevel:      p.price_level ?? null,
    googleMapsUrl:   p.url ?? null,
    phoneIntl:       p.international_phone_number ?? null,
    missed: { clicks: missedClicks, clients: missedClients, revenue: missedRevenue },
    lostCalls,
    lostRevenue,
    competitors,
  })
}
