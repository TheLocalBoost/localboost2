'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

function uid() { return Math.random().toString(36).slice(2) }

export default function AvoirPage() {
  const { id }  = useParams<{ id: string }>()
  const router  = useRouter()

  const [facture, setFacture] = useState<any>(null)
  const [lignes, setLignes]   = useState<any[]>([])
  const [motif, setMotif]     = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch(`/api/factureboost/create?id=${id}`)
      .then(r => r.json())
      .then(data => {
        setFacture(data)
        setLignes((data.lignes ?? []).map((l: any) => ({ ...l, id: l.id ?? uid() })))
      })
  }, [id])

  function updateLigne(lid: string, key: string, val: any) {
    setLignes(ls => ls.map(l => {
      if (l.id !== lid) return l
      const updated = { ...l, [key]: val }
      if (key === 'quantite' || key === 'prix_unitaire_ht') {
        updated.total_ht = parseFloat(((updated.quantite || 0) * (updated.prix_unitaire_ht || 0)).toFixed(2))
      }
      return updated
    }))
  }

  const total_ht  = lignes.reduce((s, l) => s + (l.total_ht || 0), 0)
  const total_tva = lignes.reduce((s, l) => s + (l.total_ht || 0) * ((l.taux_tva || 0) / 100), 0)
  const total_ttc = total_ht + total_tva

  async function create() {
    if (!motif.trim()) { alert('Veuillez indiquer le motif de l\'avoir.'); return }
    setLoading(true)
    try {
      const r = await fetch('/api/factureboost/avoir', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ facture_id: id, lignes, motif }),
      })
      const data = await r.json()
      if (data.error) { alert('Erreur : ' + data.error); return }
      router.push(`/factureboost/${data.id}`)
    } finally {
      setLoading(false)
    }
  }

  const inputCls = 'w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none'

  if (!facture) {
    return <div className="text-center py-16 text-gray-400">Chargement...</div>
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <button onClick={() => router.back()} className="text-sm text-gray-400 hover:text-gray-600">
          ← Retour
        </button>
        <span className="text-gray-300">/</span>
        <span className="text-sm text-gray-600 font-medium">Créer un avoir</span>
      </div>

      <div className="flex items-center gap-3 mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Avoir sur {facture.numero}</h1>
        <span className="text-sm bg-orange-100 text-orange-600 px-3 py-1 rounded-full font-medium">Note de crédit</span>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-sm text-amber-800">
        <strong>Important :</strong> L'avoir va créer un document comptable qui annule tout ou partie de la facture {facture.numero}.
        Modifiez les lignes si vous souhaitez un avoir partiel.
      </div>

      {/* Motif */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-5">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">
          Motif de l'avoir <span className="text-red-500">*</span>
        </label>
        <input
          value={motif}
          onChange={e => setMotif(e.target.value)}
          placeholder="Ex : Erreur de facturation, retour marchandise, prestation non réalisée..."
          className={inputCls}
        />
      </div>

      {/* Lignes */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-5">
        <div className="px-5 py-3 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900 text-sm">Lignes de l'avoir</h2>
          <p className="text-xs text-gray-400 mt-0.5">Modifiez les quantités pour un avoir partiel.</p>
        </div>

        <div className="grid grid-cols-12 gap-1 px-4 py-2 bg-gray-50 text-xs font-semibold text-gray-500 border-b border-gray-100">
          <span className="col-span-5">Description</span>
          <span className="col-span-1 text-center">Qté</span>
          <span className="col-span-2 text-right">P.U. HT</span>
          <span className="col-span-1 text-center">TVA</span>
          <span className="col-span-3 text-right">Total HT</span>
        </div>

        <div className="divide-y divide-gray-50">
          {lignes.map(l => (
            <div key={l.id} className="grid grid-cols-12 gap-1 px-4 py-2 items-center">
              <div className="col-span-5 text-sm text-gray-700 pr-2">{l.description}</div>
              <input
                type="number" value={l.quantite} min={0} step={0.01}
                onChange={e => updateLigne(l.id, 'quantite', parseFloat(e.target.value) || 0)}
                className="col-span-1 rounded border border-gray-200 focus:border-orange-400 px-1 py-1 text-sm text-center focus:outline-none"
              />
              <div className="col-span-2 text-right text-sm text-gray-500">
                {l.prix_unitaire_ht.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
              </div>
              <div className="col-span-1 text-center text-xs text-gray-400">{l.taux_tva}%</div>
              <div className="col-span-3 text-right text-sm font-semibold text-orange-600">
                - {l.total_ht.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Totaux */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6">
        <div className="space-y-2 max-w-xs ml-auto">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Total HT</span>
            <span className="font-semibold text-orange-600">- {total_ht.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">TVA</span>
            <span className="font-semibold text-orange-600">- {total_tva.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</span>
          </div>
          <div className="flex justify-between bg-orange-50 rounded-xl px-3 py-2.5">
            <span className="font-bold text-orange-800">Total TTC avoir</span>
            <span className="font-bold text-orange-600 text-lg">- {total_ttc.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</span>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => router.back()}
          className="flex-1 rounded-xl border border-gray-200 py-3 text-sm text-gray-600 hover:bg-gray-50 transition"
        >
          Annuler
        </button>
        <button
          onClick={create}
          disabled={loading}
          className="flex-1 rounded-xl bg-orange-500 py-3 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50 transition"
        >
          {loading ? 'Création...' : 'Créer l\'avoir →'}
        </button>
      </div>
    </div>
  )
}
