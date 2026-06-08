'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import FounderSpotsCounter from '@/components/shared/FounderSpotsCounter'
import TestimonialCard from '@/components/shared/TestimonialCard'
import { getTestimonial, testimonialsByCategory, type Testimonial } from '@/lib/testimonials'

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
  const supabase     = createClient()
  const searchParams = useSearchParams()
  const city         = searchParams.get('city') ?? ''
  const category     = searchParams.get('category') ?? ''
  const scoreParam   = parseInt(searchParams.get('score') ?? '0') || 0
  const nomParam     = searchParams.get('nom') ?? ''
  const revenueParam = parseInt(searchParams.get('revenue') ?? '0') || 0

  const [user, setUser]         = useState<{ email: string; id: string } | null>(null)
  const [loading, setLoading]   = useState(false)
  const [checking, setChecking] = useState(true)
  const [guestEmail, setGuestEmail] = useState('')

  useEffect(() => {
    const urlEmail = searchParams.get('email')
    if (urlEmail) setGuestEmail(urlEmail)

    supabase.auth.getUser().then(({ data: { user: u } }) => {
      if (u) setUser({ email: u.email ?? '', id: u.id })
      setChecking(false)
    })
  }, [])

  // Témoignages : métier détecté en premier, puis 2 autres au hasard
  const primaryTestimonial = getTestimonial(category)
  const otherTestimonials  = Object.values(testimonialsByCategory)
    .filter((t: Testimonial) => t !== primaryTestimonial)
    .sort(() => Math.random() - 0.5)
    .slice(0, 2) as Testimonial[]
  const allTestimonials = [primaryTestimonial, ...otherTestimonials]

  const handleCTA = async () => {
    const email = user?.email ?? guestEmail
    if (!email || !email.includes('@')) return
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email }),
      })
      const data: { url?: string; error?: string } = await res.json()
      if (data.url)   window.location.href = data.url
      if (data.error) alert('Erreur : ' + data.error)
    } catch {
      alert('Erreur de connexion. Réessayez.')
    } finally {
      setLoading(false)
    }
  }

  const ctaLabel = loading ? 'Chargement...' : 'Activer mon accès →'

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
              <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Vous y êtes presque</h1>
              <p className="text-gray-500 text-sm">
                Votre compte est créé. Activez votre accès pour débloquer votre plan d'action.
              </p>
            </>
          ) : city ? (
            <>
              <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Débloquez votre plan d'action complet</h1>
              <p className="text-gray-500 text-sm">
                Rejoignez les artisans de <strong>{city}</strong> qui améliorent leur visibilité Google chaque semaine.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Débloquez votre plan d'action complet</h1>
              <p className="text-gray-500 text-sm">
                Rejoignez les artisans qui améliorent leur visibilité Google chaque semaine.
              </p>
            </>
          )}
        </div>

        {/* Compteur temps réel — L6 */}
        <div className="mb-6">
          <FounderSpotsCounter />
        </div>

        {/* Bandeau personnalisé si score connu */}
        {scoreParam > 0 && (
          <div className="rounded-2xl bg-red-50 border border-red-200 p-5 mb-4 text-center">
            <p className="text-sm text-red-700 font-semibold mb-1">
              {nomParam ? `${nomParam} — score ${scoreParam}/100` : `Votre score : ${scoreParam}/100`}
            </p>
            <p className="text-2xl font-extrabold text-red-600">
              ~{revenueParam > 0 ? `${revenueParam}€` : '?'}
              <span className="text-sm font-normal text-red-500"> perdus/mois à cause des lacunes détectées</span>
            </p>
            <p className="text-xs text-red-400 mt-2">
              Pour 29€/mois, on corrige tout ça automatiquement.
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

          {!user && !checking && (
            <input
              type="email"
              value={guestEmail}
              onChange={e => setGuestEmail(e.target.value)}
              placeholder="votre@email.fr"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm mb-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          )}
          <button
            onClick={handleCTA}
            disabled={loading || checking || (!user && !guestEmail.includes('@'))}
            className="w-full rounded-xl bg-blue-600 py-4 text-sm font-bold text-white hover:bg-blue-700 transition disabled:opacity-60"
          >
            {ctaLabel}
          </button>

          {/* Garantie — mise en avant */}
          <div className="mt-4 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-center">
            <p className="text-sm font-bold text-amber-800">★ Satisfait ou remboursé 30 jours</p>
            <p className="text-xs text-amber-700 mt-0.5">Si vous ne voyez pas de résultat en 30 jours, on vous rembourse intégralement. Aucune question posée.</p>
          </div>

          {/* Réassurance */}
          <div className="flex items-center justify-around mt-4 pt-4 border-t border-gray-100">
            <div className="flex flex-col items-center gap-1 text-center">
              <span className="text-lg">🔒</span>
              <p className="text-xs text-gray-500">Paiement sécurisé<br />Stripe</p>
            </div>
            <div className="flex flex-col items-center gap-1 text-center">
              <span className="text-lg">📅</span>
              <p className="text-xs text-gray-500">Résiliable<br />en 1 clic</p>
            </div>
            <div className="flex flex-col items-center gap-1 text-center">
              <span className="text-lg">💬</span>
              <p className="text-xs text-gray-500">Support<br />direct fondateur</p>
            </div>
          </div>
        </div>

        {/* Témoignages dynamiques par métier — L5 */}
        <div className="space-y-3">
          {allTestimonials.map(t => (
            <TestimonialCard key={t.metier} testimonial={t} />
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
