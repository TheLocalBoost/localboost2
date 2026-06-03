import { Suspense } from 'react'
import Link from 'next/link'
import AnalyserClient from './AnalyserClient'

export const metadata = {
  title: 'Analyser ma fiche Google gratuitement — LocalBoost',
  description: 'Découvrez en 30 secondes pourquoi votre fiche Google n\'attire pas assez de clients. Diagnostic gratuit, sans inscription.',
}

export default function AnalyserPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-gray-900 text-lg">
          <span>📍</span><span>LocalBoost</span>
        </Link>
        <Link
          href="/pricing"
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition"
        >
          Voir les tarifs →
        </Link>
      </header>

      <Suspense fallback={null}>
        <AnalyserClient />
      </Suspense>
    </div>
  )
}
