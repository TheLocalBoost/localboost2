import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Google Places Text Search — $17/1000 requêtes, $200 crédit gratuit/mois = ~11 700 requêtes gratuites
const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY!
const DAILY_LIMIT = 350 // marge sous les 392/jour du crédit gratuit

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
  console.log('Google Places status:', data.status, 'error:', data.error_message)
  return { results: data.results || [], status: data.status }
}

function matchesName(resultName: string, searchName: string): boolean {
  const words = searchName.toLowerCase().split(/\s+/).filter(w => w.length > 2)
  const target = resultName.toLowerCase()
  return words.every(w => target.includes(w))
}

function computeScore(results: any[], commerceName: string): { score: number; position: number; competitors: any[] } {
  const position = results.findIndex((r: any) => matchesName(r.name || '', commerceName))

  const competitors = results.slice(0, 3).map((r: any, i: number) => ({
    name: r.name,
    rating: r.rating,
    reviews: r.user_ratings_total || 0,
    position: i + 1,
  }))

  let score = 50
  if (position === 0)       score = 95
  else if (position === 1)  score = 80
  else if (position === 2)  score = 65
  else if (position === -1) score = 30

  const own = results[position] || {}
  if ((own.rating || 0) >= 4.5)                score += 5
  if ((own.user_ratings_total || 0) >= 50)     score += 5
  if (score > 100) score = 100

  return { score, position: position + 1, competitors }
}

export async function POST(req: NextRequest) {
  try {
    const { commerce_name, city } = await req.json()
    if (!commerce_name || !city) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
    }

    const force = req.nextUrl.searchParams.get('force') === '1'
    const cacheKey = `${commerce_name.toLowerCase().trim()}__${city.toLowerCase().trim()}`

    // ── 1. Cache 24h ──────────────────────────────────────────────────────
    if (!force) {
      const { data: cached } = await supabase
        .from('search_cache')
        .select('score, competitors, created_at')
        .eq('cache_key', cacheKey)
        .single()

      if (cached) {
        const age = Date.now() - new Date(cached.created_at).getTime()
        if (age < 24 * 60 * 60 * 1000) {
          return NextResponse.json({ score: cached.score, competitors: cached.competitors })
        }
      }
    }

    // ── 2. Quota journalier ───────────────────────────────────────────────
    const dailyCount = await getDailyCount()
    if (dailyCount >= DAILY_LIMIT) {
      return NextResponse.json(
        { error: 'Quota journalier atteint. Revenez demain.' },
        { status: 429 }
      )
    }

    // ── 3. Google Places API ──────────────────────────────────────────────
    const { results, status } = await searchPlaces(`${commerce_name} ${city}`)
    await incrementQuota()

    if (status === 'REQUEST_DENIED') {
      return NextResponse.json({ error: `Google API refusée — vérifier la clé et les APIs activées`, status }, { status: 500 })
    }

    const { score, position, competitors } = computeScore(results, commerce_name)

    // ── 4. Cache ──────────────────────────────────────────────────────────
    await supabase.from('search_cache').upsert(
      { cache_key: cacheKey, score, competitors, created_at: new Date().toISOString() },
      { onConflict: 'cache_key' }
    )

    return NextResponse.json({ score, position, competitors })
  } catch (err) {
    console.error('Analyze public error:', err)
    return NextResponse.json({ error: 'Erreur analyse' }, { status: 500 })
  }
}
