'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function PhotosPage() {
  const [data, setData]       = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [checked, setChecked] = useState<Record<string, boolean>>({})

  useEffect(() => {
    fetch('/api/localboost/photos')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
  }, [])

  function toggle(id: string) {
    setChecked(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const nbChecked = Object.values(checked).filter(Boolean).length

  if (loading) return <div className="text-center py-16 text-gray-400">Analyse de vos photos...</div>

  if (data?.error === 'Fiche Google non configurée') {
    return (
      <div className="text-center py-16">
        <p className="text-4xl mb-4">⚙️</p>
        <p className="font-semibold text-gray-900 mb-2">Configurez votre fiche Google d'abord</p>
        <Link href="/localboost/setup" className="text-blue-600 underline text-sm">Configurer →</Link>
      </div>
    )
  }

  if (!data) return null

  const scoreColor = (s: number) =>
    s >= 75 ? 'text-green-600' : s >= 40 ? 'text-amber-500' : 'text-red-500'

  const barColor = (s: number) =>
    s >= 75 ? 'bg-green-500' : s >= 40 ? 'bg-amber-400' : 'bg-red-500'

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des photos</h1>
          <p className="text-sm text-gray-500 mt-0.5">{data.businessName}</p>
        </div>
        <a
          href={`https://business.google.com/`}
          target="_blank"
          rel="noreferrer"
          className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition"
        >
          📸 Ajouter des photos →
        </a>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        {/* Score photos */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 text-center">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Score photos</p>
          <p className={`text-5xl font-extrabold ${scoreColor(data.scorePhotos)}`}>{data.scorePhotos}</p>
          <p className="text-gray-400">/100</p>
          <div className="w-full bg-gray-100 rounded-full h-2 mt-3">
            <div
              className={`h-2 rounded-full transition-all ${barColor(data.scorePhotos)}`}
              style={{ width: `${data.scorePhotos}%` }}
            />
          </div>
        </div>

        {/* Nombre actuel */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 text-center">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Photos sur votre fiche</p>
          <p className={`text-5xl font-extrabold ${data.photoCount >= 10 ? 'text-green-600' : data.photoCount >= 5 ? 'text-amber-500' : 'text-red-500'}`}>
            {data.photoCount}
          </p>
          <p className="text-xs text-gray-400 mt-2">
            {data.photoCount < 5 ? 'Objectif : 10 photos minimum' : data.photoCount < 10 ? 'Presque — visez 10+' : '✓ Très bien'}
          </p>
        </div>

        {/* Conseil */}
        <div className={`rounded-2xl border-2 p-5 flex flex-col justify-center ${
          data.photoCount >= 10 ? 'bg-green-50 border-green-200' :
          data.photoCount >= 5  ? 'bg-amber-50 border-amber-200' :
          'bg-red-50 border-red-200'
        }`}>
          <p className="text-sm font-semibold text-gray-800 leading-relaxed">{data.conseil}</p>
          <p className="text-xs text-gray-500 mt-2">
            Source : Google Business Profile
          </p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-5">

        {/* Checklist catégories */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 text-sm">Catégories à couvrir</h2>
            <span className="text-xs text-gray-400">{nbChecked}/{data.categories.length} faites</span>
          </div>
          <div className="divide-y divide-gray-50">
            {data.categories.map((cat: any) => (
              <label
                key={cat.id}
                className={`flex items-start gap-3 px-5 py-3.5 cursor-pointer hover:bg-gray-50 transition ${checked[cat.id] ? 'bg-green-50/30' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={!!checked[cat.id]}
                  onChange={() => toggle(cat.id)}
                  className="mt-0.5 accent-blue-600"
                />
                <div>
                  <p className={`text-sm font-medium ${checked[cat.id] ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                    {cat.label}
                    {cat.required && <span className="ml-1.5 text-xs text-red-400">requis</span>}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{cat.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Suggestions IA */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 text-sm">Idées de photos pour votre activité</h2>
            <p className="text-xs text-gray-400 mt-0.5">Générées par IA pour {data.sector}</p>
          </div>
          <div className="divide-y divide-gray-50">
            {data.suggestions.map((s: string, i: number) => (
              <div key={i} className="px-5 py-3.5 flex items-start gap-3">
                <span className="text-blue-500 font-bold text-sm shrink-0 mt-0.5">{i + 1}.</span>
                <p className="text-sm text-gray-700">{s}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Guide upload */}
      <div className="mt-5 bg-blue-50 border border-blue-200 rounded-2xl p-5">
        <p className="font-semibold text-blue-800 text-sm mb-3">📸 Comment ajouter vos photos sur Google Business</p>
        <ol className="space-y-2 text-sm text-blue-700">
          <li className="flex items-start gap-2">
            <span className="font-bold shrink-0">1.</span>
            Allez sur <a href="https://business.google.com" target="_blank" rel="noreferrer" className="underline font-medium">business.google.com</a> et connectez-vous avec votre compte Google
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold shrink-0">2.</span>
            Sélectionnez votre établissement → cliquez sur <strong>"Photos"</strong> dans le menu gauche
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold shrink-0">3.</span>
            Cliquez <strong>"Ajouter des photos"</strong> → choisissez la catégorie → importez vos fichiers
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold shrink-0">4.</span>
            Conseils : photos en <strong>JPG/PNG, min 720×720 px</strong>, lumière naturelle, pas de logo en watermark
          </li>
        </ol>
        <p className="text-xs text-blue-600 mt-3">
          ⏱️ Google indexe les nouvelles photos sous 24–48h. Visez 2–3 nouvelles photos par mois.
        </p>
      </div>
    </div>
  )
}
