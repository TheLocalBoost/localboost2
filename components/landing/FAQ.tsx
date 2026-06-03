'use client'
import { useState } from 'react'

const FAQS = [
  {
    q: 'Est-ce que LocalBoost publie automatiquement sur Google ?',
    a: 'Non — Google Business ne permet pas la publication automatique via des outils externes. LocalBoost génère le contenu et vous le présente dans votre tableau de bord. Vous publiez en 30 secondes avec un simple copier-coller. C\'est le bon équilibre : automatisation sans perte de contrôle.',
  },
  {
    q: 'Est-ce adapté à mon type de commerce ?',
    a: 'Oui. LocalBoost est conçu pour tous les indépendants français : artisans du bâtiment, coiffeurs, restaurateurs, fleuristes, garagistes, boulangers... Le contenu est personnalisé selon votre activité et votre ville.',
  },
  {
    q: 'Est-ce que je suis engagé si je m\'abonne ?',
    a: 'Non. Vous pouvez annuler à tout moment depuis votre espace client en un clic. Aucun préavis, aucune question posée.',
  },
  {
    q: 'Comment publier le contenu sur ma fiche Google ?',
    a: 'LocalBoost génère votre contenu (posts, réponses aux avis, description) et vous le présente prêt à l\'emploi dans votre tableau de bord. Vous le copiez et le collez directement sur Google Business en moins de 30 secondes. Aucune connexion technique requise.',
  },
  {
    q: 'Comment annuler ?',
    a: 'En 1 clic depuis votre espace client. Aucun engagement, aucun frais d\'annulation. Vous restez actif jusqu\'à la fin de la période payée.',
  },
  {
    q: 'En quoi LocalBoost améliore-t-il concrètement mon classement Google ?',
    a: 'Google favorise les fiches actives : publications régulières, réponses aux avis, photos récentes. LocalBoost vous aide sur chacun de ces points chaque semaine. Les résultats sont visibles en 2 à 4 semaines sur votre score de visibilité.',
  },
]

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <section id="faq" className="py-20 px-6 bg-gray-50">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-10">Questions fréquentes</h2>
        <div className="space-y-2">
          {FAQS.map(({ q, a }, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between px-6 py-5 text-left gap-4"
              >
                <span className="font-semibold text-gray-900 text-sm leading-snug">{q}</span>
                <svg
                  width="18" height="18" viewBox="0 0 20 20" fill="none"
                  className={`shrink-0 text-gray-400 transition-transform ${open === i ? 'rotate-180' : ''}`}
                >
                  <path d="M5 8l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              {open === i && (
                <div className="px-6 pb-5">
                  <p className="text-sm text-gray-500 leading-relaxed">{a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
