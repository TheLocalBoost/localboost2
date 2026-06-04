'use client'
import { useRef, useEffect, useState } from 'react'

const TASKS = [
  { task: 'Publication Google hebdomadaire',  alone: '≈ 30 min',  lb: '30 secondes' },
  { task: 'Réponse à chaque avis client',     alone: '≈ 15 min',  lb: '30 secondes' },
  { task: 'Suivi de votre position Google',   alone: '≈ 20 min',  lb: 'Automatique' },
  { task: 'Photos récentes & horaires',       alone: '≈ 30 min',  lb: 'Rappels auto' },
]

export default function DashboardPreview() {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      obs.disconnect()
      setVisible(true)
    }, { threshold: 0.2 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <section className="py-20 px-6 bg-white">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-3">
            Maintenir une fiche Google, c'est du travail.
          </h2>
          <p className="text-gray-500">
            Pas compliqué — mais régulier, hebdomadaire, sans exception. Voici la réalité :
          </p>
        </div>

        <div
          ref={ref}
          className={`bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
        >
          {/* Header */}
          <div className="grid grid-cols-3 bg-gray-50 border-b border-gray-100 px-6 py-3">
            <p className="text-xs font-semibold text-gray-500 col-span-1">Tâche hebdomadaire</p>
            <p className="text-xs font-semibold text-red-500 text-center">Seul</p>
            <p className="text-xs font-semibold text-blue-600 text-center">LocalBoost</p>
          </div>

          {TASKS.map(({ task, alone, lb }, i) => (
            <div key={i} className="grid grid-cols-3 items-center px-6 py-4 border-b border-gray-50">
              <p className="text-sm text-gray-700 pr-4">{task}</p>
              <p className="text-sm font-bold text-red-500 text-center">{alone}</p>
              <p className="text-sm font-bold text-blue-600 text-center">{lb}</p>
            </div>
          ))}

          {/* Total */}
          <div className="grid grid-cols-3 items-center px-6 py-5 bg-gray-50">
            <p className="text-sm font-bold text-gray-900">Total / semaine</p>
            <div className="text-center">
              <p className="text-2xl font-extrabold text-red-500">~2h30</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-extrabold text-blue-600">~5 min</p>
            </div>
          </div>
        </div>

        <div className="mt-6 grid sm:grid-cols-2 gap-4">
          <div className="rounded-2xl bg-red-50 border border-red-100 p-5 text-center">
            <p className="text-3xl font-extrabold text-red-500 mb-1">130h</p>
            <p className="text-sm text-gray-600">de travail par an si vous le faites seul</p>
            <p className="text-xs text-gray-400 mt-1">Soit 16 jours de travail complets</p>
          </div>
          <div className="rounded-2xl bg-blue-50 border border-blue-100 p-5 text-center">
            <p className="text-3xl font-extrabold text-blue-600 mb-1">126h</p>
            <p className="text-sm text-gray-600">récupérées chaque année avec LocalBoost</p>
            <p className="text-xs text-gray-400 mt-1">Pour votre vrai travail, votre famille, votre vie</p>
          </div>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Et pendant ces 126h récupérées, votre fiche est{' '}
          <strong className="text-gray-900">toujours active, toujours à jour, toujours visible.</strong>
        </p>
      </div>
    </section>
  )
}
