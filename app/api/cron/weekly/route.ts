import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import { sendTransactional } from '@/lib/email'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY!
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://thelocalboost.fr'

function extractCity(address: string): string {
  const parts = address.split(',').map(s => s.trim())
  const cityPart = parts.find(p => /^\d{5}\s+\w/.test(p))
  if (cityPart) return cityPart.replace(/^\d{5}\s+/, '').trim()
  return parts[parts.length - 2] ?? parts[0] ?? ''
}

function getContext() {
  const months = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre']
  const seasons: Record<number,string> = {0:'hiver',1:'hiver',2:'printemps',3:'printemps',4:'printemps',5:'été',6:'été',7:'été',8:'automne',9:'automne',10:'automne',11:'hiver'}
  const now = new Date()
  return { month: months[now.getMonth()], season: seasons[now.getMonth()] }
}

async function generatePost(businessName: string, city: string): Promise<string> {
  const { month, season } = getContext()
  const msg = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 350,
    messages: [{ role: 'user', content:
      `Tu es un expert en marketing local français.
Génère UN post Google Business pour "${businessName}" situé à ${city}.
Contexte : ${month} (${season})
- Ton authentique de commerçant local
- Maximum 280 caractères, 1 emoji max
- Exploite le contexte saisonnier
Réponds UNIQUEMENT avec le texte du post.` }],
  })
  const c = msg.content[0]
  return c.type === 'text' ? c.text.trim() : ''
}

async function getAuditScore(placeId: string): Promise<{ score: number; details: Record<string, boolean> }> {
  const fields = 'name,formatted_address,formatted_phone_number,opening_hours,website,rating,user_ratings_total,photos,editorial_summary'
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&language=fr&key=${GOOGLE_API_KEY}`
  const data = await fetch(url).then(r => r.json())
  const p = data.result ?? {}

  const details: Record<string, boolean> = {
    telephone:   !!p.formatted_phone_number,
    horaires:    !!(p.opening_hours?.periods?.length),
    site:        !!p.website,
    description: !!p.editorial_summary?.overview,
    photos:      (p.photos?.length ?? 0) >= 5,
    avis20:      (p.user_ratings_total ?? 0) >= 20,
    note4:       (p.rating ?? 0) >= 4.0,
  }
  const score = Math.round((Object.values(details).filter(Boolean).length / Object.keys(details).length) * 100)
  return { score, details }
}

const PRIORITY_LABELS: Record<string, { label: string; action: string }> = {
  telephone:   { label: 'Ajoutez votre numéro de téléphone',      action: 'Les clients appellent directement depuis Google.' },
  horaires:    { label: 'Renseignez vos horaires d\'ouverture',   action: 'Un client sans horaires ira chez un concurrent.' },
  site:        { label: 'Ajoutez votre site web',                  action: 'Renforce la confiance et le référencement.' },
  description: { label: 'Rédigez une description de votre activité', action: 'Google vous comprend mieux et vous positionne plus haut.' },
  photos:      { label: 'Ajoutez des photos récentes',            action: '+35% de clics pour les fiches avec 10+ photos.' },
  avis20:      { label: 'Demandez des avis à vos clients',        action: '3× plus d\'appels pour les fiches avec 20+ avis.' },
  note4:       { label: 'Répondez à vos avis sans réponse',       action: 'Une note ≥ 4.0 double le taux de clic.' },
}

function buildEmail(
  businessName: string,
  city: string,
  post: string,
  score: number,
  priorities: string[],
  avisEnvoyes: number
): string {
  const scoreColor = score >= 70 ? '#16a34a' : score >= 40 ? '#d97706' : '#dc2626'
  const dashUrl = `${APP_URL}/localboost/dashboard`
  const week = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long' })

  const prioritiesHtml = priorities.slice(0, 3).map((key, i) => {
    const p = PRIORITY_LABELS[key]
    if (!p) return ''
    return `
<div style="border:1px solid #e5e7eb;border-radius:10px;padding:14px 16px;margin-bottom:10px;">
  <p style="font-size:11px;color:#2563eb;font-weight:700;margin:0 0 4px;">PRIORITÉ ${i + 1}</p>
  <p style="font-size:14px;font-weight:600;color:#111827;margin:0 0 4px;">${p.label}</p>
  <p style="font-size:13px;color:#6b7280;margin:0;">${p.action}</p>
</div>`
  }).join('')

  return `
<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:36px 24px;color:#1a1a1a;">

  <p style="font-size:13px;color:#888;margin:0 0 24px;">LocalBoost · Semaine du ${week} · ${businessName}, ${city}</p>

  <!-- Score -->
  <div style="background:#f9fafb;border-radius:12px;padding:20px;margin-bottom:28px;text-align:center;">
    <p style="font-size:12px;color:#6b7280;margin:0 0 8px;text-transform:uppercase;letter-spacing:0.05em;">Ma visibilité Google cette semaine</p>
    <span style="font-size:52px;font-weight:800;color:${scoreColor};">${score}</span>
    <span style="font-size:20px;color:#9ca3af;">/100</span>
  </div>

  <!-- Priorités -->
  ${priorities.length > 0 ? `
  <p style="font-weight:700;font-size:16px;margin:0 0 12px;">🎯 Vos priorités cette semaine</p>
  ${prioritiesHtml}
  <div style="text-align:center;margin:20px 0 28px;">
    <a href="${dashUrl}" style="background:#2563eb;color:#fff;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px;display:inline-block;">
      Générer le contenu IA pour chaque priorité →
    </a>
  </div>` : ''}

  <!-- Post de la semaine -->
  <p style="font-weight:700;font-size:16px;margin:0 0 12px;">📍 Votre post Google Business de la semaine</p>
  <div style="background:#fff;border:2px solid #16a34a;border-radius:12px;padding:20px;margin-bottom:16px;">
    <p style="font-size:15px;line-height:1.7;margin:0;white-space:pre-wrap;">${post}</p>
  </div>
  <div style="background:#f0fdf4;border-radius:8px;padding:12px 16px;margin-bottom:24px;font-size:13px;color:#166534;">
    <strong>Publier en 30s :</strong> copiez le texte → ouvrez
    <a href="https://business.google.com/posts" style="color:#16a34a;">Google Business</a> → collez → publiez
  </div>

  <!-- Stats avis -->
  ${avisEnvoyes > 0 ? `
  <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:14px 16px;margin-bottom:24px;">
    <p style="font-size:13px;color:#92400e;margin:0;">
      📧 ${avisEnvoyes} demande${avisEnvoyes > 1 ? 's' : ''} d'avis envoyée${avisEnvoyes > 1 ? 's' : ''} au total.
      <a href="${dashUrl}" style="color:#92400e;font-weight:600;">Envoyer de nouvelles demandes →</a>
    </p>
  </div>` : `
  <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:14px 16px;margin-bottom:24px;">
    <p style="font-size:13px;color:#1e40af;margin:0;">
      💡 Vous n'avez pas encore envoyé de demande d'avis.
      <a href="${dashUrl}" style="color:#1e40af;font-weight:600;">Commencer maintenant →</a>
    </p>
  </div>`}

  <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0 16px;">
  <p style="color:#bbb;font-size:12px;margin:0;">
    LocalBoost · contact@thelocalboost.fr ·
    <a href="mailto:contact@thelocalboost.fr?subject=désabonnement" style="color:#bbb;">Se désabonner</a>
  </p>
</div>`
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  const adminKey = req.headers.get('x-admin-key')
  if (auth !== `Bearer ${process.env.CRON_SECRET}` && adminKey !== process.env.ADMIN_SECRET_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()

  // Mode test
  const testEmail = req.nextUrl.searchParams.get('test_email')
  if (testEmail) {
    const post = await generatePost('Boulangerie Martin', 'Lyon')
    const { score, details } = await getAuditScore('ChIJZeH1eyl9q0cR0ZnE3MqBMSI')
      .catch(() => ({ score: 52, details: { photos: false, avis20: false, description: false } }))
    const priorities = Object.entries(details).filter(([,v]) => !v).map(([k]) => k)
    const html = buildEmail('Boulangerie Martin', 'Lyon', post, score, priorities, 3)
    await sendTransactional({ to: testEmail, toName: 'Test', subject: '[TEST] Votre semaine LocalBoost', html })
    return NextResponse.json({ sent: 1, test: true })
  }

  // Abonnés actifs (active + trialing + trial)
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, subscription_status, trial_ends_at')
    .in('subscription_status', ['active', 'trialing', 'trial'])

  const activeIds = (profiles ?? []).filter(p => {
    if (p.subscription_status === 'active') return true
    return p.trial_ends_at && new Date(p.trial_ends_at) > now
  }).map(p => p.id)

  if (!activeIds.length) return NextResponse.json({ sent: 0, skipped: 0 })

  // Profils LocalBoost
  const { data: lbProfiles } = await supabase
    .from('localboost_profiles')
    .select('user_id, business_name, business_address, google_place_id')
    .in('user_id', activeIds)
    .not('google_place_id', 'is', null)

  if (!lbProfiles?.length) return NextResponse.json({ sent: 0, skipped: activeIds.length })

  // Emails auth
  const { data: authData } = await supabase.auth.admin.listUsers({ perPage: 1000 })
  const emailById: Record<string, string> = {}
  ;(authData?.users ?? []).forEach((u: any) => { emailById[u.id] = u.email ?? '' })

  const results = { sent: 0, skipped: 0, errors: [] as string[] }

  for (const lb of lbProfiles) {
    const email = emailById[lb.user_id]
    if (!email) { results.skipped++; continue }

    try {
      const city = extractCity(lb.business_address ?? '')

      const [post, auditResult, avisData] = await Promise.all([
        generatePost(lb.business_name, city),
        getAuditScore(lb.google_place_id),
        supabase.from('localboost_review_requests').select('id').eq('user_id', lb.user_id),
      ])

      const priorities = Object.entries(auditResult.details).filter(([,v]) => !v).map(([k]) => k)

      const html = buildEmail(
        lb.business_name,
        city,
        post,
        auditResult.score,
        priorities,
        avisData.data?.length ?? 0
      )

      await sendTransactional({
        to:      email,
        toName:  lb.business_name,
        subject: `📍 Votre semaine LocalBoost — score ${auditResult.score}/100`,
        html,
      })

      results.sent++
      await new Promise(r => setTimeout(r, 500))
    } catch (e: any) {
      results.errors.push(`${lb.business_name}: ${e.message}`)
    }
  }

  return NextResponse.json(results)
}
