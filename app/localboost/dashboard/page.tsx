'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

function ScoreGauge({ score }: { score: number }) {
  const r = 52
  const circ = 2 * Math.PI * r
  const offset = circ - (score / 100) * circ
  const color = score >= 70 ? '#16a34a' : score >= 40 ? '#d97706' : '#dc2626'

  return (
    <svg width="130" height="130" viewBox="0 0 130 130">
      <circle cx="65" cy="65" r={r} fill="none" stroke="#f3f4f6" strokeWidth="12" />
      <circle
        cx="65" cy="65" r={r} fill="none"
        stroke={color} strokeWidth="12"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 65 65)"
        style={{ transition: 'stroke-dashoffset 0.8s ease' }}
      />
      <text x="65" y="60" textAnchor="middle" fontSize="26" fontWeight="700" fill="#111827">{score}</text>
      <text x="65" y="78" textAnchor="middle" fontSize="11" fill="#6b7280">/100</text>
    </svg>
  )
}

const FEATURES = [
  { href: '/localboost/avis',  icon: '⭐', title: 'Collecter des avis',  desc: 'Envoyez un email ou SMS après chaque prestation.', color: 'border-amber-200 bg-amber-50',  ctaColor: 'text-amber-700',  cta: 'Envoyer une demande →' },
  { href: '/localboost/audit', icon: '🔍', title: 'Audit de fiche',      desc: 'Vérifiez la complétude de votre fiche Google.',   color: 'border-blue-200 bg-blue-50',    ctaColor: 'text-blue-700',   cta: 'Lancer l\'audit →' },
  { href: '/localboost/nap',   icon: '🗂️', title: 'Cohérence NAP',       desc: 'Nom, adresse et téléphone identiques partout.',   color: 'border-green-200 bg-green-50',  ctaColor: 'text-green-700',  cta: 'Vérifier mes annuaires →' },
]

export default function LocalBoostDashboard() {
  const [profile, setProfile] = useState<any>(null)
  const [score, setScore]     = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/localboost/setup').then(r => r.json()).then(p => {
      setProfile(p?.google_place_id ? p : null)
      setLoading(false)
      if (p?.google_place_id) {
        fetch('/api/localboost/score').then(r => r.json()).then(setScore)
      }
    })
  }, [])

  if (loading) return <div className="text-center py-16 text-gray-400">Chargement...</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">LocalBoost</h1>
          <p className="text-sm text-gray-500 mt-0.5">Améliorez votre visibilité Google Maps</p>
        </div>
        {!profile && (
          <Link href="/localboost/setup" className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition">
            ⚙️ Configurer ma fiche
          </Link>
        )}
      </div>

      {!profile && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <span className="text-xl">⚠️</span>
          <div>
            <p className="font-semibold text-amber-800 text-sm">Configuration requise</p>
            <p className="text-sm text-amber-700 mt-0.5">
              Renseignez votre fiche Google Business pour activer toutes les fonctionnalités.{' '}
              <Link href="/localboost/setup" className="underline font-semibold">Configurer →</Link>
            </p>
          </div>
        </div>
      )}

      {profile && (
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          {/* Score de visibilité */}
          <div className="sm:col-span-1 bg-white rounded-2xl border border-gray-100 p-5 flex flex-col items-center justify-center">
            {score ? (
              <>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Score de visibilité</p>
                <ScoreGauge score={score.score} />
                <div className="mt-3 w-full space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Fiche Google</span>
                    <span className="font-semibold text-gray-700">{score.audit}/100</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${score.audit}%` }} />
                  </div>
                  <div className="flex justify-between text-xs mt-1">
                    <span className="text-gray-500">Avis collectés</span>
                    <span className="font-semibold text-gray-700">{score.avis}/100</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div className="bg-amber-400 h-1.5 rounded-full" style={{ width: `${score.avis}%` }} />
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-32">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="sm:col-span-2 grid grid-cols-2 gap-3">
            {[
              { label: 'Demandes d\'avis envoyées', value: score?.avisEnvoyes ?? '—', color: 'text-gray-900'  },
              { label: 'Avis Google obtenus',       value: score?.avisRecus   ?? '—', color: 'text-green-600' },
              { label: 'Score fiche Google',         value: score ? `${score.audit}%` : '—', color: 'text-blue-600'  },
              { label: 'Critères manquants',
                value: score
                  ? Object.values(score.details ?? {}).filter(v => !v).length
                  : '—',
                color: 'text-red-500' },
            ].map((k, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 text-center">
                <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
                <p className="text-xs text-gray-500 mt-1">{k.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid sm:grid-cols-3 gap-5">
        {FEATURES.map(f => (
          <Link
            key={f.href}
            href={profile ? f.href : '/localboost/setup'}
            className={`rounded-2xl border-2 p-6 flex flex-col gap-3 hover:shadow-md transition ${f.color} ${!profile ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            <div className="text-3xl">{f.icon}</div>
            <div>
              <h3 className="font-bold text-gray-900 mb-1">{f.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{f.desc}</p>
            </div>
            <span className={`text-sm font-semibold mt-auto ${f.ctaColor}`}>{f.cta}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
