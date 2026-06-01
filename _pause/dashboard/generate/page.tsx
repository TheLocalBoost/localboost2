'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function GenerateContent() {
  const searchParams = useSearchParams()
  const type = searchParams.get('type') || 'google'
  const [variants, setVariants] = useState<string[]>([])
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [copied, setCopied] = useState<number | null>(null)
  const [reviewText, setReviewText] = useState('')
  const [feedback, setFeedback] = useState('')

  const handleGenerate = async (withFeedback = false) => {
    setStatus('loading')
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          reviewText: type === 'review' ? reviewText : undefined,
          feedback: withFeedback ? feedback : undefined,
          previousVariants: withFeedback ? variants : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setVariants(data.variants)
      setFeedback('')
      setStatus('idle')
    } catch {
      setStatus('error')
    }
  }

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text)
    setCopied(index)
    setTimeout(() => setCopied(null), 2000)
  }

  const handlePublish = (text: string) => {
    navigator.clipboard.writeText(text)
    window.open('https://business.google.com/posts', '_blank')
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          {type === 'google' ? '📍 Post Google Business' : '⭐ Réponse à un avis'}
        </h1>
        <p className="text-gray-500 text-sm mt-1">3 variantes générées par l'IA en 60 secondes</p>
      </div>

      {type === 'review' && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Collez l'avis client ici</label>
          <textarea value={reviewText} onChange={(e) => setReviewText(e.target.value)} placeholder="Ex: Super boulangerie, les croissants sont excellents !" rows={3} className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20 resize-none" />
        </div>
      )}

      <button onClick={() => handleGenerate(false)} disabled={status === 'loading' || (type === 'review' && !reviewText.trim())} className="w-full rounded-xl bg-green-600 py-4 text-sm font-semibold text-white hover:bg-green-700 transition disabled:opacity-60 mb-6">
        {status === 'loading' ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
            </svg>
            Génération en cours...
          </span>
        ) : variants.length > 0 ? 'Régénérer' : 'Générer 3 variantes'}
      </button>

      {status === 'error' && (
        <div className="rounded-xl bg-red-50 border border-red-100 p-4 text-sm text-red-600 mb-4">
          Erreur. Vérifiez que votre profil commerce est configuré.
        </div>
      )}

      {variants.length > 0 && (
        <>
          <div className="space-y-4 mb-6">
            {variants.map((variant, i) => (
              <div key={i} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <p className="text-xs font-medium text-green-600 mb-2">Variante {i + 1}</p>
                <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap mb-4">{variant}</p>
                <div className="flex gap-2">
                  <button onClick={() => handleCopy(variant, i)} className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${copied === i ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                    {copied === i ? 'Copié !' : 'Copier'}
                  </button>
                  {type === 'google' && (
                    <button onClick={() => handlePublish(variant)} className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition">
                      Publier sur Google 📍
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Pas satisfait ? Affinez</p>
            <div className="flex gap-2">
              <input type="text" value={feedback} onChange={(e) => setFeedback(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && feedback.trim() && handleGenerate(true)} placeholder="Ex: plus court, ajoute une promo..." className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-green-500 focus:outline-none" />
              <button onClick={() => handleGenerate(true)} disabled={!feedback.trim() || status === 'loading'} className="rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 transition disabled:opacity-40">
                Affiner
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {['Plus court', 'Plus dynamique', 'Ajoute une promo', 'Ton plus sympa'].map((s) => (
                <button key={s} onClick={() => setFeedback(s)} className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-gray-600 hover:border-green-500 hover:text-green-600 transition">
                  {s}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {variants.length === 0 && status === 'idle' && (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
          <p className="text-gray-400 text-sm">
            {type === 'review' ? 'Collez un avis puis cliquez sur Générer' : 'Cliquez sur Générer pour créer vos posts'}
          </p>
        </div>
      )}
    </div>
  )
}

export default function GeneratePage() {
  return <Suspense><GenerateContent /></Suspense>
}