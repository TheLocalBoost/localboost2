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
    <section className="pt-28 pb-20 px-6 bg-white">
      <div className="max-w-2xl mx-auto">

        {/* Eyebrow */}
        <p className="text-xs font-semibold text-[#16a34a] uppercase tracking-widest mb-6">
          Diagnostic gratuit · Résultat en 60 secondes
        </p>

        {/* Headline — une seule idée, poids maximal */}
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight tracking-tight mb-6">
          Votre fiche Google<br />
          vous fait perdre des clients.
        </h1>

        {/* Sous-titre — factuel, une phrase */}
        <p className="text-lg text-gray-500 mb-10 max-w-lg">
          On identifie ce qui bloque votre visibilité et on prépare les corrections —
          description, publications, réponses aux avis.
        </p>

        {/* Formulaire */}
        <form id="hero-search" onSubmit={handleSubmit}>
          <div className="flex flex-col sm:flex-row gap-2 mb-3">
            <input
              type="text"
              value={nom}
              onChange={e => setNom(e.target.value)}
              placeholder="Nom de votre commerce"
              required
              className="flex-1 rounded-lg border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none bg-white"
            />
            <input
              type="text"
              value={ville}
              onChange={e => setVille(e.target.value)}
              placeholder={detectedCity || 'Ville'}
              required
              className="w-32 rounded-lg border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none bg-white"
            />
            <button
              type="submit"
              className="rounded-lg bg-gray-900 px-6 py-3 text-sm font-semibold text-white hover:bg-gray-700 transition whitespace-nowrap"
            >
              Analyser ma fiche →
            </button>
          </div>
          <p className="text-xs text-gray-400">Gratuit · Sans inscription</p>
        </form>

        {/* Preuve sociale minimaliste */}
        {signupCount > 0 && (
          <p className="text-xs text-gray-400 mt-6">
            {signupCount} artisans et commerçants ont déjà analysé leur fiche.
          </p>
        )}
      </div>
    </section>
  )
}
