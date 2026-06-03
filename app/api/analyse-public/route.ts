import { NextRequest, NextResponse } from 'next/server'

const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY!

const CRITERIA_LABELS: Record<string, string> = {
  telephone:   'Numéro de téléphone manquant',
  horaires:    'Horaires d\'ouverture non renseignés',
  site:        'Aucun site web sur la fiche',
  description: 'Description de l\'activité absente',
  photos:      'Moins de 5 photos (minimum recommandé)',
  avis20:      'Moins de 20 avis Google',
  note4:       'Note inférieure à 4.0/5',
  nom:         'Nom d\'établissement incomplet',
  adresse:     'Adresse non renseignée',
}

// Mapping Google Place types → catégorie française
const GOOGLE_TYPE_MAP: Record<string, string> = {
  plumber:              'plombier',
  electrician:          'electricien',
  hair_care:            'coiffeur',
  beauty_salon:         'coiffeur',
  bakery:               'boulanger',
  restaurant:           'restaurateur',
  food:                 'restaurateur',
  painter:              'peintre',
  flooring_store:       'carreleur',
  general_contractor:   'artisan',
  roofing_contractor:   'artisan',
  plumbing:             'plombier',
  car_repair:           'garagiste',
  locksmith:            'serrurier',
  physiotherapist:      'kine',
  dentist:              'dentiste',
  doctor:               'medecin',
}

function detectCategory(types: string[], commerceName: string): string {
  for (const t of types) {
    if (GOOGLE_TYPE_MAP[t]) return GOOGLE_TYPE_MAP[t]
  }
  // Fallback sur le nom recherché
  const n = commerceName.toLowerCase()
  for (const [key] of Object.entries(GOOGLE_TYPE_MAP)) {
    if (n.includes(key)) return GOOGLE_TYPE_MAP[key]
  }
  return 'artisan'
}

function extractCity(address: string): string {
  const parts = address.split(',').map(s => s.trim())
  const cityPart = parts.find(p => /^\d{5}\s+\w/.test(p))
  if (cityPart) return cityPart.replace(/^\d{5}\s+/, '').trim()
  return parts[parts.length - 2] ?? parts[0] ?? ''
}

// Score estimé pour les concurrents (sans appel détails)
function competitorScore(rating: number, reviewCount: number): number {
  return Math.min(72, Math.round((rating / 5 * 40) + (Math.min(reviewCount, 100) / 100 * 32)))
}

export interface Competitor {
  name: string
  vicinity: string
  rating: number
  reviewCount: number
  estimatedScore: number
}

export async function POST(req: NextRequest) {
  const { commerce_name, city } = await req.json()
  if (!commerce_name || !city) {
    return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
  }

  // 1. Recherche textsearch — prend les 3 premiers résultats
  const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(`${commerce_name} ${city}`)}&language=fr&region=fr&key=${GOOGLE_API_KEY}`
  const searchData = await fetch(searchUrl).then(r => r.json())
  const results: any[] = searchData.results ?? []
  const place = results[0]

  if (!place) {
    return NextResponse.json({ error: 'Établissement introuvable. Vérifiez le nom exact sur Google Maps.' }, { status: 404 })
  }

  // 2. Détails complets pour le résultat principal
  const fields = 'name,rating,user_ratings_total,photos,formatted_address,formatted_phone_number,opening_hours,website,editorial_summary,types'
  const detailUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=${fields}&language=fr&key=${GOOGLE_API_KEY}`
  const detailData = await fetch(detailUrl).then(r => r.json())
  const p = detailData.result ?? {}

  // 3. Audit 9 critères
  const criteria: Record<string, boolean> = {
    nom:         !!p.name,
    adresse:     !!p.formatted_address,
    telephone:   !!p.formatted_phone_number,
    horaires:    !!(p.opening_hours?.periods?.length),
    site:        !!p.website,
    description: !!p.editorial_summary?.overview,
    photos:      (p.photos?.length ?? 0) >= 5,
    avis20:      (p.user_ratings_total ?? 0) >= 20,
    note4:       (p.rating ?? 0) >= 4.0,
  }

  const score    = Math.round((Object.values(criteria).filter(Boolean).length / 9) * 100)
  const problems = Object.entries(criteria).filter(([, v]) => !v).map(([k]) => CRITERIA_LABELS[k] ?? k)

  // 4. Estimation visibilité perdue
  const missedClicks  = Math.round((100 - score) * 1.8)
  const missedClients = Math.round(missedClicks * 0.15)
  const missedRevenue = missedClients * 200

  // 5. Concurrents (résultats 1 et 2 du textsearch)
  const competitors: Competitor[] = results.slice(1, 3)
    .filter(r => r.name && r.place_id !== place.place_id)
    .map(r => ({
      name:           r.name,
      vicinity:       r.formatted_address ?? r.vicinity ?? city,
      rating:         r.rating ?? 0,
      reviewCount:    r.user_ratings_total ?? 0,
      estimatedScore: competitorScore(r.rating ?? 0, r.user_ratings_total ?? 0),
    }))

  // 6. Catégorie et ville
  const types    = (p.types ?? place.types ?? []) as string[]
  const category = detectCategory(types, commerce_name)
  const cityOut  = p.formatted_address ? extractCity(p.formatted_address) : city

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
    missed: { clicks: missedClicks, clients: missedClients, revenue: missedRevenue },
    competitors,
  })
}
