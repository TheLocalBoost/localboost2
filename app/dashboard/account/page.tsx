'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'

export default function AccountPage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'active' | 'trialing' | 'inactive' | null>(null)
  const [trialEnd, setTrialEnd] = useState<string | null>(null)
  const [canceling, setCanceling] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setEmail(user.email || '')

      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_status, trial_ends_at')
        .eq('id', user.id)
        .single()

      if (profile) {
        setStatus(profile.subscription_status)
        setTrialEnd(profile.trial_ends_at)
      }
    }
    load()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const handleCancel = async () => {
    if (!confirm('Confirmer la résiliation ? Votre accès reste actif jusqu\'à la fin de la période en cours.')) return
    setCanceling(true)
    const res = await fetch('/api/stripe/cancel', { method: 'POST' })
    if (res.ok) {
      setStatus('inactive')
    }
    setCanceling(false)
  }

  const statusLabel: Record<string, { label: string; color: string }> = {
    active:   { label: 'Abonnement actif', color: 'bg-green-50 text-green-700 border-green-200' },
    trialing: { label: 'Période d\'essai', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    inactive: { label: 'Inactif', color: 'bg-gray-50 text-gray-600 border-gray-200' },
  }

  const sub = status ? statusLabel[status] : null

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Mon compte</h1>

      {/* Infos */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm mb-4">
        <h2 className="font-semibold text-gray-900 mb-4">Informations</h2>
        <div className="space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500">Email</span>
            <span className="text-gray-900 font-medium">{email || '—'}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500">Abonnement</span>
            {sub && (
              <span className={`px-3 py-1 rounded-full border text-xs font-semibold ${sub.color}`}>
                {sub.label}
              </span>
            )}
          </div>
          {status === 'trialing' && trialEnd && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Essai jusqu'au</span>
              <span className="text-gray-900 font-medium">
                {new Date(trialEnd).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
              </span>
            </div>
          )}
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500">Prix</span>
            <span className="text-gray-900 font-medium">59€/mois</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm mb-4">
        <h2 className="font-semibold text-gray-900 mb-4">Gestion</h2>
        <div className="space-y-3">
          {(status === 'active' || status === 'trialing') && (
            <button
              onClick={handleCancel}
              disabled={canceling}
              className="w-full text-left flex items-center justify-between px-4 py-3 rounded-xl border border-red-100 text-sm text-red-600 hover:bg-red-50 transition disabled:opacity-50"
            >
              <span>{canceling ? 'Résiliation en cours...' : 'Résilier mon abonnement'}</span>
              <span>→</span>
            </button>
          )}
          <button
            onClick={handleLogout}
            className="w-full text-left flex items-center justify-between px-4 py-3 rounded-xl border border-gray-100 text-sm text-gray-600 hover:bg-gray-50 transition"
          >
            <span>Se déconnecter</span>
            <span>→</span>
          </button>
        </div>
      </div>

      <p className="text-xs text-gray-400 text-center">
        Un problème ? Contactez-nous à{' '}
        <a href="mailto:contact@thelocalboost.fr" className="text-green-600 hover:underline">
          contact@thelocalboost.fr
        </a>
      </p>
    </div>
  )
}
