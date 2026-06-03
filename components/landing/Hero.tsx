'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  detectedCity: string
  signupCount: number
  animScore: number
}

export default function Hero({ detectedCity, signupCount, animScore }: Props) {
  const router = useRouter()
  const [query, setQuery] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const q = query.trim()
    if (!q) return
    router.push(`/audit?q=${encodeURIComponent(q)}`)
  }

  return (
    <section className="pt-24 pb-16 px-6 bg-white">
      <div className="max-w-5xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">

          {/* Texte */}
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-red-50 border border-red-200 px-4 py-1.5 text-sm font-medium text-red-600 mb-6">
              ⚠️ Votre fiche Google perd des clients chaque semaine
            </div>

            <h1 className="text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight mb-5">
              Pendant que vous lisez ceci, vos concurrents captent{' '}
              <span className="text-blue-600">vos clients sur Google Maps.</span>
            </h1>

            <p className="text-lg text-gray-500 mb-4 leading-relaxed">
              LocalBoost détecte ce qui fait perdre des clients à votre fiche
              et génère chaque semaine le contenu pour remonter —{' '}
              <strong className="text-gray-800">sans effort de votre part.</strong>
            </p>

            <p className="text-sm text-gray-400 mb-8">
              Demandes d'avis automatiques · Réponses aux clients · Actions prioritaires chaque semaine
            </p>

            {/* Formulaire de recherche */}
            <form id="hero-search" onSubmit={handleSubmit} className="flex flex-col gap-3 mb-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder={detectedCity
                    ? `Ex: Plomberie Dubois, ${detectedCity}`
                    : 'Ex: Plomberie Martin, Lyon'}
                  className="flex-1 rounded-xl border border-gray-200 px-4 py-3.5 text-sm focus:border-blue-500 focus:outline-none bg-white shadow-sm"
                />
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-bold text-white hover:bg-blue-700 transition whitespace-nowrap"
                >
                  Voir mon score gratuit →
                </button>
              </div>
              <p className="text-xs text-gray-400">Aucune carte bancaire requise · Résultats en 60 secondes</p>
            </form>

            {signupCount > 0 && (
              <div className="flex items-center gap-3 text-sm text-gray-400 mt-3">
                <div className="flex -space-x-1.5">
                  {['🔧', '✂️', '🥖', '🍽️', '🎨'].map((e, i) => (
                    <div key={i} className="w-7 h-7 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-xs">
                      {e}
                    </div>
                  ))}
                </div>
                <span>Rejoint par {signupCount} artisans</span>
              </div>
            )}
          </div>

          {/* Visuel */}
          <div className="relative">
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
              <div className="bg-gray-100 px-4 py-3 flex items-center gap-2 border-b border-gray-200">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400"/>
                  <div className="w-3 h-3 rounded-full bg-amber-400"/>
                  <div className="w-3 h-3 rounded-full bg-green-400"/>
                </div>
                <div className="flex-1 bg-white rounded-lg px-3 py-1 text-xs text-gray-400">
                  plombier {detectedCity || 'Lyon'}
                </div>
              </div>

              <div className="p-4 space-y-2">
                <div className="rounded-xl border border-gray-100 p-3 bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-bold text-gray-900">Plomberie Martin</p>
                      <p className="text-xs text-amber-500 mt-0.5">★ 4.2 · 18 avis</p>
                      <p className="text-xs text-blue-600 mt-0.5">● Ouvert · Appeler</p>
                    </div>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">#1</span>
                  </div>
                </div>

                <div className="rounded-xl border border-gray-100 p-3 bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-bold text-gray-900">Chauffage & Co</p>
                      <p className="text-xs text-amber-500 mt-0.5">★ 3.9 · 7 avis</p>
                      <p className="text-xs text-gray-400 mt-0.5">Horaires non renseignés</p>
                    </div>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">#2</span>
                  </div>
                </div>

                <div className="rounded-xl border-2 border-red-200 p-3 bg-red-50/50 relative">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-bold text-red-700">Plomberie Dupont ← vous</p>
                      <p className="text-xs text-amber-500 mt-0.5">★ 4.8 · 31 avis</p>
                      <p className="text-xs text-gray-400 mt-0.5">Dernière publication : il y a 4 mois</p>
                    </div>
                    <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-semibold">#4</span>
                  </div>
                  <div className="mt-2 text-xs text-red-600 font-medium">
                    ↑ Mieux noté mais relégué — fiche inactive
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-3 -right-3 bg-blue-600 text-white text-xs font-bold px-3 py-2 rounded-xl shadow-lg">
              LocalBoost remonte votre fiche ↑
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
