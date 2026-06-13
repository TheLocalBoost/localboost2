'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import Link from 'next/link'

const NAV = [
  { href: '/localboost/dashboard', label: 'Accueil',   icon: '📍' },
  { href: '/localboost/avis',      label: 'Avis',      icon: '⭐' },
  { href: '/localboost/photos',    label: 'Photos',    icon: '📸' },
  { href: '/localboost/audit',     label: 'Audit',     icon: '🔍' },
  { href: '/localboost/connect',   label: 'Google',    icon: '🔗' },
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
    <div className="min-h-screen bg-gray-50 pb-16 sm:pb-0">

      {/* ── Header desktop ───────────────────────────── */}
      <nav className="bg-white border-b border-gray-100 px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4 sm:gap-6">
          <Link href="/localboost/dashboard" className="flex items-center gap-2 font-bold text-gray-900 shrink-0">
            <span className="text-lg">📍</span>
            <span className="hidden sm:inline">LocalBoost</span>
          </Link>
          {/* Nav desktop uniquement */}
          <div className="hidden sm:flex items-center gap-1">
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
          <Link href="/localboost/setup" className="text-xs text-gray-400 hover:text-gray-600">⚙️ Config</Link>
          <button
            onClick={async () => { await supabase.auth.signOut(); router.push('/login') }}
            className="text-xs text-gray-400 hover:text-red-500 transition"
          >
            Déconnexion
          </button>
        </div>
      </nav>

      {/* ── Contenu ──────────────────────────────────── */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        {children}
      </main>

      {/* ── Bottom tab bar mobile ─────────────────────── */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50 flex">
        {NAV.map(n => {
          const active = pathname.startsWith(n.href)
          return (
            <Link
              key={n.href}
              href={n.href}
              className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition
                ${active ? 'text-blue-600' : 'text-gray-400'}`}
            >
              <span className="text-xl leading-none">{n.icon}</span>
              <span className={`text-[10px] font-medium ${active ? 'text-blue-600' : 'text-gray-400'}`}>
                {n.label}
              </span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
