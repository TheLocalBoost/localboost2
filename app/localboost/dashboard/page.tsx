'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const SCORE_CACHE_KEY = 'lb_score_cache'
const SCORE_CACHE_TTL = 24 * 60 * 60 * 1000 // 24h

const PRIORITY_MAP: Record<string, { label: string; why: string; href: string; external?: boolean; icon: string }> = {
  telephone:   { icon: '📞', label: 'Ajoutez votre numéro de téléphone',       why: 'Les clients appellent directement depuis Google — sans numéro, ils appellent un concurrent.',    href: 'https://business.google.com', external: true },
  horaires:    { icon: '🕐', label: 'Renseignez vos horaires d\'ouverture',    why: 'Un client qui ne sait pas si vous êtes ouvert ira chez quelqu\'un d\'autre.',                     href: 'https://business.google.com', external: true },
  description: { icon: '✍️', label: 'Écrivez une description de votre activité', why: 'Google comprend mal votre métier — il vous positionne moins bien que vos concurrents.',        href: 'https://business.google.com', external: true },
  site:        { icon: '🌐', label: 'Ajoutez votre site web',                   why: 'Les clients font davantage confiance à une fiche avec un site, même une simple page.',           href: 'https://business.google.com', external: true },
  photos:      { icon: '📸', label: 'Ajoutez des photos de votre activité',    why: 'Les fiches avec 10+ photos reçoivent 35% de clics en plus. C\'est l\'action la plus rapide.',   href: '/localboost/photos' },
  avis20:      { icon: '⭐', label: 'Demandez des avis à vos clients',          why: 'Les fiches avec 20+ avis reçoivent 3× plus d\'appels. Envoyez un email ou SMS après chaque prestation.', href: '/localboost/avis' },
  note4:       { icon: '💬', label: 'Répondez à vos avis sans réponse',        why: 'Une note ≥ 4.0 double le taux de clic. Répondre aux avis négatifs améliore votre note perçue.', href: '/localboost/avis' },
}

function ScoreGauge({ score }: { score: number }) {
  const r = 48
  const circ = 2 * Math.PI * r
  const offset = circ - (score / 100) * circ
  const color = score >= 70 ? '#16a34a' : score >= 40 ? '#d97706' : '#dc2626'
  return (
    <svg width="120" height="120" viewBox="0 0 120 120">
      <circle cx="60" cy="60" r={r} fill="none" stroke="#f3f4f6" strokeWidth="10" />
      <circle cx="60" cy="60" r={r} fill="none" stroke={color} strokeWidth="10"
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        transform="rotate(-90 60 60)" style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
      <text x="60" y="55" textAnchor="middle" fontSize="24" fontWeight="700" fill="#111827">{score}</text>
      <text x="60" y="72" textAnchor="middle" fontSize="10" fill="#6b7280">/100</text>
    </svg>
  )
}

function getPriorities(details: Record<string, boolean>): string[] {
  const order = ['avis20', 'photos', 'horaires', 'telephone', 'description', 'site', 'note4']
  return order.filter(k => details[k] === false).slice(0, 3)
}

async function fetchScore() {
  const cached = localStorage.getItem(SCORE_CACHE_KEY)
  if (cached) {
    const { data, ts } = JSON.parse(cached)
    if (Date.now() - ts < SCORE_CACHE_TTL) return data
  }
  const data = await fetch('/api/localboost/score').then(r => r.json())
  localStorage.setItem(SCORE_CACHE_KEY, JSON.stringify({ data, ts: Date.now() }))
  return data
}

export default function LocalBoostDashboard() {
  const [profile, setProfile]     = useState<any>(null)
  const [score, setScore]         = useState<any>(null)
  const [priorities, setPriorities] = useState<string[]>([])
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    fetch('/api/localboost/setup').then(r => r.json()).then(p => {
      setProfile(p?.google_place_id ? p : null)
      setLoading(false)
      if (p?.google_place_id) {
        fetchScore().then(s => {
          setScore(s)
          if (s?.details) setPriorities(getPriorities(s.details))
        })
      }
    })
  }, [])

  if (loading) return <div className="text-center py-16 text-gray-400">Chargement...</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {profile ? `${profile.business_name}` : 'Bienvenue sur LocalBoost'}
          </p>
        </div>
        {!profile && (
          <Link href="/localboost/setup" className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition">
            ⚙️ Configurer ma fiche
          </Link>
        )}
      </div>

      {!profile && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6 flex items-start gap-3">
          <span className="text-2xl">⚙️</span>
          <div>
            <p className="font-semibold text-amber-800 mb-1">Commencez par chercher votre entreprise</p>
            <p className="text-sm text-amber-700">
              Entrez le nom de votre commerce pour que LocalBoost analyse votre présence Google et vous montre quoi améliorer.
            </p>
            <Link href="/localboost/setup" className="inline-block mt-3 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 transition">
              Trouver mon entreprise →
            </Link>
          </div>
        </div>
      )}

      {profile && (
        <div className="grid sm:grid-cols-3 gap-5 mb-8">
          {/* Score */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col items-center justify-center">
            {score ? (
              <>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Ma visibilité Google</p>
                <ScoreGauge score={score.score} />
                <div className="mt-3 w-full space-y-2">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-500">Fiche Google</span>
                      <span className="font-semibold text-gray-700">{score.audit}/100</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div className="bg-blue-500 h-1.5 rounded-full transition-all" style={{ width: `${score.audit}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-500">Avis collectés</span>
                      <span className="font-semibold text-gray-700">{score.avis}/100</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div className="bg-amber-400 h-1.5 rounded-full transition-all" style={{ width: `${score.avis}%` }} />
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-32">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>

          {/* Priorités */}
          <div className="sm:col-span-2 bg-white rounded-2xl border border-gray-100 p-5">
            <p className="text-sm font-bold text-gray-900 mb-4">
              {priorities.length > 0 ? '🎯 Vos priorités cette semaine' : '✅ Votre fiche est bien optimisée'}
            </p>

            {priorities.length === 0 && score && (
              <div className="text-center py-6">
                <p className="text-3xl mb-2">🏆</p>
                <p className="text-sm text-gray-600">Tous les critères essentiels sont remplis.</p>
                <p className="text-sm text-gray-500 mt-1">Continuez à collecter des avis pour maintenir votre avance.</p>
                <Link href="/localboost/avis" className="inline-block mt-3 text-sm font-semibold text-blue-600 hover:underline">
                  Envoyer des demandes d'avis →
                </Link>
              </div>
            )}

            {!score && (
              <div className="space-y-3">
                {[1,2,3].map(i => (
                  <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
                ))}
              </div>
            )}

            {priorities.length > 0 && (
              <div className="space-y-3">
                {priorities.map((key, i) => {
                  const p = PRIORITY_MAP[key]
                  if (!p) return null
                  return (
                    <div key={key} className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition">
                      <div className="shrink-0 w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-base">
                        {p.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-bold text-blue-600">Priorité {i + 1}</span>
                        </div>
                        <p className="text-sm font-semibold text-gray-900 leading-snug">{p.label}</p>
                        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{p.why}</p>
                      </div>
                      {p.external ? (
                        <a href={p.href} target="_blank" rel="noopener noreferrer"
                          className="shrink-0 text-xs font-semibold text-blue-600 hover:underline whitespace-nowrap">
                          Ouvrir →
                        </a>
                      ) : (
                        <Link href={p.href} className="shrink-0 text-xs font-semibold text-blue-600 hover:underline whitespace-nowrap">
                          Voir →
                        </Link>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Stats rapides */}
      {profile && score && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Demandes d\'avis envoyées', value: score.avisEnvoyes ?? 0, color: 'text-gray-900', href: '/localboost/avis' },
            { label: 'Avis Google obtenus',        value: score.avisRecus ?? 0,    color: 'text-green-600', href: '/localboost/avis' },
            { label: 'Critères manquants',          value: Object.values(score.details ?? {}).filter(v => !v).length, color: 'text-red-500', href: '/localboost/audit' },
            { label: 'Score fiche Google',          value: `${score.audit}%`,      color: 'text-blue-600', href: '/localboost/audit' },
          ].map((k, i) => (
            <Link key={i} href={k.href} className="bg-white rounded-xl border border-gray-100 p-4 text-center hover:border-blue-200 transition">
              <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
              <p className="text-xs text-gray-500 mt-1">{k.label}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
