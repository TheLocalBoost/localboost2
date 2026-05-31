'use client'
import { useState, useEffect, useRef } from 'react'

interface Props {
  detectedCity: string
  signupCount: number
  animScore: number
}

export default function Hero({ detectedCity, signupCount, animScore }: Props) {
  return (
    <section className="pt-28 pb-20 px-6 bg-gradient-to-b from-blue-50/50 to-white">
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left — copy */}
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 border border-blue-200 px-4 py-1.5 text-sm font-medium text-blue-700 mb-6">
              🇫🇷 Fait pour les artisans français
            </div>

            <h1 className="text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight mb-5">
              {detectedCity ? (
                <>Arrêtez de perdre des clients à{' '}
                  <span className="text-blue-600">{detectedCity}</span> faute de visibilité
                </>
              ) : (
                <>Arrêtez de perdre des clients{' '}
                  <span className="text-blue-600">faute de visibilité</span>
                </>
              )}
            </h1>

            <p className="text-lg text-gray-500 mb-8 leading-relaxed">
              LocalBoost automatise votre Google Business et génère vos devis professionnels grâce à l'IA.
              En 3 minutes. Sans effort.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <a
                href="/signup"
                className="rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white hover:bg-blue-700 transition text-center"
              >
                Commencer gratuitement — 7 jours offerts
              </a>
              <a
                href="#modules"
                className="rounded-xl border border-gray-200 px-6 py-3.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition text-center"
              >
                Voir une démo →
              </a>
            </div>

            <p className="text-xs text-gray-400 mb-6">
              ⚡ Configuration en 3 minutes — Aucune carte requise
            </p>

            <div className="flex items-center gap-2 text-sm text-gray-500">
              <div className="flex -space-x-1">
                {['🥖','✂️','🔧','🍽️'].map((e, i) => (
                  <div key={i} className="w-7 h-7 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-xs">
                    {e}
                  </div>
                ))}
              </div>
              <span>
                Rejoignez <strong className="text-gray-900">{signupCount > 10 ? `${signupCount}+` : '100+'}</strong> artisans qui économisent 5h/semaine
              </span>
            </div>
          </div>

          {/* Right — visual */}
          <div className="relative">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-xl p-6">
              {/* Score card */}
              <div className="text-center mb-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Score de visibilité Google</p>
                <div className="flex items-center justify-center gap-6 mb-4">
                  <div className="text-center">
                    <span className="text-4xl font-extrabold text-red-500">34</span>
                    <p className="text-xs text-gray-400 mt-1">Avant</p>
                  </div>
                  <div className="flex-1">
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="h-3 rounded-full bg-gradient-to-r from-red-400 to-green-500 transition-all duration-300"
                        style={{ width: `${animScore}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>0</span><span>100</span>
                    </div>
                  </div>
                  <div className="text-center">
                    <span className="text-4xl font-extrabold text-green-600">{animScore}</span>
                    <p className="text-xs text-gray-400 mt-1">Après 30j</p>
                  </div>
                </div>
              </div>

              {/* Weekly email preview */}
              <div className="bg-gray-50 rounded-xl p-4 text-sm border border-gray-100">
                <p className="text-xs text-gray-400 mb-2">📧 Email de lundi — Boulangerie Dupont</p>
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-2">
                  <p className="text-xs font-medium text-green-800">📍 Votre post de la semaine :</p>
                  <p className="text-xs text-gray-700 mt-1 italic">"Ce week-end, découvrez nos nouvelles viennoiseries au beurre AOP. Fraîcheur garantie chaque matin dès 7h. 🥐"</p>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Score : <strong className="text-green-600">78/100</strong> ▲ +5 pts</span>
                  <span className="text-xs text-blue-600 font-medium">Publier →</span>
                </div>
              </div>
            </div>

            {/* Floating badge */}
            <div className="absolute -top-3 -right-3 bg-green-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
              ✓ Généré par IA
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
