import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import LandingPage from '@/components/landing/LandingPage'

export const metadata: Metadata = {
  title: 'LocalBoost — Google Business & Devis IA pour artisans',
  description: 'Automatisez votre Google Business et générez des devis professionnels en 30 secondes grâce à l\'IA. Sans engagement. Annulation en 1 clic.',
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

export default function Page({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  return <LandingWithCodeInterceptor searchParams={searchParams} />
}

async function LandingWithCodeInterceptor({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const params = await searchParams
  if (params.code) {
    redirect(`/auth/callback?code=${params.code}`)
  }
  return <LandingPage />
}
