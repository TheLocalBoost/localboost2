'use client'

import { useState }      from 'react'
import { useSearchParams } from 'next/navigation'
import Link              from 'next/link'
import { Suspense }      from 'react'

function LoginForm() {
  const [email, setEmail]   = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const searchParams = useSearchParams()
  const linkError    = searchParams.get('error')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')
    const res = await fetch('/api/auth/resend-magic-link', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email }),
    })
    if (res.ok) {
      setStatus('sent')
    } else {
      const d = await res.json().catch(() => ({}))
      setErrorMsg(d.error ?? 'Une erreur est survenue.')
      setStatus('error')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <Link href="/">
            <img src="/logo.png.png" alt="LocalBoost" className="h-16 w-auto mx-auto mb-4" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Se connecter</h1>
          <p className="text-gray-500 text-sm">Vous recevrez un lien de connexion par email</p>
        </div>

        {linkError && status === 'idle' && (
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 mb-5 text-center">
            <p className="text-amber-800 font-semibold text-sm">⏰ Lien expiré</p>
            <p className="text-amber-700 text-xs mt-1">Entrez votre email ci-dessous pour en recevoir un nouveau.</p>
          </div>
        )}

        <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
          {status === 'sent' ? (
            <div className="text-center py-4">
              <p className="text-4xl mb-4">📬</p>
              <p className="font-bold text-gray-900 text-lg mb-2">Vérifiez votre boîte mail</p>
              <p className="text-gray-500 text-sm leading-relaxed">
                Un lien de connexion a été envoyé à <strong>{email}</strong>.<br />
                Cliquez dessus pour accéder à votre tableau de bord.
              </p>
              <p className="text-xs text-gray-400 mt-4">Pas reçu ? Vérifiez vos spams ou{' '}
                <button onClick={() => setStatus('idle')} className="underline text-blue-600">
                  réessayez
                </button>.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Votre adresse email
                </label>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="votre@email.com" required autoFocus
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
                {status === 'loading' ? 'Envoi...' : 'Recevoir mon lien de connexion →'}
              </button>
            </form>
          )}
        </div>

        <p className="mt-4 text-center text-xs text-gray-400">
          Pas encore de compte ?{' '}
          <Link href="/pricing" className="text-blue-600 hover:underline font-medium">
            Voir les offres →
          </Link>
        </p>
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
