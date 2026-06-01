import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY!

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data: lbProfile } = await supabase
    .from('localboost_profiles')
    .select('google_place_id, business_name')
    .eq('user_id', user.id)
    .single()

  if (!lbProfile?.google_place_id) {
    return NextResponse.json({ score: 0, audit: 0, avis: 0, configured: false })
  }

  const [placeRes, avisRes] = await Promise.all([
    fetch(`https://maps.googleapis.com/maps/api/place/details/json?place_id=${lbProfile.google_place_id}&fields=name,formatted_address,formatted_phone_number,opening_hours,website,rating,user_ratings_total,photos,editorial_summary&language=fr&key=${GOOGLE_API_KEY}`)
      .then(r => r.json()),
    supabase
      .from('localboost_review_requests')
      .select('status')
      .eq('user_id', user.id),
  ])

  const p = placeRes.result ?? {}
  const avisData = avisRes.data ?? []

  const criteria = [
    !!p.name,
    !!p.formatted_address,
    !!p.formatted_phone_number,
    !!(p.opening_hours?.periods?.length),
    !!p.website,
    !!p.editorial_summary?.overview,
    (p.photos?.length ?? 0) >= 5,
    (p.user_ratings_total ?? 0) >= 20,
    (p.rating ?? 0) >= 4.0,
  ]
  const auditScore = Math.round((criteria.filter(Boolean).length / criteria.length) * 100)

  const avisRecus = avisData.filter(a => a.status === 'done').length
  const avisComponent = Math.min(avisRecus / 20, 1) * 100
  const avisScore = Math.round(avisComponent)

  const globalScore = Math.round(auditScore * 0.6 + avisScore * 0.4)

  return NextResponse.json({
    score:       globalScore,
    audit:       auditScore,
    avis:        avisScore,
    avisRecus,
    avisEnvoyes: avisData.length,
    configured:  true,
    details: {
      nom:         !!p.name,
      adresse:     !!p.formatted_address,
      telephone:   !!p.formatted_phone_number,
      horaires:    !!(p.opening_hours?.periods?.length),
      site:        !!p.website,
      description: !!p.editorial_summary?.overview,
      photos:      (p.photos?.length ?? 0) >= 5,
      avis20:      (p.user_ratings_total ?? 0) >= 20,
      note4:       (p.rating ?? 0) >= 4.0,
    },
  })
}
