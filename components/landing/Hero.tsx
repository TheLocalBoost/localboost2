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
      <div className="max-w-xl mx-auto text-center">
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
                  className="w-36 rounded-xl border border-gray-200 px-4 py-3.5 text-sm focus:border-green-500 focus:outline-none bg-white shadow-sm"
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

      </div>
    </section>
  )
}
