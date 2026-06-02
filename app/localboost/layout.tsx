'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import Link from 'next/link'

const NAV = [
  { href: '/localboost/dashboard', label: 'Tableau de bord',    icon: '📍' },
  { href: '/localboost/avis',      label: 'Avis clients',       icon: '⭐' },
  { href: '/localboost/photos',    label: 'Photos',             icon: '📸' },
  { href: '/localboost/audit',     label: 'Analyser ma fiche',  icon: '🔍' },
  { href: '/localboost/nap',       label: 'Mes annuaires',      icon: '🗂️' },
]

export default function LocalBoostLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.push('/login'); return }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_status')
        .eq('id', user.id)
        .single()

      // Seul 'active' donne accès au dashboard
      if (profile?.subscription_status !== 'active') {
        router.push('/pricing')
        return
      }

      setReady(true)
    })
  }, [pathname])

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/localboost/dashboard" className="flex items-center gap-2 font-bold text-gray-900">
            <span className="text-lg">📍</span>
            <span>LocalBoost</span>
          </Link>
          <div className="flex items-center gap-1">
            {NAV.map(n => (
              <Link
                key={n.href}
                href={n.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition
                  ${pathname.startsWith(n.href)
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
              >
                <span>{n.icon}</span>{n.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/localboost/setup" className="text-xs text-gray-400 hover:text-gray-600">⚙️ Configuration</Link>
          <button
            onClick={async () => { await supabase.auth.signOut(); router.push('/login') }}
            className="text-xs text-gray-400 hover:text-red-500 transition"
          >
            Déconnexion
          </button>
        </div>
      </nav>
      <main className="max-w-5xl mx-auto px-6 py-8">{children}</main>
    </div>
  )
}
