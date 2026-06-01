'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'

interface Ligne { id: string; description: string; quantite: number; unite: string; prix_unitaire_ht: number; total_ht: number }

const STATUTS = ['brouillon', 'envoyé', 'accepté', 'refusé', 'expiré']
const UNITES  = ['m²', 'ml', 'h', 'forfait', 'u', 'm³', 'kg', 'ml', 'j']

function uid() { return Math.random().toString(36).slice(2) }

export default function DevisEditorPage() {
  const { id }  = useParams<{ id: string }>()
  const router  = useRouter()
  const [devis, setDevis]     = useState<any>(null)
  const [lignes, setLignes]   = useState<Ligne[]>([])
  const [saving, setSaving]   = useState(false)
  const [sending, setSending] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [saved, setSaved]     = useState(false)
  const [clients, setClients] = useState<any[]>([])
  const [form, setForm]       = useState({
    titre: '', client_id: '', notes: '', conditions: '',
    delai_jours: 5, validite_jours: 30, tva_taux: 10,
  })

  useEffect(() => {
    Promise.all([
      fetch(`/api/devisboost/devis/${id}`).then(r => r.json()),
      fetch('/api/devisboost/clients').then(r => r.json()),
    ]).then(([d, c]) => {
      setDevis(d)
      setClients(c)
      setLignes((d.lignes ?? []).map((l: any) => ({ ...l, id: l.id ?? uid() })))
      setForm({
        titre: d.titre ?? '',
        client_id: d.client_id ?? '',
        notes: d.notes ?? '',
        conditions: d.conditions ?? '',
        delai_jours: d.delai_jours ?? 5,
        validite_jours: d.validite_jours ?? 30,
        tva_taux: d.tva_taux ?? 10,
      })
    })
  }, [id])

  const totals = useCallback(() => {
    const ht  = lignes.reduce((s, l) => s + (l.total_ht || 0), 0)
    const tva = ht * (form.tva_taux / 100)
    return { total_ht: ht, tva_montant: parseFloat(tva.toFixed(2)), total_ttc: parseFloat((ht + tva).toFixed(2)) }
  }, [lignes, form.tva_taux])

  function updateLigne(id: string, key: keyof Ligne, val: any) {
    setLignes(ls => ls.map(l => {
      if (l.id !== id) return l
      const updated = { ...l, [key]: val }
      if (key === 'quantite' || key === 'prix_unitaire_ht') {
        updated.total_ht = parseFloat(((updated.quantite || 0) * (updated.prix_unitaire_ht || 0)).toFixed(2))
      }
      return updated
    }))
  }

  function addLigne() {
    setLignes(ls => [...ls, { id: uid(), description: '', quantite: 1, unite: 'forfait', prix_unitaire_ht: 0, total_ht: 0 }])
  }

  function removeLigne(id: string) {
    setLignes(ls => ls.filter(l => l.id !== id))
  }

  async function save() {
    setSaving(true)
    const t = totals()
    const body = { ...form, lignes, ...t }
    const r = await fetch(`/api/devisboost/devis/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    setDevis(await r.json())
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000)
  }

  async function downloadPDF() {
    setPdfLoading(true)
    await save()
    const r = await fetch('/api/devisboost/pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ devis_id: id }),
    })
    const blob = await r.blob()
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = `devis-${devis?.numero}.pdf`; a.click()
    URL.revokeObjectURL(url)
    setPdfLoading(false)
  }

  async function sendEmail() {
    if (!confirm('Envoyer ce devis par email au client ?')) return
    setSending(true)
    await save()
    const r = await fetch('/api/devisboost/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ devis_id: id }),
    })
    const d = await r.json()
    if (d.error) { alert('Erreur : ' + d.error) }
    else { setDevis((prev: any) => ({ ...prev, statut: 'envoyé' })); alert('Devis envoyé au client !') }
    setSending(false)
  }

  async function changeStatut(statut: string) {
    const r = await fetch(`/api/devisboost/devis/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ statut }),
    })
    setDevis(await r.json())
  }

  const t = totals()
  const input = 'rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:border-green-500 focus:outline-none w-full'

  if (!devis) return (
    <div className="text-center py-16 text-gray-400">Chargement...</div>
  )

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <button onClick={() => router.push('/devisboost/dashboard')} className="text-sm text-gray-400 hover:text-gray-600">← Mes devis</button>
            <span className="text-gray-300">/</span>
            <span className="text-sm font-mono text-gray-500">{devis.numero}</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">{form.titre || 'Devis sans titre'}</h1>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={devis.statut} onChange={e => changeStatut(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none"
          >
            {STATUTS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
          <button onClick={downloadPDF} disabled={pdfLoading}
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50">
            {pdfLoading ? '...' : '📥 PDF'}
          </button>
          <button onClick={sendEmail} disabled={sending || !devis.devisboost_clients?.email}
            className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-50">
            {sending ? '...' : '📧 Envoyer'}
          </button>
          <button onClick={save} disabled={saving}
            className="rounded-xl bg-green-600 px-5 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50">
            {saving ? '...' : saved ? '✅ Sauvegardé' : 'Sauvegarder'}
          </button>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-5">
        {/* Main */}
        <div className="sm:col-span-2 space-y-5">
          {/* Infos générales */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-gray-500 block mb-1">Titre du devis</label>
                <input value={form.titre} onChange={e => setForm(f => ({ ...f, titre: e.target.value }))} className={input} />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Client</label>
                <select value={form.client_id} onChange={e => setForm(f => ({ ...f, client_id: e.target.value }))} className={input}>
                  <option value="">Aucun client</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">TVA (%)</label>
                <select value={form.tva_taux} onChange={e => setForm(f => ({ ...f, tva_taux: Number(e.target.value) }))} className={input}>
                  <option value={10}>10% — Rénovation</option>
                  <option value={20}>20% — Construction neuve</option>
                  <option value={5.5}>5.5% — Travaux d'économie d'énergie</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Délai (jours ouvrés)</label>
                <input type="number" value={form.delai_jours} onChange={e => setForm(f => ({ ...f, delai_jours: +e.target.value }))} className={input} min={1} />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Validité (jours)</label>
                <input type="number" value={form.validite_jours} onChange={e => setForm(f => ({ ...f, validite_jours: +e.target.value }))} className={input} min={1} />
              </div>
            </div>
          </div>

          {/* Lignes */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900 text-sm">Détail des prestations</h2>
              <button onClick={addLigne} className="text-xs text-green-600 font-medium hover:underline">+ Ajouter une ligne</button>
            </div>

            {/* Header tableau */}
            <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-gray-50 text-xs font-semibold text-gray-500 border-b border-gray-100">
              <span className="col-span-4">Description</span>
              <span className="col-span-1 text-center">Qté</span>
              <span className="col-span-2 text-center">Unité</span>
              <span className="col-span-2 text-right">P.U. HT</span>
              <span className="col-span-2 text-right">Total HT</span>
              <span className="col-span-1"></span>
            </div>

            <div className="divide-y divide-gray-50">
              {lignes.map(l => (
                <div key={l.id} className="grid grid-cols-12 gap-2 px-4 py-2 items-center">
                  <input
                    value={l.description}
                    onChange={e => updateLigne(l.id, 'description', e.target.value)}
                    placeholder="Description..."
                    className="col-span-4 rounded border border-transparent hover:border-gray-200 focus:border-green-400 px-2 py-1 text-sm focus:outline-none"
                  />
                  <input
                    type="number" value={l.quantite} min={0} step={0.01}
                    onChange={e => updateLigne(l.id, 'quantite', parseFloat(e.target.value) || 0)}
                    className="col-span-1 rounded border border-transparent hover:border-gray-200 focus:border-green-400 px-2 py-1 text-sm text-center focus:outline-none"
                  />
                  <select
                    value={l.unite}
                    onChange={e => updateLigne(l.id, 'unite', e.target.value)}
                    className="col-span-2 rounded border border-transparent hover:border-gray-200 text-sm py-1 px-1 focus:outline-none"
                  >
                    {UNITES.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                  <input
                    type="number" value={l.prix_unitaire_ht} min={0} step={0.01}
                    onChange={e => updateLigne(l.id, 'prix_unitaire_ht', parseFloat(e.target.value) || 0)}
                    className="col-span-2 rounded border border-transparent hover:border-gray-200 focus:border-green-400 px-2 py-1 text-sm text-right focus:outline-none"
                  />
                  <div className="col-span-2 text-right text-sm font-semibold text-gray-800 pr-2">
                    {l.total_ht.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                  </div>
                  <button onClick={() => removeLigne(l.id)} className="col-span-1 text-gray-300 hover:text-red-400 text-center">×</button>
                </div>
              ))}
            </div>

            {lignes.length === 0 && (
              <div className="text-center py-8 text-gray-400 text-sm">Aucune prestation. Cliquez sur "+ Ajouter une ligne".</div>
            )}
          </div>

          {/* Notes */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1.5">Notes et remarques</label>
              <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                rows={3} className={`${input} resize-none`} placeholder="Précisions, conseils..." />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1.5">Conditions particulières</label>
              <textarea value={form.conditions} onChange={e => setForm(f => ({ ...f, conditions: e.target.value }))}
                rows={2} className={`${input} resize-none`} placeholder="Conditions d'accès chantier, fournitures client..." />
            </div>
          </div>
        </div>

        {/* Sidebar totaux */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 sticky top-4">
            <h2 className="font-semibold text-gray-900 mb-4 text-sm">Récapitulatif</h2>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total HT</span>
                <span className="font-semibold">{t.total_ht.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">TVA ({form.tva_taux}%)</span>
                <span className="font-semibold">{t.tva_montant.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</span>
              </div>
              <div className="flex justify-between bg-green-50 rounded-xl px-3 py-2.5 mt-2">
                <span className="font-bold text-green-800">Total TTC</span>
                <span className="font-bold text-green-700 text-lg">{t.total_ttc.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</span>
              </div>
            </div>

            {devis.devisboost_clients && (
              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs font-medium text-gray-500 mb-2">Client</p>
                <p className="text-sm font-semibold text-gray-800">{devis.devisboost_clients.name}</p>
                {devis.devisboost_clients.email && <p className="text-xs text-gray-400">{devis.devisboost_clients.email}</p>}
                {devis.devisboost_clients.phone && <p className="text-xs text-gray-400">{devis.devisboost_clients.phone}</p>}
              </div>
            )}

            {devis.statut === 'envoyé' && (
              <div className="border-t border-gray-100 pt-4 mt-4">
                <div className="space-y-1">
                  {devis.sent_at && <p className="text-xs text-gray-400">Envoyé le {new Date(devis.sent_at).toLocaleDateString('fr-FR')}</p>}
                  {devis.opened_at ? (
                    <p className="text-xs text-green-600">✓ Ouvert le {new Date(devis.opened_at).toLocaleDateString('fr-FR')}</p>
                  ) : (
                    <p className="text-xs text-amber-500">⏳ Pas encore ouvert</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
