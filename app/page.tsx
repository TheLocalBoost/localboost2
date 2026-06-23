import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import LandingPage from '@/components/landing/LandingPage'

export const metadata: Metadata = {
  title: 'LocalBoost — Google Business & Devis IA pour artisans',
  description: 'Optimisez votre fiche Google Business en 10 minutes et recevez plus d\'appels. Posts, avis, optimisation — préparés chaque semaine. Sans engagement.',
  openGraph: {
    title: 'LocalBoost — Google Business & Devis IA pour artisans',
    description: 'Optimisez votre fiche Google Business en 10 minutes et recevez plus d\'appels.',
    url: 'https://thelocalboost.fr',
    siteName: 'LocalBoost',
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LocalBoost — Google Business & Devis IA pour artisans',
    description: 'Optimisez votre fiche Google Business en 10 minutes et recevez plus d\'appels.',
  },
}

export default function Page({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  return <LandingWithCodeInterceptor searchParams={searchParams} />
}

async function LandingWithCodeInterceptor({ searchParams }: { searchParams: Promise<{ code?: string; error?: string; error_code?: string }> }) {
  const params = await searchParams
  if (params.code) {
    redirect(`/auth/callback?code=${params.code}`)
  }
  if (params.error) {
    const msg = params.error_code === 'otp_expired' ? 'lien_expire' : 'lien_invalide'
    redirect(`/login?error=${msg}`)
  }
  return <LandingPage />
}
