'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-browser'
import Link from 'next/link'

export default function DashboardPage() {
  const [merchant, setMerchant] = useState<any>(null)
  const [score, setScore] = useState<number | null>(null)
  const [competitors, setCompetitors] = useState<any[]>([])
  const [position, setPosition] = useState<number | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [lastReport, setLastReport] = useState<any>(null)
  const [scoreHistory, setScoreHistory] = useState<{ week_start: string; visibility_score: number }[]>([])
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: m } = await supabase
        .from('merchant_profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      setMerchant(m)

      const { data: reports } = await supabase
        .from('weekly_reports')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(8)

      if (reports && reports.length > 0) {
        setScore(reports[0].visibility_score)
        setLastReport(reports[0])
        setCompetitors(reports[0].competitor_data?.competitors || [])
        setPosition(reports[0].competitor_data?.position || null)
        setScoreHistory([...reports].reverse())
      }
    }
    load()
  }, [])

  const handleAnalyze = async () => {
    setAnalyzing(true)
    try {
      const res = await fetch('/api/analyze', { method: 'POST' })
      const data = await res.json()
      setScore(data.score)
      setCompetitors(data.competitors || [])
      setPosition(data.position)
    } catch (err) {
      console.error(err)
    } finally {
      setAnalyzing(false)
    }
  }

  const getScoreColor = (s: number) => {
    if (s >= 70) return 'text-green-600'
    if (s >= 40) return 'text-amber-600'
    return 'text-red-500'
  }

  const getScoreLabel = (s: number) => {
    if (s >= 70) return 'Bonne visibilité'
    if (s >= 40) return 'Visibilité moyenne'
    return 'Faible visibilité'
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Bonjour {merchant?.commerce_name || ''} 👋
        </h1>
        <p className="text-gray-500 mt-1">Votre assistant Google Business est prêt.</p>
      </div>

      {merchant && !merchant.specialties && (
        <div className="rounded-2xl bg-blue-50 border border-blue-200 p-4 mb-6 flex items-center justify-between">
          <div>
            <p className="font-semibold text-blue-800 text-sm">Personnalisez votre profil</p>
            <p className="text-xs text-blue-600 mt-0.5">Ajoutez vos spécialités pour des posts encore plus précis.</p>
          </div>
          <Link href="/dashboard/onboarding" className="shrink-0 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition">
            Compléter →
          </Link>
        </div>
      )}

      {/* Score de visibilité */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">📊 Score de visibilité Google</h2>
          <button
            onClick={handleAnalyze}
            disabled={analyzing || !merchant}
            className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 transition disabled:opacity-50"
          >
            {analyzing ? 'Analyse...' : 'Analyser'}
          </button>
        </div>

        {score !== null ? (
          <div>
            <div className="flex items-end gap-3 mb-3">
              <span className={`text-6xl font-extrabold ${getScoreColor(score)}`}>{score}</span>
              <span className="text-gray-400 text-xl mb-2">/100</span>
              <span className={`text-sm font-medium mb-2 ${getScoreColor(score)}`}>{getScoreLabel(score)}</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3 mb-4">
              <div
                className={`h-3 rounded-full transition-all ${score >= 70 ? 'bg-green-500' : score >= 40 ? 'bg-amber-500' : 'bg-red-500'}`}
                style={{ width: `${score}%` }}
              />
            </div>
            {position && (
              <p className="text-sm text-gray-500">
                Position sur Google Maps : <strong>#{position}</strong> pour "{merchant?.commerce_name} {merchant?.city}"
              </p>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-400 text-sm mb-4">Cliquez sur Analyser pour voir votre score de visibilité Google</p>
            <button
              onClick={handleAnalyze}
              disabled={analyzing || !merchant}
              className="rounded-xl bg-green-600 px-6 py-3 text-sm font-semibold text-white hover:bg-green-700 transition disabled:opacity-50"
            >
              {analyzing ? 'Analyse en cours...' : '🔍 Analyser ma visibilité'}
            </button>
          </div>
        )}
      </div>

      {/* Concurrents */}
      {competitors.length > 0 && (
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">🏆 Vos concurrents</h2>
          <div className="space-y-3">
            {competitors.map((c, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-gray-400">#{c.position}</span>
                  <span className="text-sm font-medium text-gray-800">{c.name}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <span>⭐ {c.rating || '—'}</span>
                  <span>{c.reviews || 0} avis</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Historique des scores */}
      {scoreHistory.length > 1 && (
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">📈 Évolution sur 8 semaines</h2>
          <div className="flex items-end gap-2 h-24">
            {scoreHistory.map((r, i) => {
              const pct = r.visibility_score
              const color = pct >= 70 ? 'bg-green-500' : pct >= 40 ? 'bg-amber-500' : 'bg-red-400'
              const isLast = i === scoreHistory.length - 1
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className={`text-xs font-bold ${isLast ? 'text-gray-900' : 'text-gray-400'}`}>{pct}</span>
                  <div className="w-full flex items-end" style={{ height: '64px' }}>
                    <div
                      className={`w-full rounded-t ${color} ${isLast ? 'opacity-100' : 'opacity-50'}`}
                      style={{ height: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(r.week_start).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Link href="/dashboard/generate?type=google" className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm hover:border-green-300 transition">
          <div className="text-2xl mb-2">📍</div>
          <h3 className="font-semibold text-gray-900 mb-1">Post Google Business</h3>
          <p className="text-sm text-gray-500">Générez un post pour cette semaine</p>
        </Link>
        <Link href="/dashboard/generate?type=review" className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm hover:border-green-300 transition">
          <div className="text-2xl mb-2">⭐</div>
          <h3 className="font-semibold text-gray-900 mb-1">Répondre à un avis</h3>
          <p className="text-sm text-gray-500">Collez un avis, recevez 3 réponses</p>
        </Link>
      </div>
    </div>
  )
}