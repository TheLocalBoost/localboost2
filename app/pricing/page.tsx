'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import FounderSpotsCounter from '@/components/shared/FounderSpotsCounter'

const FEATURES = [
  'Post Google rédigé chaque semaine — prêt à publier en 1 clic',
  'Réponses aux avis générées par IA — personnalisées à chaque client',
  'Plan d\'action hebdomadaire : ce qui rapporte le plus d\'appels en premier',
  'Description Google optimisée pour votre métier et votre ville',
  'Générateur de demandes d\'avis + QR Code imprimable',
  'Rapport hebdomadaire par email — vues, appels, clics',
  'Historique de votre score sur 12 mois',
]


function PricingContent() {
  const supabase     = createClient()
  const searchParams = useSearchParams()
  const city         = searchParams.get('city') ?? ''
  const category     = searchParams.get('category') ?? ''
  const scoreParam   = parseInt(searchParams.get('score') ?? '0') || 0
  const nomParam     = searchParams.get('nom') ?? ''
  const revenueParam = parseInt(searchParams.get('revenue') ?? '0') || 0

  const [user, setUser]             = useState<{ email: string; id: string } | null>(null)
  const [loading, setLoading]           = useState(false)
  const [loadingOneshot, setLoadingOneshot] = useState(false)
  const [checking, setChecking]         = useState(true)
  const [guestEmail, setGuestEmail]     = useState('')
  const [emailError, setEmailError]     = useState(false)

  useEffect(() => {
    const urlEmail = searchParams.get('email')
    if (urlEmail) setGuestEmail(urlEmail)

    supabase.auth.getUser().then(({ data: { user: u } }) => {
      if (u) setUser({ email: u.email ?? '', id: u.id })
      setChecking(false)
    })
  }, [])

  const handleOneshot = async () => {
    const email = user?.email ?? guestEmail
    if (!email || !email.includes('@')) { setEmailError(true); return }
    setEmailError(false)
    setLoadingOneshot(true)
    try {
      const res = await fetch('/api/stripe/checkout-oneshot', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, nom: nomParam, ville: city }),
      })
      const data: { url?: string; error?: string } = await res.json()
      if (data.url)   window.location.href = data.url
      if (data.error) alert('Erreur : ' + data.error)
    } catch {
      alert('Erreur de connexion. Réessayez.')
    } finally {
      setLoadingOneshot(false)
    }
  }

  const handleCTA = async () => {
    const email = user?.email ?? guestEmail
    if (!email || !email.includes('@')) {
      setEmailError(true)
      return
    }
    setEmailError(false)
    setLoading(true)
    fetch('/api/waitlist', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email, nom: nomParam, ville: city, score: scoreParam || undefined, source: 'pricing_cta' }),
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
      alert('Erreur de connexion. Réessayez.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-16 px-4 pb-28 sm:pb-16">
      <div className="max-w-lg mx-auto">

        {/* Logo */}
        <div className="text-center mb-10">
          <a href="/" className="inline-flex items-center gap-2 text-xl font-bold text-gray-900 mb-6">
            <span>📍</span><span>LocalBoost</span>
          </a>

          {!checking && (
            user ? (
              <>
                <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Vous y êtes presque</h1>
                <p className="text-gray-500 text-sm">
                  Votre compte est créé. Activez votre accès pour débloquer votre plan d'action.
                </p>
              </>
            ) : city ? (
              <>
                <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Récupérez les appels que Google vous coûte</h1>
                <p className="text-gray-500 text-sm">
                  Rejoignez les artisans de <strong>{city}</strong> qui récupèrent des clients chaque semaine.
                </p>
              </>
            ) : (
              <>
                <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Récupérez les appels que Google vous coûte</h1>
                <p className="text-gray-500 text-sm">
                  Rejoignez les artisans qui récupèrent des clients perdus chaque semaine.
                </p>
              </>
            )
          )}
        </div>

        {/* Compteur temps réel */}
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
              Pour 29€/mois, on vous guide pour corriger tout ça en moins de 10 minutes.
            </p>
          </div>
        )}

        {/* Email partagé — visible si non connecté */}
        {!user && !checking && (
          <div className="mb-4">
            <input
              type="email"
              value={guestEmail}
              onChange={e => { setGuestEmail(e.target.value); setEmailError(false) }}
              placeholder="votre@email.fr"
              className={`w-full rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 ${emailError ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : guestEmail.includes('@') ? 'border-green-400 focus:border-green-500 focus:ring-green-500/20' : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500/20'}`}
            />
            {emailError && <p className="text-xs text-red-500 mt-1 ml-1">Entrez votre email pour continuer</p>}
          </div>
        )}

        {/* Carte pricing 29€/mois — EN PREMIER */}
        <div className="rounded-2xl border-2 border-green-500 bg-white p-5 sm:p-8 shadow-md mb-4">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-green-50 border border-green-200 px-3 py-1 text-xs font-semibold text-green-700 mb-5">
            Offre fondateur — sans engagement
          </div>

          {/* Prix */}
          <div className="flex items-center justify-center mb-3">
            <div className="text-center">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl sm:text-5xl font-extrabold text-gray-900">29€</span>
                <span className="text-gray-500 text-lg">/mois</span>
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-400 text-center mb-2">résiliable en 1 clic · aucun engagement</p>

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
            className="w-full rounded-xl bg-green-500 hover:bg-green-400 py-4 text-base font-extrabold text-white transition disabled:opacity-60 shadow-lg shadow-green-100"
          >
            {loading ? 'Chargement...' : checking ? 'Chargement...' : 'Je commence maintenant — 29€/mois →'}
          </button>

          {/* Garantie */}
          <div className="mt-4 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-center">
            <p className="text-sm font-bold text-amber-800">★ Satisfait ou remboursé 30 jours</p>
            <p className="text-xs text-amber-700 mt-0.5">Si vous ne voyez pas de résultat en 30 jours, on vous rembourse intégralement. Aucune question posée.</p>
          </div>

          {/* Réassurance */}
          <div className="flex items-center justify-around mt-4 pt-4 border-t border-gray-100 gap-2">
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

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-gray-200" />
          <p className="text-xs text-gray-400 shrink-0">ou optimisation unique sans abonnement</p>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Carte one-shot 99€ — EN SECOND */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 shadow-sm mb-6">
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-3xl font-extrabold text-gray-900">99€</span>
            <span className="text-gray-400 text-sm">une seule fois</span>
          </div>
          <p className="text-sm font-bold text-gray-800 mb-1">Optimisation complète de votre fiche</p>
          <p className="text-xs text-gray-500 mb-4">Description rédigée + 4 posts prêts à publier + réponses à vos avis — livré par email sous 48h. Sans abonnement.</p>
          <button
            onClick={handleOneshot}
            disabled={loadingOneshot || checking}
            className="w-full rounded-xl bg-gray-800 hover:bg-gray-700 py-3 text-sm font-bold text-white transition disabled:opacity-60"
          >
            {loadingOneshot ? 'Chargement...' : 'Optimisation unique — 99€ →'}
          </button>
          <p className="text-xs text-gray-400 text-center mt-2">Paiement sécurisé · Satisfait ou remboursé</p>
        </div>

        {/* Ce qui se passe après */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <p className="text-sm font-bold text-gray-900 mb-4">Ce qui se passe après votre paiement</p>
          <div className="space-y-4">
            <div className="flex gap-3">
              <span className="text-xs font-bold text-blue-600 bg-blue-50 rounded-full w-6 h-6 flex items-center justify-center shrink-0 mt-0.5">1</span>
              <div>
                <p className="text-sm font-semibold text-gray-800">Aujourd'hui</p>
                <p className="text-xs text-gray-500 mt-0.5">Vous recevez votre audit complet (9 critères) et les 3 actions prioritaires pour votre fiche.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-xs font-bold text-blue-600 bg-blue-50 rounded-full w-6 h-6 flex items-center justify-center shrink-0 mt-0.5">2</span>
              <div>
                <p className="text-sm font-semibold text-gray-800">Dans 48h</p>
                <p className="text-xs text-gray-500 mt-0.5">Votre description Google est rédigée et soumise. Vos horaires et services sont vérifiés et corrigés.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-xs font-bold text-blue-600 bg-blue-50 rounded-full w-6 h-6 flex items-center justify-center shrink-0 mt-0.5">3</span>
              <div>
                <p className="text-sm font-semibold text-gray-800">Chaque semaine</p>
                <p className="text-xs text-gray-500 mt-0.5">Un post Google prêt à publier, des réponses aux avis rédigées, vos actions de la semaine. Vous publiez en 5 minutes depuis votre tableau de bord.</p>
              </div>
            </div>
          </div>
          <div className="mt-5 pt-4 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400">Pas de résultat visible en 30 jours → remboursement intégral, aucune question posée.</p>
          </div>
        </div>

        {/* SIRET */}
        <p className="text-center text-xs text-gray-300 mt-8">
          LocalBoost — Entreprise française · SIREN 105 578 884<br />
          Données hébergées en France · contact@thelocalboost.fr
        </p>

      </div>

      {/* Barre CTA fixe mobile — toujours visible */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 shadow-lg z-50">
        {!user && !checking && !guestEmail && (
          <input
            type="email"
            value={guestEmail}
            onChange={e => { setGuestEmail(e.target.value); setEmailError(false) }}
            placeholder="votre@email.fr"
            className={`w-full rounded-xl border px-4 py-2.5 text-sm mb-2 focus:outline-none focus:ring-2 ${emailError ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500/20'}`}
          />
        )}
        <button
          onClick={handleCTA}
          disabled={loading || checking}
          className="w-full rounded-xl bg-blue-600 py-3.5 text-sm font-bold text-white hover:bg-blue-700 transition disabled:opacity-60"
        >
          {loading ? 'Chargement...' : checking ? 'Chargement...' : 'Démarrer — 29€/mois · Sans engagement →'}
        </button>
        {emailError && <p className="text-xs text-red-500 mt-1 text-center">Entrez votre email pour continuer</p>}
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
