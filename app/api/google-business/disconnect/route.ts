import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { revokeToken } from '@/lib/google-business'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data: profile } = await supabase
    .from('localboost_profiles')
    .select('google_access_token, google_refresh_token')
    .eq('user_id', user.id)
    .single()

  // Révoquer les tokens côté Google
  if (profile?.google_refresh_token) {
    await revokeToken(profile.google_refresh_token).catch(() => {})
  }
  if (profile?.google_access_token) {
    await revokeToken(profile.google_access_token).catch(() => {})
  }

  // Effacer les tokens en base
  await supabase
    .from('localboost_profiles')
    .update({
      google_connected:        false,
      google_account_id:       null,
      google_location_name:    null,
      google_location_title:   null,
      google_access_token:     null,
      google_refresh_token:    null,
      google_token_expires_at: null,
      updated_at:              new Date().toISOString(),
    })
    .eq('user_id', user.id)

  return NextResponse.json({ success: true })
}
