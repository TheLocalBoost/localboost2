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

      // ── One-shot 99€ : audit réel + génération contextualisée + envoi ──
      if (session.metadata?.type === 'oneshot') {
        const nom   = session.metadata?.nom   ?? ''
        const ville = session.metadata?.ville ?? ''

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

          const prompt = `Tu es un expert Google Business Profile. Génère le pack complet pour "${realName}", à ${realCity}.

DONNÉES RÉELLES DE LA FICHE (utilise UNIQUEMENT ces données, n'invente rien) :
- Note Google : ${realRating > 0 ? `${realRating}/5` : 'non renseignée'}
- Nombre d'avis : ${realReviews}
- Photos : ${realPhotos}
- Score de fiche : ${score}/100
- CA estimé perdu/mois : ${lostRevenue > 0 ? `${lostRevenue}€` : 'non calculé'}
${competitorCtx ? `- ${competitorCtx}` : ''}
${realProblems.length > 0 ? `\nProblèmes détectés :\n${realProblems.map(p => `- ${p}`).join('\n')}` : ''}
${reviewsCtx ? `\nDerniers avis clients :\n${reviewsCtx}` : ''}

Réponds UNIQUEMENT avec ce JSON valide (aucun texte avant ou après) :
{
  "description": "...",
  "posts": ["post1", "post2", "post3", "post4"],
  "reviewResponses": ["réponse à l'avis 1", "réponse à l'avis 2"],
  "priorite": "..."
}

Contraintes STRICTES :
- description : 150-200 mots, mentionne "${realName}" et "${realCity}", jamais de durée inventée ("depuis X ans"), jamais de garantie inventée, ton artisan direct
- posts : 4 posts distincts (60-80 mots), basés sur les vrais problèmes et données ci-dessus${realPhone ? `, termine le dernier post avec le vrai numéro ${realPhone}` : ', ne mets jamais de numéro fictif'}. Chaque post : appel à l'action + 2 hashtags locaux
- reviewResponses : réponds à chaque avis listé ci-dessus par son prénom et en citant un détail de son avis. Si aucun avis : tableau vide []
- priorite : 1 action concrète basée sur le problème #1 détecté, chiffrée si possible`

          const msg = await anthropic.messages.create({
            model:      'claude-haiku-4-5-20251001',
            max_tokens: 2000,
            messages:   [{ role: 'user', content: prompt }],
          })

          const raw  = (msg.content[0] as { text: string }).text.trim()
          const pack = JSON.parse(raw.replace(/^```json\n?/, '').replace(/\n?```$/, ''))

          const postsHtml = pack.posts.map((p: string, i: number) => `
<div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:16px;margin:0 0 12px;">
  <p style="font-size:11px;color:#6b7280;font-weight:700;text-transform:uppercase;letter-spacing:.05em;margin:0 0 8px;">Post ${i + 1}/4 — Semaine ${i + 1}</p>
  <p style="font-size:14px;color:#1a1a1a;line-height:1.7;margin:0;white-space:pre-line;">${p}</p>
</div>`).join('')

          const reviewsHtml = (pack.reviewResponses ?? []).length > 0
            ? `<h3 style="font-size:14px;font-weight:700;color:#374151;margin:24px 0 10px;">📍 Réponses à vos avis</h3>
${(pack.reviewResponses as string[]).map((r: string, i: number) => `
<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:16px;margin:0 0 12px;">
  <p style="font-size:11px;color:#16a34a;font-weight:700;margin:0 0 8px;">Réponse à l'avis ${i + 1}</p>
  <p style="font-size:14px;color:#1a1a1a;line-height:1.7;margin:0;">${r}</p>
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

  <h3 style="font-size:14px;font-weight:700;color:#374151;margin:0 0 10px;">📍 4 posts Google — 1 par semaine</h3>
  <p style="font-size:12px;color:#9ca3af;margin:0 0 12px;">Google Business → Ajouter une mise à jour → Copier/coller.</p>
  ${postsHtml}

  ${reviewsHtml}

  <h3 style="font-size:14px;font-weight:700;color:#374151;margin:0 0 10px;">📍 Priorité cette semaine</h3>
  <div style="background:#fef3c7;border:1px solid #fde68a;border-radius:10px;padding:16px;margin:0 0 28px;">
    <p style="font-size:14px;color:#92400e;margin:0;">${pack.priorite}</p>
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
