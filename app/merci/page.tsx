'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

const DELIVERABLES = [
  'Description Google optimisée pour votre métier et votre ville',
  '4 posts Google — 1 par semaine pendant 4 semaines',
  'Réponses personnalisées à vos avis récents',
  'QR code pour collecter plus d\'avis — à imprimer ou partager',
  'Plan d\'action prioritaire basé sur vos vrais concurrents',
  'Script SMS pour demander des avis après chaque prestation',
]

function MerciContent() {
  const searchParams = useSearchParams()
  const type = searchParams.get('type')
  const isOneshot = type === 'oneshot'

  return (
    <div className="min-h-screen bg-gray-50 py-16 px-4">
      <div className="max-w-lg mx-auto">

        {/* Logo */}
        <div className="text-center mb-10">
          <a href="/" className="inline-flex items-center gap-2 text-xl font-bold text-gray-900">
            <span>📍</span><span>LocalBoost</span>
          </a>
        </div>

        {/* Carte principale */}
        <div className="bg-white rounded-2xl border-2 border-green-500 p-8 shadow-xl text-center mb-4">
          <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Paiement confirmé !</h1>
          <p className="text-gray-500 text-sm">
            {isOneshot
              ? 'Votre pack Google arrive dans votre boîte email sous 48h.'
              : 'Merci pour votre achat. Vous allez recevoir un email de confirmation.'}
          </p>
        </div>

        {/* Ce qui se passe maintenant */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-4">
          <p className="text-sm font-bold text-gray-900 mb-5">Ce qui se passe maintenant</p>
          <div className="space-y-5">
            <div className="flex gap-4">
              <span className="text-xs font-bold text-green-700 bg-green-100 rounded-full w-7 h-7 flex items-center justify-center shrink-0 mt-0.5">1</span>
              <div>
                <p className="text-sm font-semibold text-gray-800">Maintenant — analyse en cours</p>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">Notre système récupère les données réelles de votre fiche Google — note, avis, concurrents, mots-clés. Tout ce dont on a besoin pour générer du contenu qui correspond à votre vrai profil.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <span className="text-xs font-bold text-green-700 bg-green-100 rounded-full w-7 h-7 flex items-center justify-center shrink-0 mt-0.5">2</span>
              <div>
                <p className="text-sm font-semibold text-gray-800">Dans 48h — votre pack complet</p>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">Vous recevez tout par email. Chaque élément est personnalisé pour votre établissement, votre ville, vos vrais concurrents.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <span className="text-xs font-bold text-green-700 bg-green-100 rounded-full w-7 h-7 flex items-center justify-center shrink-0 mt-0.5">3</span>
              <div>
                <p className="text-sm font-semibold text-gray-800">Vous publiez — 5 minutes</p>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">Copier-coller depuis votre téléphone dans Google Business. Votre fiche devient active. Google commence à vous remonter dans les résultats.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Ce que vous allez recevoir */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-4">
          <p className="text-sm font-bold text-gray-900 mb-4">Ce que vous allez recevoir</p>
          <ul className="space-y-2.5">
            {DELIVERABLES.map(d => (
              <li key={d} className="flex items-start gap-2.5 text-sm text-gray-700">
                <span className="text-green-500 shrink-0 mt-0.5 font-bold">✓</span>{d}
              </li>
            ))}
          </ul>
        </div>

        {/* Note spam */}
        <div className="rounded-2xl bg-amber-50 border border-amber-200 px-5 py-4 text-center mb-6">
          <p className="text-sm font-semibold text-amber-800">Vérifiez vos spams</p>
          <p className="text-xs text-amber-700 mt-1">Si vous ne voyez pas d'email dans 48h, regardez dans le dossier spam ou promotions. Sinon, écrivez-nous à contact@thelocalboost.fr.</p>
        </div>

        <p className="text-center">
          <a href="/" className="text-sm text-gray-400 hover:text-gray-600">← Retour à l'accueil</a>
        </p>

        <p className="text-center text-xs text-gray-300 mt-6">
          LocalBoost · Entreprise française · contact@thelocalboost.fr
        </p>
      </div>
    </div>
  )
}

export default function MerciPage() {
  return (
    <Suspense>
      <MerciContent />
    </Suspense>
  )
}
