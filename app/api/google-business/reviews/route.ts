import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getValidToken, listReviews, replyToReview, STAR_LABELS } from '@/lib/google-business'
import Anthropic from '@anthropic-ai/sdk'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data: lbProfile } = await supabase
    .from('localboost_profiles')
    .select('google_location_name, google_connected')
    .eq('user_id', user.id)
    .single()

  if (!lbProfile?.google_connected || !lbProfile?.google_location_name) {
    return NextResponse.json({ error: 'Google Business non connecté' }, { status: 400 })
  }

  try {
    const token   = await getValidToken(supabase, user.id)
    const reviews = await listReviews(token, lbProfile.google_location_name)

    // Récupérer les avis déjà répondus en local
    const { data: replied } = await supabase
      .from('localboost_gbp_review_replies')
      .select('review_id')
      .eq('user_id', user.id)
    const repliedIds = new Set((replied ?? []).map((r: any) => r.review_id))

    const formatted = reviews.map((r: any) => ({
      id:            r.reviewId,
      name:          r.name,
      reviewer:      r.reviewer?.displayName ?? 'Anonyme',
      rating:        STAR_LABELS[r.starRating] ?? 0,
      comment:       r.comment ?? '',
      date:          r.updateTime,
      hasReply:      !!r.reviewReply?.comment || repliedIds.has(r.reviewId),
      existingReply: r.reviewReply?.comment ?? null,
    }))

    return NextResponse.json(formatted)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// Générer + poster une réponse à un avis
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { review_id, reviewer, rating, comment, action, reply } = await req.json()

  const { data: lbProfile } = await supabase
    .from('localboost_profiles')
    .select('google_location_name, google_connected')
    .eq('user_id', user.id)
    .single()

  const { data: dbProfile } = await supabase
    .from('devisboost_profiles')
    .select('company_name, metier')
    .eq('user_id', user.id)
    .single()

  if (!lbProfile?.google_connected) {
    return NextResponse.json({ error: 'Google Business non connecté' }, { status: 400 })
  }

  // Action "generate" : génère des suggestions de réponses via Claude Haiku
  if (action === 'generate') {
    const anthropic = new Anthropic()
    const response  = await anthropic.messages.create({
      model:      'claude-haiku-4-5-20251001',
      max_tokens: 600,
      messages: [{
        role:    'user',
        content: `Tu es expert en gestion de réputation pour TPE françaises.
Pour un(e) ${dbProfile?.metier ?? 'commerce'} nommé "${dbProfile?.company_name ?? 'l\'établissement'}",
génère 3 réponses professionnelles et sincères à cet avis Google.

CLIENT : ${reviewer}
NOTE : ${rating}/5 étoiles
AVIS : "${comment || '(aucun commentaire)'}"

Règles :
- Personnaliser avec le prénom du client si disponible
- Ton chaleureux et professionnel, jamais défensif
- 2-4 phrases maximum par réponse
- Varier les formulations (ni copie ni paraphrase)
- Si avis négatif : reconnaître, proposer de contacter directement

Réponds UNIQUEMENT en JSON valide : ["réponse 1", "réponse 2", "réponse 3"]`,
      }],
    })
    const text  = response.content[0].type === 'text' ? response.content[0].text : '[]'
    const match = text.match(/\[[\s\S]*\]/)
    const suggestions = match ? JSON.parse(match[0]) : []
    return NextResponse.json({ suggestions })
  }

  // Action "reply" : poster la réponse sur Google
  if (action === 'reply') {
    if (!reply?.trim()) return NextResponse.json({ error: 'Réponse vide' }, { status: 400 })

    try {
      const token = await getValidToken(supabase, user.id)
      await replyToReview(token, lbProfile.google_location_name, review_id, reply)

      await supabase.from('localboost_gbp_review_replies').insert({
        user_id:   user.id,
        review_id,
        reviewer,
        rating,
        comment,
        reply,
      })

      return NextResponse.json({ success: true })
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 500 })
    }
  }

  return NextResponse.json({ error: 'Action inconnue' }, { status: 400 })
}
