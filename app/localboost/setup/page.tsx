'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

type Tone = 'professionnel' | 'chaleureux' | 'direct'

const TONES: { key: Tone; label: string; example: string }[] = [
  { key: 'professionnel', label: 'Professionnel', example: 'Madame, Monsieur... Cordialement' },
  { key: 'chaleureux',   label: 'Chaleureux',    example: 'Bonjour ! Merci beaucoup...' },
  { key: 'direct',       label: 'Direct',         example: 'Bonjour, voici votre devis.' },
]

function LocalBoostSetupInner() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const isWelcome    = searchParams.get('welcome') === '1'

  const [step, setStep]           = useState(isWelcome ? 1 : 2)
  const [profile, setProfile]     = useState<any>(null)
  const [search, setSearch]       = useState('')
  const [city, setCity]           = useState('')
  const [results, setResults]     = useState<any[]>([])
  const [selected, setSelected]   = useState<any>(null)
  const [searching, setSearching] = useState(false)
  const [saving, setSaving]       = useState(false)
  const [tone, setTone]           = useState<Tone>('chaleureux')
  const [description, setDescription] = useState('')
  const [generating, setGenerating]   = useState(false)
  const [copied, setCopied]           = useState(false)

  const totalSteps = isWelcome ? 4 : 3
  const stepNumber = isWelcome ? step : step - 1

  useEffect(() => {
    fetch('/api/localboost/setup').then(r => r.json()).then(d => {
      if (d?.google_place_id) {
        setProfile(d)
        if (!isWelcome) setStep(3) // pas de bienvenue → commence à l'étape tone
      }
    })
  }, [])

  async function searchBusiness() {
    if (!search || !city) return
    setSearching(true)
    setResults([])
    setSelected(null)
    const r = await fetch('/api/localboost/setup', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'search', query: `${search} ${city}` }),
    })
    const data = await r.json()
    setResults(data.results ?? [])
    setSearching(false)
  }

  async function savePlace(place: any) {
    setSaving(true)
    await fetch('/api/localboost/setup', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'save', place }),
    })
    setProfile(place)
    setSaving(false)
    setStep(3)
  }

  async function saveTone() {
    setSaving(true)
    await fetch('/api/localboost/setup', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update_tone', tone }),
    })
    setSaving(false)
    setStep(4)
  }

  async function generateDescription() {
    setGenerating(true)
    const res = await fetch('/api/localboost/ai-action', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priority: 'description' }),
    })
    const data = await res.json()
    setDescription(data.content ?? '')
    setGenerating(false)
  }

  function copyAndGo() {
    navigator.clipboard.writeText(description).catch(() => {})
    setCopied(true)
    window.open('https://business.google.com', '_blank')
  }

  const input = 'w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20'

  return (
    <div className="max-w-xl mx-auto py-8 px-4">

      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          {Array.from({ length: totalSteps }).map((_, i) => {
            const n = i + 1
            const active = n === stepNumber
            const done   = n < stepNumber
            return (
              <div key={i} className="flex items-center gap-2 flex-1">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0
                  ${done ? 'bg-green-500 text-white' : active ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                  {done ? '✓' : n}
                </div>
                {i < totalSteps - 1 && (
                  <div className={`h-1 flex-1 rounded ${done ? 'bg-green-400' : 'bg-gray-100'}`} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Étape 1 — Bienvenue */}
      {step === 1 && (
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-3xl mb-6">✓</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Bienvenue dans LocalBoost</h1>
          <p className="text-gray-500 text-sm mb-6 leading-relaxed">
            Votre accès est actif. Vous allez configurer votre compte en 3 étapes rapides.<br />
            Comptez environ 3 minutes.
          </p>
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-8 text-left">
            <p className="text-sm font-semibold text-green-800">Votre accès est actif !</p>
            <p className="text-xs text-green-700 mt-1">Toutes les fonctionnalités sont disponibles dès maintenant.</p>
          </div>
          <button
            onClick={() => setStep(2)}
            className="w-full rounded-xl bg-blue-600 py-4 text-sm font-bold text-white hover:bg-blue-700 transition"
          >
            Commencer →
          </button>
        </div>
      )}

      {/* Étape 2 — Établissement */}
      {step === 2 && (
        <div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Votre établissement Google</h1>
          <p className="text-gray-500 text-sm mb-6">
            LocalBoost analyse votre fiche Google en temps réel.
          </p>

          {profile ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-5">
              <p className="text-sm font-semibold text-green-800">✓ Fiche configurée</p>
              <p className="text-sm text-green-700 mt-1">{profile.business_name ?? profile.name}</p>
              <p className="text-xs text-green-600 mt-0.5">{profile.business_address ?? profile.formatted_address}</p>
              <div className="flex gap-3 mt-3">
                <button
                  onClick={() => setStep(3)}
                  className="rounded-lg bg-green-600 px-4 py-2 text-xs font-bold text-white hover:bg-green-700 transition"
                >
                  C'est bien mon établissement →
                </button>
                <button onClick={() => setProfile(null)} className="text-xs text-green-700 underline">
                  Ce n'est pas le bon → rechercher
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3 mb-5">
              <input value={search} onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && searchBusiness()}
                placeholder="Nom de votre commerce"
                className={input} />
              <input value={city} onChange={e => setCity(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && searchBusiness()}
                placeholder="Ville"
                className={input} />
              <button onClick={searchBusiness} disabled={searching || !search || !city}
                className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition">
                {searching ? 'Recherche...' : '🔍 Trouver mon établissement'}
              </button>
            </div>
          )}

          {results.length > 0 && !profile && (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-5 py-3 border-b border-gray-100">
                Sélectionnez votre établissement
              </p>
              {results.map(r => (
                <button key={r.place_id} onClick={() => savePlace(r)}
                  className="w-full text-left px-5 py-4 border-b border-gray-50 hover:bg-blue-50 transition">
                  <p className="font-semibold text-gray-900 text-sm">{r.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{r.formatted_address}</p>
                  {r.rating && <p className="text-xs text-amber-500 mt-0.5">★ {r.rating} ({r.user_ratings_total} avis)</p>}
                </button>
              ))}
            </div>
          )}

          {saving && <p className="text-center text-sm text-gray-400">Enregistrement...</p>}
        </div>
      )}

      {/* Étape 3 — Ton */}
      {step === 3 && (
        <div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Votre style de communication</h1>
          <p className="text-gray-500 text-sm mb-6">
            Comment souhaitez-vous vous adresser à vos clients ?
          </p>
          <div className="space-y-3 mb-6">
            {TONES.map(t => (
              <button
                key={t.key}
                onClick={() => setTone(t.key)}
                className={`w-full text-left rounded-xl border-2 p-4 transition
                  ${tone === t.key ? 'border-blue-500 bg-blue-50' : 'border-gray-100 bg-white hover:border-gray-200'}`}
              >
                <p className="text-sm font-bold text-gray-900">{t.label}</p>
                <p className="text-xs text-gray-500 mt-0.5 italic">{t.example}</p>
              </button>
            ))}
          </div>
          <button onClick={saveTone} disabled={saving}
            className="w-full rounded-xl bg-blue-600 py-4 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50 transition">
            {saving ? 'Enregistrement...' : 'Enregistrer mon style →'}
          </button>
        </div>
      )}

      {/* Étape 4 — Première génération IA */}
      {step === 4 && (
        <div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Votre première amélioration en 30 secondes</h1>
          <p className="text-gray-500 text-sm mb-6">
            On va générer votre nouvelle description Google maintenant.
          </p>

          {!description && (
            <button onClick={generateDescription} disabled={generating}
              className="w-full rounded-xl bg-blue-600 py-4 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60 transition mb-4 flex items-center justify-center gap-2">
              {generating ? (
                <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Génération en cours...</>
              ) : '✨ Générer ma description →'}
            </button>
          )}

          {description && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={8}
                  className="w-full bg-transparent text-sm text-gray-700 resize-none outline-none leading-relaxed"
                />
              </div>
              <button onClick={copyAndGo}
                className={`w-full rounded-xl py-3.5 text-sm font-bold transition
                  ${copied ? 'bg-green-500 text-white' : 'bg-gray-900 text-white hover:bg-gray-700'}`}>
                {copied ? '✓ Copié — Google Business ouvert !' : '📋 Copier et aller sur Google →'}
              </button>
            </div>
          )}

          <button onClick={() => router.push('/localboost/dashboard')}
            className="w-full mt-4 rounded-xl border border-gray-200 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">
            Voir mon dashboard →
          </button>
        </div>
      )}
    </div>
  )
}

export default function LocalBoostSetup() {
  return (
    <Suspense>
      <LocalBoostSetupInner />
    </Suspense>
  )
}
