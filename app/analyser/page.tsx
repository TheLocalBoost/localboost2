import { Suspense } from 'react'
import Link from 'next/link'
import Analyzer from '@/components/landing/Analyzer'

export const metadata = {
  title: 'Analyser ma fiche Google gratuitement — LocalBoost',
  description: 'Découvrez en 30 secondes pourquoi votre fiche Google n\'attire pas assez de clients. Diagnostic gratuit, sans inscription.',
}

export default function AnalyserPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header minimal */}
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-gray-900 text-lg">
          <span>📍</span><span>LocalBoost</span>
        </Link>
        <Link
          href="/signup"
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition"
        >
          Essai gratuit 7 jours →
        </Link>
      </header>

      <Suspense fallback={null}>
        <Analyzer />
      </Suspense>
    </div>
  )
}
