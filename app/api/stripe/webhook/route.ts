import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { sendTransactional } from '@/lib/email'

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
        updated_at:              new Date().toISOString(),
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
        options: { redirectTo: `${APP_URL}/localboost/setup?welcome=1` },
      })
      const magicLink = linkData?.properties?.action_link ?? `${APP_URL}/login`

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
