'use client'
import { useState, useEffect } from 'react'
import FounderSpotsCounter from '@/components/shared/FounderSpotsCounter'

const FEATURES = [
  'Priorités IA personnalisées chaque semaine',
  'Demandes d\'avis par email et SMS illimitées',
  'QR code Google avis à imprimer',
  'Analyse complète de votre fiche Google',
  'Suggestions photos par IA',
  'Vérification sur tous les annuaires',
  'Contenu IA généré en 1 clic (description, réponses...)',
  'Sans engagement — annulation en 1 clic',
]

const TOTAL_SPOTS   = 50
const PRICE_REGULAR = 49

export default function Pricing() {
  const [spotsLeft, setSpotsLeft] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/public-stats')
      .then(r => r.json())
      .then(d => {
        const taken = Math.min(d.count ?? 0, TOTAL_SPOTS)
        setSpotsLeft(TOTAL_SPOTS - taken)
      })
      .catch(() => setSpotsLeft(TOTAL_SPOTS))
  }, [])

  const isFull    = spotsLeft !== null && spotsLeft <= 0
  const pctTaken  = spotsLeft !== null ? Math.round(((TOTAL_SPOTS - spotsLeft) / TOTAL_SPOTS) * 100) : 0

  return (
    <section id="pricing" className="py-20 px-6 bg-white">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Un prix. Tout inclus. Sans limites.</h2>
          <p className="text-gray-500">Nos concurrents comptent chaque requête. Pas nous.</p>
        </div>

        <div className="rounded-2xl border-2 border-blue-500 bg-white p-8 shadow-lg">

          {/* Badge fondateur */}
          {!isFull ? (
            <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-300 px-3 py-1 text-xs font-semibold text-amber-700 mb-5">
              🏆 Tarif fondateur — {spotsLeft !== null ? `${spotsLeft} places restantes sur ${TOTAL_SPOTS}` : 'places limitées'}
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-500 mb-5">
              Tarif standard
            </div>
          )}

          {/* Barre de progression */}
          {!isFull && spotsLeft !== null && (
            <div className="mb-6">
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className="bg-amber-400 h-2 rounded-full transition-all"
                  style={{ width: `${pctTaken}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1 text-right">{TOTAL_SPOTS - spotsLeft}/{TOTAL_SPOTS} places prises</p>
            </div>
          )}

          {/* Ancrage ROI */}
          <div className="bg-red-50 border border-red-100 rounded-xl p-3 mb-6 text-sm text-center">
            <span className="text-red-600 font-semibold">Vous perdez ~150 à 450€/mois</span>
            <span className="text-gray-500"> en clients non trouvés sur Google.</span>
          </div>

          {/* Prix */}
          {!isFull ? (
            <div className="text-center mb-1">
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-5xl font-extrabold text-gray-900">29€</span>
                <span className="text-gray-400 text-lg">/mois</span>
              </div>
              <p className="text-sm text-gray-400 mt-1">
                <span className="line-through text-gray-300">{PRICE_REGULAR}€</span>
                {' '}après les 50 premiers inscrits
              </p>
            </div>
          ) : (
            <div className="flex items-baseline justify-center gap-1 mb-1">
              <span className="text-5xl font-extrabold text-gray-900">{PRICE_REGULAR}€</span>
              <span className="text-gray-400 text-lg">/mois</span>
            </div>
          )}

          <p className="text-center text-xs text-green-600 font-semibold mt-2 mb-7">
            ✓ 7 jours gratuits — sans carte bancaire
          </p>

          {/* Features */}
          <ul className="space-y-3 mb-8">
            {FEATURES.map(f => (
              <li key={f} className="flex items-start gap-2.5 text-sm text-gray-700">
                <span className="text-blue-500 shrink-0 mt-0.5 font-bold">✓</span>{f}
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
            Démarrer maintenant →
          </a>
          <p className="text-xs text-gray-400 text-center mt-3">
            Sans engagement · Résiliation en 1 clic
          </p>
        </div>

        {/* Garantie */}
        <div className="mt-5 bg-gray-50 rounded-xl p-4 text-center">
          <p className="text-sm text-gray-600">
            🛡️ <strong>Satisfait ou remboursé 30 jours.</strong> Si LocalBoost ne vous convient pas, on rembourse sans question.
          </p>
        </div>
      </div>
    </section>
  )
}
