import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const guestEmail: string | undefined = body.email
    const nom: string | undefined = body.nom
    const ville: string | undefined = body.ville

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const email = user?.email ?? guestEmail
    if (!email) return NextResponse.json({ error: 'Email requis' }, { status: 400 })

    const session = await stripe.checkout.sessions.create({
      mode:                 'payment',
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency:     'eur',
          unit_amount:  9900,
          product_data: {
            name:        'Optimisation Google Business — Livraison 48h',
            description: 'Description optimisée + 4 posts Google prêts à publier + réponses aux avis. Livré par email sous 48h.',
          },
        },
        quantity: 1,
      }],
      customer_email: email,
      metadata: {
        ...(user?.id ? { supabase_user_id: user.id } : {}),
        email,
        nom:   nom ?? '',
        ville: ville ?? '',
        type:  'oneshot',
      },
      success_url: `${process.env.NEXT_PUBLIC_URL}/merci?type=oneshot`,
      cancel_url:  `${process.env.NEXT_PUBLIC_URL}/pricing`,
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('Stripe oneshot error:', err)
    return NextResponse.json({ error: 'Erreur de paiement' }, { status: 500 })
  }
}
