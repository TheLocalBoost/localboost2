import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

// ── Helpers ────────────────────────────────────────────────────────────────

function getContext() {
  const now = new Date()
  const months = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre']
  const seasons: Record<number,string> = {0:'hiver',1:'hiver',2:'printemps',3:'printemps',4:'printemps',5:'été',6:'été',7:'été',8:'automne',9:'automne',10:'automne',11:'hiver'}
  return { month: months[now.getMonth()], season: seasons[now.getMonth()] }
}

async function generatePost(profile: any): Promise<string> {
  const { month, season } = getContext()
  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 400,
    messages: [{
      role: 'user',
      content: `Tu es un expert en marketing local français.

COMMERCE : ${profile.commerce_name}
VILLE : ${profile.city}
TYPE : ${profile.commerce_type}
SPÉCIALITÉS : ${profile.specialties || ''}
TON : ${profile.tone || 'chaleureux'}
CONTEXTE : ${month} (${season})

Génère UN post Google Business authentique et efficace.
- Écris comme un vrai commerçant local
- Produits spécifiques, pas "nos produits"
- Maximum 280 caractères, 1 emoji maximum
- Exploite le contexte saisonnier

Réponds UNIQUEMENT avec le texte du post, rien d'autre.`,
    }],
  })
  const content = msg.content[0]
  return content.type === 'text' ? content.text.trim() : ''
}

async function getScore(profile: any): Promise<{ score: number; position: number; competitors: any[] }> {
  try {
    const query = `${profile.commerce_name} ${profile.city}`
    const res = await fetch(
      `https://serpapi.com/search.json?engine=google_maps&q=${encodeURIComponent(query)}&api_key=${process.env.SERPAPI_KEY}`
    )
    const data = await res.json()
    const results = data.local_results || []
    const position = results.findIndex((r: any) =>
      r.title?.toLowerCase().includes(profile.commerce_name?.toLowerCase())
    )
    const competitors = results.slice(0, 3).map((r: any, i: number) => ({
      name: r.title, rating: r.rating, reviews: r.reviews, position: i + 1,
    }))
    let score = 50
    if (position === 0) score = 95
    else if (position === 1) score = 80
    else if (position === 2) score = 65
    else if (position === -1) score = 30
    const own = results[position] || {}
    if (own.rating >= 4.5) score += 5
    if (own.reviews >= 50) score += 5
    if (score > 100) score = 100
    return { score, position: position + 1, competitors }
  } catch {
    return { score: 0, position: 0, competitors: [] }
  }
}

function buildEmail(profile: any, post: string, score: number, previousScore: number | null): string {
  const scoreColor = score >= 70 ? '#16a34a' : score >= 40 ? '#d97706' : '#dc2626'
  const scoreDiff = previousScore !== null ? score - previousScore : null
  const trendText = scoreDiff === null ? '' :
    scoreDiff > 0 ? `<span style="color:#16a34a;font-size:13px;">▲ +${scoreDiff} pts cette semaine</span>` :
    scoreDiff < 0 ? `<span style="color:#dc2626;font-size:13px;">▼ ${scoreDiff} pts cette semaine</span>` :
    `<span style="color:#888;font-size:13px;">= stable cette semaine</span>`

  const dashboardUrl = 'https://localboost2.vercel.app/dashboard'
  const publishUrl = 'https://business.google.com/posts'

  return `
<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:36px 24px;color:#1a1a1a;">

  <p style="font-size:13px;color:#888;margin:0 0 24px;">Votre contenu Google Business — semaine du ${new Date().toLocaleDateString('fr-FR',{day:'2-digit',month:'long'})}</p>

  <!-- Score -->
  <div style="background:#f9fafb;border-radius:12px;padding:20px;margin-bottom:28px;display:flex;align-items:center;gap:20px;">
    <div style="text-align:center;min-width:72px;">
      <span style="font-size:42px;font-weight:800;color:${scoreColor};">${score}</span>
      <span style="font-size:16px;color:#888;">/100</span>
    </div>
    <div>
      <p style="margin:0 0 4px;font-weight:600;color:#1a1a1a;">Score de visibilité Google</p>
      ${trendText}
    </div>
  </div>

  <!-- Post de la semaine -->
  <p style="font-weight:700;font-size:16px;margin:0 0 12px;">📍 Votre post de la semaine</p>
  <div style="background:#fff;border:2px solid #16a34a;border-radius:12px;padding:20px;margin-bottom:16px;">
    <p style="font-size:15px;line-height:1.7;margin:0;color:#1a1a1a;white-space:pre-wrap;">${post}</p>
  </div>

  <!-- Instructions -->
  <div style="margin-bottom:28px;">
    <p style="font-size:14px;color:#555;margin:0 0 10px;"><strong>Pour publier (30 secondes) :</strong></p>
    <ol style="font-size:14px;color:#555;margin:0;padding-left:20px;line-height:2;">
      <li>Copiez le texte ci-dessus</li>
      <li>Cliquez sur le bouton ci-dessous</li>
      <li>Collez et publiez</li>
    </ol>
  </div>

  <div style="text-align:center;margin-bottom:28px;">
    <a href="${publishUrl}" style="background:#16a34a;color:#fff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;display:inline-block;">
      Publier sur Google Business →
    </a>
  </div>

  <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">

  <p style="font-size:13px;color:#888;margin:0;">
    Besoin d'autres variantes ou de répondre à un avis ?
    <a href="${dashboardUrl}" style="color:#16a34a;">Ouvrir mon dashboard →</a>
  </p>

  <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0 16px;">
  <p style="color:#bbb;font-size:12px;margin:0;">
    LocalBoost · contact@thelocalboost.fr ·
    <a href="mailto:contact@thelocalboost.fr?subject=désabonnement" style="color:#bbb;">Se désabonner</a>
  </p>

</div>`
}

async function sendEmail(to: string, commerceName: string, html: string) {
  await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'api-key': process.env.BREVO_API_KEY! },
    body: JSON.stringify({
      sender: { name: 'LocalBoost', email: 'contact@thelocalboost.fr' },
      to: [{ email: to, name: commerceName }],
      subject: `📍 Votre contenu Google Business — ${commerceName}`,
      htmlContent: html,
    }),
  })
}

// ── Handler ────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  // Sécurité : Vercel cron, appel manuel avec CRON_SECRET ou clé admin
  const auth = req.headers.get('authorization')
  const adminKey = req.headers.get('x-admin-key')
  const validCron  = auth === `Bearer ${process.env.CRON_SECRET}`
  const validAdmin = adminKey === process.env.ADMIN_SECRET_KEY
  if (!validCron && !validAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()

  // Mode test : envoie un email de démo à une adresse spécifique
  const testEmail = req.nextUrl.searchParams.get('test_email')
  if (testEmail) {
    const mockProfile = {
      commerce_name: 'Boulangerie Martin',
      city: 'Lyon',
      commerce_type: 'Boulangerie / Pâtisserie',
      specialties: 'pain au levain, croissants artisanaux',
      tone: 'chaleureux',
    }
    const [post, { score }] = await Promise.all([
      generatePost(mockProfile),
      Promise.resolve({ score: 72, position: 2, competitors: [] }),
    ])
    const html = buildEmail(mockProfile, post, score, 65)
    await sendEmail(testEmail, mockProfile.commerce_name, html)
    return NextResponse.json({ sent: 1, test: true, post })
  }

  // Récupérer les profils abonnés actifs
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, subscription_status, trial_ends_at')
    .or('subscription_status.eq.active,subscription_status.eq.trialing')

  const activeProfiles = (profiles || []).filter(p => {
    if (p.subscription_status === 'active') return true
    if (p.subscription_status === 'trialing') {
      return p.trial_ends_at && new Date(p.trial_ends_at) > now
    }
    return false
  })

  // Récupérer les emails depuis auth.users via l'API admin
  const listResult = await supabase.auth.admin.listUsers({ perPage: 1000 })
  const authUsers = listResult.data?.users ?? []

  const emailById: Record<string, string> = {}
  authUsers.forEach((u: { id: string; email?: string }) => {
    emailById[u.id] = u.email ?? ''
  })

  const active = activeProfiles
    .map(p => ({ ...p, email: emailById[p.id] || '' }))
    .filter(p => p.email)

  const results = { sent: 0, skipped: 0, errors: [] as string[] }

  for (const user of active) {
    try {
      // Profil commerce
      const { data: merchant } = await supabase
        .from('merchant_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (!merchant) { results.skipped++; continue }

      // Dernier score connu
      const { data: lastReport } = await supabase
        .from('weekly_reports')
        .select('visibility_score')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      const previousScore = lastReport?.visibility_score ?? null

      // Génération en parallèle
      const [post, { score, position, competitors }] = await Promise.all([
        generatePost(merchant),
        getScore(merchant),
      ])

      // Sauvegarde du rapport
      await supabase.from('weekly_reports').insert({
        user_id: user.id,
        week_start: now.toISOString().split('T')[0],
        visibility_score: score,
        competitor_data: { competitors, position },
      })

      // Sauvegarde de la génération
      await supabase.from('generations').insert({
        user_id: user.id,
        type: 'google',
        content: post,
      })

      // Envoi email
      const html = buildEmail(merchant, post, score, previousScore)
      await sendEmail(user.email, merchant.commerce_name, html)

      results.sent++

      // 500ms entre chaque envoi pour ne pas saturer les APIs
      await new Promise(r => setTimeout(r, 500))
    } catch (e: any) {
      results.errors.push(`${user.email}: ${e.message}`)
    }
  }

  return NextResponse.json(results)
}
