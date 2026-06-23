import { Suspense } from 'react'

function MerciContent() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl border border-gray-200 p-8 text-center shadow-sm">
        <div className="text-4xl mb-4">✅</div>
        <h1 className="text-2xl font-extrabold text-gray-900 mb-3">Paiement reçu — merci !</h1>
        <p className="text-gray-600 text-sm leading-relaxed mb-6">
          Vous recevrez votre optimisation Google par email <strong>sous 48h</strong> :<br />
          description rédigée, 4 posts prêts à publier, réponses à vos avis.
        </p>
        <div className="rounded-xl bg-blue-50 border border-blue-100 px-4 py-3 text-sm text-blue-800 mb-6">
          Vérifiez votre boîte mail (et vos spams) dans les 48h.
        </div>
        <a href="/" className="text-sm text-gray-400 hover:text-gray-600">← Retour à l'accueil</a>
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
