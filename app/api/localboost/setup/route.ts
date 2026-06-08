import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY!

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const [{ data }, { data: billing }] = await Promise.all([
    supabase.from('localboost_profiles').select('*').eq('user_id', user.id).single(),
    supabase.from('profiles').select('subscription_status').eq('id', user.id).single(),
  ])

  const is_pro = billing?.subscription_status === 'active'
  return NextResponse.json({ ...(data ?? {}), is_pro })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body = await req.json()

  // Recherche de l'établissement
  if (body.action === 'search') {
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(body.query)}&language=fr&region=fr&key=${GOOGLE_API_KEY}`
    const data = await fetch(url).then(r => r.json())
    const results = (data.results ?? []).slice(0, 5).map((r: any) => ({
      place_id:          r.place_id,
      name:              r.name,
      formatted_address: r.formatted_address,
      rating:            r.rating,
      user_ratings_total: r.user_ratings_total,
    }))
    return NextResponse.json({ results })
  }

  // Mise à jour du ton de communication
  if (body.action === 'update_tone') {
    const { error } = await supabase
      .from('localboost_profiles')
      .update({ tone: body.tone, updated_at: new Date().toISOString() })
      .eq('user_id', user.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  // Sauvegarde de la fiche sélectionnée
  if (body.action === 'save') {
    const place = body.place
    const reviewLink = `https://search.google.com/local/writereview?placeid=${place.place_id}`

    // Récupérer les détails complets
    const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,formatted_address,formatted_phone_number,website&language=fr&key=${GOOGLE_API_KEY}`
    const details    = await fetch(detailsUrl).then(r => r.json())
    const result     = details.result ?? {}

    const { error } = await supabase
      .from('localboost_profiles')
      .upsert({
        user_id:            user.id,
        google_place_id:    place.place_id,
        google_review_link: reviewLink,
        business_name:      result.name     ?? place.name,
        business_address:   result.formatted_address ?? place.formatted_address,
        business_phone:     result.formatted_phone_number ?? '',
        business_website:   result.website  ?? '',
        updated_at:         new Date().toISOString(),
      }, { onConflict: 'user_id' })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, review_link: reviewLink })
  }

  return NextResponse.json({ error: 'Action inconnue' }, { status: 400 })
}
