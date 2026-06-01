'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const ANNUAIRES = [
  { name: 'Pages Jaunes',  url: (n: string, a: string) => `https://www.pagesjaunes.fr/search/sibling/pros?quoiqui=${encodeURIComponent(n)}&ou=${encodeURIComponent(a)}`, icon: '📒' },
  { name: 'Yelp',          url: (n: string, a: string) => `https://www.yelp.fr/search?find_desc=${encodeURIComponent(n)}&find_loc=${encodeURIComponent(a)}`, icon: '⭐' },
  { name: 'Tripadvisor',   url: (n: string, a: string) => `https://www.tripadvisor.fr/Search?q=${encodeURIComponent(n + ' ' + a)}`, icon: '🦉' },
  { name: 'Mappy',         url: (n: string, a: string) => `https://fr.mappy.com/search/${encodeURIComponent(n + ' ' + a)}`, icon: '🗺️' },
  { name: 'Kompass',       url: (n: string, a: string) => `https://fr.kompass.com/searchCompany?text=${encodeURIComponent(n)}`, icon: '🧭' },
  { name: 'Societe.com',   url: (n: string, a: string) => `https://www.societe.com/cgi-bin/search?champs=${encodeURIComponent(n)}`, icon: '🏢' },
]

export default function NapPage() {
  const [profile, setProfile]   = useState<any>(null)
  const [checked, setChecked]   = useState<Record<string, 'ok' | 'nok' | null>>({})
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    fetch('/api/localboost/setup').then(r => r.json()).then(d => {
      if (d?.google_place_id) setProfile(d)
      setLoading(false)
    })
  }, [])

  function toggle(name: string, val: 'ok' | 'nok') {
    setChecked(prev => ({ ...prev, [name]: prev[name] === val ? null : val }))
  }

  const nbOk  = Object.values(checked).filter(v => v === 'ok').length
  const nbNok = Object.values(checked).filter(v => v === 'nok').length

  if (loading) return <div className="text-center py-16 text-gray-400">Chargement...</div>

  if (!profile) {
    return (
      <div className="text-center py-16">
        <p className="text-4xl mb-4">⚙️</p>
        <p className="font-semibold text-gray-900 mb-2">Configurez votre fiche Google d'abord</p>
        <Link href="/localboost/setup" className="text-blue-600 underline text-sm">Configurer →</Link>
      </div>
    )
  }

  const businessName    = profile.business_name ?? ''
  const businessAddress = (profile.business_address ?? '').split(',')[1]?.trim() ?? profile.business_address ?? ''

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mes annuaires en ligne</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Vérifiez que votre nom, adresse et téléphone sont identiques sur tous les annuaires.
        </p>
      </div>

      {/* Référence Google */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 mb-6">
        <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-3">
          📍 Vos informations de référence (Google)
        </p>
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Nom</p>
            <p className="font-semibold text-gray-900 text-sm">{profile.business_name || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Adresse</p>
            <p className="font-semibold text-gray-900 text-sm">{profile.business_address || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Téléphone</p>
            <p className="font-semibold text-gray-900 text-sm">{profile.business_phone || '—'}</p>
          </div>
        </div>
        <p className="text-xs text-blue-600 mt-3">
          Ces informations doivent être <strong>identiques à la virgule près</strong> sur tous les annuaires ci-dessous.
        </p>
      </div>

      {/* Progression */}
      {(nbOk + nbNok) > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-4 mb-5 flex items-center gap-4">
          <div className="flex-1">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>{nbOk + nbNok} / {ANNUAIRES.length} vérifiés</span>
              <span className="text-green-600">{nbOk} cohérents · <span className="text-red-500">{nbNok} écarts</span></span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className="h-2 rounded-full bg-green-500 transition-all"
                style={{ width: `${((nbOk + nbNok) / ANNUAIRES.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Liste annuaires */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-6">
        <div className="px-5 py-3 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Annuaires à vérifier</h2>
          <p className="text-xs text-gray-400 mt-0.5">Cliquez sur le lien → vérifiez votre fiche → cochez le résultat</p>
        </div>
        <div className="divide-y divide-gray-50">
          {ANNUAIRES.map(a => {
            const status = checked[a.name]
            return (
              <div key={a.name} className={`px-5 py-4 flex items-center gap-4 ${status === 'nok' ? 'bg-red-50/30' : status === 'ok' ? 'bg-green-50/20' : ''}`}>
                <span className="text-xl shrink-0">{a.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm">{a.name}</p>
                  <a
                    href={a.url(businessName, businessAddress)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Ouvrir ma fiche {a.name} →
                  </a>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => toggle(a.name, 'ok')}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      status === 'ok'
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-green-100 hover:text-green-700'
                    }`}
                  >
                    ✓ Cohérent
                  </button>
                  <button
                    onClick={() => toggle(a.name, 'nok')}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      status === 'nok'
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-700'
                    }`}
                  >
                    ✗ Écart
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Conseils si écarts */}
      {nbNok > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5">
          <p className="font-semibold text-red-800 text-sm mb-2">
            ⚠️ {nbNok} écart{nbNok > 1 ? 's' : ''} détecté{nbNok > 1 ? 's' : ''}
          </p>
          <p className="text-sm text-red-700 mb-3">
            Les incohérences NAP envoient des signaux contradictoires à Google et pénalisent votre classement local.
            Corrigez chaque annuaire pour qu'il corresponde exactement à votre fiche Google.
          </p>
          <div className="bg-white rounded-lg p-3 text-xs text-gray-700 space-y-1">
            <p className="font-semibold mb-1">Ce qu'il faut harmoniser :</p>
            <p>• <strong>Nom :</strong> "{profile.business_name}"</p>
            <p>• <strong>Adresse :</strong> "{profile.business_address}"</p>
            {profile.business_phone && <p>• <strong>Téléphone :</strong> "{profile.business_phone}"</p>}
          </div>
        </div>
      )}

      {nbOk === ANNUAIRES.length && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
          <p className="font-semibold text-green-800">✓ Parfait — votre NAP est cohérent sur tous les annuaires !</p>
          <p className="text-sm text-green-700 mt-1">C'est un signal fort pour Google Maps. Vérifiez à nouveau dans 3 mois.</p>
        </div>
      )}
    </div>
  )
}
