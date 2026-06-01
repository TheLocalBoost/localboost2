'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

interface LigneFacture {
  id: string
  description: string
  quantite: number
  unite: string
  prix_unitaire_ht: number
  taux_tva: number
  total_ht: number
}

const STATUTS_LABELS: Record<string, { label: string; color: string }> = {
  brouillon:  { label: 'Brouillon',   color: 'bg-gray-100 text-gray-600'     },
  emise:      { label: 'Émise',       color: 'bg-blue-100 text-blue-700'     },
  envoyee:    { label: 'Envoyée',     color: 'bg-indigo-100 text-indigo-700' },
  vue:        { label: 'Vue',         color: 'bg-purple-100 text-purple-700' },
  payee:      { label: 'Payée',       color: 'bg-green-100 text-green-700'   },
  retard:     { label: 'En retard',   color: 'bg-red-100 text-red-600'       },
  litigieuse: { label: 'Litigieuse',  color: 'bg-orange-100 text-orange-700' },
}

const STATUTS_EDITABLES = ['brouillon', 'emise', 'envoyee', 'vue', 'payee', 'retard', 'litigieuse']
const UNITES = ['m²', 'ml', 'h', 'forfait', 'u', 'm³', 'kg', 'j', 'ml']
const TAUX_TVA = [0, 5.5, 10, 20]

function uid() { return Math.random().toString(36).slice(2) }

function fmt(n: number) {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
}

export default function FactureEditorPage() {
  const { id }  = useParams<{ id: string }>()
  const router  = useRouter()

  const [facture, setFacture]   = useState<any>(null)
  const [lignes, setLignes]     = useState<LigneFacture[]>([])
  const [saving, setSaving]     = useState(false)
  const [sending, setSending]   = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [saved, setSaved]       = useState(false)
  const [confirmPayee, setConfirmPayee] = useState(false)

  const [form, setForm] = useState({
    titre:             '',
    conditions_paiement: '',
    date_echeance:     '',
    client_b2b:        false,
    client_siren:      '',
    bon_commande:      '',
    adresse_livraison: '',
    nature_transaction: 'prestation',
    rib_iban:          '',
    rib_bic:           '',
    rib_banque:        '',
    penalites_retard:  'Pénalités de retard : taux légal × 3 en cas de retard de paiement.',
    escompte:          'Pas d\'escompte pour règlement anticipé.',
  })

  const isLocked = facture?.statut && facture.statut !== 'brouillon'

  useEffect(() => {
    fetch(`/api/factureboost/create?id=${id}`)
      .then(r => r.json())
      .then(data => {
        setFacture(data)
        setLignes((data.lignes ?? []).map((l: any) => ({ ...l, id: l.id ?? uid() })))
        setForm({
          titre:               data.titre ?? '',
          conditions_paiement: data.conditions_paiement ?? '',
          date_echeance:       data.date_echeance?.slice(0, 10) ?? '',
          client_b2b:          data.client_b2b ?? false,
          client_siren:        data.client_siren ?? '',
          bon_commande:        data.bon_commande ?? '',
          adresse_livraison:   data.adresse_livraison ?? '',
          nature_transaction:  data.nature_transaction ?? 'prestation',
          rib_iban:            data.rib?.iban ?? '',
          rib_bic:             data.rib?.bic ?? '',
          rib_banque:          data.rib?.banque ?? '',
          penalites_retard:    data.penalites_retard ?? 'Pénalités de retard : taux légal × 3 en cas de retard de paiement.',
          escompte:            data.escompte ?? 'Pas d\'escompte pour règlement anticipé.',
        })
      })
  }, [id])

  const totaux = useCallback(() => {
    const tvaMap: Record<number, { base: number; montant: number }> = {}
    let total_ht = 0
    for (const l of lignes) {
      total_ht += l.total_ht
      const taux = l.taux_tva ?? 0
      if (!tvaMap[taux]) tvaMap[taux] = { base: 0, montant: 0 }
      tvaMap[taux].base    += l.total_ht
      tvaMap[taux].montant += parseFloat((l.total_ht * taux / 100).toFixed(2))
    }
    const tva_details = Object.entries(tvaMap)
      .filter(([, v]) => v.base > 0)
      .map(([taux, v]) => ({ taux: Number(taux), ...v }))
    const total_tva = tva_details.reduce((s, t) => s + t.montant, 0)
    return {
      total_ht:   parseFloat(total_ht.toFixed(2)),
      tva_details,
      total_tva:  parseFloat(total_tva.toFixed(2)),
      total_ttc:  parseFloat((total_ht + total_tva).toFixed(2)),
    }
  }, [lignes])

  function updateLigne(lid: string, key: keyof LigneFacture, val: any) {
    setLignes(ls => ls.map(l => {
      if (l.id !== lid) return l
      const updated = { ...l, [key]: val }
      if (key === 'quantite' || key === 'prix_unitaire_ht') {
        updated.total_ht = parseFloat(((updated.quantite || 0) * (updated.prix_unitaire_ht || 0)).toFixed(2))
      }
      return updated
    }))
  }

  function addLigne() {
    setLignes(ls => [...ls, { id: uid(), description: '', quantite: 1, unite: 'forfait', prix_unitaire_ht: 0, taux_tva: 20, total_ht: 0 }])
  }

  function removeLigne(lid: string) {
    setLignes(ls => ls.filter(l => l.id !== lid))
  }

  async function save(newStatut?: string) {
    setSaving(true)
    const t = totaux()
    const body: any = {
      ...form,
      lignes,
      ...t,
      rib: form.rib_iban ? { iban: form.rib_iban, bic: form.rib_bic, banque: form.rib_banque } : null,
    }
    if (newStatut) body.statut = newStatut
    const r = await fetch(`/api/factureboost/create?id=${id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    })
    const updated = await r.json()
    setFacture(updated)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    return updated
  }

  async function emettre() {
    if (!confirm('Émettre cette facture ? Elle ne pourra plus être modifiée.')) return
    await save('emise')
  }

  async function downloadPDF() {
    setPdfLoading(true)
    await save()
    const r = await fetch('/api/factureboost/generate-pdf', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ facture_id: id }),
    })
    const blob = await r.blob()
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url
    a.download = `facture-${facture?.numero}.pdf`
    a.click()
    URL.revokeObjectURL(url)
    setPdfLoading(false)
  }

  async function sendEmail() {
    if (!confirm('Envoyer cette facture par email au client ?')) return
    setSending(true)
    await save()
    const r = await fetch('/api/factureboost/send', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ facture_id: id }),
    })
    const d = await r.json()
    if (d.error) { alert('Erreur : ' + d.error) }
    else {
      setFacture((prev: any) => ({ ...prev, statut: 'envoyee' }))
      alert('Facture envoyée au client !')
    }
    setSending(false)
  }

  async function marquerPayee() {
    setConfirmPayee(false)
    await fetch(`/api/factureboost/${id}/statut`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ statut: 'payee' }),
    })
    setFacture((prev: any) => ({ ...prev, statut: 'payee' }))
  }

  async function activerStripe() {
    const r = await fetch('/api/factureboost/create?id=' + id + '&action=stripe', { method: 'POST' })
    const d = await r.json()
    if (d.stripe_payment_link) {
      setFacture((prev: any) => ({ ...prev, stripe_payment_link: d.stripe_payment_link }))
      alert('Lien de paiement créé : ' + d.stripe_payment_link)
    }
  }

  const t = totaux()
  const inputCls = 'w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none'
  const inputLocked = `${inputCls} bg-gray-50 cursor-not-allowed`

  if (!facture) {
    return <div className="text-center py-16 text-gray-400">Chargement...</div>
  }

  const statut = STATUTS_LABELS[facture.statut]

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <button onClick={() => router.push('/factureboost/dashboard')} className="text-sm text-gray-400 hover:text-gray-600">
              ← Mes factures
            </button>
            <span className="text-gray-300">/</span>
            <span className="text-sm font-mono text-gray-500">{facture.numero}</span>
            {facture.type === 'avoir' && (
              <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">Avoir</span>
            )}
          </div>
          <h1 className="text-xl font-bold text-gray-900">{form.titre || 'Facture sans titre'}</h1>
          {isLocked && (
            <p className="text-xs text-amber-600 mt-1">
              🔒 Facture émise — non modifiable. Créez un avoir pour toute correction.
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-end">
          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${statut?.color ?? 'bg-gray-100 text-gray-600'}`}>
            {statut?.label ?? facture.statut}
          </span>

          {facture.statut === 'brouillon' && (
            <button
              onClick={emettre}
              className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 transition"
            >
              📤 Émettre
            </button>
          )}

          <button
            onClick={downloadPDF}
            disabled={pdfLoading}
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition"
          >
            {pdfLoading ? '...' : '📥 PDF'}
          </button>

          {facture.statut !== 'brouillon' && facture.statut !== 'payee' && (
            <button
              onClick={sendEmail}
              disabled={sending}
              className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100 disabled:opacity-50 transition"
            >
              {sending ? '...' : '📧 Envoyer'}
            </button>
          )}

          {!['brouillon', 'payee'].includes(facture.statut) && (
            <button
              onClick={() => setConfirmPayee(true)}
              className="rounded-xl border border-green-200 bg-green-50 px-4 py-2 text-sm font-medium text-green-700 hover:bg-green-100 transition"
            >
              ✅ Marquer payée
            </button>
          )}

          {['emise', 'envoyee', 'vue', 'retard'].includes(facture.statut) && !facture.avoir_de && (
            <Link
              href={`/factureboost/${id}/avoir`}
              className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-medium text-orange-700 hover:bg-orange-100 transition"
            >
              📝 Créer un avoir
            </Link>
          )}

          {!isLocked && (
            <button
              onClick={() => save()}
              disabled={saving}
              className="rounded-xl bg-orange-500 px-5 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50 transition"
            >
              {saving ? '...' : saved ? '✅ Sauvegardé' : 'Sauvegarder'}
            </button>
          )}
        </div>
      </div>

      {/* Modal confirmation payée */}
      {confirmPayee && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="font-bold text-gray-900 mb-2">Marquer comme payée ?</h3>
            <p className="text-sm text-gray-500 mb-5">
              La facture {facture.numero} sera définitivement marquée comme payée. Cette action ne peut pas être annulée.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmPayee(false)} className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm text-gray-600 hover:bg-gray-50">
                Annuler
              </button>
              <button onClick={marquerPayee} className="flex-1 rounded-xl bg-green-600 py-2.5 text-sm font-semibold text-white hover:bg-green-700">
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid sm:grid-cols-3 gap-5">
        {/* Colonne principale */}
        <div className="sm:col-span-2 space-y-5">

          {/* Infos générales */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1.5">Titre</label>
              <input
                value={form.titre}
                onChange={e => setForm(f => ({ ...f, titre: e.target.value }))}
                disabled={isLocked}
                className={isLocked ? inputLocked : inputCls}
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1.5">Date d'échéance</label>
                <input
                  type="date"
                  value={form.date_echeance}
                  onChange={e => setForm(f => ({ ...f, date_echeance: e.target.value }))}
                  disabled={isLocked}
                  className={isLocked ? inputLocked : inputCls}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1.5">Conditions de paiement</label>
                <input
                  value={form.conditions_paiement}
                  onChange={e => setForm(f => ({ ...f, conditions_paiement: e.target.value }))}
                  disabled={isLocked}
                  placeholder="Ex : 30 jours net"
                  className={isLocked ? inputLocked : inputCls}
                />
              </div>
            </div>
          </div>

          {/* Tableau des lignes */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900 text-sm">Détail des prestations</h2>
              {!isLocked && (
                <button onClick={addLigne} className="text-xs text-orange-600 font-medium hover:underline">
                  + Ajouter une ligne
                </button>
              )}
            </div>

            <div className="grid grid-cols-12 gap-1 px-4 py-2 bg-gray-50 text-xs font-semibold text-gray-500 border-b border-gray-100">
              <span className="col-span-4">Description</span>
              <span className="col-span-1 text-center">Qté</span>
              <span className="col-span-1 text-center">Unité</span>
              <span className="col-span-2 text-right">P.U. HT</span>
              <span className="col-span-1 text-center">TVA</span>
              <span className="col-span-2 text-right">Total HT</span>
              <span className="col-span-1"></span>
            </div>

            <div className="divide-y divide-gray-50">
              {lignes.map(l => (
                <div key={l.id} className="grid grid-cols-12 gap-1 px-4 py-2 items-center">
                  <input
                    value={l.description}
                    onChange={e => updateLigne(l.id, 'description', e.target.value)}
                    disabled={isLocked}
                    placeholder="Description..."
                    className="col-span-4 rounded border border-transparent hover:border-gray-200 focus:border-orange-400 px-2 py-1 text-sm focus:outline-none disabled:bg-transparent"
                  />
                  <input
                    type="number" value={l.quantite} min={0} step={0.01}
                    onChange={e => updateLigne(l.id, 'quantite', parseFloat(e.target.value) || 0)}
                    disabled={isLocked}
                    className="col-span-1 rounded border border-transparent hover:border-gray-200 focus:border-orange-400 px-1 py-1 text-sm text-center focus:outline-none disabled:bg-transparent"
                  />
                  <select
                    value={l.unite}
                    onChange={e => updateLigne(l.id, 'unite', e.target.value)}
                    disabled={isLocked}
                    className="col-span-1 rounded border border-transparent hover:border-gray-200 text-xs py-1 px-0.5 focus:outline-none disabled:bg-transparent"
                  >
                    {UNITES.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                  <input
                    type="number" value={l.prix_unitaire_ht} min={0} step={0.01}
                    onChange={e => updateLigne(l.id, 'prix_unitaire_ht', parseFloat(e.target.value) || 0)}
                    disabled={isLocked}
                    className="col-span-2 rounded border border-transparent hover:border-gray-200 focus:border-orange-400 px-2 py-1 text-sm text-right focus:outline-none disabled:bg-transparent"
                  />
                  <select
                    value={l.taux_tva}
                    onChange={e => updateLigne(l.id, 'taux_tva', Number(e.target.value))}
                    disabled={isLocked}
                    className="col-span-1 rounded border border-transparent hover:border-gray-200 text-xs py-1 px-0.5 focus:outline-none disabled:bg-transparent"
                  >
                    {TAUX_TVA.map(tx => <option key={tx} value={tx}>{tx}%</option>)}
                  </select>
                  <div className="col-span-2 text-right text-sm font-semibold text-gray-800 pr-1">
                    {l.total_ht.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                  </div>
                  {!isLocked ? (
                    <button onClick={() => removeLigne(l.id)} className="col-span-1 text-gray-300 hover:text-red-400 text-center text-lg leading-none">×</button>
                  ) : <div className="col-span-1" />}
                </div>
              ))}
            </div>

            {lignes.length === 0 && (
              <div className="text-center py-8 text-gray-400 text-sm">
                Aucune prestation. {!isLocked && 'Cliquez sur "+ Ajouter une ligne".'}
              </div>
            )}
          </div>

          {/* Mentions légales obligatoires */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Mentions légales obligatoires</p>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1.5">Pénalités de retard</label>
              <input
                value={form.penalites_retard}
                onChange={e => setForm(f => ({ ...f, penalites_retard: e.target.value }))}
                disabled={isLocked}
                className={isLocked ? inputLocked : inputCls}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1.5">Escompte</label>
              <input
                value={form.escompte}
                onChange={e => setForm(f => ({ ...f, escompte: e.target.value }))}
                disabled={isLocked}
                className={isLocked ? inputLocked : inputCls}
              />
            </div>
          </div>

          {/* Mentions 2026 */}
          <div className="bg-amber-50 rounded-2xl border border-amber-200 p-5 space-y-4">
            <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">🆕 Mentions obligatoires 2026</p>
            <div className="flex items-center gap-3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={form.client_b2b} onChange={e => setForm(f => ({ ...f, client_b2b: e.target.checked }))} disabled={isLocked} className="sr-only peer" />
                <div className="w-10 h-5 bg-gray-200 peer-checked:bg-orange-500 rounded-full transition peer-focus:ring-2 peer-focus:ring-orange-300 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5" />
              </label>
              <span className="text-sm text-gray-700">Client professionnel (B2B)</span>
            </div>
            {form.client_b2b && (
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1.5">SIREN client (obligatoire)</label>
                <input value={form.client_siren} onChange={e => setForm(f => ({ ...f, client_siren: e.target.value }))} disabled={isLocked} placeholder="123 456 789" maxLength={11} className={isLocked ? inputLocked : inputCls} />
              </div>
            )}
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1.5">N° bon de commande</label>
              <input value={form.bon_commande} onChange={e => setForm(f => ({ ...f, bon_commande: e.target.value }))} disabled={isLocked} placeholder="BC-2026-001" className={isLocked ? inputLocked : inputCls} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1.5">Adresse de livraison</label>
              <input value={form.adresse_livraison} onChange={e => setForm(f => ({ ...f, adresse_livraison: e.target.value }))} disabled={isLocked} className={isLocked ? inputLocked : inputCls} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1.5">Nature de la transaction</label>
              <select value={form.nature_transaction} onChange={e => setForm(f => ({ ...f, nature_transaction: e.target.value }))} disabled={isLocked} className={isLocked ? inputLocked : inputCls}>
                <option value="prestation">Prestation de service</option>
                <option value="livraison">Livraison de biens</option>
              </select>
            </div>
          </div>

          {/* RIB */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Coordonnées bancaires (virement)</p>
            <div className="grid sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-gray-500 block mb-1.5">IBAN</label>
                <input value={form.rib_iban} onChange={e => setForm(f => ({ ...f, rib_iban: e.target.value }))} disabled={isLocked} placeholder="FR76 1234 5678 9012 3456 7890 123" className={isLocked ? inputLocked : inputCls} />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1.5">BIC</label>
                <input value={form.rib_bic} onChange={e => setForm(f => ({ ...f, rib_bic: e.target.value }))} disabled={isLocked} placeholder="BNPAFRPP" className={isLocked ? inputLocked : inputCls} />
              </div>
              <div className="sm:col-span-3">
                <label className="text-xs font-medium text-gray-500 block mb-1.5">Banque</label>
                <input value={form.rib_banque} onChange={e => setForm(f => ({ ...f, rib_banque: e.target.value }))} disabled={isLocked} placeholder="BNP Paribas" className={isLocked ? inputLocked : inputCls} />
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Totaux */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 sticky top-4">
            <h2 className="font-semibold text-gray-900 mb-4 text-sm">Récapitulatif</h2>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total HT</span>
                <span className="font-semibold">{fmt(t.total_ht)}</span>
              </div>
              {t.tva_details.map(td => (
                <div key={td.taux} className="flex justify-between text-sm">
                  <span className="text-gray-500">TVA {td.taux}%</span>
                  <span className="font-semibold">{fmt(td.montant)}</span>
                </div>
              ))}
              <div className="flex justify-between bg-orange-50 rounded-xl px-3 py-2.5 mt-2">
                <span className="font-bold text-orange-800">Total TTC</span>
                <span className="font-bold text-orange-600 text-lg">{fmt(t.total_ttc)}</span>
              </div>
              {facture.montant_regle > 0 && (
                <div className="flex justify-between text-sm pt-1">
                  <span className="text-gray-500">Réglé</span>
                  <span className="font-semibold text-green-600">{fmt(facture.montant_regle)}</span>
                </div>
              )}
            </div>

            {/* Infos dates */}
            <div className="border-t border-gray-100 pt-4 space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Émission</span>
                <span className="text-gray-600">{new Date(facture.date_emission).toLocaleDateString('fr-FR')}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Échéance</span>
                <span className={`font-medium ${facture.statut === 'retard' ? 'text-red-600' : 'text-gray-600'}`}>
                  {new Date(form.date_echeance || facture.date_echeance).toLocaleDateString('fr-FR')}
                </span>
              </div>
              {facture.sent_at && (
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Envoyée</span>
                  <span className="text-gray-600">{new Date(facture.sent_at).toLocaleDateString('fr-FR')}</span>
                </div>
              )}
              {facture.opened_at ? (
                <p className="text-xs text-green-600">✓ Ouverte par le client</p>
              ) : facture.sent_at ? (
                <p className="text-xs text-amber-500">⏳ Pas encore ouverte</p>
              ) : null}
              {facture.paid_at && (
                <p className="text-xs text-green-600 font-semibold">✓ Payée le {new Date(facture.paid_at).toLocaleDateString('fr-FR')}</p>
              )}
            </div>

            {/* Client */}
            {facture.client_nom && (
              <div className="border-t border-gray-100 pt-4 mt-4">
                <p className="text-xs font-medium text-gray-500 mb-2">Client</p>
                <p className="text-sm font-semibold text-gray-800">{facture.client_nom}</p>
                {facture.client_email && <p className="text-xs text-gray-400">{facture.client_email}</p>}
                {facture.client_b2b && facture.client_siren && (
                  <p className="text-xs text-gray-400">SIREN : {facture.client_siren}</p>
                )}
              </div>
            )}

            {/* Stripe */}
            <div className="border-t border-gray-100 pt-4 mt-4">
              {facture.stripe_payment_link ? (
                <div>
                  <p className="text-xs text-green-600 font-medium mb-1">✓ Paiement en ligne actif</p>
                  <a href={facture.stripe_payment_link} target="_blank" rel="noreferrer" className="text-xs text-blue-500 underline break-all">
                    Lien de paiement
                  </a>
                </div>
              ) : facture.statut !== 'brouillon' && facture.statut !== 'payee' ? (
                <button
                  onClick={activerStripe}
                  className="w-full text-xs rounded-lg border border-gray-200 px-3 py-2 text-gray-500 hover:bg-gray-50 transition"
                >
                  💳 Activer paiement en ligne
                </button>
              ) : null}
            </div>

            {/* Relances */}
            {(facture.relance_1_at || facture.relance_2_at || facture.relance_3_at) && (
              <div className="border-t border-gray-100 pt-4 mt-4">
                <p className="text-xs font-medium text-gray-500 mb-2">Relances envoyées</p>
                {facture.relance_1_at && <p className="text-xs text-gray-400">Relance 1 · {new Date(facture.relance_1_at).toLocaleDateString('fr-FR')}</p>}
                {facture.relance_2_at && <p className="text-xs text-gray-400">Relance 2 · {new Date(facture.relance_2_at).toLocaleDateString('fr-FR')}</p>}
                {facture.relance_3_at && <p className="text-xs text-red-400">Mise en demeure · {new Date(facture.relance_3_at).toLocaleDateString('fr-FR')}</p>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
