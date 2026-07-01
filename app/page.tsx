import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import LandingPage from '@/components/landing/LandingPage'

export const metadata: Metadata = {
  title: 'LocalBoost — Votre fiche Google optimisée pour recevoir plus d\'appels',
  description: 'Découvrez pourquoi votre fiche Google laisse partir des clients et récupérez tout le travail de correction en 48h pour 39€. Gratuit et sans inscription.',
  openGraph: {
    title: 'LocalBoost — Votre fiche Google optimisée pour recevoir plus d\'appels',
    description: 'Découvrez pourquoi votre fiche Google laisse partir des clients et récupérez tout le travail de correction en 48h pour 39€.',
    url: 'https://thelocalboost.fr',
    siteName: 'LocalBoost',
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LocalBoost — Votre fiche Google optimisée pour recevoir plus d\'appels',
    description: 'Découvrez pourquoi votre fiche Google laisse partir des clients et récupérez tout le travail de correction en 48h pour 39€.',
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
