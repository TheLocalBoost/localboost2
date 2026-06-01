'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'

export default function OnboardingPage() {
  const [form, setForm] = useState({
    commerce_name: '',
    city:          '',
    commerce_type: '',
    specialties:   '',
    tone:          'chaleureux',
  })
  const [status, setStatus]   = useState<'idle' | 'loading' | 'success'>('idle')
  const [hasProfile, setHasProfile] = useState(false)
  const router  = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase.from('merchant_profiles').select('*').eq('id', user.id).single()
      if (data) {
        setHasProfile(true)
        setForm({
          commerce_name: data.commerce_name || '',
          city:          data.city          || '',
          commerce_type: data.commerce_type || '',
          specialties:   data.specialties   || '',
          tone:          data.tone          || 'chaleureux',
        })
      } else {
        // Pré-remplir depuis les métadonnées auth si pas encore de profil
        const meta = user.user_metadata || {}
        setForm(f => ({
          ...f,
          commerce_name: meta.commerce || '',
          city:          meta.ville    || '',
          commerce_type: meta.secteur  || '',
        }))
      }
    }
    load()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('merchant_profiles').upsert({
      id: user.id, ...form, updated_at: new Date().toISOString(),
    })
    setStatus('success')
    setTimeout(() => router.push('/dashboard'), 1000)
  }

  const input = 'w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20'

  return (
    <div className="max-w-xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          {hasProfile ? 'Mon profil commerce' : 'Finalisez votre profil'}
        </h1>
        <p className="text-gray-500 text-sm">
          {hasProfile
            ? 'Modifiez vos informations pour personnaliser le contenu généré par l\'IA.'
            : 'Ajoutez vos spécialités et le ton de communication pour des posts encore plus personnalisés.'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">

          {/* Infos de base (pré-remplies depuis signup) */}
          <div className="pb-4 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Informations de base</p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom du commerce</label>
                <input type="text" value={form.commerce_name} onChange={e => setForm(f => ({ ...f, commerce_name: e.target.value }))} placeholder="Boulangerie Martin" required className={input} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Ville</label>
                  <input type="text" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="Lyon" required className={input} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Type d'activité</label>
                  <input type="text" value={form.commerce_type} onChange={e => setForm(f => ({ ...f, commerce_type: e.target.value }))} placeholder="Boulangerie" required className={input} />
                </div>
              </div>
            </div>
          </div>

          {/* Personnalisation IA */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Personnalisation IA <span className="normal-case font-normal text-gray-400">(optionnel)</span></p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Spécialités / Points forts</label>
                <textarea
                  value={form.specialties}
                  onChange={e => setForm(f => ({ ...f, specialties: e.target.value }))}
                  placeholder="Ex: pain au levain maison, croissants artisanaux au beurre AOP, galettes bretonnes..."
                  rows={3}
                  className={`${input} resize-none`}
                />
                <p className="text-xs text-gray-400 mt-1">Plus vous êtes précis, plus les posts générés sont authentiques.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ton de communication</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'chaleureux',     label: '😊 Chaleureux',     desc: 'Proche, humain' },
                    { value: 'professionnel',  label: '💼 Professionnel',  desc: 'Sobre, sérieux' },
                    { value: 'dynamique',      label: '⚡ Dynamique',      desc: 'Énergie, action' },
                    { value: 'humoristique',   label: '😄 Humoristique',   desc: 'Léger, décalé' },
                  ].map(t => (
                    <button
                      key={t.value} type="button"
                      onClick={() => setForm(f => ({ ...f, tone: t.value }))}
                      className={`rounded-xl border px-4 py-2.5 text-left transition ${form.tone === t.value ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      <p className={`text-sm font-medium ${form.tone === t.value ? 'text-green-700' : 'text-gray-700'}`}>{t.label}</p>
                      <p className="text-xs text-gray-400">{t.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <button type="submit" disabled={status === 'loading'} className="w-full rounded-xl bg-green-600 py-3 text-sm font-semibold text-white hover:bg-green-700 transition disabled:opacity-60">
          {status === 'loading' ? 'Enregistrement...' : status === 'success' ? '✓ Enregistré !' : 'Enregistrer'}
        </button>
      </form>
    </div>
  )
}
