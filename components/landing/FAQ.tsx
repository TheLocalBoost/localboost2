'use client'
import { useState } from 'react'

const FAQS = [
  {
    q: 'Est-ce que c\'est compliqué à configurer ?',
    a: 'Non. En 3 minutes chrono, votre compte est prêt. Pas de technique, pas de code. Vous renseignez votre nom de commerce et votre ville — l\'IA s\'occupe du reste.',
  },
  {
    q: 'Puis-je annuler à tout moment ?',
    a: 'Oui, sans engagement ni frais. Résiliation en 1 clic depuis votre espace client. Vous restez abonné jusqu\'à la fin de la période en cours.',
  },
  {
    q: 'Les devis générés sont-ils vraiment professionnels ?',
    a: 'Oui. L\'IA connaît les prix du marché BTP en France et génère des devis complets avec TVA, totaux HT/TTC et PDF mis en page. Vos clients ne verront pas la différence avec un devis fait à la main — en mieux.',
  },
  {
    q: 'Faut-il connecter mon compte Google ?',
    a: 'Non pour démarrer. Vous recevez le contenu par email et vous le copiez-collez vous-même en 30 secondes sur Google Business. Simple et efficace.',
  },
  {
    q: 'Y a-t-il un engagement minimum ?',
    a: 'Aucun. Mois par mois, résiliable à tout moment. Les 7 premiers jours sont offerts sans condition.',
  },
]

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <section id="faq" className="py-20 px-6 bg-gray-50">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Questions fréquentes</h2>
        <div className="space-y-3">
          {FAQS.map(({ q, a }, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between px-6 py-5 text-left"
              >
                <span className="font-semibold text-gray-900 text-sm pr-4">{q}</span>
                <svg
                  width="20" height="20" viewBox="0 0 20 20" fill="none"
                  className={`shrink-0 text-gray-400 transition-transform ${open === i ? 'rotate-180' : ''}`}
                >
                  <path d="M5 8l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
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
