'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  detectedCity: string
  signupCount: number
  animScore: number
}

export default function Hero({ detectedCity, signupCount }: Props) {
  const router = useRouter()
  const [nom, setNom]     = useState('')
  const [ville, setVille] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nom.trim() || !ville.trim()) return
    router.push(`/analyser?nom=${encodeURIComponent(nom.trim())}&ville=${encodeURIComponent(ville.trim())}`)
  }

  return (
    <section className="pt-24 pb-16 px-4 sm:px-6 bg-white">
      <div className="max-w-4xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">

          {/* Texte */}
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-green-50 border border-green-200 px-4 py-1.5 text-xs font-semibold text-green-700 mb-6">
              Ce que les agences facturent 300€ — livré en 48h pour 39€
            </div>

            <h1 className="text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight mb-4">
              Votre fiche Google<br />
              <span className="text-green-600">laisse partir des clients.</span>
            </h1>

            <p className="text-lg text-gray-500 mb-8 leading-relaxed">
              On identifie ce qui bloque votre visibilité et on prépare les corrections.{' '}
              <strong className="text-gray-800">Gratuit. Sans inscription.</strong>
            </p>

            <form id="hero-search" onSubmit={handleSubmit} className="flex flex-col gap-3 mb-5">
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={nom}
                  onChange={e => setNom(e.target.value)}
                  placeholder="Nom de votre commerce"
                  required
                  className="flex-1 rounded-xl border border-gray-200 px-4 py-3.5 text-sm focus:border-green-500 focus:outline-none bg-white shadow-sm"
                />
                <input
                  type="text"
                  value={ville}
                  onChange={e => setVille(e.target.value)}
                  placeholder={detectedCity || 'Ville'}
                  required
                  className="w-32 rounded-xl border border-gray-200 px-4 py-3.5 text-sm focus:border-green-500 focus:outline-none bg-white shadow-sm"
                />
              </div>
              <button
                type="submit"
                className="rounded-xl bg-green-500 px-5 py-3.5 text-sm font-bold text-white hover:bg-green-400 transition shadow-lg"
              >
                Voir ce qui bloque ma fiche — gratuit →
              </button>
              <p className="text-xs text-gray-400 text-center">Gratuit · Sans inscription · 60 secondes</p>
            </form>

            {signupCount > 0 && (
              <div className="flex items-center gap-3 text-sm text-gray-400">
                <div className="flex -space-x-1.5">
                  {['🔧', '✂️', '🥖', '🍽️', '🎨'].map((e, i) => (
                    <div key={i} className="w-7 h-7 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-xs">{e}</div>
                  ))}
                </div>
                <span>{signupCount} artisans ont déjà analysé leur fiche</span>
              </div>
            )}
          </div>

          {/* Visuel — SERP + résultat */}
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
                <div className="rounded-xl border border-gray-100 p-3 bg-gray-50 flex items-start justify-between">
                  <div>
                    <p className="text-xs font-bold text-gray-900">Plomberie Martin</p>
                    <p className="text-xs text-amber-500 mt-0.5">★ 4.2 · 18 avis</p>
                  </div>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">#1</span>
                </div>
                <div className="rounded-xl border border-gray-100 p-3 bg-gray-50 flex items-start justify-between">
                  <div>
                    <p className="text-xs font-bold text-gray-900">Chauffage & Co</p>
                    <p className="text-xs text-amber-500 mt-0.5">★ 3.9 · 7 avis</p>
                  </div>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">#2</span>
                </div>
                <div className="rounded-xl border-2 border-red-200 p-3 bg-red-50/50 flex items-start justify-between">
                  <div>
                    <p className="text-xs font-bold text-red-700">Plomberie Dupont ← vous</p>
                    <p className="text-xs text-amber-500 mt-0.5">★ 4.8 · 31 avis</p>
                    <p className="text-xs text-red-500 mt-0.5 font-medium">Fiche inactive → relégué en #4</p>
                  </div>
                  <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-semibold">#4</span>
                </div>
              </div>

              <div className="mx-4 mb-4 rounded-xl bg-green-50 border border-green-100 p-3">
                <p className="text-xs text-green-700 font-semibold mb-2">Ce que LocalBoost prépare pour vous</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {['📝 Description prête', '📅 12 publications', '⭐ Réponses aux avis', '📈 Plan d\'action'].map((item, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <span className="text-green-500 text-xs">✓</span>
                      <p className="text-xs text-gray-700">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="absolute -top-3 -right-3 bg-green-600 text-white text-xs font-bold px-3 py-2 rounded-xl shadow-lg">
              Votre dossier vous attend →
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
