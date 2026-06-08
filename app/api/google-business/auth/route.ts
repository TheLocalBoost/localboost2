import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getOAuthUrl } from '@/lib/google-business'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  // state = userId pour vérification dans le callback
  const url = getOAuthUrl(user.id)
  return NextResponse.redirect(url)
}
