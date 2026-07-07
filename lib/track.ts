import posthog from 'posthog-js'

export function track(event: string, properties?: Record<string, unknown>) {
  if (typeof window !== 'undefined' && localStorage.getItem('owner') === '1') return

  // Supabase — conservation pendant la période de transition
  fetch('/api/track', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ event, properties }),
  }).catch(() => {})

  // PostHog
  if (typeof window !== 'undefined') {
    posthog.capture(event, properties)
  }
}
