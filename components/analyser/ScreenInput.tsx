'use client'
import { useEffect, useState, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { track } from '@/lib/track'
import ScreenLayout from './ScreenLayout'

interface Props {
  onStart: (nom: string, ville: string, email: string) => void
}

function looksReal(s: string): boolean {
  return (
    s.length > 1 &&
    s.length < 80 &&
    /[aeiouyéèêëàâîïôùûü]/i.test(s) &&
    !/[^a-zA-ZÀ-ÿ0-9\s\-'&.]/u.test(s)
  )
}

export default function ScreenInput({ onStart }: Props) {
  const searchParams = useSearchParams()
  const [nom, setNom] = useState('')
  const [ville, setVille] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const autoStartFired = useRef(false)

  useEffect(() => {
    if (autoStartFired.current) return

    const paramNom   = searchParams.get('nom') ?? ''
    const paramVille = searchParams.get('ville') ?? ''
    const paramEmail = searchParams.get('email') ?? ''
    const utmSource  = searchParams.get('utm_source') ?? ''

    if (paramNom && paramVille && looksReal(paramNom) && looksReal(paramVille)) {
      autoStartFired.current = true

      if (utmSource === 'ovh') {
        track('email_click_landed', {
          nom:          paramNom,
          ville:        paramVille,
          utm_source:   utmSource,
          utm_campaign: searchParams.get('utm_campaign') ?? '',
        })
      }

      onStart(paramNom, paramVille, paramEmail)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nom.trim() || !ville.trim() || submitting) return
    setSubmitting(true)
    onStart(nom.trim(), ville.trim(), '')
  }

  // If URL params are valid, this screen shows briefly during auto-start
  const paramNom   = searchParams.get('nom') ?? ''
  const paramVille = searchParams.get('ville') ?? ''
  const isAutoStart = paramNom && paramVille && looksReal(paramNom) && looksReal(paramVille)

  if (isAutoStart) {
    return (
      <ScreenLayout centered={false}>
        <div className="mb-10">
          <span className="text-base font-bold text-gray-900">LocalBoost</span>
        </div>
        <p className="text-sm text-gray-400">
          Analyse en cours pour{' '}
          <span className="font-semibold text-gray-700">{paramNom}</span>
          {', '}
          <span className="font-semibold text-gray-700">{paramVille}</span>
          ...
        </p>
      </ScreenLayout>
    )
  }

  return (
    <ScreenLayout centered={false}>
      <div className="mb-10">
        <span className="text-base font-bold text-gray-900">LocalBoost</span>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-2 leading-snug">
        Analysez votre fiche Google
      </h1>
      <p className="text-sm text-gray-500 mb-8">
        Diagnostic gratuit. Résultat personnalisé en 60 secondes.
      </p>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <input
            type="text"
            value={nom}
            onChange={e => setNom(e.target.value)}
            placeholder="Nom de votre établissement"
            required
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#16a34a] focus:outline-none transition"
          />
        </div>
        <div>
          <input
            type="text"
            value={ville}
            onChange={e => setVille(e.target.value)}
            placeholder="Ville"
            required
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#16a34a] focus:outline-none transition"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-gray-900 px-5 py-3.5 text-sm font-bold text-white hover:bg-gray-800 disabled:opacity-60 transition"
        >
          {submitting ? 'Analyse en cours...' : 'Analyser ma fiche →'}
        </button>
      </form>

      <p className="text-xs text-gray-400 mt-4 text-center">
        Aucune inscription requise
      </p>
    </ScreenLayout>
  )
}
