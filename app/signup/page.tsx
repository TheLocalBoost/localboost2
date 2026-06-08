'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import Link from 'next/link'

const SECTORS = [
  'Boulangerie / Pâtisserie',
  'Restaurant / Traiteur',
  'Coiffeur / Barbier',
  'Salon de beauté / Esthétique',
  'Plombier / Chauffagiste',
  'Électricien',
  'Peintre / Décorateur',
  'Maçon / Carreleur',
  'Menuisier / Charpentier',
  'Garagiste / Mécanicien',
  'Fleuriste',
  'Pharmacie / Parapharmacie',
  'Médecin / Paramédical',
  'Dentiste / Orthodontiste',
  'Hôtel / Chambre d\'hôtes',
  'Épicerie / Commerce alimentaire',
  'Autre commerce local',
]

export default function SignupPage() {
  const [step, setStep] = useState<1 | 2>(1)
  const [form, setForm] = useState({
    prenom: '',
    nom: '',
    commerce: '',
    ville: '',
    secteur: '',
    email: '',
    password: '',
  })
  const [status, setStatus]       = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg]   = useState('')
  const [alreadyExists, setAlreadyExists] = useState(false)
  const supabase = createClient()

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault()
    setStep(2)
  }

  function checkPassword(pwd: string): string | null {
    if (pwd.length < 8) return 'Au moins 8 caractères'
    return null
  }

  const passwordError = form.password ? checkPassword(form.password) : null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')

    const pwdErr = checkPassword(form.password)
    if (pwdErr) {
      setErrorMsg(pwdErr)
      setStatus('error')
      return
    }

    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/localboost/setup`,
        data: {
          prenom:   form.prenom,
          nom:      form.nom,
          commerce: form.commerce,
          ville:    form.ville,
          secteur:  form.secteur,
        },
      },
    })

    if (error) {
      const exists = error.message.includes('already registered') || error.message.includes('already been registered')
      setAlreadyExists(exists)
      setErrorMsg(exists ? '' : error.message)
      setStatus('error')
      return
    }

    // Tracker l'événement signup
    fetch('/api/analytics/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'signup', path: '/signup', meta: { secteur: form.secteur, ville: form.ville } }),
    }).catch(() => {})

    setStatus('success')
  }

  const input = 'w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20'

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="text-6xl mb-6">📧</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Vérifiez votre email</h1>
          <p className="text-gray-500 mb-2">
            Un lien de confirmation a été envoyé à
          </p>
          <p className="font-semibold text-gray-900 mb-6">{form.email}</p>
          <p className="text-sm text-gray-400">
            Cliquez sur le lien pour activer votre compte et accéder à la plateforme.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6">
            <img src="/logo.png.png" alt="LocalBoost" className="h-16 w-auto mx-auto" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Créer votre compte gratuit</h1>
          <p className="text-gray-500 text-sm">Gratuit · Aucune carte bancaire requise</p>
        </div>

        {/* Étapes */}
        <div className="flex items-center justify-center gap-3 mb-8">
          {[1, 2].map(n => (
            <div key={n} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition
                ${step >= n ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
                {step > n ? '✓' : n}
              </div>
              <span className={`text-xs ${step >= n ? 'text-gray-700 font-medium' : 'text-gray-400'}`}>
                {n === 1 ? 'Votre commerce' : 'Votre compte'}
              </span>
              {n < 2 && <div className={`w-8 h-0.5 ${step > n ? 'bg-blue-600' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">

          {/* Étape 1 — Commerce */}
          {step === 1 && (
            <form onSubmit={handleStep1} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Prénom *</label>
                  <input type="text" value={form.prenom} onChange={set('prenom')} placeholder="Jean" required className={input} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom *</label>
                  <input type="text" value={form.nom} onChange={set('nom')} placeholder="Dupont" required className={input} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom de votre commerce *</label>
                <input type="text" value={form.commerce} onChange={set('commerce')} placeholder="Boulangerie Dupont" required className={input} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Ville *</label>
                <input type="text" value={form.ville} onChange={set('ville')} placeholder="Paris, Lyon, Bordeaux..." required className={input} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Type d'activité *</label>
                <select value={form.secteur} onChange={set('secteur')} required className={input}>
                  <option value="">Sélectionnez votre activité</option>
                  {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <button type="submit" className="w-full rounded-xl bg-blue-600 py-3.5 text-sm font-semibold text-white hover:bg-blue-700 transition">
                Continuer →
              </button>
            </form>
          )}

          {/* Étape 2 — Compte */}
          {step === 2 && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <button type="button" onClick={() => setStep(1)} className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 mb-2">
                ← Retour
              </button>

              <div className="bg-blue-50 rounded-xl px-4 py-3 mb-2">
                <p className="text-xs text-blue-700 font-medium">Commerce enregistré ✓</p>
                <p className="text-sm text-blue-900 font-semibold">{form.commerce} · {form.ville}</p>
                <p className="text-xs text-blue-600">{form.secteur}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email professionnel *</label>
                <input type="email" value={form.email} onChange={set('email')} placeholder="jean@boulangerie-dupont.fr" required className={input} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Mot de passe *</label>
                <input type="password" value={form.password} onChange={set('password')} placeholder="Ex: MonMot2passe!" required minLength={8} className={input} />
                {form.password && passwordError && (
                  <p className="text-xs text-red-500 mt-1">⚠ {passwordError}</p>
                )}
                {!form.password && (
                  <p className="text-xs text-gray-400 mt-1">8 caractères minimum</p>
                )}
              </div>

              {status === 'error' && alreadyExists && (
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm">
                  <p className="font-semibold text-amber-800 mb-1">Un compte existe déjà avec cet email.</p>
                  <Link href="/login" className="inline-block mt-1 rounded-lg bg-amber-600 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-700 transition">
                    Se connecter →
                  </Link>
                </div>
              )}
              {status === 'error' && !alreadyExists && errorMsg && (
                <div className="rounded-xl bg-red-50 border border-red-100 p-3 text-sm text-red-600">{errorMsg}</div>
              )}

              <button type="submit" disabled={status === 'loading'} className="w-full rounded-xl bg-blue-600 py-3.5 text-sm font-semibold text-white hover:bg-blue-700 transition disabled:opacity-60">
                {status === 'loading' ? 'Création du compte...' : 'Créer mon compte gratuitement →'}
              </button>

              <p className="text-xs text-gray-400 text-center">
                En créant un compte, vous acceptez nos <Link href="/cgv" className="underline">CGV</Link> et notre <Link href="/mentions-legales" className="underline">politique de confidentialité</Link>.
              </p>
            </form>
          )}

          <p className="mt-5 text-center text-sm text-gray-500">
            Déjà un compte ? <Link href="/login" className="text-blue-600 font-medium hover:underline">Se connecter</Link>
          </p>
        </div>

        {/* Trust */}
        <div className="flex items-center justify-center gap-6 mt-6 text-xs text-gray-400">
          <span>🔒 Données sécurisées</span>
          <span>🇫🇷 Hébergé en Europe</span>
          <span>✓ Sans engagement</span>
        </div>
      </div>
    </div>
  )
}
