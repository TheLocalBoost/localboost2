import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Génère un Stripe Payment Link à usage interne (à usage unique, envoyé
// manuellement au client dans l'email de conversation) pour un montant et un
// tier négociés au cas par cas. Chaque lien est tracé dans `payment_links`
// pour relier un paiement reçu à un client et un montant précis — voir
// app/api/stripe/webhook/route.ts pour la réconciliation au paiement.
export async function POST(req: NextRequest) {
  const k = req.nextUrl.searchParams.get('k')
  if (k !== process.env.ADMIN_SECRET_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const email = String(body.email ?? '').trim().toLowerCase()
  const nom   = String(body.nom ?? '').trim()
  const ville = body.ville ? String(body.ville).trim() : null
  const tier  = body.tier as string
  const amountCents = body.amountCents

  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'email valide requis' }, { status: 400 })
  }
  if (!nom) {
    return NextResponse.json({ error: 'nom requis' }, { status: 400 })
  }
  if (tier !== 'express' && tier !== 'surMesure') {
    return NextResponse.json({ error: 'tier doit être "express" ou "surMesure"' }, { status: 400 })
  }
  if (!Number.isInteger(amountCents) || amountCents < 100) {
    return NextResponse.json({ error: 'amountCents doit être un entier ≥ 100 (1,00€)' }, { status: 400 })
  }

  const tierLabel = tier === 'express' ? 'Pack Express' : 'Pack Sur-mesure'

  try {
    const price = await stripe.prices.create({
      currency:     'eur',
      unit_amount:  amountCents,
      product_data: { name: `${tierLabel} Google Business — ${nom}` },
    })

    const paymentLink = await stripe.paymentLinks.create({
      line_items: [{ price: price.id, quantity: 1 }],
      metadata:   { email, nom, ville: ville ?? '', tier },
      after_completion: {
        type:     'redirect',
        redirect: { url: `${process.env.NEXT_PUBLIC_URL}/merci?type=${tier}` },
      },
    })

    const { data, error } = await supabase
      .from('payment_links')
      .insert({
        email, nom, ville, tier, amount_cents: amountCents,
        stripe_payment_link_id: paymentLink.id,
        stripe_url:             paymentLink.url,
      })
      .select('id')
      .single()

    if (error) {
      console.error('[create-payment-link] db insert failed', error)
      // Le lien Stripe existe déjà — le renvoyer quand même pour ne pas le perdre,
      // mais signaler explicitement l'échec de traçabilité.
      return NextResponse.json({
        ok: true, url: paymentLink.url,
        warning: 'Lien Stripe créé mais NON enregistré en base (traçabilité perdue) — notez-le manuellement.',
      }, { status: 207 })
    }

    return NextResponse.json({ ok: true, id: data.id, url: paymentLink.url })
  } catch (err) {
    console.error('[create-payment-link] stripe error', err)
    return NextResponse.json({ error: 'Erreur Stripe lors de la création du lien.' }, { status: 500 })
  }
}
