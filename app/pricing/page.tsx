'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { Suspense } from 'react'

const FEATURES = [
  'Priorités IA personnalisées chaque semaine',
  'Demandes d\'avis par email et SMS illimitées',
  'QR code Google avis à imprimer',
  'Analyse complète de votre fiche Google',
  'Suggestions photos par IA',
  'Vérification sur tous les annuaires',
  'Contenu IA généré en 1 clic',
  'Sans engagement — annulation en 1 clic',
]

function PricingContent() {
  const [loading, setLoading]   = useState(false)
  const [trialDays, setTrialDays] = useState<number | null>(null)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data } = await supabase
        .from('profiles')
        .select('trial_ends_at')
        .eq('id', user.id)
        .single()
      if (data?.trial_ends_at) {
        const days = Math.ceil((new Date(data.trial_ends_at).getTime() - Date.now()) / 86400000)
        setTrialDays(days > 0 ? days : 0)
      }
    })
  }, [])

  const handleSubscribe = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID }),
      })
      const data = await res.json()
      if (data.url)   window.location.href = data.url
      if (data.error) alert('Erreur : ' + data.error)
    } catch {
      alert('Erreur de connexion. Réessayez.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-20">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <a href="/" className="inline-flex items-center gap-2 text-xl font-bold text-gray-900 mb-6">
            <span>📍</span><span>LocalBoost</span>
          </a>
          {trialDays !== null && trialDays === 0 ? (
            <>
              <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Votre essai est terminé</h1>
              <p className="text-gray-500">Continuez à attirer plus de clients avec LocalBoost.</p>
            </>
          ) : trialDays !== null && trialDays > 0 ? (
            <>
              <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Passez à l'abonnement</h1>
              <p className="text-gray-500">Il vous reste <strong>{trialDays} jour{trialDays > 1 ? 's' : ''}</strong> d'essai gratuit.</p>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Commencer LocalBoost</h1>
              <p className="text-gray-500">Sans engagement. Annulez à tout moment.</p>
            </>
          )}
        </div>

        <div className="rounded-2xl border-2 border-blue-500 bg-white p-8 shadow-sm">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-300 px-3 py-1 text-xs font-semibold text-amber-700 mb-5">
            🏆 Tarif fondateur — places limitées
          </div>

          <div className="text-center mb-6">
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-5xl font-extrabold text-gray-900">29€</span>
              <span className="text-gray-500">/mois</span>
            </div>
            <p className="text-sm text-gray-400 mt-1 line-through">49€ après les 50 premiers</p>
          </div>

          <ul className="space-y-3 mb-8">
            {FEATURES.map(f => (
              <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                <span className="text-blue-500 shrink-0 font-bold">✓</span>{f}
              </li>
            ))}
          </ul>

          <button
            onClick={handleSubscribe}
            disabled={loading}
            className="w-full rounded-xl bg-blue-600 py-4 text-sm font-semibold text-white hover:bg-blue-700 transition disabled:opacity-60"
          >
            {loading ? 'Chargement...' : 'S\'abonner — 29€/mois →'}
          </button>
          <p className="mt-3 text-center text-xs text-gray-400">Sans engagement · Annulation en 1 clic</p>
        </div>

        <div className="mt-4 bg-gray-50 rounded-xl p-4 text-center">
          <p className="text-sm text-gray-600">
            🛡️ <strong>Satisfait ou remboursé 30 jours.</strong>
          </p>
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
