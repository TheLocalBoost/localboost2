import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { commerce_name, city } = await req.json()
    if (!commerce_name || !city) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
    }

    const query = `${commerce_name} ${city}`
    const response = await fetch(
      `https://serpapi.com/search.json?engine=google_maps&q=${encodeURIComponent(query)}&api_key=${process.env.SERPAPI_KEY}`
    )
    const data = await response.json()

    const results = data.local_results || []
    const position = results.findIndex((r: any) =>
      r.title?.toLowerCase().includes(commerce_name.toLowerCase())
    )

    const topCompetitors = results.slice(0, 3).map((r: any) => ({
      name: r.title,
      rating: r.rating,
      reviews: r.reviews,
      position: results.indexOf(r) + 1,
    }))

    let score = 50
    if (position === 0) score = 95
    else if (position === 1) score = 80
    else if (position === 2) score = 65
    else if (position === -1) score = 30

    const ownListing = results[position] || {}
    if (ownListing.rating >= 4.5) score += 5
    if (ownListing.reviews >= 50) score += 5
    if (score > 100) score = 100

    return NextResponse.json({
      score,
      position: position + 1,
      competitors: topCompetitors,
    })
  } catch (err) {
    console.error('Analyze public error:', err)
    return NextResponse.json({ error: 'Erreur analyse' }, { status: 500 })
  }
}