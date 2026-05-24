'use client'

import { useState } from 'react'

export default function LandingPage() {
  const [commerceName, setCommerceName] = useState('')
  const [city, setCity] = useState('')
  const [email, setEmail] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [waitlistStatus, setWaitlistStatus] = useState<'idle' | 'loading' | 'success'>('idle')

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault()
    setAnalyzing(true)
    setResult(null)
    try {
      const res = await fetch('/api/analyze-public', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commerce_name: commerceName, city }),
      })
      const data = await res.json()
      setResult(data)
    } catch {
      setResult({ error: true })
    } finally {
      setAnalyzing(false)
    }
  }

  const handleWaitlist = async (e: React.FormEvent) => {
    e.preventDefault()
    setWaitlistStatus('loading')
    try {
      await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, commerce_name: commerceName, city }),
      })
      setWaitlistStatus('success')
    } catch {
      setWaitlistStatus('success')
    }
  }

  const getScoreColor = (s: number) => {
    if (s >= 70) return 'text-green-600'
    if (s >= 40) return 'text-amber-500'
    return 'text-red-500'
  }

  const getScoreLabel = (s: number) => {
    if (s >= 70) return '✅ Bonne visibilité'
    if (s >= 40) return '⚠️ Visibilité moyenne — vous pouvez faire mieux'
    return '🚨 Faible visibilité — vos concurrents vous dépassent'
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-xl">🚀</span>
          <span className="font-bold text-gray-900">LocalBoost</span>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 border border-amber-200 px-4 py-1.5 text-sm font-medium text-amber-700">
          🎯 Lancement bientôt — Places limitées
        </div>
      </nav>

      {/* Hero */}
      <div className="max-w-4xl mx-auto px-6 py-20 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-green-50 border border-green-200 px-4 py-1.5 text-sm font-medium text-green-700 mb-6">
          🇫🇷 Spécialisé commerçants locaux français
        </div>
        <h1 className="text-5xl font-extrabold text-gray-900 mb-6 leading-tight">
          Quel est votre score de<br />
          <span className="text-green-600">visibilité Google ?</span>
        </h1>
        <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto">
          Analysez gratuitement votre fiche Google Business et découvrez pourquoi vos concurrents apparaissent avant vous.
        </p>

        {/* Formulaire analyse */}
        <form onSubmit={handleAnalyze} className="max-w-xl mx-auto">
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <input
              type="text"
              value={commerceName}
              onChange={(e) => setCommerceName(e.target.value)}
              placeholder="Nom de votre commerce"
              required
              className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
            />
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Ville"
              required
              className="w-32 rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
            />
          </div>
          <button
            type="submit"
            disabled={analyzing}
            className="w-full rounded-xl bg-green-600 py-4 text-base font-semibold text-white hover:bg-green-700 transition disabled:opacity-60"
          >
            {analyzing ? '🔍 Analyse en cours...' : '🔍 Analyser ma visibilité gratuitement'}
          </button>
        </form>

        {/* Résultat */}
        {result && !result.error && (
          <div className="mt-8 max-w-xl mx-auto rounded-2xl border-2 border-green-200 bg-green-50 p-6 text-left">
            <div className="flex items-end gap-3 mb-3">
              <span className={`text-6xl font-extrabold ${getScoreColor(result.score)}`}>{result.score}</span>
              <span className="text-gray-400 text-xl mb-2">/100</span>
            </div>
            <p className={`font-semibold mb-4 ${getScoreColor(result.score)}`}>{getScoreLabel(result.score)}</p>
            <div className="w-full bg-white rounded-full h-3 mb-4">
              <div
                className={`h-3 rounded-full transition-all ${result.score >= 70 ? 'bg-green-500' : result.score >= 40 ? 'bg-amber-500' : 'bg-red-500'}`}
                style={{ width: `${result.score}%` }}
              />
            </div>

            {result.competitors?.length > 0 && (
              <div className="mb-6">
                <p className="text-sm font-medium text-gray-700 mb-2">Vos concurrents sur Google Maps :</p>
                {result.competitors.slice(0, 3).map((c: any, i: number) => (
                  <div key={i} className="flex items-center justify-between text-sm py-1.5 border-b border-green-100 last:border-0">
                    <span className="text-gray-700">#{c.position} {c.name}</span>
                    <span className="text-gray-500">⭐ {c.rating} ({c.reviews} avis)</span>
                  </div>
                ))}
              </div>
            )}

            {waitlistStatus === 'success' ? (
              <div className="rounded-xl bg-green-600 p-4 text-center">
                <p className="text-white font-semibold">🎉 Vous êtes sur la liste !</p>
                <p className="text-green-100 text-sm mt-1">Vous serez parmi les premiers à accéder à LocalBoost.</p>
              </div>
            ) : (
              <form onSubmit={handleWaitlist} className="space-y-3">
                <p className="text-sm font-semibold text-gray-800">
                  {result.score < 70 ? '👇 Rejoignez la liste d\'attente pour améliorer votre score :' : '👇 Maintenez votre avance avec LocalBoost :'}
                </p>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  required
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:border-green-500 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={waitlistStatus === 'loading'}
                  className="w-full rounded-xl bg-gray-900 py-3 text-sm font-semibold text-white hover:bg-gray-800 transition disabled:opacity-60"
                >
                  {waitlistStatus === 'loading' ? 'Inscription...' : '🚀 Rejoindre la liste d\'attente — Gratuit'}
                </button>
                <p className="text-xs text-gray-400 text-center">Lancement dans moins de 15 jours. Places limitées.</p>
              </form>
            )}
          </div>
        )}

        {result?.error && (
          <div className="mt-6 rounded-xl bg-red-50 border border-red-100 p-4 text-sm text-red-600 max-w-xl mx-auto">
            Commerce non trouvé sur Google Maps. Vérifiez le nom et la ville.
          </div>
        )}
      </div>

      {/* Problème */}
      <div className="bg-gray-50 py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Vos concurrents apparaissent avant vous sur Google Maps
          </h2>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              { emoji: '😓', title: 'Vous manquez de temps', desc: 'Entre le four, les clients et la gestion — le marketing passe toujours après.' },
              { emoji: '😕', title: 'Vous ne savez pas quoi écrire', desc: 'Une page blanche chaque semaine. Résultat : votre fiche n\'est jamais à jour.' },
              { emoji: '📉', title: 'Vous perdez des clients', desc: 'Google favorise les fiches actives. Vos concurrents qui publient vous dépassent.' },
            ].map((item) => (
              <div key={item.title} className="bg-white rounded-2xl p-6 border border-gray-100">
                <div className="text-3xl mb-3">{item.emoji}</div>
                <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Solution */}
      <div className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">LocalBoost fait le travail à votre place</h2>
          <p className="text-gray-500 mb-12">Chaque semaine, automatiquement, sans que vous ayez à y penser.</p>
          <div className="grid sm:grid-cols-2 gap-6 text-left">
            {[
              { emoji: '📍', title: 'Post Google Business hebdomadaire', desc: 'L\'IA génère chaque semaine un post calibré pour votre commerce, votre ville et la saison.' },
              { emoji: '⭐', title: 'Réponses aux avis en 60 secondes', desc: 'Collez un avis, recevez 3 réponses personnalisées prêtes à publier.' },
              { emoji: '📊', title: 'Score de visibilité hebdomadaire', desc: 'Suivez votre progression sur Google Maps et battez vos concurrents semaine après semaine.' },
              { emoji: '📧', title: 'Email hebdomadaire automatique', desc: 'Chaque lundi matin, votre contenu de la semaine directement dans votre boîte mail.' },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-gray-100 p-6">
                <div className="text-2xl mb-3">{item.emoji}</div>
                <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="bg-gray-50 py-20 px-6">
        <div className="max-w-md mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Un seul plan. Simple.</h2>
          <p className="text-gray-500 mb-8">Lancement dans moins de 15 jours.</p>
          <div className="bg-white rounded-2xl border-2 border-green-500 p-8 shadow-sm">
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-medium text-amber-700 mb-4">
              🔥 Prix de lancement — Places limitées
            </div>
            <div className="flex items-baseline justify-center gap-1 mb-2">
              <span className="text-5xl font-extrabold text-gray-900">59€</span>
              <span className="text-gray-500">/mois</span>
            </div>
            <p className="text-sm text-gray-400 mb-6">après 7 jours gratuits</p>
            <ul className="space-y-3 mb-8 text-left">
              {[
                'Posts Google Business illimités',
                'Réponses aux avis illimitées',
                'Score de visibilité hebdomadaire',
                'Analyse de vos concurrents',
                'Email hebdo automatique',
                'Sans engagement',
              ].map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="text-green-500">✓</span>{f}
                </li>
              ))}
            </ul>
            <button
              onClick={() => document.getElementById('waitlist-bottom')?.scrollIntoView({ behavior: 'smooth' })}
              className="w-full rounded-xl bg-green-600 py-4 text-sm font-semibold text-white hover:bg-green-700 transition"
            >
              Rejoindre la liste d'attente
            </button>
          </div>
        </div>
      </div>

      {/* Waitlist finale */}
      <div id="waitlist-bottom" className="py-20 px-6 text-center">
        <div className="max-w-md mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Soyez parmi les premiers</h2>
          <p className="text-gray-500 mb-8">Lancement dans moins de 15 jours. Les premiers inscrits bénéficieront d'un accompagnement personnalisé.</p>
          {waitlistStatus === 'success' ? (
            <div className="rounded-2xl bg-green-50 border border-green-200 p-8">
              <p className="text-2xl mb-2">🎉</p>
              <p className="font-semibold text-green-800">Vous êtes sur la liste !</p>
              <p className="text-sm text-green-600 mt-1">On vous contacte dès le lancement.</p>
            </div>
          ) : (
            <form onSubmit={handleWaitlist} className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
                required
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
              />
              <button
                type="submit"
                disabled={waitlistStatus === 'loading'}
                className="w-full rounded-xl bg-green-600 py-4 text-sm font-semibold text-white hover:bg-green-700 transition disabled:opacity-60"
              >
                {waitlistStatus === 'loading' ? 'Inscription...' : '🚀 Rejoindre la liste d\'attente — Gratuit'}
              </button>
              <p className="text-xs text-gray-400">Pas de spam. Juste un email au lancement.</p>
            </form>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 px-6">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span>🚀</span>
            <span className="font-bold text-gray-900">LocalBoost</span>
          </div>
          <p className="text-sm text-gray-400">© 2025 LocalBoost</p>
        </div>
      </footer>
    </div>
  )
}