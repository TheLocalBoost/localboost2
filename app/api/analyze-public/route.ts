import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY!
const DAILY_LIMIT = 350

// Benchmarks moyens par type de commerce (fixes, zéro token)
const SECTOR_BENCHMARKS: Record<string, { label: string; average: number }> = {
  bakery:        { label: 'Boulangerie',     average: 72 },
  restaurant:    { label: 'Restaurant',      average: 65 },
  cafe:          { label: 'Café',            average: 63 },
  bar:           { label: 'Bar',             average: 60 },
  hair_care:     { label: 'Coiffeur',        average: 58 },
  beauty_salon:  { label: 'Salon de beauté', average: 60 },
  pharmacy:      { label: 'Pharmacie',       average: 75 },
  plumber:       { label: 'Plombier',        average: 52 },
  electrician:   { label: 'Électricien',     average: 48 },
  car_repair:    { label: 'Garage',          average: 55 },
  doctor:        { label: 'Médecin',         average: 68 },
  dentist:       { label: 'Dentiste',        average: 70 },
  lodging:       { label: 'Hôtel',           average: 78 },
  florist:       { label: 'Fleuriste',       average: 55 },
  optician:      { label: 'Opticien',        average: 62 },
  supermarket:   { label: 'Supermarché',     average: 70 },
  clothing_store:{ label: 'Boutique',        average: 56 },
  gym:           { label: 'Salle de sport',  average: 64 },
}

function getSectorBenchmark(types: string[]): { label: string; average: number } {
  for (const t of (types || [])) {
    if (SECTOR_BENCHMARKS[t]) return SECTOR_BENCHMARKS[t]
  }
  return { label: 'Commerce local', average: 60 }
}

function computeGaps(own: any, position: number): string[] {
  const gaps: string[] = []
  const rating  = own?.rating || 0
  const reviews = own?.user_ratings_total || 0

  if (position === -1) {
    gaps.push("Votre établissement n'apparaît pas dans les premiers résultats Google Maps pour cette recherche — les clients potentiels ne vous voient pas.")
  } else if (position >= 3) {
    gaps.push(`Vous apparaissez en position ${position + 1} sur Google Maps — la quasi-totalité des clics va aux 3 premiers résultats.`)
  }

  if (rating > 0 && rating < 4.0) {
    gaps.push(`Note de ${rating.toFixed(1)}/5 — en dessous du seuil de 4.0/5 que regardent la plupart des clients avant de choisir.`)
  }

  if (reviews === 0) {
    gaps.push("Aucun avis Google — une fiche sans avis est systématiquement ignorée au profit des concurrents.")
  } else if (reviews < 10) {
    gaps.push(`Seulement ${reviews} avis — les fiches bien positionnées dans votre secteur en ont généralement 20 ou plus.`)
  } else if (reviews < 25) {
    gaps.push(`${reviews} avis — vous êtes encore en dessous du seuil de crédibilité (25+ avis) que les clients cherchent.`)
  }

  return gaps.slice(0, 3)
}

function today(): string {
  return new Date().toISOString().split('T')[0]
}

async function getDailyCount(): Promise<number> {
  const { data } = await supabase
    .from('api_quota')
    .select('count')
    .eq('date', today())
    .eq('key_index', 0)
    .single()
  return data?.count || 0
}

async function incrementQuota() {
  await supabase.rpc('increment_api_quota', { p_date: today(), p_key_index: 0 })
}

async function searchPlaces(query: string): Promise<{ results: any[]; status: string }> {
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&language=fr&region=fr&key=${GOOGLE_API_KEY}`
  const res = await fetch(url)
  const data = await res.json()
  return { results: data.results || [], status: data.status }
}

function matchesName(resultName: string, searchName: string): boolean {
  const words = searchName.toLowerCase().split(/\s+/).filter(w => w.length > 2)
  const target = resultName.toLowerCase()
  return words.every(w => target.includes(w))
}

export async function POST(req: NextRequest) {
  try {
    const { commerce_name, city } = await req.json()
    if (!commerce_name || !city) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
    }

    const force    = req.nextUrl.searchParams.get('force') === '1'
    const cacheKey = `${commerce_name.toLowerCase().trim()}__${city.toLowerCase().trim()}`

    // ── Cache 24h ─────────────────────────────────────────────────────────
    if (!force) {
      const { data: cached } = await supabase
        .from('search_cache')
        .select('score, competitors, created_at, own_listing, sector, gaps')
        .eq('cache_key', cacheKey)
        .single()

      if (cached) {
        const age = Date.now() - new Date(cached.created_at).getTime()
        if (age < 24 * 60 * 60 * 1000) {
          return NextResponse.json({
            score:      cached.score,
            competitors: cached.competitors,
            ownListing: cached.own_listing,
            sector:     cached.sector,
            gaps:       cached.gaps,
          })
        }
      }
    }

    // ── Quota ─────────────────────────────────────────────────────────────
    const dailyCount = await getDailyCount()
    if (dailyCount >= DAILY_LIMIT) {
      return NextResponse.json({ error: 'Quota journalier atteint. Revenez demain.' }, { status: 429 })
    }

    // ── Google Places ──────────────────────────────────────────────────────
    const { results, status } = await searchPlaces(`${commerce_name} ${city}`)
    await incrementQuota()

    if (status === 'REQUEST_DENIED') {
      return NextResponse.json({ error: 'Google API refusée — vérifier la clé' }, { status: 500 })
    }

    const position = results.findIndex((r: any) => matchesName(r.name || '', commerce_name))
    const own      = position >= 0 ? results[position] : null

    const competitors = results.slice(0, 3).map((r: any, i: number) => ({
      name: r.name, rating: r.rating, reviews: r.user_ratings_total || 0, position: i + 1,
    }))

    let score = 50
    if (position === 0)       score = 95
    else if (position === 1)  score = 80
    else if (position === 2)  score = 65
    else if (position === -1) score = 30
    if ((own?.rating || 0) >= 4.5)              score += 5
    if ((own?.user_ratings_total || 0) >= 50)   score += 5
    if (score > 100) score = 100

    const sector     = getSectorBenchmark(own?.types || results[0]?.types || [])
    const gaps       = computeGaps(own, position)
    const ownListing = own ? { name: own.name, rating: own.rating, reviews: own.user_ratings_total || 0 } : null

    // ── Cache ──────────────────────────────────────────────────────────────
    await supabase.from('search_cache').upsert(
      { cache_key: cacheKey, score, competitors, own_listing: ownListing, sector, gaps, created_at: new Date().toISOString() },
      { onConflict: 'cache_key' }
    )

    return NextResponse.json({ score, position: position + 1, competitors, ownListing, sector, gaps })
  } catch (err) {
    console.error('Analyze public error:', err)
    return NextResponse.json({ error: 'Erreur analyse' }, { status: 500 })
  }
}
