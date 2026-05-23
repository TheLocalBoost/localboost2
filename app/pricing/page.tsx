'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import { Suspense } from 'react'

function PricingContent() {
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    const handleSession = async () => {
      const code = searchParams.get('code')
      if (code) {
        await supabase.auth.exchangeCodeForSession(code)
      }
      setChecking(false)
    }
    handleSession()
  }, [])

  const handleSubscribe = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      if (data.error) alert(data.error)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400 text-sm">Chargement...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-20">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <a href="/" className="inline-flex items-center gap-2 text-xl font-bold text-gray-900 mb-6">
            <span>🚀</span><span>LocalBoost</span>
          </a>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Accès bêta</h1>
          <p className="text-gray-500">7 jours gratuits, puis 59€/mois. Annulez à tout moment.</p>
        </div>
        <div className="rounded-2xl border-2 border-green-500 bg-white p-8 shadow-sm">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-green-50 border border-green-200 px-4 py-1.5 text-sm font-medium text-green-700 mb-4">
              Accès bêta — Places limitées
            </div>
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-5xl font-extrabold text-gray-900">59€</span>
              <span className="text-gray-500">/mois</span>
            </div>
            <p className="text-sm text-gray-400 mt-1">après 7 jours gratuits</p>
          </div>
          <ul className="space-y-3 mb-8">
            {[
              'Posts Google Business illimités',
              'Réponses aux avis illimitées',
              'Score de visibilité hebdomadaire',
              'Email hebdo automatique',
              'Analyse de vos concurrents',
              'Sans engagement',
            ].map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                <span className="text-green-500 shrink-0">✓</span>{f}
              </li>
            ))}
          </ul>
          <button
            onClick={handleSubscribe}
            disabled={loading || checking}
            className="w-full rounded-xl bg-green-600 py-4 text-sm font-semibold text-white hover:bg-green-700 transition disabled:opacity-60"
          >
            {loading ? 'Chargement...' : 'Commencer 7 jours gratuits'}
          </button>
          <p className="mt-3 text-center text-xs text-gray-400">Carte requise. Annulation en 1 clic.</p>
        </div>
      </div>
    </div>
  )
}

export default function PricingPage() {
  return (
    <Suspense>
      <PricingContent />
    </Suspense>
  )
}