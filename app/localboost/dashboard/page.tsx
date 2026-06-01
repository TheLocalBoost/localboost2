'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function LocalBoostDashboard() {
  const [profile, setProfile]   = useState<any>(null)
  const [stats, setStats]       = useState({ avis_envoyes: 0, avis_recus: 0 })
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/localboost/setup').then(r => r.json()),
      fetch('/api/localboost/avis').then(r => r.json()),
    ]).then(([p, avis]) => {
      setProfile(p?.google_place_id ? p : null)
      if (Array.isArray(avis)) {
        setStats({
          avis_envoyes: avis.length,
          avis_recus:   avis.filter((a: any) => a.status === 'done').length,
        })
      }
      setLoading(false)
    })
  }, [])

  const FEATURES = [
    {
      href:  '/localboost/avis',
      icon:  '⭐',
      title: 'Collecter des avis',
      desc:  'Envoyez un email automatique après chaque prestation pour demander un avis Google.',
      color: 'border-amber-200 bg-amber-50',
      cta:   'Envoyer une demande →',
      ctaColor: 'text-amber-700',
    },
    {
      href:  '/localboost/audit',
      icon:  '🔍',
      title: 'Audit de fiche',
      desc:  'Vérifiez la complétude de votre fiche Google et découvrez ce qui freine votre visibilité.',
      color: 'border-blue-200 bg-blue-50',
      cta:   'Lancer l\'audit →',
      ctaColor: 'text-blue-700',
    },
    {
      href:  '/localboost/nap',
      icon:  '🗂️',
      title: 'Cohérence NAP',
      desc:  'Vérifiez que votre nom, adresse et téléphone sont identiques sur tous les annuaires.',
      color: 'border-green-200 bg-green-50',
      cta:   'Vérifier mes annuaires →',
      ctaColor: 'text-green-700',
    },
  ]

  if (loading) return <div className="text-center py-16 text-gray-400">Chargement...</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">LocalBoost</h1>
          <p className="text-sm text-gray-500 mt-0.5">Améliorez votre visibilité Google Maps</p>
        </div>
        {!profile && (
          <Link
            href="/localboost/setup"
            className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition"
          >
            ⚙️ Configurer ma fiche
          </Link>
        )}
      </div>

      {/* Alerte setup manquant */}
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

      {/* Stats */}
      {profile && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            { label: 'Demandes d\'avis envoyées', value: stats.avis_envoyes, color: 'text-gray-900' },
            { label: 'Avis obtenus',              value: stats.avis_recus,   color: 'text-green-600' },
            { label: 'Taux de conversion',
              value: stats.avis_envoyes > 0
                ? `${Math.round((stats.avis_recus / stats.avis_envoyes) * 100)}%`
                : '—',
              color: 'text-blue-600' },
            { label: 'Fiche configurée', value: '✓', color: 'text-green-600' },
          ].map((k, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 text-center">
              <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
              <p className="text-xs text-gray-500 mt-1">{k.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Features */}
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
