'use client'

import { Analytics } from '@vercel/analytics/next'

export function VercelAnalytics() {
  return (
    <Analytics
      beforeSend={(event) => {
        const url = new URL(event.url)
        if (
          url.pathname.startsWith('/admin') ||
          url.pathname.startsWith('/dashboard/admin')
        ) return null
        return event
      }}
    />
  )
}
