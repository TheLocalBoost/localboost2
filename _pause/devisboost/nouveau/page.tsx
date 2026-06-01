'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const EXAMPLES = [
  'Réfection salle de bain 8m², carrelage sol et mur, remplacement baignoire par douche italienne',
  'Installation tableau électrique neuf + 10 prises + 6 interrupteurs en rénovation appartement',
  'Peinture salon 25m² + couloir 12m², préparation murs, 2 couches',
  'Remplacement chaudière gaz condensation + robinets thermostatiques 4 radiateurs',
  'Pose parquet chêne massif 30m², pose colle, plinthes comprises',
]

export default function NouveauDevisPage() {
  const router = useRouter()
  const [description, setDescription] = useState('')
  const [clients, setClients]         = useState<any[]>([])
  const [clientId, setClientId]       = useState('')
  const [newClient, setNewClient]     = useState({ name: '', email: '', phone: '', address: '' })
  const [showNew, setShowNew]         = useState(false)
  const [generating, setGenerating]   = useState(false)
  const [error, setError]             = useState('')

  useEffect(() => {
    fetch('/api/devisboost/clients').then(r => r.json()).then(setClients).catch(() => {})
  }, [])

  async function generate(e: React.FormEvent) {
    e.preventDefault()
    if (!description.trim()) return
    setGenerating(true)
    setError('')

    try {
      let finalClientId = clientId

      // Créer le client si nouveau
      if (showNew && newClient.name) {
        const r = await fetch('/api/devisboost/clients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newClient),
        })
        const c = await r.json()
        finalClientId = c.id
      }

      // Génération IA
      const r = await fetch('/api/devisboost/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description }),
      })
      const data = await r.json()
      if (data.error) throw new Error(data.error)

      // Créer le devis en base
      const r2 = await fetch('/api/devisboost/devis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          client_id: finalClientId || null,
          description_chantier: description,
          statut: 'brouillon',
        }),
      })
      const devis = await r2.json()
      router.push(`/devisboost/devis/${devis.id}`)
    } catch (err: any) {
      setError(err.message ?? 'Erreur lors de la génération')
      setGenerating(false)
    }
  }

  const input = 'w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20'

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">✨ Nouveau devis</h1>
        <p className="text-gray-500 mt-1">Décrivez le chantier en langage naturel — l'IA génère le devis en 30 secondes.</p>
      </div>

      <form onSubmit={generate} className="space-y-5">
        {/* Description chantier */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <label className="block text-sm font-semibold text-gray-900 mb-3">Décrivez le chantier *</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            required
            rows={4}
            placeholder="Ex : Réfection salle de bain 12m², carrelage sol et mur, remplacement baignoire par douche italienne..."
            className={`${input} resize-none`}
          />
          <div className="mt-3">
            <p className="text-xs text-gray-400 mb-2">Exemples :</p>
            <div className="flex flex-wrap gap-2">
              {EXAMPLES.map((ex, i) => (
                <button
                  key={i} type="button"
                  onClick={() => setDescription(ex)}
                  className="text-xs bg-gray-50 hover:bg-green-50 hover:text-green-700 text-gray-500 border border-gray-200 rounded-lg px-2.5 py-1 transition"
                >
                  {ex.slice(0, 45)}...
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Client */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-semibold text-gray-900">Client</label>
            <button
              type="button"
              onClick={() => { setShowNew(!showNew); setClientId('') }}
              className="text-xs text-green-600 hover:underline"
            >
              {showNew ? '← Choisir existant' : '+ Nouveau client'}
            </button>
          </div>

          {showNew ? (
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <input value={newClient.name} onChange={e => setNewClient(n => ({ ...n, name: e.target.value }))}
                  placeholder="Nom du client *" className={input} />
              </div>
              <input value={newClient.email} onChange={e => setNewClient(n => ({ ...n, email: e.target.value }))}
                placeholder="Email" type="email" className={input} />
              <input value={newClient.phone} onChange={e => setNewClient(n => ({ ...n, phone: e.target.value }))}
                placeholder="Téléphone" className={input} />
              <div className="sm:col-span-2">
                <input value={newClient.address} onChange={e => setNewClient(n => ({ ...n, address: e.target.value }))}
                  placeholder="Adresse" className={input} />
              </div>
            </div>
          ) : (
            <select value={clientId} onChange={e => setClientId(e.target.value)} className={input}>
              <option value="">Sans client (à compléter plus tard)</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          )}
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-600">{error}</div>
        )}

        <button
          type="submit" disabled={generating || !description.trim()}
          className="w-full rounded-xl bg-green-600 py-4 text-sm font-semibold text-white hover:bg-green-700 transition disabled:opacity-60"
        >
          {generating ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              L'IA analyse votre chantier...
            </span>
          ) : '✨ Générer le devis →'}
        </button>
        <p className="text-xs text-gray-400 text-center">Généré par Claude Sonnet · Environ 10-20 secondes</p>
      </form>
    </div>
  )
}
