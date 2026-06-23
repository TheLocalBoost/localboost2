import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import {
  exchangeCode,
  listAccounts,
  listLocations,
} from '@/lib/google-business'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://thelocalboost.fr'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code  = searchParams.get('code')
  const state = searchParams.get('state') // userId
  const error = searchParams.get('error')

  if (error) {
    return NextResponse.redirect(`${APP_URL}/localboost/connect?error=${encodeURIComponent(error)}`)
  }

  if (!code || !state) {
    return NextResponse.redirect(`${APP_URL}/localboost/connect?error=missing_params`)
  }

  const supabase = await createClient()

  // Vérifier que le state correspond à un user existant
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.id !== state) {
    return NextResponse.redirect(`${APP_URL}/localboost/connect?error=invalid_state`)
  }

  try {
    // 1. Échanger le code contre les tokens
    const { access_token, refresh_token, expires_in } = await exchangeCode(code)

    // 2. Récupérer les comptes Google Business
    const accounts = await listAccounts(access_token)
    if (!accounts.length) {
      return NextResponse.redirect(`${APP_URL}/localboost/connect?error=no_account`)
    }

    // 3. Récupérer les établissements du premier compte
    const accountName = accounts[0].name
    const locations   = await listLocations(access_token, accountName)

    if (!locations.length) {
      return NextResponse.redirect(`${APP_URL}/localboost/connect?error=no_location`)
    }

    let selectedLocation = locations[0]

    // Si plusieurs établissements → on prend le premier, l'utilisateur peut changer depuis l'UI
    // (cas multi-établissements géré dans /localboost/connect)

    // 4. Sauvegarder les tokens et la location
    await supabase
      .from('localboost_profiles')
      .upsert({
        user_id:                 user.id,
        google_connected:        true,
        google_account_id:       accountName,
        google_location_name:    selectedLocation.name,
        google_location_title:   selectedLocation.title ?? '',
        google_access_token:     access_token,
        google_refresh_token:    refresh_token,
        google_token_expires_at: new Date(Date.now() + expires_in * 1000).toISOString(),
        updated_at:              new Date().toISOString(),
      }, { onConflict: 'user_id' })

    // Si plusieurs établissements, passer le nb en query param pour que l'UI propose de changer
    const hasMulti = locations.length > 1
    const redirect = hasMulti
      ? `${APP_URL}/localboost/connect?success=1&multi=${locations.length}`
      : `${APP_URL}/localboost/connect?success=1`

    return NextResponse.redirect(redirect)

  } catch (err: any) {
    console.error('GBP callback error:', err)
    return NextResponse.redirect(`${APP_URL}/localboost/connect?error=${encodeURIComponent(err.message ?? 'unknown')}`)
  }
}
