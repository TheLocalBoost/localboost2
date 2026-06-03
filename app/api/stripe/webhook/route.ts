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
      const session = event.data.object as Stripe.Checkout.Session
      // Le metadata contient supabase_user_id (défini dans /api/stripe/checkout)
      const userId = session.metadata?.supabase_user_id
      if (!userId) break

      await supabaseAdmin.from('profiles').update({
        stripe_customer_id:      session.customer as string,
        stripe_subscription_id:  session.subscription as string,
        subscription_status:     'active',
        onboarded:               false,
        updated_at:              new Date().toISOString(),
      }).eq('id', userId)

      // Incrémenter le compteur de places fondateur prises
      const { data: spotsRow } = await supabaseAdmin
        .from('founder_config').select('value').eq('key', 'spots_taken').single()
      if (spotsRow) {
        await supabaseAdmin
          .from('founder_config')
          .update({ value: (spotsRow.value as number) + 1 })
          .eq('key', 'spots_taken')
      }

      // Email de bienvenue envoyé uniquement après paiement confirmé
      const { data: userData } = await supabaseAdmin.auth.admin.getUserById(userId)
      const email = userData?.user?.email
      if (email) {
        await sendTransactional({
          to:      email,
          subject: 'Votre accès LocalBoost est activé ✓',
          html: `
<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px 20px;color:#1a1a1a;">
  <h2 style="font-size:20px;font-weight:700;margin:0 0 16px;">Bonjour,</h2>
  <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 16px;">
    Votre accès LocalBoost est maintenant actif.
  </p>
  <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 8px;">
    Voici ce que vous pouvez faire dès maintenant :
  </p>
  <ol style="color:#374151;font-size:15px;line-height:2;margin:0 0 24px;padding-left:20px;">
    <li>Connectez votre fiche Google Business — <a href="${APP_URL}/localboost/setup" style="color:#2563eb;">/localboost/setup</a></li>
    <li>Consultez votre audit complet — <a href="${APP_URL}/localboost/audit" style="color:#2563eb;">/localboost/audit</a></li>
    <li>Générez votre description Google optimisée — <a href="${APP_URL}/localboost/dashboard" style="color:#2563eb;">/localboost/dashboard</a></li>
  </ol>
  <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 24px;">
    Si vous avez la moindre question, répondez directement à cet email.
  </p>
  <p style="color:#374151;font-size:15px;margin:0;">À bientôt,<br>L'équipe LocalBoost</p>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0 16px;">
  <p style="color:#9ca3af;font-size:12px;margin:0;">LocalBoost · contact@thelocalboost.fr</p>
</div>`,
        }).catch(err => console.error('Welcome email error:', err))
      }
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
      const subId = typeof invoice.subscription === 'string'
        ? invoice.subscription
        : invoice.subscription?.id
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
