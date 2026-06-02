'use client'

import { useState, useEffect, Suspense } from 'react'
import { createClient } from '@/lib/supabase-browser'

const FEATURES = [
  'Plan d\'action personnalisé mis à jour chaque semaine',
  'Description Google rédigée par IA',
  'Réponses aux avis générées par IA',
  'Générateur de demandes d\'avis + QR Code',
  'Publications Google automatiques',
  'Rapport hebdomadaire par email',
  'Historique de votre score sur 12 mois',
]

const TESTIMONIALS = [
  { name: 'Marc D.', role: 'Plombier · Lyon', text: '« En 3 semaines, je suis passé de la 5e à la 2e position sur Google. 4 nouveaux clients ce mois-ci. »', stars: 5 },
  { name: 'Sophie L.', role: 'Coiffeuse · Bordeaux', text: '« L\'email de demande d\'avis a multiplié mes avis Google par 3 en un mois. Simple et efficace. »', stars: 5 },
  { name: 'Thomas R.', role: 'Électricien · Nantes', text: '« Les priorités IA m\'ont évité de perdre du temps sur ce qui n\'avait pas d\'impact. Très bien. »', stars: 5 },
]

const SPOTS_LEFT = parseInt(process.env.NEXT_PUBLIC_FOUNDER_SPOTS_LEFT ?? '47', 10)

function PricingContent() {
  const supabase = createClient()
  const [user, setUser]       = useState<{ email: string; id: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      if (u) setUser({ email: u.email ?? '', id: u.id })
      setChecking(false)
    })
  }, [])

  const handleCTA = async () => {
    if (!user) {
      window.location.href = '/signup?redirect=pricing'
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/checkout', { method: 'POST' })
      const data: { url?: string; error?: string } = await res.json()
      if (data.url)   window.location.href = data.url
      if (data.error) alert('Erreur : ' + data.error)
    } catch {
      alert('Erreur de connexion. Réessayez.')
    } finally {
      setLoading(false)
    }
  }

  const ctaLabel = loading
    ? 'Chargement...'
    : user
      ? 'Activer mon accès →'
      : 'Commencer →'

  return (
    <div className="min-h-screen bg-gray-50 py-16 px-4">
      <div className="max-w-lg mx-auto">

        {/* Logo */}
        <div className="text-center mb-10">
          <a href="/" className="inline-flex items-center gap-2 text-xl font-bold text-gray-900 mb-6">
            <span>📍</span><span>LocalBoost</span>
          </a>

          {checking ? null : user ? (
            <>
              <h1 className="text-2xl font-extrabold text-gray-900 mb-2">
                Vous y êtes presque
              </h1>
              <p className="text-gray-500 text-sm">
                Votre compte est créé. Activez votre accès pour débloquer votre plan d'action.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-extrabold text-gray-900 mb-2">
                Débloquez votre plan d'action complet
              </h1>
              <p className="text-gray-500 text-sm">
                Rejoignez les artisans qui améliorent leur visibilité Google chaque semaine.
              </p>
            </>
          )}
        </div>

        {/* Compteur urgence */}
        {SPOTS_LEFT > 0 && (
          <div className="rounded-xl border border-yellow-300 bg-yellow-50 px-4 py-3 text-center mb-6">
            <p className="text-sm font-semibold text-yellow-800">
              Offre fondateur — {SPOTS_LEFT} places restantes sur 50
            </p>
          </div>
        )}

        {/* Carte pricing */}
        <div className="rounded-2xl border-2 border-blue-500 bg-white p-8 shadow-md mb-6">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-xs font-semibold text-blue-700 mb-5">
            Offre fondateur
          </div>

          <div className="text-center mb-2">
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-5xl font-extrabold text-gray-900">29€</span>
              <span className="text-gray-500 text-lg">/mois</span>
            </div>
            <p className="text-sm text-gray-400 mt-1">puis 29€/mois, résiliable à tout moment</p>
          </div>

          <ul className="space-y-3 mt-6 mb-8">
            {FEATURES.map(f => (
              <li key={f} className="flex items-start gap-2.5 text-sm text-gray-700">
                <span className="text-green-500 shrink-0 mt-0.5 font-bold">✓</span>{f}
              </li>
            ))}
          </ul>

          <button
            onClick={handleCTA}
            disabled={loading || checking}
            className="w-full rounded-xl bg-blue-600 py-4 text-sm font-bold text-white hover:bg-blue-700 transition disabled:opacity-60"
          >
            {ctaLabel}
          </button>

          {/* Réassurance */}
          <div className="flex items-center justify-around mt-5 pt-5 border-t border-gray-100">
            <div className="flex flex-col items-center gap-1 text-center">
              <span className="text-lg">🔒</span>
              <p className="text-xs text-gray-500">Paiement sécurisé<br />Stripe</p>
            </div>
            <div className="flex flex-col items-center gap-1 text-center">
              <span className="text-lg">📅</span>
              <p className="text-xs text-gray-500">Résiliable<br />en 1 clic</p>
            </div>
            <div className="flex flex-col items-center gap-1 text-center">
              <span className="text-lg">⭐</span>
              <p className="text-xs text-gray-500">Résultats en 30 jours<br />ou remboursé</p>
            </div>
          </div>
        </div>

        {/* Témoignages */}
        <div className="space-y-3">
          {TESTIMONIALS.map(t => (
            <div key={t.name} className="bg-white rounded-xl border border-gray-100 p-4">
              <div className="flex items-center gap-0.5 mb-2">
                {Array.from({ length: t.stars }).map((_, i) => (
                  <span key={i} className="text-amber-400 text-xs">★</span>
                ))}
              </div>
              <p className="text-sm text-gray-700 leading-relaxed mb-2">{t.text}</p>
              <p className="text-xs text-gray-400 font-semibold">{t.name} · {t.role}</p>
            </div>
          ))}
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
