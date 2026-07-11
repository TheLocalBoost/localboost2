'use client'
import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

function ContactForm() {
  const searchParams = useSearchParams()
  const [form, setForm] = useState({
    name:    searchParams.get('name') ?? '',
    email:   searchParams.get('email') ?? '',
    message: searchParams.get('message') ?? '',
  })
  const [loading, setLoading] = useState(false)
  const [sent, setSent]     = useState(false)
  const [error, setError]   = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/contact', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(form),
      })
      const data = await res.json()
      if (data.error) { setError(data.error); return }
      setSent(true)
    } catch {
      setError('Erreur de connexion. Réessayez.')
    } finally {
      setLoading(false)
    }
  }

  const input = 'w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white'

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-gray-900 text-lg">
          <span>📍</span><span>LocalBoost</span>
        </Link>
      </header>

      <div className="max-w-lg mx-auto px-6 py-16">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Contactez-nous</h1>
          <p className="text-gray-500">
            Une question, un problème, une suggestion ?<br />
            On répond sous 24h.
          </p>
        </div>

        {sent ? (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
            <p className="text-2xl mb-3">✓</p>
            <p className="text-lg font-semibold text-green-800 mb-2">Message envoyé !</p>
            <p className="text-sm text-green-700">Nous vous répondrons dans les 24 heures.</p>
            <Link href="/"
              className="inline-block mt-6 text-sm font-semibold text-green-700 underline hover:no-underline">
              Retour à l'accueil
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 p-8 space-y-4 shadow-sm">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Votre nom *
              </label>
              <input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Jean Dupont"
                required
                className={input}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Email *
              </label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="jean@example.fr"
                required
                className={input}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Message *
              </label>
              <textarea
                value={form.message}
                onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                placeholder="Décrivez votre question ou votre demande..."
                required
                rows={5}
                className={`${input} resize-none`}
              />
            </div>

            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-blue-600 py-4 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60 transition"
            >
              {loading ? 'Envoi...' : 'Envoyer mon message →'}
            </button>
          </form>
        )}

        <div className="mt-8 text-center text-sm text-gray-400">
          Ou par email directement :{' '}
          <a href="mailto:contact@thelocalboost.fr" className="text-blue-600 hover:underline">
            contact@thelocalboost.fr
          </a>
        </div>
      </div>
    </div>
  )
}

export default function ContactPage() {
  return (
    <Suspense>
      <ContactForm />
    </Suspense>
  )
}
