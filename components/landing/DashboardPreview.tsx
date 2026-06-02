'use client'
import { useState, useEffect, useRef } from 'react'

function AnimatedScoreRing({ animate }: { animate: boolean }) {
  const r = 36, circ = 2 * Math.PI * r
  const [score, setScore] = useState(0)

  useEffect(() => {
    if (!animate) return
    let n = 0
    const target = 34
    const step = () => {
      n = Math.min(n + 1, target)
      setScore(n)
      if (n < target) setTimeout(step, 1000 / target)
    }
    setTimeout(step, 200)
  }, [animate])

  const offset = circ - (score / 100) * circ

  return (
    <svg width="80" height="80" viewBox="0 0 80 80">
      <circle cx="40" cy="40" r={r} fill="none" stroke="#fee2e2" strokeWidth="8" />
      <circle cx="40" cy="40" r={r} fill="none" stroke="#dc2626" strokeWidth="8"
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round" transform="rotate(-90 40 40)"
        style={{ transition: 'stroke-dashoffset 0.05s linear' }} />
      <text x="40" y="36" textAnchor="middle" fontSize="16" fontWeight="800" fill="#111827">{score}</text>
      <text x="40" y="50" textAnchor="middle" fontSize="9" fill="#6b7280">/100</text>
    </svg>
  )
}

export default function DashboardPreview() {
  const ref = useRef<HTMLDivElement>(null)
  const [animate, setAnimate] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      obs.disconnect()
      setAnimate(true)
    }, { threshold: 0.3 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  function scrollToSearch() {
    document.getElementById('hero-search')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section className="py-20 px-6 bg-gray-50">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-3">
            Voici ce que vous allez découvrir
          </h2>
          <p className="text-gray-500">
            Exemple d'audit pour un plombier à Lyon — votre résultat sera personnalisé
          </p>
        </div>

        <div ref={ref} className="bg-white rounded-2xl shadow-lg overflow-hidden">

          {/* BLOC 1 — Header */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-gray-700">Plomberie Dubois · Lyon 7e</p>
              <span className="rounded-full bg-red-100 text-red-600 text-xs font-bold px-3 py-1">Score critique</span>
            </div>
            <div className="flex items-center gap-4">
              <AnimatedScoreRing animate={animate} />
              <div>
                <p className="text-sm font-bold text-red-600">Votre fiche est quasiment invisible</p>
                <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                  Sur 100 personnes qui cherchent un plombier, moins de 3 vous trouvent.
                </p>
              </div>
            </div>
          </div>

          {/* BLOC 2 — Opportunités perdues */}
          <div className="mx-4 my-3 rounded-lg p-3" style={{ background: '#fff7ed', border: '1px solid #fed7aa' }}>
            <p className="text-xs text-orange-600 font-semibold uppercase tracking-wide mb-1">
              Clients perdus ce mois-ci
            </p>
            <p className="text-2xl font-bold text-orange-500">12 clients</p>
            <p className="text-xs text-gray-500 mt-0.5">Soit ~720 € de chiffre d'affaires non réalisé</p>
          </div>

          {/* BLOC 3 — Problèmes */}
          <div className="px-4 pb-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Problèmes détectés
            </p>
            <div className="space-y-2">

              {/* Problème 1 — visible */}
              <div className="flex items-start gap-3 rounded-xl border border-red-100 bg-red-50/40 p-3">
                <span className="text-red-500 shrink-0 mt-0.5">⚠</span>
                <div>
                  <p className="text-xs font-semibold text-gray-800">Description Google inexistante</p>
                  <p className="text-xs text-gray-400 mt-0.5">Google ne sait pas quels services vous proposez.</p>
                </div>
              </div>

              {/* Problème 2 — flouté */}
              <div className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3 relative">
                <span className="text-gray-300 shrink-0 mt-0.5">🔒</span>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-gray-800 blur-sm select-none">Vos horaires sont incorrects</p>
                  <p className="text-xs text-gray-400 mt-0.5">Débloquez pour voir la solution</p>
                </div>
              </div>

              {/* Problème 3 — flouté */}
              <div className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3 relative">
                <span className="text-gray-300 shrink-0 mt-0.5">🔒</span>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-gray-800 blur-sm select-none">Pas de réponse aux avis négatifs</p>
                  <p className="text-xs text-gray-400 mt-0.5">Débloquez pour voir la solution</p>
                </div>
              </div>
            </div>
          </div>

          {/* BLOC 4 — CTA */}
          <div className="p-4 pt-4">
            <button
              onClick={scrollToSearch}
              className="w-full rounded-xl bg-blue-600 py-3.5 text-sm font-bold text-white hover:bg-blue-700 transition"
            >
              Débloquer mon plan d'action — 29€/mois
            </button>
            <p className="text-xs text-gray-400 text-center mt-2">Résiliable à tout moment</p>
          </div>

        </div>
      </div>
    </section>
  )
}
