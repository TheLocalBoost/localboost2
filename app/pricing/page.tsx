'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import FounderSpotsCounter from '@/components/shared/FounderSpotsCounter'

const FEATURES = [
  'Plan d\'action personnalisÃ© mis Ã  jour chaque semaine',
  'Description Google rÃ©digÃ©e par IA',
  'RÃ©ponses aux avis gÃ©nÃ©rÃ©es par IA',
  'GÃ©nÃ©rateur de demandes d\'avis + QR Code',
  'Publications Google automatiques',
  'Rapport hebdomadaire par email',
  'Historique de votre score sur 12 mois',
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

  const handleCTA = async () => {
    const email = user?.email ?? guestEmail
    if (!email || !email.includes('@')) return
    setLoading(true)
    // Capture au moment du clic â€” consentement explicite (l'artisan essaie de payer)
    fetch('/api/waitlist', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email, nom: nomParam, ville: city, score: scoreParam || undefined, source: 'outreach_click' }),
    }).catch(() => {})
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
      alert('Erreur de connexion. RÃ©essayez.')
    } finally {
      setLoading(false)
    }
  }

  const ctaLabel = loading ? 'Chargement...' : 'Confier ma fiche Google Ã  LocalBoost â†’'

  return (
    <div className="min-h-screen bg-gray-50 py-16 px-4">
      <div className="max-w-lg mx-auto">

        {/* Logo */}
        <div className="text-center mb-10">
          <a href="/" className="inline-flex items-center gap-2 text-xl font-bold text-gray-900 mb-6">
            <span>ðŸ“</span><span>LocalBoost</span>
          </a>

          {checking ? null : user ? (
            <>
              <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Vous y Ãªtes presque</h1>
              <p className="text-gray-500 text-sm">
                Votre compte est crÃ©Ã©. Activez votre accÃ¨s pour dÃ©bloquer votre plan d'action.
              </p>
            </>
          ) : city ? (
            <>
              <h1 className="text-2xl font-extrabold text-gray-900 mb-2">DÃ©bloquez votre plan d'action complet</h1>
              <p className="text-gray-500 text-sm">
                Rejoignez les artisans de <strong>{city}</strong> qui amÃ©liorent leur visibilitÃ© Google chaque semaine.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-extrabold text-gray-900 mb-2">DÃ©bloquez votre plan d'action complet</h1>
              <p className="text-gray-500 text-sm">
                Rejoignez les artisans qui amÃ©liorent leur visibilitÃ© Google chaque semaine.
              </p>
            </>
          )}
        </div>

        {/* Compteur temps rÃ©el â€” L6 */}
        <div className="mb-6">
          <FounderSpotsCounter />
        </div>

        {/* Bandeau personnalisÃ© si score connu */}
        {scoreParam > 0 && (
          <div className="rounded-2xl bg-red-50 border border-red-200 p-5 mb-4 text-center">
            <p className="text-sm text-red-700 font-semibold mb-1">
              {nomParam ? `${nomParam} â€” score ${scoreParam}/100` : `Votre score : ${scoreParam}/100`}
            </p>
            <p className="text-2xl font-extrabold text-red-600">
              ~{revenueParam > 0 ? `${revenueParam}â‚¬` : '?'}
              <span className="text-sm font-normal text-red-500"> perdus/mois Ã  cause des lacunes dÃ©tectÃ©es</span>
            </p>
            <p className="text-xs text-red-400 mt-2">
              Pour 29â‚¬/mois, on corrige tout Ã§a automatiquement.
            </p>
          </div>
        )}

        {/* Carte pricing */}
        <div className="rounded-2xl border-2 border-blue-500 bg-white p-8 shadow-md mb-6">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-xs font-semibold text-blue-700 mb-5">
            Offre fondateur
          </div>

          {/* Ancre prix â€” plan annuel barrÃ© */}
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="text-center opacity-40">
              <p className="text-xs text-gray-500 mb-0.5">Annuel</p>
              <p className="text-lg font-bold text-gray-400 line-through">348â‚¬</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-blue-600 font-semibold mb-0.5">Mensuel</p>
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-extrabold text-gray-900">29â‚¬</span>
                <span className="text-gray-500 text-lg">/mois</span>
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-400 text-center mb-2">sans engagement Â· rÃ©siliable en 1 clic</p>

          <ul className="space-y-3 mt-6 mb-8">
            {FEATURES.map(f => (
              <li key={f} className="flex items-start gap-2.5 text-sm text-gray-700">
                <span className="text-green-500 shrink-0 mt-0.5 font-bold">âœ“</span>{f}
              </li>
            ))}
          </ul>

          {!user && !checking && (
            guestEmail
              ? (
                <div className="rounded-xl bg-blue-50 border border-blue-200 px-4 py-3 mb-3 flex items-center gap-2">
                  <span className="text-blue-600 text-sm font-bold">âœ“</span>
                  <span className="text-sm text-blue-800 flex-1 truncate">{guestEmail}</span>
                  <button onClick={() => setGuestEmail('')} className="text-xs text-blue-400 hover:text-blue-600 shrink-0">changer</button>
                </div>
              )
              : (
                <input
                  type="email"
                  value={guestEmail}
                  onChange={e => setGuestEmail(e.target.value)}
                  placeholder="votre@email.fr"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm mb-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              )
          )}
          <button
            onClick={handleCTA}
            disabled={loading || checking || (!user && !guestEmail.includes('@'))}
            className="w-full rounded-xl bg-blue-600 py-4 text-sm font-bold text-white hover:bg-blue-700 transition disabled:opacity-60"
          >
            {ctaLabel}
          </button>

          {/* Garantie â€” mise en avant */}
          <div className="mt-4 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-center">
            <p className="text-sm font-bold text-amber-800">â˜… Satisfait ou remboursÃ© 30 jours</p>
            <p className="text-xs text-amber-700 mt-0.5">Si vous ne voyez pas de rÃ©sultat en 30 jours, on vous rembourse intÃ©gralement. Aucune question posÃ©e.</p>
          </div>

          {/* RÃ©assurance */}
          <div className="flex items-center justify-around mt-4 pt-4 border-t border-gray-100">
            <div className="flex flex-col items-center gap-1 text-center">
              <span className="text-lg">ðŸ”’</span>
              <p className="text-xs text-gray-500">Paiement sÃ©curisÃ©<br />Stripe</p>
            </div>
            <div className="flex flex-col items-center gap-1 text-center">
              <span className="text-lg">ðŸ“…</span>
              <p className="text-xs text-gray-500">RÃ©siliable<br />en 1 clic</p>
            </div>
            <div className="flex flex-col items-center gap-1 text-center">
              <span className="text-lg">ðŸ’¬</span>
              <p className="text-xs text-gray-500">Support<br />direct fondateur</p>
            </div>
          </div>
        </div>

        {/* Ce que vous recevez */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <p className="text-sm font-bold text-gray-900 mb-4">Ce qui se passe aprÃ¨s votre paiement</p>
          <div className="space-y-4">
            <div className="flex gap-3">
              <span className="text-xs font-bold text-blue-600 bg-blue-50 rounded-full w-6 h-6 flex items-center justify-center shrink-0 mt-0.5">1</span>
              <div>
                <p className="text-sm font-semibold text-gray-800">Aujourd'hui</p>
                <p className="text-xs text-gray-500 mt-0.5">Vous recevez votre audit complet (9 critÃ¨res) et les 3 actions prioritaires pour votre fiche.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-xs font-bold text-blue-600 bg-blue-50 rounded-full w-6 h-6 flex items-center justify-center shrink-0 mt-0.5">2</span>
              <div>
                <p className="text-sm font-semibold text-gray-800">Dans 48h</p>
                <p className="text-xs text-gray-500 mt-0.5">Votre description Google est rÃ©digÃ©e et soumise. Vos horaires et services sont vÃ©rifiÃ©s et corrigÃ©s.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-xs font-bold text-blue-600 bg-blue-50 rounded-full w-6 h-6 flex items-center justify-center shrink-0 mt-0.5">3</span>
              <div>
                <p className="text-sm font-semibold text-gray-800">Chaque semaine</p>
                <p className="text-xs text-gray-500 mt-0.5">Un rapport vous dit oÃ¹ en est votre fiche. On rÃ©pond aux avis, on publie du contenu. Vous ne touchez Ã  rien.</p>
              </div>
            </div>
          </div>
          <div className="mt-5 pt-4 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400">Pas de rÃ©sultat visible en 30 jours â†’ remboursement intÃ©gral, aucune question posÃ©e.</p>
          </div>
        </div>

        {/* SIRET + confiance */}
        <p className="text-center text-xs text-gray-300 mt-8">
          LocalBoost â€” Entreprise franÃ§aise Â· SIREN 105 578 884<br />
          DonnÃ©es hÃ©bergÃ©es en France Â· contact@thelocalboost.fr
        </p>

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
