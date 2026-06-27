'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'

const INCLUDES = [
  'Description Google optimisée pour votre métier et votre ville',
  '4 posts Google — 1 par semaine pendant 4 semaines',
  'Réponses personnalisées à vos avis clients',
  'QR code pour collecter plus d\'avis — à imprimer',
  'Plan d\'action prioritaire basé sur vos vrais concurrents',
  'Script SMS pour demander des avis après chaque prestation',
]

function PricingContent() {
  const supabase     = createClient()
  const searchParams = useSearchParams()
  const city         = searchParams.get('city') ?? ''
  const nomParam     = searchParams.get('nom') ?? ''
  const scoreParam   = parseInt(searchParams.get('score') ?? '0') || 0
  const revenueParam = parseInt(searchParams.get('revenue') ?? '0') || 0

  const [user, setUser]               = useState<{ email: string; id: string } | null>(null)
  const [loading, setLoading]         = useState(false)
  const [checking, setChecking]       = useState(true)
  const [guestEmail, setGuestEmail]   = useState('')
  const [emailError, setEmailError]   = useState(false)

  useEffect(() => {
    const urlEmail = searchParams.get('email')
    if (urlEmail) setGuestEmail(urlEmail)
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      if (u) setUser({ email: u.email ?? '', id: u.id })
      setChecking(false)
    })
  }, [])

  const handlePay = async () => {
    const email = user?.email ?? guestEmail
    if (!email || !email.includes('@')) { setEmailError(true); return }
    setEmailError(false)
    setLoading(true)
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
          <h1 className="text-2xl font-extrabold text-gray-900 mb-2">
            Votre pack Google — livré en 48h
          </h1>
          <p className="text-gray-500 text-sm">
            {city
              ? `Ce que les agences facturent 150-500€ pour ${city} — pour 39€, sans engagement.`
              : 'Ce que les agences facturent 150-500€ — pour 39€, livré en 48h, sans engagement.'}
          </p>
        </div>

        {/* Bandeau score si connu */}
        {scoreParam > 0 && (
          <div className="rounded-2xl bg-red-50 border border-red-200 p-5 mb-4 text-center">
            <p className="text-sm text-red-700 font-semibold mb-1">
              {nomParam ? `${nomParam} — score ${scoreParam}/100` : `Votre score : ${scoreParam}/100`}
            </p>
            {revenueParam > 0 && (
              <p className="text-2xl font-extrabold text-red-600">
                ~{revenueParam}€
                <span className="text-sm font-normal text-red-500"> perdus/mois à cause des lacunes détectées</span>
              </p>
            )}
          </div>
        )}

        {/* Email */}
        {!user && !checking && (
          <div className="mb-4">
            <input
              type="email"
              value={guestEmail}
              onChange={e => { setGuestEmail(e.target.value); setEmailError(false) }}
              placeholder="votre@email.fr — on vous envoie le pack ici"
              className={`w-full rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 ${emailError ? 'border-red-400 focus:ring-red-500/20' : guestEmail.includes('@') ? 'border-green-400 focus:ring-green-500/20' : 'border-gray-200 focus:ring-blue-500/20'}`}
            />
            {emailError && <p className="text-xs text-red-500 mt-1 ml-1">Entrez votre email pour recevoir le pack</p>}
          </div>
        )}

        {/* Carte principale */}
        <div className="rounded-2xl border-2 border-green-500 bg-white p-6 sm:p-8 shadow-xl mb-4">
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-5xl font-extrabold text-gray-900">39€</span>
            <span className="text-gray-400">une seule fois</span>
          </div>
          <p className="text-sm text-gray-500 mb-6">Livré par email sous 48h · Satisfait ou remboursé sous 30 jours</p>

          <ul className="space-y-3 mb-8">
            {INCLUDES.map(f => (
              <li key={f} className="flex items-start gap-2.5 text-sm text-gray-700">
                <span className="text-green-500 shrink-0 mt-0.5 font-bold">✓</span>{f}
              </li>
            ))}
          </ul>

          <button
            onClick={handlePay}
            disabled={loading || checking}
            className="w-full rounded-xl bg-green-500 hover:bg-green-400 py-4 text-base font-extrabold text-white transition disabled:opacity-60 shadow-lg shadow-green-100"
          >
            {loading ? 'Chargement...' : 'Je veux mon pack Google — 39€ →'}
          </button>
          <p className="text-xs text-gray-400 text-center mt-2">Paiement sécurisé Stripe · Remboursé si insatisfait</p>
        </div>

        {/* Comparaison agences */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 mb-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4 text-center">Pourquoi 39€ et pas 300€ ?</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-xs text-gray-400 mb-2">Agence traditionnelle</p>
              <p className="text-xl font-extrabold text-red-500">150-500€</p>
              <p className="text-xs text-gray-400 mt-1">2-4 semaines</p>
              <p className="text-xs text-gray-400">Contrat souvent imposé</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-green-700 font-semibold mb-2">LocalBoost</p>
              <p className="text-xl font-extrabold text-green-600">39€</p>
              <p className="text-xs text-gray-500 mt-1">48h</p>
              <p className="text-xs text-gray-500">Sans engagement</p>
            </div>
          </div>
          <p className="text-xs text-gray-400 text-center mt-4 pt-3 border-t border-gray-100">
            On utilise l'IA pour faire en 5 minutes ce qu'une agence fait en 2 semaines. Même résultat. Prix divisé par 10.
          </p>
        </div>

        {/* Garantie */}
        <div className="rounded-2xl bg-amber-50 border border-amber-200 px-5 py-4 text-center mb-4">
          <p className="text-sm font-bold text-amber-800">★ Satisfait ou remboursé — 30 jours</p>
          <p className="text-xs text-amber-700 mt-1">Pas de résultat visible ? Remboursement intégral, aucune question posée.</p>
        </div>

        {/* Ce qui se passe après */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8">
          <p className="text-sm font-bold text-gray-900 mb-4">Ce qui se passe après votre paiement</p>
          <div className="space-y-4">
            {[
              { t: 'Maintenant', d: 'Vous recevez une confirmation. Notre système analyse votre fiche Google en temps réel.' },
              { t: 'Dans 48h maximum', d: 'Votre pack complet arrive par email : description, posts, réponses aux avis, QR code, plan d\'action.' },
              { t: 'Vous publiez', d: 'Copiez-collez en 5 minutes depuis votre téléphone. Votre fiche devient active. Google vous remonte.' },
            ].map(({ t, d }, i) => (
              <div key={i} className="flex gap-3">
                <span className="text-xs font-bold text-green-700 bg-green-50 rounded-full w-6 h-6 flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{t}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-center text-xs text-gray-300 mt-4">
          LocalBoost · Entreprise française · SIREN 105 578 884 · contact@thelocalboost.fr
        </p>
      </div>

      {/* Barre fixe mobile */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 shadow-lg z-50">
        <button
          onClick={handlePay}
          disabled={loading || checking}
          className="w-full rounded-xl bg-green-500 py-3.5 text-sm font-bold text-white hover:bg-green-400 transition disabled:opacity-60"
        >
          {loading ? 'Chargement...' : 'Je veux mon pack — 39€ →'}
        </button>
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
