'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const STATUTS: Record<string, { label: string; color: string }> = {
  brouillon: { label: 'Brouillon',  color: 'bg-gray-100 text-gray-600'   },
  envoyé:    { label: 'Envoyé',     color: 'bg-blue-100 text-blue-700'   },
  accepté:   { label: 'Accepté',    color: 'bg-green-100 text-green-700' },
  refusé:    { label: 'Refusé',     color: 'bg-red-100 text-red-600'     },
  expiré:    { label: 'Expiré',     color: 'bg-amber-100 text-amber-700' },
}

export default function DashboardPage() {
  const router = useRouter()
  const [devis, setDevis]     = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [filter, setFilter]   = useState('')

  useEffect(() => { load() }, [filter])

  async function load() {
    setLoading(true)
    const params = new URLSearchParams()
    if (filter) params.set('statut', filter)
    if (search) params.set('q', search)
    const r = await fetch(`/api/devisboost/devis?${params}`)
    setDevis(await r.json())
    setLoading(false)
  }

  async function duplicate(d: any) {
    const r = await fetch('/api/devisboost/devis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        titre: `${d.titre} (copie)`,
        client_id: d.client_id,
        lignes: d.lignes,
        total_ht: d.total_ht, tva_taux: d.tva_taux,
        tva_montant: d.tva_montant, total_ttc: d.total_ttc,
        delai_jours: d.delai_jours, validite_jours: d.validite_jours,
        notes: d.notes, conditions: d.conditions,
        description_chantier: d.description_chantier,
      }),
    })
    const copy = await r.json()
    router.push(`/devisboost/devis/${copy.id}`)
  }

  async function remove(id: string) {
    if (!confirm('Supprimer ce devis ?')) return
    await fetch(`/api/devisboost/devis/${id}`, { method: 'DELETE' })
    setDevis(d => d.filter(x => x.id !== id))
  }

  const stats = {
    total:     devis.length,
    caHT:      devis.filter(d => d.statut === 'accepté').reduce((s, d) => s + d.total_ht, 0),
    acceptes:  devis.filter(d => d.statut === 'accepté').length,
    enAttente: devis.filter(d => d.statut === 'envoyé').length,
  }
  const tauxAcceptation = stats.total > 0
    ? Math.round((stats.acceptes / (devis.filter(d => ['accepté','refusé'].includes(d.statut)).length || 1)) * 100)
    : 0

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mes devis</h1>
        <Link href="/devisboost/nouveau" className="rounded-xl bg-green-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-700 transition">
          ✨ Nouveau devis
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total devis',    value: stats.total,                                        color: 'text-gray-900'  },
          { label: 'CA HT accepté', value: stats.caHT.toLocaleString('fr-FR') + ' €',          color: 'text-green-600' },
          { label: 'Taux acceptation', value: `${tauxAcceptation}%`,                           color: 'text-blue-600'  },
          { label: 'En attente',    value: stats.enAttente,                                    color: 'text-amber-600' },
        ].map((k, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 text-center">
            <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
            <p className="text-xs text-gray-500 mt-1">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div className="flex gap-3 mb-5">
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && load()}
          placeholder="Rechercher un devis..."
          className="flex-1 rounded-xl border border-gray-200 px-4 py-2 text-sm focus:border-green-500 focus:outline-none"
        />
        <select
          value={filter} onChange={e => setFilter(e.target.value)}
          className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
        >
          <option value="">Tous</option>
          {Object.entries(STATUTS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {/* Liste */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Chargement...</div>
      ) : devis.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-400 mb-4">Aucun devis pour l'instant.</p>
          <Link href="/devisboost/nouveau" className="rounded-xl bg-green-600 px-6 py-3 text-sm font-semibold text-white hover:bg-green-700">
            Créer mon premier devis →
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100 bg-gray-50">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Numéro</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Client</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Titre</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500">Total TTC</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Statut</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Date</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {devis.map(d => (
                <tr key={d.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                  <td className="px-5 py-3 font-mono text-xs text-gray-500">{d.numero}</td>
                  <td className="px-5 py-3 font-medium text-gray-800">{d.devisboost_clients?.name ?? '—'}</td>
                  <td className="px-5 py-3 text-gray-600 max-w-[200px] truncate">{d.titre}</td>
                  <td className="px-5 py-3 text-right font-semibold text-gray-900">
                    {d.total_ttc.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUTS[d.statut]?.color ?? 'bg-gray-100 text-gray-600'}`}>
                      {STATUTS[d.statut]?.label ?? d.statut}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-400 text-xs">
                    {new Date(d.created_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex gap-2 justify-end">
                      <Link href={`/devisboost/devis/${d.id}`} className="text-xs text-green-600 hover:underline">Ouvrir</Link>
                      <button onClick={() => duplicate(d)} className="text-xs text-gray-400 hover:text-gray-600">Dupliquer</button>
                      <button onClick={() => remove(d.id)} className="text-xs text-red-400 hover:text-red-600">Suppr.</button>
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
