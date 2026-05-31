import { Metadata } from 'next'
import LandingPage from '@/components/landing/LandingPage'

export const metadata: Metadata = {
  title: 'LocalBoost — Google Business & Devis IA pour artisans',
  description: 'Automatisez votre Google Business et générez des devis professionnels en 30 secondes grâce à l\'IA. 7 jours gratuits. Sans engagement.',
  openGraph: {
    title: 'LocalBoost — Google Business & Devis IA pour artisans',
    description: 'Automatisez votre Google Business et générez des devis professionnels en 30 secondes grâce à l\'IA.',
    url: 'https://thelocalboost.fr',
    siteName: 'LocalBoost',
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LocalBoost — Google Business & Devis IA pour artisans',
    description: 'Automatisez votre Google Business et générez des devis professionnels en 30 secondes.',
  },
}

export default function Page() {
  return <LandingPage />
}
