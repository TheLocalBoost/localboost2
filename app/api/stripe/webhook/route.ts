import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import { sendTransactional } from '@/lib/email'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const APP_URL = process.env.NEXT_PUBLIC_URL!

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig  = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Webhook invalide' }, { status: 400 })
  }

  switch (event.type) {

    case 'checkout.session.completed': {
      const session     = event.data.object as Stripe.Checkout.Session
      const existingId  = session.metadata?.supabase_user_id
      const email       = session.metadata?.email ?? session.customer_details?.email ?? session.customer_email

      if (!email) break

      // ── One-shot 39€ : audit réel + génération contextualisée + envoi ──
      if (session.metadata?.type === 'oneshot') {
        const nom   = session.metadata?.nom   ?? ''
        const ville = session.metadata?.ville ?? ''

        // Notification interne — vente reçue
        sendTransactional({
          to:      'mandartbrian68@gmail.com',
          subject: `💰 Nouvelle vente — ${nom || email}`,
          html: `<div style="font-family:Arial,sans-serif;padding:20px;color:#1a1a1a;">
<h2 style="font-size:18px;margin:0 0 12px;">Nouvelle vente one-shot 39€</h2>
<table style="font-size:14px;border-collapse:collapse;">
<tr><td style="padding:4px 8px 4px 0;color:#6b7280;">Email</td><td style="padding:4px 0;font-weight:700;">${email}</td></tr>
<tr><td style="padding:4px 8px 4px 0;color:#6b7280;">Établissement</td><td style="padding:4px 0;font-weight:700;">${nom || '—'}</td></tr>
<tr><td style="padding:4px 8px 4px 0;color:#6b7280;">Ville</td><td style="padding:4px 0;font-weight:700;">${ville || '—'}</td></tr>
<tr><td style="padding:4px 8px 4px 0;color:#6b7280;">Session Stripe</td><td style="padding:4px 0;font-family:monospace;font-size:12px;">${session.id}</td></tr>
</table>
<p style="margin:16px 0 0;color:#6b7280;font-size:13px;">La génération est en cours. Vérifiez la boîte email du client dans ~30 min.</p>
</div>`,
        }).catch(() => {})

        try {
          // 1. Récupérer les vraies données Google de la fiche
          const auditRes = await fetch(`${APP_URL}/api/analyse-public`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ commerce_name: nom, city: ville }),
          })
          const audit = auditRes.ok ? await auditRes.json() : null

          // Données réelles extraites de l'audit
          const realName       = audit?.name ?? nom
          const realCity       = audit?.city ?? ville
          const category       = audit?.category ?? 'artisan'
          const realRating     = audit?.rating ?? 0
          const realReviews    = audit?.reviews ?? 0
          const realPhotos     = audit?.photos ?? 0
          const realPhone      = audit?.phoneIntl ?? null
          const realProblems   = (audit?.problems ?? []).slice(0, 3).map((p: { text: string }) => p.text)
          const realReviews3   = (audit?.recentReviews ?? []).filter((r: { text: string }) => r.text?.length > 15).slice(0, 2)
          const topCompetitor  = audit?.competitors?.[0] ?? null
          const lostRevenue    = audit?.lostRevenue ?? 0
          const score          = audit?.score ?? 0
          const placeId        = audit?.placeId ?? null
          const reviewUrl      = placeId ? `https://search.google.com/local/writereview?placeid=${placeId}` : null
          const qrUrl          = reviewUrl ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(reviewUrl)}&color=1a1a1a&bgcolor=ffffff` : null

          const competitorCtx = topCompetitor
            ? `Concurrent principal : ${topCompetitor.name} (${topCompetitor.rating}★ · ${topCompetitor.reviewCount} avis · score ${topCompetitor.estimatedScore}/100 — apparaît avant ${realName})`
            : ''

          const reviewsCtx = realReviews3.length > 0
            ? realReviews3.map((r: { author: string; rating: number; text: string }) =>
                `- ${r.author} (${r.rating}★) : "${r.text.slice(0, 120)}"`).join('\n')
            : ''

          // Calendrier éditorial daté — gratuit, calculé côté serveur
          function buildCalendar(n: number): Array<{ date: string; postNum: number }> {
            const now = new Date()
            const daysUntilMon = ((8 - now.getDay()) % 7) || 7
            const start = new Date(now)
            start.setDate(start.getDate() + daysUntilMon)
            return Array.from({ length: n }, (_, i) => {
              const d = new Date(start)
              d.setDate(d.getDate() + i * 7)
              return { date: d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }), postNum: i + 1 }
            })
          }

          // Appel 1 — contenu principal (description, posts, réponses, guide)
          const prompt = `Tu es un expert Google Business Profile. Génère le pack complet pour "${realName}", à ${realCity}.

DONNÉES RÉELLES DE LA FICHE :
- Note Google : ${realRating > 0 ? `${realRating}/5` : 'non renseignée'}
- Nombre d'avis : ${realReviews}
- Photos : ${realPhotos}
${competitorCtx ? `- ${competitorCtx}` : ''}
${realProblems.length > 0 ? `\nProblèmes détectés :\n${realProblems.map(p => `- ${p}`).join('\n')}` : ''}
${reviewsCtx ? `\nDerniers avis clients :\n${reviewsCtx}` : ''}

Réponds UNIQUEMENT avec ce JSON valide :
{
  "description": "...",
  "posts": ["post1","post2","post3","post4","post5","post6","post7","post8","post9","post10","post11","post12"],
  "reviewResponses": [],
  "responseTemplates": {"5etoiles":["t1","t2","t3","t4","t5","t6","t7","t8"],"sansTexte":["t1","t2","t3","t4","t5"],"mitige":["t1","t2","t3","t4","t5"],"negatif":["t1","t2","t3","t4","t5"],"incident":["t1","t2","t3"],"fidele":["t1","t2","t3","t4"]},
  "guideSteps": ["étape1","étape2","étape3","étape4","étape5","étape6"],
  "actionPlan": "..."
}

Contraintes STRICTES :
- description : 150-200 mots, mentionne "${realName}" et "${realCity}", jamais de durée inventée, ton artisan direct
- posts : 12 posts distincts (55-75 mots). Couvrir : conseil pratique, printemps, été, automne, hiver, fête des mères, rentrée, Noël, galette des rois, témoignage, coulisses, urgence. Appel à l'action + 2 hashtags locaux${realPhone ? `. Post 12 : numéro ${realPhone}` : ''}
- reviewResponses : réponds aux avis fournis par prénom en citant un détail. Si aucun avis : []
- responseTemplates : 30 modèles classés par situation (5★, sans texte, mitigé, négatif, incident, fidèle), ton chaleureux, mentionner "${realCity}"
- guideSteps : 6 étapes concrètes pour publier sur Google Business
- actionPlan : 2-3 actions prioritaires chiffrées basées sur les problèmes détectés`

          // Appel 2 — FAQ, services, idées photos (parallèle)
          const prompt2 = `Tu es un expert Google Business Profile. Génère des contenus complémentaires pour "${realName}" (${category}) à ${realCity}.

Réponds UNIQUEMENT avec ce JSON valide :
{
  "faq": [{"q":"...","a":"..."}],
  "services": [{"name":"...","description":"..."}],
  "photoIdeas": ["idée1","idée2"]
}

Contraintes :
- faq : 20 questions/réponses que les clients posent à un ${category} à ${realCity}. Questions concrètes (horaires, tarifs, zones, urgences, devis...). Réponses 1-2 phrases directes.
- services : 5 services phares du secteur ${category} avec nom court + description 2 lignes. Concrets et locaux.
- photoIdeas : 20 idées de photos à publier sur Google (avant/après, équipe, matériel, client satisfait, coulisses...). Adaptées au métier ${category}.`

          const [msg, msg2] = await Promise.all([
            anthropic.messages.create({ model: 'claude-haiku-4-5-20251001', max_tokens: 6000, messages: [{ role: 'user', content: prompt }] }),
            anthropic.messages.create({ model: 'claude-haiku-4-5-20251001', max_tokens: 3000, messages: [{ role: 'user', content: prompt2 }] }),
          ])

          const raw  = (msg.content[0] as { text: string }).text.trim()
          const raw2 = (msg2.content[0] as { text: string }).text.trim()
          const pack  = JSON.parse(raw.replace(/^```json\n?/, '').replace(/\n?```$/, ''))
          const pack2 = JSON.parse(raw2.replace(/^```json\n?/, '').replace(/\n?```$/, ''))

          const calendar = buildCalendar(12)

          const postsHtml = (pack.posts as string[]).map((p, i) => `
<div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:16px;margin:0 0 10px;">
  <p style="font-size:11px;color:#6b7280;font-weight:700;text-transform:uppercase;letter-spacing:.05em;margin:0 0 8px;">Publication ${i + 1}/12</p>
  <p style="font-size:14px;color:#1a1a1a;line-height:1.7;margin:0;white-space:pre-line;">${p}</p>
</div>`).join('')

          const reviewsHtml = (pack.reviewResponses ?? []).length > 0
            ? `<h3 style="font-size:14px;font-weight:700;color:#374151;margin:24px 0 10px;">📍 Réponses à vos avis récents</h3>
${(pack.reviewResponses as string[]).map((r: string, i: number) => `
<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:16px;margin:0 0 10px;">
  <p style="font-size:11px;color:#16a34a;font-weight:700;margin:0 0 8px;">Réponse ${i + 1}</p>
  <p style="font-size:14px;color:#1a1a1a;line-height:1.7;margin:0;">${r}</p>
</div>`).join('')}`
            : ''

          // 30 réponses classées
          const tpl = pack.responseTemplates ?? {}
          const LABELS: Record<string, string> = { '5etoiles': 'Avis 5★', sansTexte: 'Avis sans commentaire', mitige: 'Avis mitigé (3-4★)', negatif: 'Avis négatif (1-2★)', incident: 'Incident / erreur', fidele: 'Client fidèle' }
          const templatesHtml = Object.keys(tpl).length > 0
            ? `<h3 style="font-size:14px;font-weight:700;color:#374151;margin:24px 0 10px;">📍 30 réponses types classées par situation</h3>
<p style="font-size:13px;color:#6b7280;margin:0 0 12px;">Utilisez ces modèles pour tous vos futurs avis. Adaptez le prénom et le détail.</p>
${Object.entries(tpl).map(([key, arr]) => `
<div style="margin:0 0 16px;">
  <p style="font-size:12px;font-weight:700;color:#6b7280;text-transform:uppercase;margin:0 0 6px;">${LABELS[key] ?? key}</p>
  ${(arr as string[]).map((r: string, i: number) => `
<div style="background:#fafafa;border:1px solid #e5e7eb;border-radius:8px;padding:10px 14px;margin:0 0 6px;">
  <p style="font-size:13px;color:#374151;line-height:1.6;margin:0;">${r}</p>
</div>`).join('')}
</div>`).join('')}`
            : ''

          // Calendrier éditorial
          const calendarHtml = calendar.length > 0
            ? `<h3 style="font-size:14px;font-weight:700;color:#374151;margin:24px 0 10px;">📅 Calendrier éditorial — 3 mois</h3>
<p style="font-size:13px;color:#6b7280;margin:0 0 12px;">Publiez une publication par semaine selon ce calendrier.</p>
<table style="width:100%;border-collapse:collapse;font-size:13px;">
${calendar.map(c => `<tr style="border-bottom:1px solid #f3f4f6;"><td style="padding:8px 0;color:#6b7280;">${c.date}</td><td style="padding:8px 0;font-weight:600;color:#374151;text-align:right;">Publication n°${c.postNum}</td></tr>`).join('')}
</table>`
            : ''

          // FAQ
          const faqItems = (pack2.faq ?? []) as Array<{ q: string; a: string }>
          const faqHtml = faqItems.length > 0
            ? `<h3 style="font-size:14px;font-weight:700;color:#374151;margin:24px 0 10px;">❓ FAQ Google Business — 20 questions/réponses</h3>
<p style="font-size:13px;color:#6b7280;margin:0 0 12px;">Ajoutez ces questions dans la section "Questions & Réponses" de votre fiche Google.</p>
${faqItems.map((item: { q: string; a: string }, i: number) => `
<div style="border-bottom:1px solid #f3f4f6;padding:10px 0;">
  <p style="font-size:13px;font-weight:700;color:#374151;margin:0 0 4px;">${i + 1}. ${item.q}</p>
  <p style="font-size:13px;color:#6b7280;margin:0;">${item.a}</p>
</div>`).join('')}`
            : ''

          // Descriptions services
          const serviceItems = (pack2.services ?? []) as Array<{ name: string; description: string }>
          const servicesHtml = serviceItems.length > 0
            ? `<h3 style="font-size:14px;font-weight:700;color:#374151;margin:24px 0 10px;">🛠️ Descriptions de vos services Google</h3>
<p style="font-size:13px;color:#6b7280;margin:0 0 12px;">Ajoutez ces services dans Google Business → Infos → Services.</p>
${serviceItems.map((s: { name: string; description: string }) => `
<div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:12px 14px;margin:0 0 8px;">
  <p style="font-size:13px;font-weight:700;color:#374151;margin:0 0 4px;">${s.name}</p>
  <p style="font-size:13px;color:#6b7280;margin:0;">${s.description}</p>
</div>`).join('')}`
            : ''

          // Idées photos
          const photoItems = (pack2.photoIdeas ?? []) as string[]
          const photosHtml = photoItems.length > 0
            ? `<h3 style="font-size:14px;font-weight:700;color:#374151;margin:24px 0 10px;">📸 20 idées de photos à publier</h3>
<p style="font-size:13px;color:#6b7280;margin:0 0 12px;">Prenez ces photos avec votre téléphone et publiez-les sur votre fiche Google.</p>
<div style="display:grid;gap:4px;">
${photoItems.map((idea: string, i: number) => `<p style="font-size:13px;color:#374151;margin:0;padding:6px 0;border-bottom:1px solid #f9fafb;">${i + 1}. ${idea}</p>`).join('')}
</div>`
            : ''

          const guideHtml = (pack.guideSteps ?? []).length > 0
            ? `<h3 style="font-size:14px;font-weight:700;color:#374151;margin:24px 0 10px;">📍 Guide de mise en ligne — étape par étape</h3>
${(pack.guideSteps as string[]).map((step: string, i: number) => `
<div style="display:flex;gap:12px;margin:0 0 10px;">
  <span style="flex-shrink:0;width:22px;height:22px;border-radius:50%;background:#2563eb;color:#fff;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;">${i + 1}</span>
  <p style="font-size:13px;color:#374151;line-height:1.6;margin:0;">${step}</p>
</div>`).join('')}`
            : ''

          const situationHtml = audit ? `
<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:16px;margin:0 0 24px;">
  <p style="font-size:13px;font-weight:700;color:#991b1b;margin:0 0 10px;">Votre situation réelle sur Google</p>
  <table style="width:100%;font-size:13px;color:#374151;border-collapse:collapse;">
    <tr><td style="padding:4px 0;">Note Google</td><td style="text-align:right;font-weight:700;">${realRating > 0 ? `${realRating}/5` : '—'} · ${realReviews} avis</td></tr>
    <tr><td style="padding:4px 0;">Score de fiche</td><td style="text-align:right;font-weight:700;">${score}/100</td></tr>
    ${lostRevenue > 0 ? `<tr><td style="padding:4px 0;">CA perdu estimé/mois</td><td style="text-align:right;font-weight:700;color:#dc2626;">~${lostRevenue}€</td></tr>` : ''}
    ${topCompetitor ? `<tr><td style="padding:4px 0;">Concurrent principal</td><td style="text-align:right;font-weight:700;">${topCompetitor.name} (${topCompetitor.reviewCount} avis)</td></tr>` : ''}
  </table>
</div>` : ''

          await sendTransactional({
            to:      email,
            subject: `Votre optimisation Google est prête — ${realName}`,
            html: `
<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 20px;color:#1a1a1a;">
  <h2 style="font-size:20px;font-weight:800;margin:0 0 6px;">Votre pack Google Business est prêt ✅</h2>
  <p style="color:#6b7280;font-size:14px;margin:0 0 20px;">${realName} · ${realCity}</p>

  ${situationHtml}

  <h3 style="font-size:14px;font-weight:700;color:#374151;margin:0 0 10px;">📍 Description Google à publier</h3>
  <p style="font-size:12px;color:#9ca3af;margin:0 0 8px;">Copiez ce texte dans Google Business → Infos → Description.</p>
  <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:16px;margin:0 0 24px;">
    <p style="font-size:14px;color:#1a1a1a;line-height:1.7;margin:0;">${pack.description}</p>
  </div>

  <h3 style="font-size:14px;font-weight:700;color:#374151;margin:0 0 10px;">📍 12 publications Google — 1 par semaine pendant 3 mois</h3>
  <p style="font-size:12px;color:#9ca3af;margin:0 0 12px;">Google Business → Ajouter une mise à jour → Copier/coller. Publiez-en une par semaine.</p>
  ${postsHtml}

  ${reviewsHtml}

  ${calendarHtml}

  ${templatesHtml}

  ${faqHtml}

  ${servicesHtml}

  ${photosHtml}

  ${guideHtml}

  <h3 style="font-size:14px;font-weight:700;color:#374151;margin:0 0 10px;">📍 Plan d'action prioritaire</h3>
  <div style="background:#fef3c7;border:1px solid #fde68a;border-radius:10px;padding:16px;margin:0 0 28px;">
    <p style="font-size:14px;color:#92400e;margin:0;white-space:pre-line;">${pack.actionPlan ?? pack.priorite}</p>
  </div>

  ${qrUrl ? `
  <h3 style="font-size:14px;font-weight:700;color:#374151;margin:0 0 10px;">📍 Collectez plus d'avis Google</h3>
  <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:20px;margin:0 0 24px;text-align:center;">
    <p style="font-size:13px;color:#374151;margin:0 0 16px;">Imprimez ce QR code et posez-le en caisse, sur vos factures ou en vitrine.<br>Vos clients scannent → laissent un avis en 30 secondes.</p>
    <img src="${qrUrl}" width="160" height="160" alt="QR code avis Google" style="display:inline-block;border-radius:8px;border:2px solid #e5e7eb;" />
    <p style="font-size:11px;color:#9ca3af;margin:12px 0 0;">Lien direct : <a href="${reviewUrl}" style="color:#2563eb;">${reviewUrl}</a></p>
  </div>

  <h3 style="font-size:14px;font-weight:700;color:#374151;margin:0 0 10px;">📞 Script téléphone (30 secondes)</h3>
  <div style="background:#fafafa;border:1px solid #e5e7eb;border-radius:10px;padding:16px;margin:0 0 12px;">
    <p style="font-size:13px;color:#6b7280;font-style:italic;margin:0 0 8px;">À dire à la fin d'une prestation ou au moment de régler :</p>
    <p style="font-size:14px;color:#1a1a1a;line-height:1.7;margin:0;">"Bonjour, si vous êtes satisfait de la prestation, est-ce que vous auriez 30 secondes pour nous laisser un avis sur Google ? Ça nous aide énormément. Je peux vous envoyer le lien directement par SMS si vous voulez."</p>
  </div>

  <h3 style="font-size:14px;font-weight:700;color:#374151;margin:0 0 10px;">💬 SMS à envoyer après la prestation</h3>
  <div style="background:#fafafa;border:1px solid #e5e7eb;border-radius:10px;padding:16px;margin:0 0 24px;">
    <p style="font-size:13px;color:#6b7280;font-style:italic;margin:0 0 8px;">Copiez-collez ce message dans votre téléphone :</p>
    <p style="font-size:14px;color:#1a1a1a;line-height:1.7;margin:0;">Bonjour [Prénom] ! C'est ${realName}. Merci pour votre confiance 🙏 Si vous avez 30 secondes, un avis Google nous aiderait beaucoup : ${reviewUrl}</p>
  </div>` : ''}

  <hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 20px;">
  <p style="color:#6b7280;font-size:13px;margin:0 0 4px;">Des questions ? Répondez directement à cet email.</p>
  <p style="color:#6b7280;font-size:13px;margin:0;"><strong>Brian · LocalBoost</strong></p>
</div>`,
          })
        } catch (err) {
          console.error('Oneshot generation error:', err)
        }
        break
      }

      // 1. Trouver ou créer le compte Supabase
      let userId = existingId
      if (!userId) {
        // Chercher si un compte existe déjà avec cet email
        const { data: listData } = await supabaseAdmin.auth.admin.listUsers()
        const existing = listData.users.find((u: { email?: string }) => u.email === email)

        if (existing) {
          userId = existing.id
        } else {
          // Créer un nouveau compte (email confirmé automatiquement)
          const { data: created } = await supabaseAdmin.auth.admin.createUser({
            email,
            email_confirm: true,
          })
          userId = created.user?.id
        }
      }

      if (!userId) break

      // 2. Créer ou mettre à jour le profil
      await supabaseAdmin.from('profiles').upsert({
        id:                      userId,
        stripe_customer_id:      session.customer as string,
        stripe_subscription_id:  session.subscription as string,
        subscription_status:     'active',
        onboarded:               false,
      }, { onConflict: 'id' })

      // 3. Incrémenter le compteur de places fondateur
      const { data: spotsRow } = await supabaseAdmin
        .from('founder_config').select('value').eq('key', 'spots_taken').single()
      if (spotsRow) {
        await supabaseAdmin
          .from('founder_config')
          .update({ value: (spotsRow.value as number) + 1 })
          .eq('key', 'spots_taken')
      }

      // 4. Générer un magic link pour la connexion + email de bienvenue
      const { data: linkData } = await supabaseAdmin.auth.admin.generateLink({
        type:    'magiclink',
        email,
        options: { redirectTo: `${APP_URL}/auth/callback` },
      })
      // Bypass le endpoint Supabase (PKCE incompatible côté serveur) :
      // on envoie le token_hash directement vers notre /auth/callback
      const hashedToken = linkData?.properties?.hashed_token
      const next        = encodeURIComponent('/localboost/setup?welcome=1')
      const magicLink   = hashedToken
        ? `${APP_URL}/auth/callback?token_hash=${hashedToken}&type=magiclink&next=${next}`
        : `${APP_URL}/login`

      await sendTransactional({
        to:      email,
        subject: 'Votre accès LocalBoost est activé ✓',
        html: `
<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px 20px;color:#1a1a1a;">
  <h2 style="font-size:20px;font-weight:700;margin:0 0 16px;">Bienvenue sur LocalBoost !</h2>
  <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 20px;">
    Votre abonnement est actif. Cliquez sur le bouton ci-dessous pour accéder à votre tableau de bord et connecter votre fiche Google.
  </p>
  <div style="text-align:center;margin:28px 0;">
    <a href="${magicLink}" style="display:inline-block;background:#2563eb;color:#fff;font-family:Arial,sans-serif;font-size:15px;font-weight:700;padding:14px 32px;border-radius:10px;text-decoration:none;">
      Accéder à mon tableau de bord →
    </a>
    <p style="font-size:12px;color:#9ca3af;margin:10px 0 0;">Ce lien est valable 24h · Un seul clic suffit</p>
  </div>
  <p style="color:#374151;font-size:14px;line-height:1.7;margin:0 0 8px;">Une fois connecté, vous pourrez :</p>
  <ul style="color:#374151;font-size:14px;line-height:2;margin:0 0 24px;padding-left:20px;">
    <li>Connecter votre fiche Google Business</li>
    <li>Voir votre audit complet et vos priorités</li>
    <li>Activer les réponses automatiques aux avis</li>
  </ul>
  <p style="color:#374151;font-size:14px;margin:0;">Questions ? Répondez directement à cet email.<br>À bientôt,<br><strong>L'équipe LocalBoost</strong></p>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0 16px;">
  <p style="color:#9ca3af;font-size:12px;margin:0;">LocalBoost · contact@thelocalboost.fr</p>
</div>`,
      }).catch(err => console.error('Welcome email error:', err))

      break
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      await supabaseAdmin.from('profiles')
        .update({ subscription_status: sub.status, updated_at: new Date().toISOString() })
        .eq('stripe_subscription_id', sub.id)
      break
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      await supabaseAdmin.from('profiles')
        .update({ subscription_status: 'canceled', updated_at: new Date().toISOString() })
        .eq('stripe_subscription_id', sub.id)
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      const sub = invoice.parent?.subscription_details?.subscription
      const subId = typeof sub === 'string' ? sub : sub?.id
      if (subId) {
        await supabaseAdmin.from('profiles')
          .update({ subscription_status: 'past_due', updated_at: new Date().toISOString() })
          .eq('stripe_subscription_id', subId)
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}
