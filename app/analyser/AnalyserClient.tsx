'use client'
import { useState } from 'react'
import Analyzer from '@/components/landing/Analyzer'
import ExitIntentModal from '@/components/analyser/ExitIntentModal'

interface ResultData { score: number; name: string; city: string; category: string }

export default function AnalyserClient() {
  const [emailCaptured, setEmailCaptured] = useState(false)
  const [result, setResult]               = useState<ResultData | null>(null)

  return (
    <>
      <Analyzer
        onEmailCapture={() => setEmailCaptured(true)}
        onResult={setResult}
      />
      {result && (
        <ExitIntentModal
          score={result.score}
          establishmentName={result.name}
          city={result.city}
          category={result.category}
          emailCaptured={emailCaptured}
          onCapture={() => setEmailCaptured(true)}
        />
      )}
    </>
  )
}
