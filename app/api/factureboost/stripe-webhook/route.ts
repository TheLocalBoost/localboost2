import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import Stripe from 'stripe'

export const dynamic = 'force-dynamic'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: NextRequest) {
  const body      = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature || !process.env.STRIPE_FACTURE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Signature manquante' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_FACTURE_WEBHOOK_SECRET)
  } catch {
    return NextResponse.json({ error: 'Signature invalide' }, { status: 400 })
  }

  if (event.type === 'payment_intent.succeeded' || event.type === 'checkout.session.completed') {
    const supabase = await createClient()

    let factureId: string | undefined
    let paymentIntentId: string | undefined

    if (event.type === 'payment_intent.succeeded') {
      const pi = event.data.object as Stripe.PaymentIntent
      factureId       = pi.metadata?.facture_id
      paymentIntentId = pi.id
    } else {
      const session = event.data.object as Stripe.Checkout.Session
      factureId       = session.metadata?.facture_id
      paymentIntentId = typeof session.payment_intent === 'string' ? session.payment_intent : undefined
    }

    if (!factureId) return NextResponse.json({ received: true })

    // Marquer la facture comme payée
    await supabase
      .from('factureboost_factures')
      .update({
        statut:                 'payee',
        paid_at:                new Date().toISOString(),
        stripe_payment_intent:  paymentIntentId ?? null,
        updated_at:             new Date().toISOString(),
      })
      .eq('id', factureId)

    // Log
    const { data: facture } = await supabase
      .from('factureboost_factures')
      .select('user_id, numero')
      .eq('id', factureId)
      .single()

    if (facture) {
      await supabase.from('factureboost_logs').insert({
        facture_id:  factureId,
        user_id:     facture.user_id,
        action:      'paid_stripe',
        details:     { payment_intent: paymentIntentId },
      })
    }
  }

  return NextResponse.json({ received: true })
}
