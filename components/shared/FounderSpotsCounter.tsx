'use client'
import { useState, useEffect } from 'react'

interface SpotsData { total: number; taken: number; remaining: number }

export default function FounderSpotsCounter() {
  const [data, setData] = useState<SpotsData | null>(null)

  async function load() {
    try {
      const r = await fetch('/api/founder-spots')
      if (r.ok) setData(await r.json())
    } catch {}
  }

  useEffect(() => {
    load()
    const iv = setInterval(load, 60_000)
    return () => clearInterval(iv)
  }, [])

  if (!data) return null

  const isLow      = data.remaining <= 10
  const isCritical = data.remaining <= 5

  const bg     = isLow ? '#fef2f2' : '#fefce8'
  const border = isLow ? '#fecaca' : '#fef08a'
  const text   = isLow ? '#991b1b' : '#854d0e'

  return (
    <div
      style={{ background: bg, border: `1px solid ${border}`, borderRadius: 8, padding: '10px 16px', textAlign: 'center' }}
      className={isCritical ? 'animate-pulse' : ''}
    >
      <p style={{ color: text, fontWeight: 600, fontSize: 14, margin: 0 }}>
        Offre fondateur — {data.remaining} place{data.remaining > 1 ? 's' : ''} restante{data.remaining > 1 ? 's' : ''} sur {data.total}
      </p>
    </div>
  )
}
