import { Suspense } from 'react'
import AnalyserFlow from '@/components/analyser/AnalyserFlow'

export const metadata = {
  title: 'Analyser ma fiche Google — LocalBoost',
  description: 'Diagnostic gratuit de votre fiche Google. Résultat personnalisé en 60 secondes.',
}

export default function AnalyserPage() {
  return (
    <div className="min-h-screen bg-white">
      <Suspense fallback={null}>
        <AnalyserFlow />
      </Suspense>
    </div>
  )
}
