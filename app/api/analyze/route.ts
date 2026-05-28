import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { createClient as createAdmin } from '@supabase/supabase-js'

const supabaseAdmin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY!
const DAILY_LIMIT = 350

function today(): string {
  return new Date().toISOString().split('T')[0]
}

async function getDailyCount(): Promise<number> {
  const { data } = await supabaseAdmin
    .from('api_quota')
    .select('count')
    .eq('date', today())
    .eq('key_index', 0)
    .single()
  return data?.count || 0
}

async function incrementQuota() {
  await supabaseAdmin.rpc('increment_api_quota', { p_date: today(), p_key_index: 0 })
}

function matchesName(resultName: string, searchName: string): boolean {
  const words = searchName.toLowerCase().split(/\s+/).filter(w => w.length > 2)
  const target = resultName.toLowerCase()
  return words.every(w => target.includes(w))
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { data: profile } = await supabase
      .from('merchant_profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (!profile) return NextResponse.json({ error: 'Profil manquant' }, { status: 400 })

    // Quota journalier partagé avec la landing page
    const dailyCount = await getDailyCount()
    if (dailyCount >= DAILY_LIMIT) {
      return NextResponse.json({ error: 'Quota journalier atteint. Revenez demain.' }, { status: 429 })
    }

    const query = `${profile.commerce_name} ${profile.city}`
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&language=fr&region=fr&key=${GOOGLE_API_KEY}`
    const res = await fetch(url)
    const data = await res.json()
    await incrementQuota()

    if (data.status === 'REQUEST_DENIED') {
      return NextResponse.json({ error: 'Google API refusée' }, { status: 500 })
    }

    const results = data.results || []
    const position = results.findIndex((r: any) => matchesName(r.name || '', profile.commerce_name))

    const topCompetitors = results.slice(0, 3).map((r: any, i: number) => ({
      name: r.name,
      rating: r.rating,
      reviews: r.user_ratings_total || 0,
      position: i + 1,
    }))

    // Sauvegarde du place_id pour la surveillance des avis
    const ownResult = position >= 0 ? results[position] : results[0]
    if (ownResult?.place_id) {
      await supabase
        .from('merchant_profiles')
        .update({ place_id: ownResult.place_id })
        .eq('id', user.id)
    }

    let score = 50
    if (position === 0)       score = 95
    else if (position === 1)  score = 80
    else if (position === 2)  score = 65
    else if (position === -1) score = 30

    const own = results[position] || {}
    if ((own.rating || 0) >= 4.5)               score += 5
    if ((own.user_ratings_total || 0) >= 50)    score += 5
    if (score > 100) score = 100

    await supabase.from('weekly_reports').insert({
      user_id: user.id,
      week_start: new Date().toISOString().split('T')[0],
      visibility_score: score,
      competitor_data: { competitors: topCompetitors, position: position + 1 },
    })

    return NextResponse.json({
      score,
      position: position + 1,
      competitors: topCompetitors,
      ownListing: {
        name: own.name,
        rating: own.rating,
        reviews: own.user_ratings_total || 0,
      },
    })
  } catch (err) {
    console.error('Analyze error:', err)
    return NextResponse.json({ error: 'Erreur analyse' }, { status: 500 })
  }
}
