'use client'
import { useState, useEffect, useCallback } from 'react'

interface Props {
  score: number
  establishmentName: string
  city: string
  category: string
  emailCaptured: boolean
  onCapture: (email: string) => void
}

const SESSION_KEY = 'lb_exit_intent_shown'
const MIN_TIME_MS = 15_000 // 15s minimum avant déclenchement

export default function ExitIntentModal({ score, establishmentName, city, category, emailCaptured, onCapture }: Props) {
  const [visible, setVisible]     = useState(false)
  const [email, setEmail]         = useState('')
  const [loading, setLoading]     = useState(false)
  const [sent, setSent]           = useState(false)
  const [mountTime]               = useState(() => Date.now())

  const canTrigger = useCallback(() => {
    if (emailCaptured) return false
    if (sessionStorage.getItem(SESSION_KEY)) return false
    if (Date.now() - mountTime < MIN_TIME_MS) return false
    return true
  }, [emailCaptured, mountTime])

  const trigger = useCallback(() => {
    if (!canTrigger()) return
    sessionStorage.setItem(SESSION_KEY, '1')
    setVisible(true)
  }, [canTrigger])

  useEffect(() => {
    // Desktop: souris qui sort par le haut
    const onMouseLeave = (e: MouseEvent) => {
      if (e.clientY < 10) trigger()
    }

    // Mobile: page masquée (changement d'onglet / fermeture)
    const onVisibilityChange = () => {
      if (document.hidden) trigger()
    }

    // Mobile: scroll rapide vers le haut
    let lastScrollY = window.scrollY
    let lastScrollTime = Date.now()
    const onScroll = () => {
      const now = window.scrollY
      const elapsed = Date.now() - lastScrollTime
      if (lastScrollY - now > 100 && elapsed < 300) trigger()
      lastScrollY = now
      lastScrollTime = Date.now()
    }

    document.addEventListener('mouseleave', onMouseLeave)
    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      document.removeEventListener('mouseleave', onMouseLeave)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('scroll', onScroll)
    }
  }, [trigger])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.includes('@')) return
    setLoading(true)
    try {
      await fetch('/api/leads', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, establishmentName, score, city, category }),
      })
      setSent(true)
      onCapture(email)
      setTimeout(() => setVisible(false), 2000)
    } catch {
      setVisible(false)
    } finally {
      setLoading(false)
    }
  }

  if (!visible) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.55)' }}
      onClick={e => { if (e.target === e.currentTarget) setVisible(false) }}
    >
      <div className="relative bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
        {/* Fermer */}
        <button
          onClick={() => setVisible(false)}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-xl leading-none"
          aria-label="Fermer"
        >×</button>

        {/* Icône warning */}
        <div className="flex justify-center mb-4">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
            <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
              stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <h2 className="text-lg font-bold text-gray-900 text-center mb-2">
          Votre rapport va disparaître
        </h2>
        <p className="text-sm text-gray-500 text-center mb-5">
          Votre score de <strong>{score}/100</strong> ne sera pas sauvegardé.
          Laissez votre email pour le retrouver quand vous voulez.
        </p>

        {sent ? (
          <p className="text-center text-sm font-semibold text-green-600 py-4">
            ✓ Rapport sauvegardé ! Vérifiez votre boîte mail.
          </p>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="votre@email.fr"
                required
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-blue-600 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60 transition"
              >
                {loading ? '...' : 'Sauvegarder mon rapport →'}
              </button>
            </form>
            <button
              onClick={() => setVisible(false)}
              className="w-full mt-3 text-xs text-gray-400 hover:text-gray-600 transition"
            >
              Non merci, je préfère perdre mon rapport
            </button>
          </>
        )}
      </div>
    </div>
  )
}
