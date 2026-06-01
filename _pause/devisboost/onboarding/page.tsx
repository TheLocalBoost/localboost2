'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'

const METIERS = ['Plombier', 'Électricien', 'Peintre', 'Maçon', 'Menuisier', 'Carreleur', 'Couvreur', 'Chauffagiste', 'Serrurier', 'Jardinier', 'Autre']

export default function OnboardingPage() {
  const router   = useRouter()
  const supabase = createClient()
  const [form, setForm] = useState({
    company_name: '', siret: '', metier: '', address: '', phone: '', email: '',
    tva_number: '', payment_conditions: 'Acompte de 30% à la commande, solde à réception',
    mentions_legales: '',
  })
  const [logo, setLogo]       = useState<File | null>(null)
  const [saving, setSaving]   = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    fetch('/api/devisboost/profile')
      .then(r => r.json())
      .then(d => { if (d) setForm(f => ({ ...f, ...d })) })
      .catch(() => {})
  }, [])

  const up = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    let logo_url = (form as any).logo_url
    if (logo) {
      const { data: { user } } = await supabase.auth.getUser()
      const ext = logo.name.split('.').pop()
      const { data } = await supabase.storage
        .from('devisboost-logos')
        .upload(`${user!.id}/logo.${ext}`, logo, { upsert: true })
      if (data) {
        const { data: { publicUrl } } = supabase.storage.from('devisboost-logos').getPublicUrl(data.path)
        logo_url = publicUrl
      }
    }
    await fetch('/api/devisboost/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, logo_url }),
    })
    setSuccess(true)
    setTimeout(() => router.push('/devisboost/dashboard'), 1000)
    setSaving(false)
  }

  const input = 'w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20'

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Configurez votre profil artisan</h1>
        <p className="text-gray-500 mt-1">Ces informations apparaîtront sur vos devis.</p>
      </div>

      <form onSubmit={save} className="space-y-6">
        {/* Entreprise */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Votre entreprise</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Nom de l'entreprise *</label>
              <input value={form.company_name} onChange={up('company_name')} required className={input} placeholder="Plomberie Dupont" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Métier *</label>
              <select value={form.metier} onChange={up('metier')} required className={input}>
                <option value="">Choisir...</option>
                {METIERS.map(m => <option key={m} value={m.toLowerCase()}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">SIRET</label>
              <input value={form.siret} onChange={up('siret')} className={input} placeholder="123 456 789 00012" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">N° TVA intracommunautaire</label>
              <input value={form.tva_number} onChange={up('tva_number')} className={input} placeholder="FR12345678901" />
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Coordonnées</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Adresse complète</label>
              <input value={form.address} onChange={up('address')} className={input} placeholder="12 rue de la Paix, 75001 Paris" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Téléphone</label>
              <input value={form.phone} onChange={up('phone')} className={input} placeholder="06 12 34 56 78" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Email professionnel</label>
              <input type="email" value={form.email} onChange={up('email')} className={input} placeholder="contact@monentreprise.fr" />
            </div>
          </div>
        </div>

        {/* Logo */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Logo (optionnel)</h2>
          <input
            type="file" accept="image/*"
            onChange={e => setLogo(e.target.files?.[0] ?? null)}
            className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
          />
          <p className="text-xs text-gray-400 mt-2">PNG ou JPG, recommandé : 400×200px max</p>
        </div>

        {/* Conditions */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Conditions par défaut</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Conditions de paiement</label>
              <input value={form.payment_conditions} onChange={up('payment_conditions')} className={input} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Mentions légales</label>
              <textarea value={form.mentions_legales} onChange={up('mentions_legales') as any} rows={3}
                className={`${input} resize-none`}
                placeholder="Ex : Devis valable 30 jours. Paiement comptant à réception de facture..." />
            </div>
          </div>
        </div>

        <button
          type="submit" disabled={saving}
          className="w-full rounded-xl bg-green-600 py-3.5 text-sm font-semibold text-white hover:bg-green-700 transition disabled:opacity-60"
        >
          {saving ? 'Enregistrement...' : success ? '✅ Profil enregistré !' : 'Enregistrer mon profil →'}
        </button>
      </form>
    </div>
  )
}
