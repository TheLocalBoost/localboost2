import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

// ── Helpers ────────────────────────────────────────────────────────────────

async function fetchReviews(commerceName: string, city: string): Promise<any[]> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  if (!apiKey) return []

  // 1. Cherche le place_id via Places Text Search
  const searchRes = await fetch(
    `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(`${commerceName} ${city}`)}&inputtype=textquery&fields=place_id&key=${apiKey}`
  )
  const searchData = await searchRes.json()
  const placeId = searchData?.candidates?.[0]?.place_id
  if (!placeId) return []

  // 2. Récupère les détails + avis (Places API retourne jusqu'à 5 avis récents)
  const detailRes = await fetch(
    `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=reviews&language=fr&key=${apiKey}`
  )
  const detailData = await detailRes.json()
  const reviews = detailData?.result?.reviews || []

  // Normalise le format pour correspondre à celui qu'on utilisait avec Outscraper
  return reviews.map((r: any) => ({
    reviewId:  `${placeId}_${r.time}`,
    name:      r.author_name,
    rating:    r.rating,
    text:      r.text,
    date:      new Date(r.time * 1000).toISOString(),
  }))
}

async function generateResponses(profile: any, reviewText: string, rating: number): Promise<string[]> {
  const tone = rating <= 2 ? 'empathique et professionnel, cherche à comprendre et à résoudre' : 'chaleureux et reconnaissant'
  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 600,
    messages: [{
      role: 'user',
      content: `Tu es un expert en relation client pour commerçants locaux français.

COMMERCE : ${profile.commerce_name}
VILLE : ${profile.city}
TYPE : ${profile.commerce_type}
TON : ${tone}

AVIS REÇU (${rating} étoile${rating > 1 ? 's' : ''}) :
"${reviewText}"

Génère 3 réponses courtes et authentiques à cet avis.
- Réponds DIRECTEMENT au contenu de l'avis
- 80-200 caractères par réponse, 1 emoji maximum
- ${rating <= 2 ? 'Excuse-toi sincèrement, propose une solution concrète' : 'Remercie chaleureusement, invite à revenir'}

Réponds UNIQUEMENT avec JSON valide :
{"variants": ["reponse1", "reponse2", "reponse3"]}`,
    }],
  })
  const content = msg.content[0]
  if (content.type !== 'text') return []
  const clean = content.text.replace(/```json|```/g, '').trim()
  const parsed = JSON.parse(clean)
  return parsed.variants || []
}

function buildAlertEmail(
  profile: any,
  review: { author: string; rating: number; text: string; date: string },
  responses: string[]
): string {
  const stars = '⭐'.repeat(review.rating) + '☆'.repeat(5 - review.rating)
  const isNegative = review.rating <= 2
  const accentColor = isNegative ? '#dc2626' : '#16a34a'
  const bgColor = isNegative ? '#fef2f2' : '#f0fdf4'
  const borderColor = isNegative ? '#fecaca' : '#bbf7d0'
  const label = isNegative ? '🚨 Avis négatif' : '⭐ Nouvel avis positif'

  const publishUrl = 'https://business.google.com/reviews'

  return `
<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:36px 24px;color:#1a1a1a;">

  <p style="font-size:13px;color:#888;margin:0 0 20px;">${profile.commerce_name} · ${profile.city}</p>

  <!-- Badge -->
  <div style="display:inline-block;background:${bgColor};border:1px solid ${borderColor};color:${accentColor};font-weight:700;font-size:14px;padding:8px 16px;border-radius:20px;margin-bottom:24px;">
    ${label}
  </div>

  <!-- Avis -->
  <div style="background:#f9fafb;border-left:3px solid ${accentColor};border-radius:8px;padding:16px 20px;margin-bottom:24px;">
    <div style="margin-bottom:8px;">
      <span style="font-size:18px;">${stars}</span>
      <span style="font-size:13px;color:#888;margin-left:8px;">${review.author} · ${review.date}</span>
    </div>
    <p style="font-size:15px;line-height:1.6;margin:0;color:#1a1a1a;font-style:italic;">"${review.text}"</p>
  </div>

  <!-- Réponses -->
  <p style="font-weight:700;font-size:15px;margin:0 0 12px;">3 réponses prêtes à publier :</p>

  ${responses.map((r, i) => `
  <div style="border:1px solid #e5e7eb;border-radius:10px;padding:14px 16px;margin-bottom:10px;">
    <p style="font-size:12px;color:#16a34a;font-weight:600;margin:0 0 6px;">Réponse ${i + 1}</p>
    <p style="font-size:14px;line-height:1.6;margin:0;color:#1a1a1a;">${r}</p>
  </div>`).join('')}

  <!-- CTA -->
  <div style="text-align:center;margin:28px 0;">
    <a href="${publishUrl}" style="background:${accentColor};color:#fff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;display:inline-block;">
      Répondre sur Google →
    </a>
  </div>

  <p style="font-size:13px;color:#888;margin:0;">Copiez la réponse de votre choix, puis cliquez sur le bouton.</p>

  <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0 16px;">
  <p style="color:#bbb;font-size:12px;margin:0;">
    LocalBoost · Alerte avis automatique ·
    <a href="mailto:contact@thelocalboost.fr?subject=désabonnement" style="color:#bbb;">Se désabonner</a>
  </p>

</div>`
}

async function sendAlertEmail(to: string, commerceName: string, html: string, isNegative: boolean) {
  const subject = isNegative
    ? `🚨 Avis négatif reçu — répondez maintenant (${commerceName})`
    : `⭐ Nouvel avis positif sur votre fiche Google (${commerceName})`

  await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'api-key': process.env.BREVO_API_KEY! },
    body: JSON.stringify({
      sender: { name: 'LocalBoost', email: 'contact@thelocalboost.fr' },
      to: [{ email: to, name: commerceName }],
      subject,
      htmlContent: html,
    }),
  })
}

// ── Handler ────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  const adminKey = req.headers.get('x-admin-key')
  const validCron  = auth === `Bearer ${process.env.CRON_SECRET}`
  const validAdmin = adminKey === process.env.ADMIN_SECRET_KEY
  if (!validCron && !validAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Mode test
  const testEmail = req.nextUrl.searchParams.get('test_email')
  if (testEmail) {
    const mockProfile = { commerce_name: 'Boulangerie Martin', city: 'Lyon', commerce_type: 'Boulangerie' }
    const mockReview  = { author: 'Jean-Pierre M.', rating: 1, text: 'Service très décevant, je ne reviendrai pas.', date: "aujourd'hui" }
    const responses   = await generateResponses(mockProfile, mockReview.text, mockReview.rating)
    const html = buildAlertEmail(mockProfile, mockReview, responses)
    await sendAlertEmail(testEmail, mockProfile.commerce_name, html, true)
    return NextResponse.json({ sent: 1, test: true, responses })
  }

  // ── Production ─────────────────────────────────────────────────────────
  const now = new Date()

  // Abonnés actifs avec un place_id connu
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, subscription_status, trial_ends_at')
    .or('subscription_status.eq.active,subscription_status.eq.trialing')

  const activeIds = (profiles || [])
    .filter(p => {
      if (p.subscription_status === 'active') return true
      if (p.subscription_status === 'trialing') return p.trial_ends_at && new Date(p.trial_ends_at) > now
      return false
    })
    .map(p => p.id)

  if (!activeIds.length) return NextResponse.json({ sent: 0, checked: 0 })

  const { data: merchants } = await supabase
    .from('merchant_profiles')
    .select('id, commerce_name, city, commerce_type, tone')
    .in('id', activeIds)

  const listResult = await supabase.auth.admin.listUsers({ perPage: 1000 })
  const authUsers  = listResult.data?.users ?? []
  const emailById: Record<string, string> = {}
  authUsers.forEach((u: { id: string; email?: string }) => { emailById[u.id] = u.email ?? '' })

  const results = { checked: 0, sent: 0, errors: [] as string[] }

  for (const merchant of merchants || []) {
    try {
      const email = emailById[merchant.id]
      if (!email) continue

      const reviews = await fetchReviews(merchant.commerce_name, merchant.city)
      results.checked++

      for (const review of reviews) {
        const reviewId = review.reviewId
        const reviewData = {
          author: review.name   || 'Anonyme',
          rating: review.rating || 0,
          text:   review.text   || '',
          date:   review.date   || '',
        }

        // Vérifier si cet avis est déjà connu
        const { data: existing } = await supabase
          .from('reviews')
          .select('id')
          .eq('user_id', merchant.id)
          .eq('review_id', reviewId)
          .single()

        if (existing) continue

        // Nouvel avis : stocker + alerter
        await supabase.from('reviews').insert({
          user_id:   merchant.id,
          review_id: reviewId,
          author:    reviewData.author,
          rating:    reviewData.rating,
          text:      reviewData.text,
          date:      reviewData.date,
          alerted:   true,
        })

        const responses = await generateResponses(merchant, reviewData.text, reviewData.rating)
        const html = buildAlertEmail(merchant, reviewData, responses)
        await sendAlertEmail(email, merchant.commerce_name, html, review.rating <= 2)
        results.sent++

        await new Promise(r => setTimeout(r, 300))
      }

      await new Promise(r => setTimeout(r, 500))
    } catch (e: any) {
      results.errors.push(`${merchant.commerce_name}: ${e.message}`)
    }
  }

  return NextResponse.json(results)
}
