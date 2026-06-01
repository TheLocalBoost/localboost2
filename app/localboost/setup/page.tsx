'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function LocalBoostSetup() {
  const router = useRouter()
  const [search, setSearch]     = useState('')
  const [city, setCity]         = useState('')
  const [results, setResults]   = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [searching, setSearching] = useState(false)
  const [saving, setSaving]     = useState(false)
  const [profile, setProfile]   = useState<any>(null)

  useEffect(() => {
    fetch('/api/localboost/setup').then(r => r.json()).then(d => {
      if (d?.google_place_id) setProfile(d)
    })
  }, [])

  async function searchBusiness() {
    if (!search || !city) return
    setSearching(true)
    setResults([])
    setSelected(null)
    const r = await fetch('/api/localboost/setup', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ action: 'search', query: `${search} ${city}` }),
    })
    const data = await r.json()
    setResults(data.results ?? [])
    setSearching(false)
  }

  async function save() {
    if (!selected) return
    setSaving(true)
    await fetch('/api/localboost/setup', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ action: 'save', place: selected }),
    })
    setSaving(false)
    router.push('/localboost/dashboard')
  }

  const input = 'w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20'

  return (
    <div className="max-w-xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <button onClick={() => router.push('/localboost/dashboard')} className="text-sm text-gray-400 hover:text-gray-600">
          ← Dashboard
        </button>
        <span className="text-gray-300">/</span>
        <span className="text-sm text-gray-600 font-medium">Configuration</span>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-2">Configurer votre fiche Google</h1>
      <p className="text-gray-500 text-sm mb-8">
        Trouvez votre établissement pour activer la collecte d'avis et l'audit de fiche.
      </p>

      {/* Fiche actuelle */}
      {profile && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
          <p className="text-sm font-semibold text-green-800 mb-1">✓ Fiche configurée</p>
          <p className="text-sm text-green-700">{profile.business_name}</p>
          <p className="text-xs text-green-600 mt-0.5">{profile.business_address}</p>
          <button
            onClick={() => setProfile(null)}
            className="text-xs text-green-700 underline mt-2"
          >
            Modifier
          </button>
        </div>
      )}

      {/* Recherche */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4 mb-5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Trouver mon établissement</p>
        <div className="flex gap-3">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && searchBusiness()}
            placeholder="Nom de votre commerce"
            className={`flex-1 ${input}`}
          />
          <input
            value={city}
            onChange={e => setCity(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && searchBusiness()}
            placeholder="Ville"
            className={`w-32 ${input}`}
          />
        </div>
        <button
          onClick={searchBusiness}
          disabled={searching || !search || !city}
          className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition"
        >
          {searching ? 'Recherche...' : '🔍 Trouver mon établissement'}
        </button>
      </div>

      {/* Résultats */}
      {results.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-5 py-3 border-b border-gray-100">
            Sélectionnez votre établissement
          </p>
          {results.map((r, i) => (
            <button
              key={r.place_id}
              onClick={() => setSelected(r)}
              className={`w-full text-left px-5 py-4 border-b border-gray-50 hover:bg-gray-50 transition ${selected?.place_id === r.place_id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}`}
            >
              <p className="font-semibold text-gray-900 text-sm">{r.name}</p>
              <p className="text-xs text-gray-500 mt-0.5">{r.formatted_address}</p>
              {r.rating && (
                <p className="text-xs text-amber-500 mt-0.5">★ {r.rating} ({r.user_ratings_total} avis)</p>
              )}
            </button>
          ))}
        </div>
      )}

      {results.length === 0 && !searching && search && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5 text-sm text-amber-800">
          Aucun résultat. Vérifiez l'orthographe exacte de votre fiche Google Maps.
        </div>
      )}

      {selected && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-5">
          <p className="text-sm font-semibold text-blue-800 mb-1">✓ Sélectionné : {selected.name}</p>
          <p className="text-xs text-blue-600">{selected.formatted_address}</p>
        </div>
      )}

      <button
        onClick={save}
        disabled={!selected || saving}
        className="w-full rounded-xl bg-blue-600 py-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition"
      >
        {saving ? 'Enregistrement...' : 'Enregistrer ma fiche →'}
      </button>
    </div>
  )
}
