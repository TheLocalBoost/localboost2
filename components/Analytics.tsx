'use client'
import { useEffect, useRef } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

export function Analytics() {
  const pathname    = usePathname()
  const searchParams = useSearchParams()
  const lastPath    = useRef('')

  useEffect(() => {
    if (pathname.startsWith('/admin') || pathname.startsWith('/dashboard/admin')) return
    const path = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '')
    if (path === lastPath.current) return
    lastPath.current = path

    const params   = new URLSearchParams(window.location.search)
    const referrer = document.referrer || null

    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path:       pathname,
        referrer,
        utm_source: params.get('utm_source'),
        utm_medium: params.get('utm_medium'),
      }),
    }).catch(() => {})
  }, [pathname, searchParams])

  return null
}

// Helper pour tracker un événement depuis n'importe quel composant
export function trackEvent(name: string, meta?: Record<string, unknown>) {
  fetch('/api/analytics/event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, path: window.location.pathname, meta }),
  }).catch(() => {})
}
