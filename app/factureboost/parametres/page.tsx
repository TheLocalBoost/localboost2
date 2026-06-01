'use client'

import { useState, useEffect } from 'react'

export default function ParametresPage() {
  const [form, setForm] = useState({
    iban:               '',
    bic:                '',
    banque:             '',
    tva_number:         '',
    siren:              '',
    micro_entrepreneur: false,
    penalites_retard:   'Pénalités de retard : taux légal × 3 en cas de retard de paiement.',
    escompte:           'Pas d\'escompte pour règlement anticipé.',
    chorus_pro_email:   '',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved]   = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/factureboost/profile')
      .then(r => r.json())
      .then(data => {
        if (data && !data.error) {
          setForm({
            iban:               data.iban ?? '',
            bic:                data.bic ?? '',
            banque:             data.banque ?? '',
            tva_number:         data.tva_number ?? '',
            siren:              data.siren ?? '',
            micro_entrepreneur: data.micro_entrepreneur ?? false,
            penalites_retard:   data.penalites_retard ?? 'Pénalités de retard : taux légal × 3 en cas de retard de paiement.',
            escompte:           data.escompte ?? 'Pas d\'escompte pour règlement anticipé.',
            chorus_pro_email:   data.chorus_pro_email ?? '',
          })
        }
        setLoading(false)
      })
  }, [])

  async function save() {
    setSaving(true)
    await fetch('/api/factureboost/profile', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(form),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const input = 'w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-400/20'

  if (loading) {
    return <div className="text-center py-16 text-gray-400">Chargement...</div>
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Paramètres FactureBoost</h1>
          <p className="text-sm text-gray-500 mt-1">Vos informations de facturation par défaut</p>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50 transition"
        >
          {saving ? '...' : saved ? '✅ Sauvegardé' : 'Sauvegarder'}
        </button>
      </div>

      <div className="space-y-5">
        {/* Identité fiscale */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Identité fiscale</p>

          <div className="flex items-center gap-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={form.micro_entrepreneur}
                onChange={e => setForm(f => ({ ...f, micro_entrepreneur: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-gray-200 peer-checked:bg-orange-500 rounded-full transition peer-focus:ring-2 peer-focus:ring-orange-300 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5" />
            </label>
            <span className="text-sm text-gray-700">Micro-entrepreneur (TVA non applicable, art. 293 B CGI)</span>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1.5">SIREN</label>
            <input
              value={form.siren}
              onChange={e => setForm(f => ({ ...f, siren: e.target.value }))}
              placeholder="123 456 789"
              maxLength={11}
              className={input}
            />
          </div>

          {!form.micro_entrepreneur && (
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1.5">Numéro de TVA intracommunautaire</label>
              <input
                value={form.tva_number}
                onChange={e => setForm(f => ({ ...f, tva_number: e.target.value }))}
                placeholder="FR12 123456789"
                className={input}
              />
            </div>
          )}
        </div>

        {/* Coordonnées bancaires */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Coordonnées bancaires par défaut</p>
          <p className="text-xs text-gray-400">Pré-remplies sur chaque nouvelle facture.</p>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-gray-500 block mb-1.5">IBAN</label>
              <input
                value={form.iban}
                onChange={e => setForm(f => ({ ...f, iban: e.target.value }))}
                placeholder="FR76 1234 5678 9012 3456 7890 123"
                className={input}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1.5">BIC / SWIFT</label>
              <input
                value={form.bic}
                onChange={e => setForm(f => ({ ...f, bic: e.target.value }))}
                placeholder="BNPAFRPP"
                className={input}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1.5">Banque</label>
              <input
                value={form.banque}
                onChange={e => setForm(f => ({ ...f, banque: e.target.value }))}
                placeholder="BNP Paribas"
                className={input}
              />
            </div>
          </div>
        </div>

        {/* Mentions légales par défaut */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Mentions légales par défaut</p>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1.5">Pénalités de retard</label>
            <input
              value={form.penalites_retard}
              onChange={e => setForm(f => ({ ...f, penalites_retard: e.target.value }))}
              className={input}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1.5">Escompte</label>
            <input
              value={form.escompte}
              onChange={e => setForm(f => ({ ...f, escompte: e.target.value }))}
              className={input}
            />
          </div>
        </div>

        {/* Chorus Pro */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Chorus Pro (Factures B2B publiques)</p>
            <p className="text-xs text-gray-400">
              Pour les factures aux entités publiques, le dépôt se fait via Chorus Pro (portail DGFiP gratuit).
              Renseignez votre email Chorus Pro pour recevoir des rappels de dépôt.
            </p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1.5">Email Chorus Pro</label>
            <input
              type="email"
              value={form.chorus_pro_email}
              onChange={e => setForm(f => ({ ...f, chorus_pro_email: e.target.value }))}
              placeholder="votre@email.fr"
              className={input}
            />
          </div>
          <div className="bg-blue-50 rounded-xl p-4 text-xs text-blue-700">
            <strong>Rappel :</strong> À partir du 1er septembre 2026, toutes les entreprises doivent pouvoir recevoir des factures électroniques.
            À partir du 1er septembre 2027, les TPE doivent émettre au format Factur-X via une Plateforme Agréée.
            FactureBoost génère des factures au format Factur-X valide prêtes pour ce transit.
          </div>
        </div>
      </div>
    </div>
  )
}
