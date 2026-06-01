'use client'

import { useState, useEffect } from 'react'

const STATUTS: Record<string, { label: string; color: string }> = {
  sent:     { label: 'Envoyée',   color: 'bg-blue-100 text-blue-700'   },
  reminded: { label: 'Relancée', color: 'bg-amber-100 text-amber-700' },
  done:     { label: 'Avis reçu', color: 'bg-green-100 text-green-700' },
}

export default function AvisPage() {
  const [requests, setRequests] = useState<any[]>([])
  const [profile, setProfile]   = useState<any>(null)
  const [loading, setLoading]   = useState(true)
  const [sending, setSending]   = useState(false)
  const [form, setForm] = useState({ client_name: '', client_email: '', prestation: '' })
  const [success, setSuccess]   = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/localboost/avis').then(r => r.json()),
      fetch('/api/localboost/setup').then(r => r.json()),
    ]).then(([avis, p]) => {
      setRequests(Array.isArray(avis) ? avis : [])
      setProfile(p?.google_place_id ? p : null)
      setLoading(false)
    })
  }, [])

  async function send(e: React.FormEvent) {
    e.preventDefault()
    if (!profile) return
    setSending(true)
    const r = await fetch('/api/localboost/avis', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(form),
    })
    const data = await r.json()
    if (!data.error) {
      setRequests(prev => [data, ...prev])
      setForm({ client_name: '', client_email: '', prestation: '' })
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    }
    setSending(false)
  }

  async function markDone(id: string) {
    await fetch('/api/localboost/avis', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ id, status: 'done' }),
    })
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'done' } : r))
  }

  const input = 'w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none'
  const stats = {
    envoyes:  requests.length,
    recus:    requests.filter(r => r.status === 'done').length,
    en_cours: requests.filter(r => r.status !== 'done').length,
  }

  if (loading) return <div className="text-center py-16 text-gray-400">Chargement...</div>

  if (!profile) {
    return (
      <div className="text-center py-16">
        <p className="text-4xl mb-4">⚙️</p>
        <p className="font-semibold text-gray-900 mb-2">Configurez votre fiche Google d'abord</p>
        <a href="/localboost/setup" className="text-blue-600 underline text-sm">Configurer →</a>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Collecter des avis</h1>
          <p className="text-sm text-gray-500 mt-0.5">Envoyez un email après chaque prestation pour obtenir un avis Google</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Demandes envoyées', value: stats.envoyes,  color: 'text-gray-900'  },
          { label: 'Avis obtenus',      value: stats.recus,    color: 'text-green-600' },
          { label: 'En attente',        value: stats.en_cours, color: 'text-amber-600' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        {/* Formulaire */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-900 mb-4 text-sm">Nouvelle demande d'avis</h2>
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-4 text-sm text-green-700">
              ✓ Email envoyé à {form.client_email || 'votre client'}
            </div>
          )}
          <form onSubmit={send} className="space-y-3">
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1.5">Nom du client</label>
              <input
                value={form.client_name}
                onChange={e => setForm(f => ({ ...f, client_name: e.target.value }))}
                placeholder="Marie Dupont"
                required
                className={input}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1.5">Email du client</label>
              <input
                type="email"
                value={form.client_email}
                onChange={e => setForm(f => ({ ...f, client_email: e.target.value }))}
                placeholder="marie@email.fr"
                required
                className={input}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1.5">Prestation réalisée</label>
              <input
                value={form.prestation}
                onChange={e => setForm(f => ({ ...f, prestation: e.target.value }))}
                placeholder="Ex : réfection salle de bain"
                className={input}
              />
            </div>
            <button
              type="submit"
              disabled={sending}
              className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {sending ? 'Envoi...' : '📧 Envoyer la demande d\'avis'}
            </button>
          </form>

          <div className="mt-4 p-3 bg-gray-50 rounded-xl text-xs text-gray-500">
            <p className="font-medium text-gray-700 mb-1">L'email envoyé à votre client :</p>
            <p>• Remerciements personnalisés</p>
            <p>• Bouton direct vers votre fiche Google</p>
            <p>• Relance automatique à J+3 si pas d'avis</p>
          </div>
        </div>

        {/* Historique */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 text-sm">Historique</h2>
          </div>
          {requests.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">
              Aucune demande envoyée pour l'instant.
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {requests.map(r => (
                <div key={r.id} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{r.client_name}</p>
                    <p className="text-xs text-gray-400">
                      {r.prestation && `${r.prestation} · `}
                      {new Date(r.created_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUTS[r.status]?.color}`}>
                      {STATUTS[r.status]?.label}
                    </span>
                    {r.status !== 'done' && (
                      <button
                        onClick={() => markDone(r.id)}
                        className="text-xs text-gray-400 hover:text-green-600"
                      >
                        ✓
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
