import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const guestEmail: string | undefined = body.email

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Utilisateur connecté OU email fourni en guest
    const email = user?.email ?? guestEmail
    if (!email) return NextResponse.json({ error: 'Email requis' }, { status: 400 })

    const session = await stripe.checkout.sessions.create({
      mode:                 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: process.env.STRIPE_PRICE_ID!, quantity: 1 }],
      customer_email:       email,
      allow_promotion_codes: true,
      metadata: {
        ...(user?.id ? { supabase_user_id: user.id } : {}),
        email,
      },
      success_url: `${process.env.NEXT_PUBLIC_URL}/localboost/setup?welcome=1`,
      cancel_url:  `${process.env.NEXT_PUBLIC_URL}/pricing`,
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('Stripe checkout error:', err)
    return NextResponse.json({ error: 'Erreur de paiement' }, { status: 500 })
  }
}
