'use client'

import { useState, useEffect } from 'react'

export default function ClientsPage() {
  const [clients, setClients]   = useState<any[]>([])
  const [editing, setEditing]   = useState<any | null>(null)
  const [form, setForm]         = useState({ name: '', email: '', phone: '', address: '' })
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    const r = await fetch('/api/devisboost/clients')
    setClients(await r.json())
    setLoading(false)
  }

  function startEdit(c?: any) {
    setEditing(c ?? 'new')
    setForm(c ? { name: c.name, email: c.email ?? '', phone: c.phone ?? '', address: c.address ?? '' } : { name: '', email: '', phone: '', address: '' })
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    if (editing === 'new') {
      const r = await fetch('/api/devisboost/clients', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      })
      const created = await r.json()
      setClients(c => [...c, created])
    } else {
      const r = await fetch('/api/devisboost/clients', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editing.id, ...form }),
      })
      const updated = await r.json()
      setClients(c => c.map(x => x.id === updated.id ? updated : x))
    }
    setEditing(null); setSaving(false)
  }

  async function remove(id: string) {
    if (!confirm('Supprimer ce client ?')) return
    await fetch('/api/devisboost/clients', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    setClients(c => c.filter(x => x.id !== id))
  }

  const input = 'w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20'

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
        <button onClick={() => startEdit()} className="rounded-xl bg-green-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-700">
          + Nouveau client
        </button>
      </div>

      {/* Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">{editing === 'new' ? 'Nouveau client' : 'Modifier le client'}</h3>
            <form onSubmit={save} className="space-y-3">
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required placeholder="Nom du client *" className={input} />
              <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} type="email" placeholder="Email" className={input} />
              <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="Téléphone" className={input} />
              <input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Adresse" className={input} />
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditing(null)} className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50">Annuler</button>
                <button type="submit" disabled={saving} className="flex-1 rounded-xl bg-green-600 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50">
                  {saving ? '...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-400">Chargement...</div>
      ) : clients.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="mb-4">Aucun client enregistré.</p>
          <button onClick={() => startEdit()} className="rounded-xl bg-green-600 px-6 py-3 text-sm font-semibold text-white hover:bg-green-700">
            Ajouter mon premier client →
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100 bg-gray-50">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Nom</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Email</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Téléphone</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Adresse</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {clients.map(c => (
                <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium text-gray-800">{c.name}</td>
                  <td className="px-5 py-3 text-gray-500">{c.email ?? '—'}</td>
                  <td className="px-5 py-3 text-gray-500">{c.phone ?? '—'}</td>
                  <td className="px-5 py-3 text-gray-500 max-w-[180px] truncate">{c.address ?? '—'}</td>
                  <td className="px-5 py-3">
                    <div className="flex gap-3 justify-end">
                      <button onClick={() => startEdit(c)} className="text-xs text-green-600 hover:underline">Modifier</button>
                      <button onClick={() => remove(c.id)} className="text-xs text-red-400 hover:text-red-600">Suppr.</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
