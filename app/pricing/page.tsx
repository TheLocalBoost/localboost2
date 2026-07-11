'use client'

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { track } from '@/lib/track'

// Ancienne page pricing à prix fixe (test 9,99€ vs 39€) neutralisée : la vente
// se fait désormais au cas par cas, en conversation email, sans prix affiché
// publiquement. On redirige vers /contact en conservant le contexte du
// prospect (nom, ville, email) pour les anciens liens déjà envoyés
// (emails de relance pricing_exits/pricing-reminder, favoris, etc.).
function PricingRedirect() {
  const router        = useRouter()
  const searchParams  = useSearchParams()

  useEffect(() => {
    const nom   = searchParams.get('nom') ?? ''
    const city  = searchParams.get('city') ?? searchParams.get('ville') ?? ''
    const email = searchParams.get('email') ?? ''

    track('pricing_redirected_to_contact', { nom, city })

    const params = new URLSearchParams()
    if (nom) params.set('name', nom)
    if (email) params.set('email', email)
    params.set('message', nom
      ? `Je souhaite recevoir mon rapport pour ${nom}${city ? ` à ${city}` : ''}.`
      : 'Je souhaite recevoir mon rapport.')

    router.replace(`/contact?${params.toString()}`)
  }, [router, searchParams])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
      <p className="text-sm text-gray-400">Redirection...</p>
    </div>
  )
}

export default function PricingPage() {
  return (
    <Suspense>
      <PricingRedirect />
    </Suspense>
  )
}
