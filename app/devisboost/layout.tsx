'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import Link from 'next/link'

const NAV = [
  { href: '/devisboost/dashboard', label: 'Mes devis',   icon: '📋' },
  { href: '/devisboost/nouveau',   label: 'Nouveau devis', icon: '✨' },
  { href: '/devisboost/clients',   label: 'Clients',     icon: '👤' },
]

export default function DevisBoostLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      if (pathname === '/devisboost/onboarding') { setReady(true); return }
      const { data } = await supabase
        .from('devisboost_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single()
      if (!data) { router.push('/devisboost/onboarding'); return }
      setReady(true)
    })
  }, [pathname])

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Topbar */}
      <nav className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/devisboost/dashboard" className="flex items-center gap-2 font-bold text-gray-900">
            <span className="text-lg">📄</span>
            <span>DevisBoost</span>
          </Link>
          <div className="flex items-center gap-1">
            {NAV.map(n => (
              <Link
                key={n.href}
                href={n.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition
                  ${pathname.startsWith(n.href) ? 'bg-green-50 text-green-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
              >
                <span>{n.icon}</span>{n.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/devisboost/onboarding" className="text-xs text-gray-400 hover:text-gray-600">
            ⚙️ Profil
          </Link>
          <Link href="/dashboard" className="text-xs text-gray-400 hover:text-gray-600">
            ← LocalBoost
          </Link>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-8">{children}</main>
    </div>
  )
}
