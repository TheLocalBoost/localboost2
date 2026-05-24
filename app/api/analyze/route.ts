import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

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

    const query = `${profile.commerce_name} ${profile.city}`

    const response = await fetch(
      `https://serpapi.com/search.json?engine=google_maps&q=${encodeURIComponent(query)}&api_key=${process.env.SERPAPI_KEY}`
    )
    const data = await response.json()

    const results = data.local_results || []
    const position = results.findIndex((r: any) =>
      r.title?.toLowerCase().includes(profile.commerce_name?.toLowerCase())
    )

    const topCompetitors = results.slice(0, 3).map((r: any) => ({
      name: r.title,
      rating: r.rating,
      reviews: r.reviews,
      position: results.indexOf(r) + 1,
    }))

    // Score sur 100
    let score = 50
    if (position === 0) score = 95
    else if (position === 1) score = 80
    else if (position === 2) score = 65
    else if (position === -1) score = 30 // pas trouvé

    const ownListing = results[position] || {}
    if (ownListing.rating >= 4.5) score += 5
    if (ownListing.reviews >= 50) score += 5
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
        name: ownListing.title,
        rating: ownListing.rating,
        reviews: ownListing.reviews,
      }
    })
  } catch (err) {
    console.error('Analyze error:', err)
    return NextResponse.json({ error: 'Erreur analyse' }, { status: 500 })
  }
}