import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getValidToken, createPost } from '@/lib/google-business'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { content } = await req.json()
  if (!content?.trim()) return NextResponse.json({ error: 'Contenu vide' }, { status: 400 })

  const { data: lbProfile } = await supabase
    .from('localboost_profiles')
    .select('google_location_name, google_connected')
    .eq('user_id', user.id)
    .single()

  if (!lbProfile?.google_connected) {
    return NextResponse.json({ error: 'Google Business non connecté' }, { status: 400 })
  }
  if (!lbProfile?.google_location_name) {
    return NextResponse.json({ error: 'Établissement non configuré' }, { status: 400 })
  }

  try {
    const token  = await getValidToken(supabase, user.id)
    const result = await createPost(token, lbProfile.google_location_name, content)

    // Sauvegarder le post publié
    await supabase.from('localboost_gbp_posts').insert({
      user_id:        user.id,
      gbp_post_name:  result.name ?? null,
      content,
      auto_published: false,
      published_at:   new Date().toISOString(),
    })

    return NextResponse.json({ success: true, post: result })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// Historique des posts publiés
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data } = await supabase
    .from('localboost_gbp_posts')
    .select('*')
    .eq('user_id', user.id)
    .order('published_at', { ascending: false })
    .limit(20)

  return NextResponse.json(data ?? [])
}
