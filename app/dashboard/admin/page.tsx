'use client'

import { useState, useEffect } from 'react'

interface Stats {
  total: number
  sent: number
  remaining: number
  bySector: [string, number][]
  recent: { nom: string; email: string; secteur: string; ville: string; sent_at: string }[]
}

const ADMIN_KEY = process.env.NEXT_PUBLIC_ADMIN_KEY || ''

export default function AdminPage() {
  const [key, setKey]       = useState('')
  const [authed, setAuthed] = useState(false)
  const [stats, setStats]   = useState<Stats | null>(null)
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [limit, setLimit]   = useState(50)
  const [result, setResult] = useState<{ sent: number; errors?: string[] } | null>(null)
  const [error, setError]   = useState('')

  async function fetchStats(adminKey: string) {
    setLoading(true)
    setError('')
    const res = await fetch('/api/admin/stats', { headers: { 'x-admin-key': adminKey } })
    if (res.status === 401) { setError('Clé invalide'); setLoading(false); return }
    const data = await res.json()
    setStats(data)
    setAuthed(true)
    setLoading(false)
  }

  async function sendBatch() {
    setSending(true)
    setResult(null)
    const res = await fetch('/api/admin/send', {
      method: 'POST',
      headers: { 'x-admin-key': key, 'Content-Type': 'application/json' },
      body: JSON.stringify({ limit }),
    })
    const data = await res.json()
    setResult(data)
    setSending(false)
    fetchStats(key)
  }

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-xl shadow p-8 w-full max-w-sm">
          <h1 className="text-xl font-bold mb-6 text-gray-900">Admin LocalBoost</h1>
          <input
            type="password"
            placeholder="Clé admin"
            value={key}
            onChange={e => setKey(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetchStats(key)}
            className="w-full border rounded-lg px-4 py-2 mb-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
          <button
            onClick={() => fetchStats(key)}
            disabled={loading}
            className="w-full bg-green-600 text-white py-2 rounded-lg font-semibold text-sm hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Vérification...' : 'Accéder'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Outreach Admin</h1>
          <button
            onClick={() => fetchStats(key)}
            className="text-sm text-green-600 hover:underline"
          >
            Rafraîchir
          </button>
        </div>

        {/* KPIs */}
        {stats && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-5 text-center">
              <p className="text-3xl font-bold text-gray-900">{stats.total.toLocaleString()}</p>
              <p className="text-sm text-gray-500 mt-1">Total leads</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-5 text-center">
              <p className="text-3xl font-bold text-green-600">{stats.sent.toLocaleString()}</p>
              <p className="text-sm text-gray-500 mt-1">Envoyés</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-5 text-center">
              <p className="text-3xl font-bold text-orange-500">{stats.remaining.toLocaleString()}</p>
              <p className="text-sm text-gray-500 mt-1">Restants</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* Send batch */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Envoyer un batch</h2>
            <div className="flex items-center gap-3 mb-4">
              <label className="text-sm text-gray-600 whitespace-nowrap">Nombre d'emails :</label>
              <input
                type="number"
                value={limit}
                onChange={e => setLimit(Number(e.target.value))}
                min={1}
                max={500}
                className="border rounded-lg px-3 py-1.5 text-sm w-24 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <button
              onClick={sendBatch}
              disabled={sending}
              className="w-full bg-green-600 text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-green-700 disabled:opacity-50"
            >
              {sending ? `Envoi en cours...` : `Envoyer ${limit} emails →`}
            </button>
            {result && (
              <div className={`mt-4 p-3 rounded-lg text-sm ${result.errors?.length ? 'bg-orange-50 text-orange-700' : 'bg-green-50 text-green-700'}`}>
                <p className="font-semibold">✅ {result.sent} emails envoyés</p>
                {result.errors?.map((e, i) => (
                  <p key={i} className="text-xs mt-1 text-red-500">{e}</p>
                ))}
              </div>
            )}
          </div>

          {/* By sector */}
          {stats?.bySector && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Par secteur</h2>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {stats.bySector.map(([sector, count]) => (
                  <div key={sector} className="flex justify-between items-center text-sm">
                    <span className="capitalize text-gray-700">{sector}</span>
                    <span className="font-semibold text-gray-900">{count.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Recent sends */}
        {stats?.recent && stats.recent.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Derniers envois</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="pb-2 font-medium">Nom</th>
                  <th className="pb-2 font-medium">Email</th>
                  <th className="pb-2 font-medium">Secteur</th>
                  <th className="pb-2 font-medium">Ville</th>
                  <th className="pb-2 font-medium">Envoyé le</th>
                </tr>
              </thead>
              <tbody>
                {stats.recent.map((r, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-2 text-gray-900 max-w-[120px] truncate">{r.nom}</td>
                    <td className="py-2 text-gray-500 max-w-[160px] truncate">{r.email}</td>
                    <td className="py-2 capitalize text-gray-700">{r.secteur}</td>
                    <td className="py-2 text-gray-700">{r.ville}</td>
                    <td className="py-2 text-gray-400">
                      {new Date(r.sent_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
