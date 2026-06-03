import type { Testimonial } from '@/lib/testimonials'

export default function TestimonialCard({ testimonial: t }: { testimonial: Testimonial }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      {/* Étoiles */}
      <div className="flex items-center gap-0.5 mb-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <svg key={i} width="14" height="14" viewBox="0 0 20 20" fill="#f59e0b">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>

      {/* Citation */}
      <p className="text-sm text-gray-700 italic leading-relaxed mb-3">
        &ldquo;{t.quote}&rdquo;
      </p>

      {/* Auteur */}
      <p className="text-xs font-semibold text-gray-500 mb-3">
        {t.name} · {t.metier} · {t.city}
      </p>

      {/* Score avant / après */}
      <div className="flex items-center gap-2 text-xs">
        <span className="rounded-full bg-gray-100 text-gray-500 px-2 py-0.5 font-semibold">
          {t.before}/100
        </span>
        <span className="text-gray-400">→</span>
        <span className="rounded-full bg-green-100 text-green-700 px-2 py-0.5 font-semibold">
          {t.after}/100
        </span>
        <span className="text-green-600 font-bold ml-1">{t.gain}</span>
      </div>
    </div>
  )
}
