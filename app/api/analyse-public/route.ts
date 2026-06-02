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

export async function POST(req: NextRequest) {
  const { commerce_name, city } = await req.json()
  if (!commerce_name || !city) {
    return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
  }

  // 1. Recherche du place
  const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(`${commerce_name} ${city}`)}&language=fr&region=fr&key=${GOOGLE_API_KEY}`
  const searchData = await fetch(searchUrl).then(r => r.json())
  const place = searchData.results?.[0]

  if (!place) {
    return NextResponse.json({ error: 'Établissement introuvable. Vérifiez le nom exact sur Google Maps.' }, { status: 404 })
  }

  // 2. Détails complets
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
  const missedClicks  = Math.round((100 - score) * 1.8)   // ~1.8 clics perdus par point
  const missedClients = Math.round(missedClicks * 0.15)    // 15% de taux de conversion appel
  const missedRevenue = missedClients * 200                 // 200€ par intervention moyenne

  return NextResponse.json({
    found: true,
    name:    p.name ?? commerce_name,
    address: p.formatted_address ?? '',
    score,
    reviews: p.user_ratings_total ?? 0,
    rating:  p.rating ?? 0,
    photos:  p.photos?.length ?? 0,
    problems,                    // verrouillé côté client
    missed: {                    // verrouillé côté client
      clicks:  missedClicks,
      clients: missedClients,
      revenue: missedRevenue,
    },
  })
}
