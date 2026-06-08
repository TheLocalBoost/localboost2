'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import Link from 'next/link'
import { Suspense } from 'react'

function LoginForm() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus]     = useState<'idle' | 'loading' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [resendEmail, setResendEmail]   = useState('')
  const [resendStatus, setResendStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle')
  const [resendMsg, setResendMsg]       = useState('')
  const router       = useRouter()
  const searchParams = useSearchParams()
  const confirmed    = searchParams.get('confirmed') === '1'
  const linkError    = searchParams.get('error')
  const supabase     = createClient()

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault()
    setResendStatus('loading')
    const res = await fetch('/api/auth/resend-magic-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: resendEmail }),
    })
    if (res.ok) {
      setResendStatus('sent')
    } else {
      const d = await res.json().catch(() => ({}))
      setResendMsg(d.error ?? 'Une erreur est survenue.')
      setResendStatus('error')
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setErrorMsg('Email ou mot de passe incorrect.')
      setStatus('error')
      return
    }
    router.push('/localboost/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/">
            <img src="/logo.png.png" alt="LocalBoost" className="h-16 w-auto mx-auto mb-4" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Se connecter</h1>
          <p className="text-gray-500 text-sm">Accédez à votre espace commerçant</p>
        </div>

        {confirmed && (
          <div className="rounded-xl bg-green-50 border border-green-200 p-4 mb-5 text-center">
            <p className="text-green-800 font-semibold text-sm">✅ Votre email est vérifié !</p>
            <p className="text-green-700 text-xs mt-1">Vous pouvez maintenant vous connecter.</p>
          </div>
        )}

        {(linkError === 'lien_expire' || linkError === 'lien_invalide') && (
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-5 mb-5">
            <p className="text-amber-800 font-semibold text-sm mb-1">⏰ Lien expiré ou invalide</p>
            <p className="text-amber-700 text-xs mb-4">Les liens de connexion sont valables 1h. Entrez votre email pour en recevoir un nouveau.</p>
            {resendStatus === 'sent' ? (
              <p className="text-green-700 text-sm font-semibold text-center">✅ Nouveau lien envoyé — vérifiez votre boîte mail.</p>
            ) : (
              <form onSubmit={handleResend} className="flex gap-2">
                <input
                  type="email" value={resendEmail} onChange={e => setResendEmail(e.target.value)}
                  placeholder="votre@email.com" required
                  className="flex-1 rounded-lg border border-amber-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/40 bg-white"
                />
                <button
                  type="submit" disabled={resendStatus === 'loading'}
                  className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 transition disabled:opacity-60 whitespace-nowrap"
                >
                  {resendStatus === 'loading' ? '...' : 'Renvoyer'}
                </button>
              </form>
            )}
            {resendStatus === 'error' && <p className="text-red-600 text-xs mt-2">{resendMsg}</p>}
          </div>
        )}

        <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input
                type="email" value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="votre@email.com" required
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-gray-700">Mot de passe</label>
                <Link href="/forgot-password" className="text-xs text-blue-600 hover:underline">
                  Mot de passe oublié ?
                </Link>
              </div>
              <input
                type="password" value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Votre mot de passe" required
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            {status === 'error' && (
              <div className="rounded-xl bg-red-50 border border-red-100 p-3 text-sm text-red-600">
                {errorMsg}
              </div>
            )}

            <button
              type="submit" disabled={status === 'loading'}
              className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition disabled:opacity-60"
            >
              {status === 'loading' ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-gray-500">
            Pas encore de compte ?{' '}
            <Link href="/signup" className="text-blue-600 font-medium hover:underline">
              Créer un compte
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  )
}
