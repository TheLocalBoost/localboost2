export function track(event: string, properties?: Record<string, unknown>) {
  if (typeof window !== 'undefined' && localStorage.getItem('owner') === '1') return
  fetch('/api/track', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ event, properties }),
  }).catch(() => {})
}
