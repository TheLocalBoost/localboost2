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

// Sources : FIDUCIAL 2025 (boulanger), Travaux.com 2025 (plombier),
// Depanneo 2024 (electricien), Esprit-Coiffure 2024 (coiffeur),
// idGarages 2024 (garagiste), FIDUCIAL 2024 (restaurant), 150€ défaut conservateur
const PANIER_MOYEN: Record<string, number> = {
  plombier:    200,
  electricien: 180,
  coiffeur:    55,
  boulanger:   75,
  restaurateur: 25,
  garagiste:   300,
  serrurier:   150,
  kine:        70,
  dentiste:    150,
  medecin:     80,
  pharmacie:   40,
  hotel:       100,
  fleuriste:   55,
  opticien:    200,
  artisan:     150,
  peintre:     180,
  carreleur:   200,
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

// Vérifie si un avis a été posté dans les 3 derniers mois
function hasRecentReview(reviews: any[]): boolean {
  if (!reviews?.length) return false
  const threeMonthsAgo = Date.now() / 1000 - 90 * 86400
  return reviews.some(r => r.time > threeMonthsAgo)
}

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
  const panier   = PANIER_MOYEN[category] ?? 150

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
    ? parseFloat((competitors.filter(c => c.rating > 0).reduce((a, c) => a + c.rating, 0)
        / competitors.filter(c => c.rating > 0).length).toFixed(1))
    : null
  const lastReviewAge  = (p.reviews ?? [])[0]?.relative_time_description ?? null
  const position       = estimatePosition(score, competitors)

  // Fiche fermée — critique
  if (p.business_status === 'CLOSED_PERMANENTLY') {
    items.push({
      text: 'CRITIQUE — Votre fiche Google affiche votre établissement comme définitivement fermé. Aucun client ne vous appellera.',
      calls: 20,
      revenue: 20 * panier,
    })
  } else if (p.business_status === 'CLOSED_TEMPORARILY') {
    items.push({
      text: 'Votre fiche Google indique que votre établissement est temporairement fermé. Les clients passent chez le concurrent.',
      calls: 10,
      revenue: 10 * panier,
    })
  }

  // 1. Horaires absents — 8 à 15 appels perdus/mois (borne basse)
  if (!criteria.horaires) {
    items.push({
      text: 'Vos horaires ne sont pas renseignés. Un client qui cherche votre commerce à 19h voit "fermé" sur votre fiche — il appelle le concurrent.',
      calls: 8,
      revenue: 8 * panier,
    })
  }

  // 2. Photos insuffisantes — 5 à 10 appels perdus/mois (borne basse)
  if (!criteria.photos) {
    items.push({
      text: `Vous avez ${myPhotos} photo${myPhotos !== 1 ? 's' : ''} sur votre fiche. Sans photos récentes, votre fiche inspire moins confiance que celle du voisin. Le client choisit l'autre.`,
      calls: 5,
      revenue: 5 * panier,
    })
  }

  // 3. Fiche inactive (aucun avis ni activité depuis 3 mois) — 10 à 20 appels perdus/mois (borne basse)
  if (!criteria.recentReview) {
    const posCtx = position > 1 ? ` Votre fiche apparaît en position estimée #${position} sur Google.` : ''
    items.push({
      text: lastReviewAge
        ? `Votre dernier avis date de ${lastReviewAge}. Google considère votre fiche comme inactive et la place après vos concurrents actifs.${posCtx}`
        : `Aucune activité récente sur votre fiche. Google la place après vos concurrents actifs.${posCtx}`,
      calls: 10,
      revenue: 10 * panier,
    })
  }

  // 4. Description manquante — 2 à 4 appels perdus/mois (borne basse)
  if (!criteria.description) {
    items.push({
      text: "Votre fiche n'a pas de description. Google ne sait pas précisément quels services vous proposez — votre fiche ressort moins dans les recherches locales.",
      calls: 2,
      revenue: 2 * panier,
    })
  }

  // 5. Site web absent — 1 à 3 appels perdus/mois (borne basse)
  if (!criteria.site) {
    items.push({
      text: "Aucun site web lié à votre fiche. Vos concurrents qui en ont un paraissent plus établis — Google les favorise dans les résultats.",
      calls: 1,
      revenue: 1 * panier,
    })
  }

  // 6. Moins de 20 avis (ou moins que les concurrents) — 3 à 6 appels perdus/mois (borne basse)
  if (!criteria.avis20) {
    items.push({
      text: avgCompReviews && myReviews < avgCompReviews
        ? `Vous avez ${myReviews} avis, vos concurrents en ont ${avgCompReviews} en moyenne (jusqu'à ${topCompReviews}). Google classe en priorité les fiches avec le plus d'avis récents.`
        : `Vous avez ${myReviews} avis Google. En dessous de 20, votre fiche est peu mise en avant dans les recherches locales.`,
      calls: 3,
      revenue: 3 * panier,
    })
  } else if (avgCompReviews !== null && myReviews < avgCompReviews) {
    items.push({
      text: `Vous avez ${myReviews} avis, vos concurrents en ont ${avgCompReviews} en moyenne. Chaque avis supplémentaire améliore votre classement sur Google.`,
      calls: 2,
      revenue: 2 * panier,
    })
  }

  // 7. Note < 4.0 — 5 à 12 appels perdus/mois (borne basse)
  if (!criteria.note4) {
    items.push({
      text: avgCompRating && avgCompRating > myRating
        ? `Votre note est ${myRating}/5, vos concurrents ont ${avgCompRating}/5 en moyenne. En dessous de 4.0, la majorité des clients ne vous appellent pas.`
        : `Votre note est ${myRating}/5. En dessous de 4.0, les clients choisissent directement un concurrent mieux noté.`,
      calls: 5,
      revenue: 5 * panier,
    })
  }

  // 8. Téléphone absent (critique, hors spec — appel impossible depuis Maps)
  if (!criteria.telephone) {
    items.push({
      text: 'Aucun numéro de téléphone sur votre fiche — les clients ne peuvent pas vous appeler directement depuis Google Maps.',
      calls: 4,
      revenue: 4 * panier,
    })
  }

  // Garantir minimum 3 problèmes
  if (items.length < 3 && criteria.avis20 && myReviews < 50) {
    items.push({
      text: `Vous avez ${myReviews} avis. Les fiches avec 50+ avis dominent les premières positions sur votre secteur.`,
      calls: 2,
      revenue: 2 * panier,
    })
  }
  if (items.length < 3) {
    items.push({
      text: "Votre fiche n'a pas eu de publications Google récemment. Les fiches actives bénéficient d'un meilleur classement local.",
      calls: 2,
      revenue: 2 * panier,
    })
  }

  const sliced = items.slice(0, 6)

  // Bug 1 fix — total = somme des problèmes détectés (pas le delta de position CTR)
  const rawCalls   = sliced.reduce((sum, it) => sum + it.calls, 0)
  const rawRevenue = sliced.reduce((sum, it) => sum + it.revenue, 0)

  // Correction 4 — plafonnement cohérent avec le score
  const cap         = score >= 86 ? 5 : score >= 71 ? 15 : score >= 51 ? 30 : rawCalls
  const cappedCalls = Math.min(rawCalls, cap)
  const cappedRevenue = rawCalls > 0 ? Math.round(rawRevenue * cappedCalls / rawCalls) : 0

  return { problems: sliced, lostCalls: cappedCalls, lostRevenue: cappedRevenue }
}

// Rate limiting: 60 req/min per IP
const rl = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rl.get(ip)
  if (!entry || now > entry.resetAt) {
    rl.set(ip, { count: 1, resetAt: now + 60_000 })
    return true
  }
  if (entry.count >= 60) return false
  entry.count++
  return true
}

// Cache in-memory (nom+ville → résultat, TTL 30min)
const cache = new Map<string, { data: any; expiresAt: number }>()
function cacheKey(name: string, city: string) { return `${name.toLowerCase().trim()}|${city.toLowerCase().trim()}` }
function fromCache(name: string, city: string) {
  const c = cache.get(cacheKey(name, city))
  if (!c || Date.now() > c.expiresAt) return null
  return c.data
}
function toCache(name: string, city: string, data: any) {
  cache.set(cacheKey(name, city), { data, expiresAt: Date.now() + 30 * 60_000 })
}

// Normalise une ville pour comparaison (accents, casse, tirets)
function normalizeStr(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '')
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: 'Trop de requêtes. Réessayez dans une minute.' }, { status: 429 })
  }

  const { commerce_name, city } = await req.json()
  if (!commerce_name || !city) return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })

  // Cache hit
  const cached = fromCache(commerce_name, city)
  if (cached) return NextResponse.json(cached)

  // 1. Textsearch — essaie le nom complet, puis le premier mot si pas de résultat
  async function textsearch(query: string) {
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&language=fr&region=fr&key=${GOOGLE_API_KEY}`
    const data = await fetch(url).then(r => r.json())
    return (data.results ?? []) as any[]
  }

  let results = await textsearch(`${commerce_name} ${city}`)

  // Nom avec virgules (ex: "JP Entreprise Plomberie, Electricité, Chauffage") → essaie avant la 1ère virgule
  if (!results.length && commerce_name.includes(',')) {
    const beforeComma = commerce_name.split(',')[0].trim()
    results = await textsearch(`${beforeComma} ${city}`)
    // Puis 2 premiers mots de la partie avant virgule
    if (!results.length && beforeComma.includes(' ')) {
      const twoWords = beforeComma.split(' ').slice(0, 2).join(' ')
      results = await textsearch(`${twoWords} ${city}`)
    }
  }

  // Retry avec nom tronqué aux 2 premiers mots si nom long et 0 résultats
  if (!results.length && commerce_name.includes(' ')) {
    const shortName = commerce_name.split(' ').slice(0, 2).join(' ')
    results = await textsearch(`${shortName} ${city}`)
  }

  // Retry avec seulement le premier mot si toujours rien
  if (!results.length && commerce_name.includes(' ')) {
    results = await textsearch(`${commerce_name.split(' ')[0]} ${city}`)
  }

  if (!results.length) return NextResponse.json({ error: 'Établissement introuvable. Vérifiez le nom exact sur Google Maps.' }, { status: 404 })

  // Choisir le résultat qui correspond à la bonne ville (évite de montrer le mauvais établissement)
  const cityNorm = normalizeStr(city)
  const place = results.find(r => {
    const addr = normalizeStr(r.formatted_address ?? r.vicinity ?? '')
    return addr.includes(cityNorm)
  }) ?? results[0]

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

  // 3. Catégorie et ville
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

  // Scoring pondéré : description et activité récente sont les 2 signaux
  // les plus importants pour l'algorithme Google Maps — chacun vaut 3x plus
  // que les critères de complétude basique. nom/adresse exclus (toujours vrais).
  const SCORE_WEIGHTS: Record<string, number> = {
    telephone: 7, horaires: 8, site: 6,
    description: 22, photos: 7, avis20: 8, note4: 8, recentReview: 22,
  }
  const totalW  = 88
  const earnedW = Object.entries(SCORE_WEIGHTS).reduce(
    (sum, [k, w]) => sum + (criteria[k] ? w : 0), 0
  )
  const score = Math.round(earnedW / totalW * 100)

  // 6. Concurrents — recherche par secteur+ville pour trouver les vrais concurrents locaux
  const competitorResults = await textsearch(`${category} ${cityOut}`)
  const competitors: Competitor[] = competitorResults
    .filter(r => r.name && r.place_id !== place.place_id)
    .slice(0, 3)
    .map(r => ({
      name:           r.name,
      vicinity:       r.formatted_address ?? r.vicinity ?? cityOut,
      rating:         r.rating ?? 0,
      reviewCount:    r.user_ratings_total ?? 0,
      estimatedScore: competitorScore(r.rating ?? 0, r.user_ratings_total ?? 0),
    }))

  // 7. Problèmes enrichis avec impact individuel + total plafonnéselon score
  const { problems, lostCalls, lostRevenue } = generateRichProblems(p, criteria, competitors, category, score)

  // Score Commercial — 5 dimensions en langage artisan, pas SEO
  const beating = competitors.filter(c => c.estimatedScore < score).length
  const commercialScores = {
    found:          Math.round((Number(criteria.description)*3 + Number(criteria.horaires)*2.5 + Number(criteria.site)*2 + Number(criteria.telephone)*2 + 0.5) / 10 * 10),
    trust:          Math.round((Number(criteria.note4)*4 + Number(criteria.avis20)*3.5 + Number(criteria.photos)*2.5) / 10 * 10),
    desire:         Math.round((Number(criteria.recentReview)*5 + Number(criteria.description)*5) / 10 * 10),
    activity:       Math.round((Number(criteria.recentReview)*7 + Number(criteria.photos)*3) / 10 * 10),
    vsCompetitors:  competitors.length ? Math.max(1, Math.round(2 + beating / competitors.length * 8)) : 5,
  }

  // 8. Données annexes
  const recentReviews = (p.reviews ?? []).slice(0, 3).map((r: any) => ({
    author:  r.author_name ?? '',
    rating:  r.rating ?? 0,
    text:    r.text ?? '',
    time:    r.relative_time_description ?? '',
  }))
  const weekdayHours: string[] = p.opening_hours?.weekday_text ?? []
  const openNow: boolean | null = p.opening_hours?.open_now ?? null

  const responseData = {
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
    placeId:         place.place_id ?? null,
    lostCalls,
    lostRevenue,
    competitors,
    commercialScores,
  }

  toCache(commerce_name, city, responseData)
  return NextResponse.json(responseData)
}
