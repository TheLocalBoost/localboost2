import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Suspense } from 'react'
import { VercelAnalytics } from '@/components/VercelAnalytics'
import { Analytics as CustomAnalytics } from '@/components/Analytics'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'LocalBoost — Google Business & Devis IA pour artisans',
  description: 'Automatisez votre Google Business et générez des devis professionnels en 30 secondes grâce à l\'IA. Sans engagement.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        {children}
        <VercelAnalytics />
        <Suspense fallback={null}>
          <CustomAnalytics />
        </Suspense>
      </body>
    </html>
  )
}
