'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'

const COMMERCE_TYPES = [
  'Boulangerie / Patisserie',
  'Restaurant / Cafe',
  'Coiffeur / Barbier',
  'Pharmacie',
  'Fleuriste',
  'Epicerie / Superette',
  'Garage automobile',
  'Institut de beaute',
  'Librairie',
  'Autre',
]

export default function OnboardingPage() {
  const [form, setForm] = useState({
    commerce_name: '',
    city: '',
    commerce_type: '',
    specialties: '',
    tone: 'chaleureux',
  })
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('merchant_profiles').select('*').eq('id', user.id).single()
      if (data) setForm({ commerce_name: data.commerce_name || '', city: data.city || '', commerce_type: data.commerce_type || '', specialties: data.specialties || '', tone: data.tone || 'chaleureux' })
    }
    load()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('merchant_profiles').upsert({ id: user.id, ...form, updated_at: new Date().toISOString() })
    setStatus('success')
    setTimeout(() => router.push('/dashboard'), 1000)
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Mon commerce</h1>
      <p className="text-gray-500 mb-8">Ces informations permettent à l'IA de générer du contenu personnalisé.</p>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom du commerce</label>
            <input type="text" value={form.commerce_name} onChange={(e) => setForm({ ...form, commerce_name: e.target.value })} placeholder="Ex: Boulangerie Martin" required className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Ville</label>
            <input type="text" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Ex: Lyon" required className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Type de commerce</label>
            <select value={form.commerce_type} onChange={(e) => setForm({ ...form, commerce_type: e.target.value })} required className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20">
              <option value="">Choisir...</option>
              {COMMERCE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Spécialités / Points forts</label>
            <textarea value={form.specialties} onChange={(e) => setForm({ ...form, specialties: e.target.value })} placeholder="Ex: croissants artisanaux, pain au levain..." rows={3} className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20 resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Ton de communication</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'chaleureux', label: 'Chaleureux' },
                { value: 'professionnel', label: 'Professionnel' },
                { value: 'dynamique', label: 'Dynamique' },
                { value: 'humoristique', label: 'Humoristique' },
              ].map((t) => (
                <button key={t.value} type="button" onClick={() => setForm({ ...form, tone: t.value })} className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition ${form.tone === t.value ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <button type="submit" disabled={status === 'loading'} className="w-full rounded-xl bg-green-600 py-3 text-sm font-semibold text-white hover:bg-green-700 transition disabled:opacity-60">
          {status === 'loading' ? 'Enregistrement...' : status === 'success' ? 'Enregistré !' : 'Enregistrer'}
        </button>
      </form>
    </div>
  )
}