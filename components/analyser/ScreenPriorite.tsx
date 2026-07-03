'use client'
import { useState } from 'react'
import ScreenLayout from './ScreenLayout'

interface Props {
  nom: string
  onNext: (priority: string) => void
}

const OPTIONS = [
  { id: 'convince', label: 'Mieux présenter mon activité aux visiteurs' },
  { id: 'reviews',  label: 'Répondre à mes avis clients plus facilement' },
  { id: 'publish',  label: 'Avoir du contenu à publier sans y passer du temps' },
  { id: 'time',     label: 'Gagner du temps sur tout ce qui touche à Google' },
]

export default function ScreenPriorite({ nom, onNext }: Props) {
  const [selected, setSelected] = useState<string | null>(null)

  return (
    <ScreenLayout>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-6">
        Une question
      </p>

      <h2 className="text-xl font-bold text-gray-900 mb-2 leading-snug">
        Qu&apos;est-ce qui compte le plus pour {nom} ?
      </h2>
      <p className="text-sm text-gray-400 mb-8">
        Cela ne change pas le contenu du rapport — uniquement la façon dont il vous est présenté.
      </p>

      <div className="space-y-3 mb-10">
        {OPTIONS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setSelected(id)}
            className={`w-full text-left rounded-xl border px-4 py-3.5 text-sm transition ${
              selected === id
                ? 'border-[#16a34a] bg-[#f0fdf4] text-gray-900 font-medium'
                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <button
        onClick={() => onNext(selected ?? 'time')}
        disabled={!selected}
        className="w-full rounded-xl bg-gray-900 px-5 py-4 text-sm font-bold text-white hover:bg-gray-800 disabled:opacity-40 transition"
      >
        Continuer →
      </button>
    </ScreenLayout>
  )
}
