'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const STATUTS: Record<string, { label: string; color: string }> = {
  brouillon:  { label: 'Brouillon',    color: 'bg-gray-100 text-gray-600'    },
  emise:      { label: 'Émise',        color: 'bg-blue-100 text-blue-700'    },
  envoyee:    { label: 'Envoyée',      color: 'bg-indigo-100 text-indigo-700' },
  vue:        { label: 'Vue',          color: 'bg-purple-100 text-purple-700' },
  payee:      { label: 'Payée',        color: 'bg-green-100 text-green-700'  },
  retard:     { label: 'En retard',    color: 'bg-red-100 text-red-600'      },
  litigieuse: { label: 'Litigieuse',   color: 'bg-orange-100 text-orange-700' },
}

export default function FactureDashboard() {
  const router = useRouter()
  const [factures, setFactures] = useState<any[]>([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [filter, setFilter]     = useState('')
  const [mois, setMois]         = useState('')

  useEffect(() => { load() }, [filter, mois])

  async function load() {
    setLoading(true)
    const p = new URLSearchParams()
    if (filter) p.set('statut', filter)
    if (mois)   p.set('mois', mois)
    if (search) p.set('q', search)
    const r = await fetch(`/api/factureboost/create?${p}`)
    setFactures(await r.json())
    setLoading(false)
  }

  const now   = new Date()
  const debut = new Date(now.getFullYear(), now.getMonth(), 1)
  const fin   = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  const duMois = factures.filter(f => {
    const d = new Date(f.date_emission)
    return d >= debut && d <= fin && f.type === 'facture'
  })

  const kpis = {
    facture:  duMois.reduce((s, f) => s + f.total_ttc, 0),
    encaisse: duMois.filter(f => f.statut === 'payee').reduce((s, f) => s + f.total_ttc, 0),
    attente:  duMois.filter(f => ['emise','envoyee','vue'].includes(f.statut)).reduce((s, f) => s + f.total_ttc, 0),
    retard:   factures.filter(f => f.statut === 'retard').reduce((s, f) => s + f.total_ttc, 0),
  }

  function fmt(n: number) {
    return n.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) + ' €'
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mes factures</h1>
        <Link
          href="/factureboost/nouvelle"
          className="rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 transition"
        >
          ✨ Nouvelle facture
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Facturé ce mois',  value: fmt(kpis.facture),  color: 'text-gray-900'   },
          { label: 'Encaissé',         value: fmt(kpis.encaisse), color: 'text-green-600'  },
          { label: 'En attente',       value: fmt(kpis.attente),  color: 'text-blue-600'   },
          { label: 'En retard',        value: fmt(kpis.retard),   color: 'text-red-500'    },
        ].map((k, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 text-center">
            <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
            <p className="text-xs text-gray-500 mt-1">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && load()}
          placeholder="Rechercher par n° ou client..."
          className="flex-1 min-w-[200px] rounded-xl border border-gray-200 px-4 py-2 text-sm focus:border-orange-400 focus:outline-none"
        />
        <select
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none"
        >
          <option value="">Tous les statuts</option>
          {Object.entries(STATUTS).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
        <input
          type="month"
          value={mois}
          onChange={e => setMois(e.target.value)}
          className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none"
        />
        <a
          href="/api/factureboost/export-csv"
          className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
        >
          📊 Export CSV
        </a>
      </div>

      {/* Liste */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Chargement...</div>
      ) : factures.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-4">🧾</p>
          <p className="text-gray-400 mb-4">Aucune facture pour l'instant.</p>
          <Link
            href="/factureboost/nouvelle"
            className="rounded-xl bg-orange-500 px-6 py-3 text-sm font-semibold text-white hover:bg-orange-600"
          >
            Créer ma première facture →
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
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Échéance</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Statut</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {factures.map(f => {
                const isAvoir    = f.type === 'avoir'
                const isRetard   = f.statut === 'retard'
                return (
                  <tr key={f.id} className={`border-b border-gray-50 hover:bg-gray-50 transition ${isRetard ? 'bg-red-50/30' : ''}`}>
                    <td className="px-5 py-3">
                      <span className="font-mono text-xs text-gray-500">{f.numero}</span>
                      {isAvoir && <span className="ml-1.5 text-xs bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full">Avoir</span>}
                    </td>
                    <td className="px-5 py-3 font-medium text-gray-800">{f.client_nom ?? '—'}</td>
                    <td className="px-5 py-3 text-gray-600 max-w-[180px] truncate">{f.titre}</td>
                    <td className="px-5 py-3 text-right font-semibold text-gray-900">
                      {isAvoir && <span className="text-red-500 mr-0.5">-</span>}
                      {f.total_ttc.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-400">
                      {new Date(f.date_echeance).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUTS[f.statut]?.color ?? 'bg-gray-100 text-gray-600'}`}>
                        {STATUTS[f.statut]?.label ?? f.statut}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <Link href={`/factureboost/${f.id}`} className="text-xs text-orange-600 hover:underline">
                        Ouvrir
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
