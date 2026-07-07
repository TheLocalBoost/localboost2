'use client'
import { useEffect, useRef } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import posthog from 'posthog-js'

export function Analytics() {
  const pathname     = usePathname()
  const searchParams = useSearchParams()
  const lastPath     = useRef('')

  useEffect(() => {
    if (pathname.startsWith('/admin') || pathname.startsWith('/dashboard/admin')) return
    const path = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '')
    if (path === lastPath.current) return
    lastPath.current = path

    const params   = new URLSearchParams(window.location.search)
    const referrer = document.referrer || null
    const isOwner  = localStorage.getItem('owner') === '1'

    // Supabase — conservation pendant la période de transition
    if (!isOwner) {
      fetch('/api/analytics/track', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          path:       pathname,
          referrer,
          utm_source: params.get('utm_source'),
          utm_medium: params.get('utm_medium'),
        }),
      }).catch(() => {})
    }

    // PostHog page view
    if (!isOwner) {
      posthog.capture('$pageview', {
        $current_url: window.location.href,
        path:         pathname,
        referrer,
        utm_source:   params.get('utm_source'),
        utm_medium:   params.get('utm_medium'),
      })
    }
  }, [pathname, searchParams])

  return null
}

export function trackEvent(name: string, meta?: Record<string, unknown>) {
  const isOwner = typeof window !== 'undefined' && localStorage.getItem('owner') === '1'

  // Supabase — conservation pendant la période de transition
  if (!isOwner) {
    fetch('/api/analytics/event', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ name, path: window.location.pathname, meta }),
    }).catch(() => {})
  }

  // PostHog
  if (!isOwner && typeof window !== 'undefined') {
    posthog.capture(name, meta)
  }
}
