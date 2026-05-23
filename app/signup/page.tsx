'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import Link from 'next/link'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const supabase = createClient()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/pricing`,
      },
    })

    if (error) {
      if (error.message.includes('already registered')) {
        setErrorMsg('Un compte existe déjà avec cet email. Connectez-vous.')
      } else {
        setErrorMsg(error.message)
      }
      setStatus('error')
      return
    }

    setStatus('success')
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="text-5xl mb-4">📧</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Vérifiez votre email</h1>
          <p className="text-gray-500">Un lien de confirmation a été envoyé à <strong>{email}</strong>.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-xl font-bold text-gray-900 mb-6">
            <span>🚀</span><span>LocalBoost</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Créer un compte</h1>
          <p className="text-gray-500 text-sm">7 jours gratuits, sans engagement</p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="votre@email.com" required className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Mot de passe</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minimum 6 caractères" required minLength={6} className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20" />
            </div>
            {status === 'error' && (
              <div className="rounded-xl bg-red-50 border border-red-100 p-3 text-sm text-red-600">{errorMsg}</div>
            )}
            <button type="submit" disabled={status === 'loading'} className="w-full rounded-xl bg-green-600 py-3 text-sm font-semibold text-white hover:bg-green-700 transition disabled:opacity-60">
              {status === 'loading' ? 'Création...' : 'Créer mon compte'}
            </button>
          </form>
          <p className="mt-4 text-center text-sm text-gray-500">
            Déjà un compte ? <Link href="/login" className="text-green-600 font-medium hover:underline">Se connecter</Link>
          </p>
        </div>
      </div>
    </div>
  )
}