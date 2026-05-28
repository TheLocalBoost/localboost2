'use client'

import { useState, useEffect } from 'react'

export default function LandingPage() {
  const [commerceName, setCommerceName] = useState('')
  const [city, setCity] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [loadingStep, setLoadingStep] = useState(0)
  const [result, setResult] = useState<any>(null)
  const [captureEmail, setCaptureEmail] = useState('')
  const [captureStatus, setCaptureStatus] = useState<'idle' | 'loading' | 'done'>('idle')

  const LOADING_STEPS = [
    'Analyse de votre fiche Google...',
    'Comparaison avec les fiches similaires...',
    'Calcul du score de visibilité...',
  ]

  // Cycle through loading steps while analyzing
  useEffect(() => {
    if (!analyzing) { setLoadingStep(0); return }
    const interval = setInterval(() => setLoadingStep(s => (s + 1) % LOADING_STEPS.length), 2000)
    return () => clearInterval(interval)
  }, [analyzing])

  // Pre-fill from email link (?nom=...&ville=...) and auto-run
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const nom   = params.get('nom')
    const ville = params.get('ville')
    if (nom)   setCommerceName(nom)
    if (ville) setCity(ville)
    if (nom && ville) {
      runAnalysis(nom, ville)
    }
  }, [])

  const runAnalysis = async (name: string, ville: string) => {
    setAnalyzing(true)
    setResult(null)
    try {
      const res = await fetch('/api/analyze-public', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commerce_name: name, city: ville }),
      })
      const data = await res.json()
      setResult(data)
      setTimeout(() => document.getElementById('score-result')?.scrollIntoView({ behavior: 'smooth' }), 100)
    } catch {
      setResult({ error: true })
    } finally {
      setAnalyzing(false)
    }
  }

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault()
    runAnalysis(commerceName, city)
  }

  const getScoreColor = (s: number) => {
    if (s >= 70) return 'text-green-600'
    if (s >= 40) return 'text-amber-500'
    return 'text-red-500'
  }

  const getScoreMessage = (s: number) => {
    if (s >= 70) return {
      label: '✅ Bonne visibilité',
      message: 'Votre fiche Google est active. Maintenez ce rythme pour rester visible.',
      color: 'border-green-200 bg-green-50',
    }
    if (s >= 40) return {
      label: '⚠️ Visibilité insuffisante',
      message: 'Votre fiche Google manque d\'activité. Vous perdez probablement des clients sans le savoir.',
      color: 'border-amber-200 bg-amber-50',
    }
    return {
      label: '🚨 Fiche Google inactive',
      message: 'Votre fiche Google n\'est pas optimisée. Des clients potentiels ne vous trouvent pas.',
      color: 'border-red-200 bg-red-50',
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <img src="/logo.png.png" alt="LocalBoost" className="h-8 w-auto" />
        </div>
        <div className="flex items-center gap-3">
          <a href="/login" className="text-sm text-gray-600 hover:text-gray-900">Se connecter</a>
          <a href="/signup" className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 transition">Essai gratuit →</a>
        </div>
      </nav>

      {/* Hero */}
      <div className="max-w-4xl mx-auto px-6 pt-20 pb-12 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-green-50 border border-green-200 px-4 py-1.5 text-sm font-medium text-green-700 mb-6">
          🇫🇷 Conçu pour les commerçants locaux français
        </div>
        <h1 className="text-5xl font-extrabold text-gray-900 mb-6 leading-tight">
          86% de vos nouveaux clients<br />
          <span className="text-green-600">vous cherchent sur Google.</span><br />
          Est-ce qu'ils vous trouvent ?
        </h1>
        <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto">
          Une fiche Google inactive vous fait perdre des clients chaque jour — sans que vous le sachiez.
        </p>
        <button
          onClick={() => document.getElementById('score-form')?.scrollIntoView({ behavior: 'smooth' })}
          className="rounded-xl bg-green-600 px-8 py-4 text-base font-semibold text-white hover:bg-green-700 transition"
        >
          Calculer mon score gratuit →
        </button>
      </div>

      {/* Statistiques */}
      <div className="bg-gray-50 py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { stat: '86%', desc: 'des consommateurs cherchent un commerce local sur Google avant de se déplacer', source: 'Google' },
              { stat: '7×', desc: 'plus de visites pour une fiche Google active vs une fiche inactive', source: 'Google My Business' },
              { stat: '+35%', desc: 'de clients potentiels supplémentaires avec une fiche optimisée et régulièrement mise à jour', source: 'BrightLocal 2024' },
            ].map((item) => (
              <div key={item.stat} className="bg-white rounded-2xl p-6 border border-gray-100 text-center shadow-sm">
                <div className="text-4xl font-extrabold text-green-600 mb-3">{item.stat}</div>
                <p className="text-sm text-gray-600 mb-2">{item.desc}</p>
                <p className="text-xs text-gray-400">Source : {item.source}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Score analyseur */}
      <div id="score-form" className="py-20 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Votre fiche Google vous fait-elle perdre des clients ?
          </h2>
          <p className="text-gray-500 mb-10">Entrez le nom de votre commerce — votre score apparaît en 30 secondes.</p>

          <form onSubmit={handleAnalyze} className="mb-8">
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
                className="w-36 rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
              />
            </div>
            <button
              type="submit"
              disabled={analyzing}
              className="w-full rounded-xl bg-green-600 py-4 text-base font-semibold text-white hover:bg-green-700 transition disabled:opacity-60"
            >
              {analyzing ? `🔍 ${LOADING_STEPS[loadingStep]}` : '🔍 Calculer mon score gratuitement'}
            </button>
          </form>

          {/* Résultat */}
          <div id="score-result">
            {result && !result.error && (() => {
              const { label, message, color } = getScoreMessage(result.score)
              const sector  = result.sector  || { label: 'Commerce local', average: 60 }
              const gaps    = result.gaps    || []
              const diff    = result.score - sector.average
              return (
                <div className={`rounded-2xl border-2 p-6 text-left ${color}`}>
                  {/* Score + benchmark */}
                  <div className="flex items-end justify-between mb-2">
                    <div className="flex items-end gap-3">
                      <span className={`text-7xl font-extrabold ${getScoreColor(result.score)}`}>{result.score}</span>
                      <span className="text-gray-400 text-2xl mb-3">/100</span>
                    </div>
                    <div className="text-right mb-3">
                      <p className="text-xs text-gray-400">Moyenne {sector.label}</p>
                      <p className="text-lg font-bold text-gray-500">{sector.average}/100</p>
                      <p className={`text-xs font-semibold ${diff >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {diff >= 0 ? `+${diff} pts au-dessus` : `${diff} pts en dessous`}
                      </p>
                    </div>
                  </div>

                  <p className={`font-semibold text-lg mb-2 ${getScoreColor(result.score)}`}>{label}</p>
                  <p className="text-sm text-gray-600 mb-4">{message}</p>

                  <div className="w-full bg-white rounded-full h-3 mb-5">
                    <div
                      className={`h-3 rounded-full transition-all ${result.score >= 70 ? 'bg-green-500' : result.score >= 40 ? 'bg-amber-500' : 'bg-red-500'}`}
                      style={{ width: `${result.score}%` }}
                    />
                  </div>

                  {/* Ce qui manque */}
                  {gaps.length > 0 && (
                    <div className="bg-white rounded-xl p-4 mb-5">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Ce qui pénalise votre fiche</p>
                      <ul className="space-y-2">
                        {gaps.map((gap: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                            <span className="text-red-400 mt-0.5 shrink-0">✗</span>
                            {gap}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <a
                    href="/signup"
                    className="block w-full rounded-xl bg-green-600 py-4 text-center text-sm font-semibold text-white hover:bg-green-700 transition"
                  >
                    Corriger ces problèmes automatiquement →
                  </a>
                  <p className="text-xs text-gray-400 text-center mt-2">7 jours gratuits · Sans engagement · Annulation en 1 clic</p>

                  {/* Capture email discrète */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    {captureStatus === 'done' ? (
                      <p className="text-xs text-green-600 text-center">✓ Rapport envoyé par email.</p>
                    ) : captureStatus === 'loading' ? (
                      <p className="text-xs text-gray-400 text-center">Envoi...</p>
                    ) : (
                      <form
                        onSubmit={async (e) => {
                          e.preventDefault()
                          setCaptureStatus('loading')
                          try {
                            await fetch('/api/waitlist', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ email: captureEmail, commerce_name: commerceName, city }),
                            })
                          } finally {
                            setCaptureStatus('done')
                          }
                        }}
                        className="flex gap-2"
                      >
                        <input
                          type="email"
                          value={captureEmail}
                          onChange={e => setCaptureEmail(e.target.value)}
                          placeholder="Recevoir une copie du rapport par email"
                          required
                          className="flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs focus:border-green-500 focus:outline-none"
                        />
                        <button type="submit" className="rounded-xl bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-200 transition">
                          Envoyer
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              )
            })()}

            {result?.error && (
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-5 text-left">
                <p className="font-semibold text-amber-800 mb-1">Impossible d'identifier votre établissement automatiquement.</p>
                <p className="text-sm text-amber-700 mb-3">Vérifiez que le nom correspond exactement à celui sur Google Maps, puis relancez l'analyse.</p>
                <button
                  onClick={() => { setResult(null); document.getElementById('score-form')?.scrollIntoView({ behavior: 'smooth' }) }}
                  className="text-sm font-semibold text-amber-800 underline"
                >
                  Modifier la recherche →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pourquoi les fiches perdent des clients */}
      <div className="bg-gray-50 py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">
            Pourquoi la plupart des commerçants perdent des clients sur Google
          </h2>
          <p className="text-gray-500 text-center mb-12">Pas par manque de qualité. Par manque de temps.</p>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              { emoji: '⏰', title: 'Pas le temps', desc: 'Entre le service, la gestion et les fournisseurs — Google Business passe toujours après. Et c\'est normal.' },
              { emoji: '💡', title: 'Plus d\'idées', desc: 'Quoi publier cette semaine ? La page blanche décourage. Résultat : la fiche reste silencieuse des mois.' },
              { emoji: '📉', title: 'Fiche qui s\'endort', desc: 'Google pénalise les fiches inactives. Moins vous publiez, moins vous apparaissez. Un cercle vicieux.' },
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
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">
            LocalBoost s'occupe de votre Google Business à votre place
          </h2>
          <p className="text-gray-500 text-center mb-12">Chaque semaine, automatiquement. Vous n'avez rien à faire.</p>
          <div className="grid sm:grid-cols-2 gap-6">
            {[
              { emoji: '📍', title: 'Publication hebdomadaire automatique', desc: 'Un post Google Business généré chaque semaine — adapté à votre commerce, votre ville et la saison. Vous copiez-collez en 30 secondes.' },
              { emoji: '⭐', title: 'Réponses aux avis prêtes à publier', desc: 'Collez un avis reçu. Recevez 3 réponses personnalisées. Choisissez celle qui vous convient. Publiez en un clic.' },
              { emoji: '📊', title: 'Score de visibilité hebdomadaire', desc: 'Suivez l\'évolution de votre fiche Google chaque semaine. Voyez votre progression en temps réel.' },
              { emoji: '📧', title: 'Tout dans votre boîte mail', desc: 'Chaque lundi matin, votre contenu de la semaine arrive directement dans votre email. Pas besoin d\'ouvrir une application.' },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-gray-100 p-6 flex gap-4">
                <div className="text-2xl shrink-0">{item.emoji}</div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Avant / Après */}
      <div className="bg-gray-50 py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Ce que ça change en 30 jours</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="rounded-2xl border-2 border-red-200 bg-white p-6">
              <p className="text-sm font-semibold text-red-500 mb-4">❌ Sans LocalBoost</p>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Dernière publication</span>
                  <span className="font-medium text-red-500">il y a 4 mois</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Avis sans réponse</span>
                  <span className="font-medium text-red-500">12 avis ignorés</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Score de visibilité</span>
                  <span className="font-medium text-red-500">34/100</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Clients perdus/mois</span>
                  <span className="font-medium text-red-500">estimé ~20</span>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border-2 border-green-400 bg-white p-6">
              <p className="text-sm font-semibold text-green-600 mb-4">✅ Avec LocalBoost — 30 jours</p>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Publications publiées</span>
                  <span className="font-medium text-green-600">4 posts publiés</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Avis avec réponse</span>
                  <span className="font-medium text-green-600">100% répondus</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Score de visibilité</span>
                  <span className="font-medium text-green-600">78/100</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Temps passé/semaine</span>
                  <span className="font-medium text-green-600">moins de 2 min</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="py-20 px-6">
        <div className="max-w-md mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Simple et transparent</h2>
          <p className="text-gray-500 mb-8">Moins de 2€ par jour pour garder votre fiche Google active et visible.</p>
          <div className="bg-white rounded-2xl border-2 border-green-500 p-8 shadow-sm">
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-medium text-amber-700 mb-4">
              🔥 Prix de lancement bêta
            </div>
            <div className="flex items-baseline justify-center gap-1 mb-1">
              <span className="text-5xl font-extrabold text-gray-900">59€</span>
              <span className="text-gray-500">/mois</span>
            </div>
            <p className="text-sm text-gray-400 mb-2">après 7 jours gratuits</p>
            <p className="text-xs text-green-600 font-medium mb-6">Un seul nouveau client couvre l'abonnement.</p>
            <ul className="space-y-3 mb-8 text-left">
              {[
                'Posts Google Business hebdomadaires',
                'Réponses aux avis illimitées',
                'Score de visibilité hebdomadaire',
                'Email hebdo automatique',
                'Sans engagement — résiliable en 1 clic',
              ].map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="text-green-500">✓</span>{f}
                </li>
              ))}
            </ul>
            <a
              href="/signup"
              className="block w-full rounded-xl bg-green-600 py-4 text-sm font-semibold text-white hover:bg-green-700 transition text-center"
            >
              Commencer 7 jours gratuits →
            </a>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="bg-gray-50 py-20 px-6">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Questions fréquentes</h2>
          <div className="space-y-4">
            {[
              {
                q: 'Est-ce que LocalBoost publie automatiquement sur Google ?',
                a: 'Non — Google Business ne permet pas la publication automatique. LocalBoost génère le contenu et vous l\'envoie chaque semaine. Vous publiez en 30 secondes avec un simple copier-coller.'
              },
              {
                q: 'Est-ce adapté à mon type de commerce ?',
                a: 'Oui. LocalBoost est conçu pour tous les commerçants locaux indépendants : boulangers, coiffeurs, restaurateurs, garagistes, fleuristes... Le contenu est personnalisé selon votre activité.'
              },
              {
                q: 'Comment annuler ?',
                a: 'En un clic depuis votre espace client. Aucun engagement, aucun frais d\'annulation. Vous restez abonné jusqu\'à la fin de la période en cours.'
              },
            ].map((item) => (
              <div key={item.q} className="bg-white rounded-2xl border border-gray-100 p-6">
                <h3 className="font-semibold text-gray-900 mb-2">{item.q}</h3>
                <p className="text-sm text-gray-500">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA finale */}
      <div className="py-20 px-6 text-center">
        <div className="max-w-md mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Prêt à être plus visible sur Google ?</h2>
          <p className="text-gray-500 mb-8">7 jours gratuits, sans engagement. Résiliable en un clic.</p>
          <a
            href="/signup"
            className="block w-full rounded-xl bg-green-600 py-4 text-sm font-semibold text-white hover:bg-green-700 transition"
          >
            Commencer gratuitement →
          </a>
          <p className="text-xs text-gray-400 mt-3">Carte requise. Aucun débit pendant l'essai.</p>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 px-6">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span>🚀</span>
            <span className="font-bold text-gray-900">LocalBoost</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="/mentions-legales" className="text-sm text-gray-400 hover:text-gray-600">Mentions légales</a>
            <a href="/cgv" className="text-sm text-gray-400 hover:text-gray-600">CGV</a>
            <a href="mailto:contact@thelocalboost.fr" className="text-sm text-gray-400 hover:text-gray-600">Contact</a>
          </div>
          <p className="text-sm text-gray-400">© 2026 TheLocalBoost — SIREN 105 578 884</p>
        </div>
      </footer>
    </div>
  )
}