'use client'
import FounderSpotsCounter from '@/components/shared/FounderSpotsCounter'

const FREE_FEATURES = [
  'Score de visibilité Google en temps réel',
  'Liste des problèmes détectés sur votre fiche',
  '1 action IA générée gratuitement',
  'QR code Google avis à imprimer',
]

const PRO_FEATURES = [
  'Post Google rédigé par IA chaque semaine',
  'Réponses aux avis personnalisées, prêtes à publier',
  'Plan d\'action complet avec impact estimé',
  'Rapport lundi matin dans votre boîte mail',
  'Demandes d\'avis par email illimitées',
  'Connexion Google Business directe',
  'Sans engagement — annulation en 1 clic',
]

const PRICE_REGULAR = 49

export default function Pricing() {
  return (
    <section id="pricing" className="py-20 px-6 bg-white">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Commencez gratuitement. Passez Pro quand vous êtes convaincu.</h2>
          <p className="text-gray-500">Aucune carte bancaire requise pour démarrer.</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-5">

          {/* Gratuit */}
          <div className="rounded-2xl border-2 border-gray-200 bg-white p-6">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Gratuit</p>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-4xl font-extrabold text-gray-900">0€</span>
              <span className="text-gray-400">/mois</span>
            </div>
            <p className="text-xs text-gray-400 mb-6">Pour toujours · Sans carte bancaire</p>
            <ul className="space-y-2.5 mb-8">
              {FREE_FEATURES.map(f => (
                <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-green-500 shrink-0 font-bold mt-0.5">✓</span>{f}
                </li>
              ))}
            </ul>
            <a
              href="/signup"
              className="block w-full rounded-xl bg-gray-900 py-3.5 text-sm font-bold text-white hover:bg-gray-700 transition text-center"
            >
              Créer mon compte gratuit →
            </a>
          </div>

          {/* Pro */}
          <div className="rounded-2xl border-2 border-blue-500 bg-white p-6 shadow-lg relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                Tarif fondateur
              </span>
            </div>

            <p className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-2">Pro</p>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-4xl font-extrabold text-gray-900">29€</span>
              <span className="text-gray-400">/mois</span>
            </div>
            <p className="text-xs text-gray-400 mb-6">Passe à {PRICE_REGULAR}€ après les 50 premiers</p>

            <div className="bg-red-50 border border-red-100 rounded-xl p-3 mb-5">
              <p className="text-xs text-center text-gray-600">
                <span className="text-red-600 font-bold">Vous perdez ~150–450€/mois</span> en clients non trouvés.<br />
                LocalBoost coûte moins qu'un client perdu.
              </p>
            </div>

            <ul className="space-y-2.5 mb-6">
              {FREE_FEATURES.map(f => (
                <li key={f} className="flex items-start gap-2 text-sm text-gray-500">
                  <span className="text-green-500 shrink-0 font-bold mt-0.5">✓</span>{f}
                </li>
              ))}
              {PRO_FEATURES.map(f => (
                <li key={f} className="flex items-start gap-2 text-sm text-gray-700 font-medium">
                  <span className="text-blue-500 shrink-0 font-bold mt-0.5">✓</span>{f}
                </li>
              ))}
            </ul>

            <div className="mb-4">
              <FounderSpotsCounter />
            </div>

            <a
              href="/pricing"
              className="block w-full rounded-xl bg-blue-600 py-3.5 text-sm font-bold text-white hover:bg-blue-700 transition text-center"
            >
              Passer en Pro — 29€/mois →
            </a>
            <p className="text-xs text-gray-400 text-center mt-2">Sans engagement · Résiliation en 1 clic</p>
          </div>

        </div>
      </div>
    </section>
  )
}
