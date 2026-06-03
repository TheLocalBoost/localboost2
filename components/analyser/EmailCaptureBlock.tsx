'use client'
import { useState } from 'react'

interface Props {
  establishmentName: string
  score: number
  city: string
  category: string
  onCapture?: (email: string) => void
}

export default function EmailCaptureBlock({ establishmentName, score, city, category, onCapture }: Props) {
  const [email, setEmail]         = useState('')
  const [loading, setLoading]     = useState(false)
  const [sent, setSent]           = useState(false)
  const [showCTA, setShowCTA]     = useState(false)
  const [error, setError]         = useState('')

  const pricingUrl = `/pricing?city=${encodeURIComponent(city)}&category=${encodeURIComponent(category)}&score=${score}`

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.includes('@')) { setError('Email invalide'); return }
    setError('')
    setLoading(true)
    try {
      await fetch('/api/leads', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, establishmentName, score, city, category }),
      })
      setSent(true)
      onCapture?.(email)
      setTimeout(() => setShowCTA(true), 2000)
    } catch {
      setShowCTA(true) // affiche le CTA même en cas d'erreur
    } finally {
      setLoading(false)
    }
  }

  if (showCTA) {
    return (
      <div className="rounded-2xl bg-blue-600 p-6 text-center">
        {sent && (
          <p className="text-green-200 text-sm font-semibold mb-4">
            ✓ Votre plan arrive dans quelques minutes. Vérifiez votre boîte mail.
          </p>
        )}
        <p className="text-white font-bold text-xl mb-2">Débloquez les solutions</p>
        <p className="text-blue-200 text-sm mb-5">
          Plan d'action complet · Génération IA · Collecte d'avis · Suivi du score
        </p>
        <a
          href={pricingUrl}
          className="block w-full rounded-xl bg-white py-4 text-sm font-bold text-blue-600 hover:bg-blue-50 transition"
        >
          Débloquer mon plan complet — 29€/mois →
        </a>
        <p className="text-blue-300 text-xs mt-3">Sans carte bancaire · Annulation en 1 clic</p>
      </div>
    )
  }

  if (sent) {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-5 text-center">
        <p className="text-sm font-semibold text-green-700">
          ✓ Votre plan arrive dans quelques minutes. Vérifiez votre boîte mail.
        </p>
        <p className="text-xs text-gray-400 mt-2">Chargement du plan complet...</p>
      </div>
    )
  }

  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 12 }}
    >
      <p className="text-sm font-bold text-gray-900 mb-1">
        Recevez votre plan d'action détaillé par email — gratuit
      </p>
      <p className="text-xs text-gray-500 mb-4">
        3 actions concrètes pour améliorer votre score cette semaine, rédigées pour {establishmentName}
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="votre@email.fr"
          required
          className="flex-1 rounded-xl border border-blue-200 bg-white px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60 transition whitespace-nowrap"
        >
          {loading ? '...' : 'Envoyer mon plan →'}
        </button>
      </form>
      {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
      <p className="text-xs text-gray-400 mt-3 text-center">
        Puis débloquez tout avec LocalBoost Pro à 29€/mois
      </p>
    </div>
  )
}
