'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function AuditPage() {
  const [audit, setAudit]   = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState('')

  useEffect(() => {
    fetch('/api/localboost/audit')
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error)
        else setAudit(d)
        setLoading(false)
      })
  }, [])

  const impactColor = (i: string) =>
    i === 'élevé' ? 'text-red-500 bg-red-50' : 'text-amber-600 bg-amber-50'

  const scoreColor = (s: number) =>
    s >= 80 ? 'text-green-600' : s >= 50 ? 'text-amber-500' : 'text-red-500'

  if (loading) return <div className="text-center py-16 text-gray-400">Analyse de votre fiche...</div>

  if (error === 'Fiche Google non configurée') {
    return (
      <div className="text-center py-16">
        <p className="text-4xl mb-4">⚙️</p>
        <p className="font-semibold text-gray-900 mb-2">Configurez votre fiche Google d'abord</p>
        <Link href="/localboost/setup" className="text-blue-600 underline text-sm">Configurer →</Link>
      </div>
    )
  }

  if (!audit) return null

  const { place, score, checklist, missing } = audit

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit de fiche Google</h1>
          <p className="text-sm text-gray-500 mt-0.5">{place.name}</p>
        </div>
        <button
          onClick={() => { setLoading(true); fetch('/api/localboost/audit').then(r => r.json()).then(d => { setAudit(d); setLoading(false) }) }}
          className="rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition"
        >
          ↻ Rafraîchir
        </button>
      </div>

      <div className="grid sm:grid-cols-3 gap-5 mb-8">
        {/* Score global */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Score de complétude</p>
          <p className={`text-6xl font-extrabold ${scoreColor(score)}`}>{score}</p>
          <p className="text-gray-400 text-lg">/100</p>
          <div className="w-full bg-gray-100 rounded-full h-2 mt-3">
            <div
              className={`h-2 rounded-full ${score >= 80 ? 'bg-green-500' : score >= 50 ? 'bg-amber-400' : 'bg-red-500'}`}
              style={{ width: `${score}%` }}
            />
          </div>
        </div>

        {/* Infos fiche */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-2.5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Votre fiche</p>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Note</span>
            <span className="font-semibold">{place.rating ? `★ ${place.rating}/5` : '—'}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Avis</span>
            <span className={`font-semibold ${(place.reviews ?? 0) >= 20 ? 'text-green-600' : 'text-amber-500'}`}>
              {place.reviews ?? 0} avis
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Photos</span>
            <span className={`font-semibold ${(place.photos ?? 0) >= 5 ? 'text-green-600' : 'text-red-500'}`}>
              {place.photos ?? 0} photos
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Téléphone</span>
            <span className={`font-semibold ${place.phone ? 'text-green-600' : 'text-red-500'}`}>
              {place.phone ?? '✗ manquant'}
            </span>
          </div>
        </div>

        {/* Points manquants */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Points à corriger</p>
          {missing.length === 0 ? (
            <p className="text-sm text-green-600 font-semibold">✓ Fiche complète !</p>
          ) : (
            <ul className="space-y-1.5">
              {missing.slice(0, 4).map((m: any) => (
                <li key={m.id} className="flex items-center gap-2 text-sm">
                  <span className="text-red-400 shrink-0">✗</span>
                  <span className="text-gray-700">{m.label}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium shrink-0 ${impactColor(m.impact)}`}>
                    {m.impact}
                  </span>
                </li>
              ))}
              {missing.length > 4 && (
                <li className="text-xs text-gray-400">+{missing.length - 4} autres points</li>
              )}
            </ul>
          )}
        </div>
      </div>

      {/* Checklist complète */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-6">
        <div className="px-5 py-3 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900 text-sm">Checklist complète</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {checklist.map((item: any) => (
            <div key={item.id} className={`px-5 py-3.5 flex items-start gap-3 ${item.ok ? '' : 'bg-red-50/30'}`}>
              <span className={`text-lg shrink-0 mt-0.5 ${item.ok ? 'text-green-500' : 'text-red-400'}`}>
                {item.ok ? '✓' : '✗'}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className={`text-sm font-medium ${item.ok ? 'text-gray-700' : 'text-gray-900'}`}>{item.label}</p>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${impactColor(item.impact)}`}>
                    impact {item.impact}
                  </span>
                </div>
                {!item.ok && (
                  <p className="text-xs text-gray-500 mt-1">{item.action}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Horaires */}
      {place.hours?.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Horaires sur Google</p>
          <ul className="space-y-1">
            {place.hours.map((h: string, i: number) => (
              <li key={i} className="text-sm text-gray-600">{h}</li>
            ))}
          </ul>
        </div>
      )}

      {/* CTA si points manquants */}
      {missing.length > 0 && (
        <div className="mt-5 bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
          <p className="text-sm text-blue-800">
            <strong>{missing.length} point{missing.length > 1 ? 's' : ''} à corriger</strong> — chaque amélioration booste votre classement Google.
          </p>
          <Link
            href="/localboost/avis"
            className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition whitespace-nowrap ml-4"
          >
            Collecter des avis →
          </Link>
        </div>
      )}
    </div>
  )
}
