import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const session = await stripe.checkout.sessions.create({
      mode:                 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: process.env.STRIPE_PRICE_ID!, quantity: 1 }],
      customer_email:       user.email,
      allow_promotion_codes: true,
      metadata:             { supabase_user_id: user.id },
      success_url: `${process.env.NEXT_PUBLIC_URL}/localboost/setup?welcome=1`,
      cancel_url:  `${process.env.NEXT_PUBLIC_URL}/pricing`,
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('Stripe checkout error:', err)
    return NextResponse.json({ error: 'Erreur de paiement' }, { status: 500 })
  }
}
