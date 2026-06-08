import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getValidToken, getInsights, summarizeInsights } from '@/lib/google-business'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data: lbProfile } = await supabase
    .from('localboost_profiles')
    .select('google_location_name, google_connected, google_location_title')
    .eq('user_id', user.id)
    .single()

  if (!lbProfile?.google_connected || !lbProfile?.google_location_name) {
    return NextResponse.json({ error: 'Google Business non connecté' }, { status: 400 })
  }

  try {
    const token  = await getValidToken(supabase, user.id)
    const series = await getInsights(token, lbProfile.google_location_name)
    const totals = summarizeInsights(series)

    return NextResponse.json({
      location_title: lbProfile.google_location_title,
      periode:        '28 derniers jours',
      ...totals,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
