'use client'
import FounderSpotsCounter from '@/components/shared/FounderSpotsCounter'

const FEATURES = [
  'Score de visibilité Google en temps réel',
  'Liste des problèmes détectés sur votre fiche',
  'Plan d\'action complet avec impact estimé',
  'QR code Google avis à imprimer',
  'Post Google rédigé par IA chaque semaine',
  'Réponses aux avis personnalisées, prêtes à publier',
  'Rapport lundi matin dans votre boîte mail',
  'Demandes d\'avis par email illimitées',
  'Connexion Google Business directe',
  'Sans engagement — annulation en 1 clic',
]

const PRICE_REGULAR = 49

export default function Pricing() {
  return (
    <section id="pricing" className="py-20 px-6 bg-white">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Un seul tarif. Tout inclus.</h2>
          <p className="text-gray-500">Tarif fondateur réservé aux premiers clients.</p>
        </div>

        <div className="rounded-2xl border-2 border-blue-500 bg-white p-8 shadow-xl relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
              Tarif fondateur
            </span>
          </div>

          <p className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-2">Pro</p>
          <div className="flex items-baseline gap-1 mb-1">
            <span className="text-5xl font-extrabold text-gray-900">29€</span>
            <span className="text-gray-400">/mois</span>
          </div>
          <p className="text-xs text-gray-400 mb-6">Passe à {PRICE_REGULAR}€ après les 50 premiers</p>

          <div className="bg-red-50 border border-red-100 rounded-xl p-3 mb-6">
            <p className="text-xs text-center text-gray-600">
              <span className="text-red-600 font-bold">Vous perdez ~150–450€/mois</span> en clients non trouvés.<br />
              LocalBoost coûte moins qu'un client perdu.
            </p>
          </div>

          <ul className="space-y-2.5 mb-6">
            {FEATURES.map(f => (
              <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-blue-500 shrink-0 font-bold mt-0.5">✓</span>{f}
              </li>
            ))}
          </ul>

          <div className="mb-4">
            <FounderSpotsCounter />
          </div>

          <a
            href="/pricing"
            className="block w-full rounded-xl bg-blue-600 py-4 text-sm font-bold text-white hover:bg-blue-700 transition text-center"
          >
            Passer en Pro — 29€/mois →
          </a>
          <p className="text-xs text-gray-400 text-center mt-2">Sans engagement · Résiliation en 1 clic</p>
        </div>
      </div>
    </section>
  )
}
