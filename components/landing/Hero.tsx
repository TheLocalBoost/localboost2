'use client'

interface Props {
  detectedCity: string
  signupCount: number
  animScore: number
}

export default function Hero({ detectedCity, signupCount, animScore }: Props) {
  return (
    <section className="pt-24 pb-16 px-6 bg-white">
      <div className="max-w-5xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">

          {/* Texte */}
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-red-50 border border-red-200 px-4 py-1.5 text-sm font-medium text-red-600 mb-6">
              ⚠️ Votre fiche Google perd des clients chaque semaine
            </div>

            <h1 className="text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight mb-5">
              {detectedCity ? (
                <>Les artisans {' '}
                  <span className="text-blue-600">à {detectedCity}</span>{' '}
                  perdent en moyenne<br />
                  <span className="text-red-500">3 à 8 clients/mois</span>{' '}
                  sur Google.
                </>
              ) : (
                <>Les artisans perdent en moyenne{' '}
                  <span className="text-red-500">3 à 8 clients/mois</span>{' '}
                  à cause d'une fiche Google inactive.
                </>
              )}
            </h1>

            <p className="text-lg text-gray-500 mb-4 leading-relaxed">
              Pas parce qu'ils travaillent mal. Parce que leur fiche Google n'est pas entretenue.
              LocalBoost s'en occupe <strong className="text-gray-800">chaque semaine, automatiquement.</strong>
            </p>

            <p className="text-sm text-gray-400 mb-8">
              Posts hebdomadaires · Réponses aux avis · Score de visibilité · Tout par email le lundi
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-5">
              <button
                onClick={() => document.getElementById('analyzer')?.scrollIntoView({ behavior: 'smooth' })}
                className="rounded-xl bg-blue-600 px-6 py-4 text-sm font-bold text-white hover:bg-blue-700 transition text-center"
              >
                Calculer mes pertes gratuitement →
              </button>
              <button
                onClick={() => document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' })}
                className="rounded-xl border border-gray-200 px-6 py-4 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition text-center"
              >
                Comment ça marche
              </button>
            </div>

            <div className="flex items-center gap-3 text-sm text-gray-400">
              <div className="flex -space-x-1.5">
                {['🔧', '✂️', '🥖', '🍽️', '🎨'].map((e, i) => (
                  <div key={i} className="w-7 h-7 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-xs">
                    {e}
                  </div>
                ))}
              </div>
              <span>
                {signupCount > 10 ? `${signupCount}+` : '100+'} artisans utilisent LocalBoost
              </span>
            </div>
          </div>

          {/* Visuel */}
          <div className="relative">
            {/* Carte Google Maps simulée */}
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
              {/* Header maps */}
              <div className="bg-gray-100 px-4 py-3 flex items-center gap-2 border-b border-gray-200">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400"/>
                  <div className="w-3 h-3 rounded-full bg-amber-400"/>
                  <div className="w-3 h-3 rounded-full bg-green-400"/>
                </div>
                <div className="flex-1 bg-white rounded-lg px-3 py-1 text-xs text-gray-400">
                  plombier {detectedCity || 'Lyon'}
                </div>
              </div>

              {/* Résultats Google Maps */}
              <div className="p-4 space-y-2">
                {/* Concurrent 1 — mieux positionné */}
                <div className="rounded-xl border border-gray-100 p-3 bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-bold text-gray-900">Plomberie Martin</p>
                      <p className="text-xs text-amber-500 mt-0.5">★ 4.2 · 18 avis</p>
                      <p className="text-xs text-blue-600 mt-0.5">● Ouvert · Appeler</p>
                    </div>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">#1</span>
                  </div>
                </div>

                {/* Concurrent 2 */}
                <div className="rounded-xl border border-gray-100 p-3 bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-bold text-gray-900">Chauffage & Co</p>
                      <p className="text-xs text-amber-500 mt-0.5">★ 3.9 · 7 avis</p>
                      <p className="text-xs text-gray-400 mt-0.5">Horaires non renseignés</p>
                    </div>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">#2</span>
                  </div>
                </div>

                {/* VOUS — relégué */}
                <div className="rounded-xl border-2 border-red-200 p-3 bg-red-50/50 relative">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-bold text-red-700">Plomberie Dupont ← vous</p>
                      <p className="text-xs text-amber-500 mt-0.5">★ 4.8 · 31 avis</p>
                      <p className="text-xs text-gray-400 mt-0.5">Dernière publication : il y a 4 mois</p>
                    </div>
                    <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-semibold">#4</span>
                  </div>
                  <div className="mt-2 text-xs text-red-600 font-medium">
                    ↑ Mieux noté mais relégué — fiche inactive
                  </div>
                </div>
              </div>
            </div>

            {/* Badge animé */}
            <div className="absolute -bottom-3 -right-3 bg-blue-600 text-white text-xs font-bold px-3 py-2 rounded-xl shadow-lg">
              LocalBoost remonte votre fiche ↑
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
