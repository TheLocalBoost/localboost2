import type { Testimonial } from '@/lib/testimonials'

export default function TestimonialCard({ testimonial: t }: { testimonial: Testimonial }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      {/* En-tête : métier + scores */}
      <div className="flex items-center justify-between mb-3">
        <span className="rounded-full bg-gray-100 text-gray-600 text-xs font-semibold px-3 py-1">
          {t.metier}
        </span>
        <div className="flex items-center gap-2 text-xs">
          <span className="rounded-full bg-red-50 text-red-500 px-2 py-0.5 font-bold">{t.before}/100</span>
          <span className="text-gray-300">→</span>
          <span className="rounded-full bg-green-100 text-green-700 px-2 py-0.5 font-bold">{t.after}/100</span>
        </div>
      </div>

      {/* Situation initiale */}
      <p className="text-xs text-gray-500 leading-relaxed mb-3 italic">{t.situation}</p>

      {/* Actions réalisées */}
      <ul className="space-y-1 mb-3">
        {t.actions.map((a, i) => (
          <li key={i} className="flex items-start gap-2 text-xs text-gray-700">
            <span className="text-green-500 shrink-0 mt-0.5 font-bold">✓</span>{a}
          </li>
        ))}
      </ul>

      {/* Résultat */}
      <div className="rounded-lg bg-green-50 border border-green-100 px-3 py-2 text-xs font-bold text-green-700">
        Résultat : {t.gain}
      </div>
    </div>
  )
}
