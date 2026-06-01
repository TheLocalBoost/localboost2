'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function NouvelleFactureForm() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const devisId      = searchParams.get('devis_id')

  const [clients, setClients]   = useState<any[]>([])
  const [devis, setDevis]       = useState<any[]>([])
  const [loading, setLoading]   = useState(false)
  const [source, setSource]     = useState<'devis' | 'scratch'>(devisId ? 'devis' : 'scratch')
  const [selectedDevis, setSelectedDevis] = useState(devisId ?? '')
  const [form, setForm] = useState({
    client_id:         '',
    titre:             '',
    client_b2b:        false,
    client_siren:      '',
    bon_commande:      '',
    adresse_livraison: '',
    nature_transaction: 'prestation' as 'prestation' | 'livraison',
    echeance_jours:    30,
  })

  useEffect(() => {
    Promise.all([
      fetch('/api/devisboost/clients').then(r => r.json()),
      fetch('/api/devisboost/devis?statut=accepté').then(r => r.json()),
    ]).then(([c, d]) => {
      setClients(c)
      setDevis(d)
    })
  }, [])

  // Pré-remplissage si devis sélectionné
  useEffect(() => {
    if (!selectedDevis) return
    const d = devis.find(x => x.id === selectedDevis)
    if (!d) return
    setForm(f => ({
      ...f,
      client_id: d.client_id ?? '',
      titre:     d.titre ?? '',
    }))
  }, [selectedDevis, devis])

  async function create() {
    setLoading(true)
    try {
      const body: any = { ...form }
      if (source === 'devis' && selectedDevis) {
        body.devis_id = selectedDevis
      }
      const r = await fetch('/api/factureboost/create', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      })
      const data = await r.json()
      if (data.error) { alert('Erreur : ' + data.error); return }
      router.push(`/factureboost/${data.id}`)
    } finally {
      setLoading(false)
    }
  }

  const input = 'w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-400/20'

  return (
    <div className="max-w-xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <button onClick={() => router.push('/factureboost/dashboard')} className="text-sm text-gray-400 hover:text-gray-600">
          ← Mes factures
        </button>
        <span className="text-gray-300">/</span>
        <span className="text-sm text-gray-600 font-medium">Nouvelle facture</span>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-8">Créer une facture</h1>

      {/* Source */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Point de départ</p>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setSource('devis')}
            className={`rounded-xl border-2 p-4 text-left transition ${source === 'devis' ? 'border-orange-400 bg-orange-50' : 'border-gray-100 hover:border-gray-200'}`}
          >
            <div className="text-2xl mb-1">📋</div>
            <p className="font-semibold text-sm text-gray-900">Depuis un devis accepté</p>
            <p className="text-xs text-gray-500 mt-0.5">Reprend toutes les lignes automatiquement</p>
          </button>
          <button
            onClick={() => setSource('scratch')}
            className={`rounded-xl border-2 p-4 text-left transition ${source === 'scratch' ? 'border-orange-400 bg-orange-50' : 'border-gray-100 hover:border-gray-200'}`}
          >
            <div className="text-2xl mb-1">✏️</div>
            <p className="font-semibold text-sm text-gray-900">Nouvelle facture vierge</p>
            <p className="text-xs text-gray-500 mt-0.5">Saisie manuelle des prestations</p>
          </button>
        </div>

        {source === 'devis' && (
          <div className="mt-4">
            <label className="text-xs font-medium text-gray-500 block mb-1.5">Devis accepté à convertir</label>
            <select
              value={selectedDevis}
              onChange={e => setSelectedDevis(e.target.value)}
              className={input}
            >
              <option value="">Sélectionner un devis...</option>
              {devis.map(d => (
                <option key={d.id} value={d.id}>
                  {d.numero} — {d.titre} ({d.total_ttc?.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} € TTC)
                </option>
              ))}
            </select>
            {devis.length === 0 && (
              <p className="text-xs text-amber-600 mt-2">Aucun devis accepté. Acceptez un devis dans DevisBoost d'abord.</p>
            )}
          </div>
        )}
      </div>

      {/* Infos générales */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-5 space-y-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Informations</p>
        <div>
          <label className="text-xs font-medium text-gray-500 block mb-1.5">Titre de la facture</label>
          <input
            value={form.titre}
            onChange={e => setForm(f => ({ ...f, titre: e.target.value }))}
            placeholder="Ex : Rénovation salle de bain – M. Dupont"
            className={input}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 block mb-1.5">Client</label>
          <select
            value={form.client_id}
            onChange={e => setForm(f => ({ ...f, client_id: e.target.value }))}
            className={input}
          >
            <option value="">Sélectionner un client...</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 block mb-1.5">Délai de paiement (jours)</label>
          <input
            type="number"
            value={form.echeance_jours}
            onChange={e => setForm(f => ({ ...f, echeance_jours: +e.target.value }))}
            min={0}
            className={input}
          />
        </div>
      </div>

      {/* Mentions légales 2026 */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-5 space-y-4">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Mentions obligatoires 2026</p>
          <p className="text-xs text-amber-600">Obligatoires à partir du 1er septembre 2026 pour les factures B2B</p>
        </div>

        <div className="flex items-center gap-3">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={form.client_b2b}
              onChange={e => setForm(f => ({ ...f, client_b2b: e.target.checked }))}
              className="sr-only peer"
            />
            <div className="w-10 h-5 bg-gray-200 peer-checked:bg-orange-500 rounded-full transition peer-focus:ring-2 peer-focus:ring-orange-300 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5" />
          </label>
          <span className="text-sm text-gray-700">Client professionnel (B2B)</span>
        </div>

        {form.client_b2b && (
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1.5">SIREN du client (obligatoire B2B)</label>
            <input
              value={form.client_siren}
              onChange={e => setForm(f => ({ ...f, client_siren: e.target.value }))}
              placeholder="123 456 789"
              maxLength={11}
              className={input}
            />
          </div>
        )}

        <div>
          <label className="text-xs font-medium text-gray-500 block mb-1.5">Numéro de bon de commande</label>
          <input
            value={form.bon_commande}
            onChange={e => setForm(f => ({ ...f, bon_commande: e.target.value }))}
            placeholder="BC-2026-001 (si applicable)"
            className={input}
          />
        </div>

        <div>
          <label className="text-xs font-medium text-gray-500 block mb-1.5">Adresse de livraison des biens</label>
          <input
            value={form.adresse_livraison}
            onChange={e => setForm(f => ({ ...f, adresse_livraison: e.target.value }))}
            placeholder="Si différente de l'adresse du client"
            className={input}
          />
        </div>

        <div>
          <label className="text-xs font-medium text-gray-500 block mb-1.5">Nature de la transaction</label>
          <select
            value={form.nature_transaction}
            onChange={e => setForm(f => ({ ...f, nature_transaction: e.target.value as any }))}
            className={input}
          >
            <option value="prestation">Prestation de service</option>
            <option value="livraison">Livraison de biens</option>
          </select>
        </div>
      </div>

      <button
        onClick={create}
        disabled={loading || (source === 'devis' && !selectedDevis)}
        className="w-full rounded-xl bg-orange-500 py-4 text-sm font-semibold text-white hover:bg-orange-600 transition disabled:opacity-50"
      >
        {loading ? 'Création en cours...' : 'Créer la facture →'}
      </button>
    </div>
  )
}

export default function NouvellePage() {
  return (
    <Suspense fallback={<div className="text-center py-16 text-gray-400">Chargement...</div>}>
      <NouvelleFactureForm />
    </Suspense>
  )
}
