'use client'
import { useState } from 'react'

const FAQS = [
  {
    q: 'Pourquoi ma fiche Google perd-elle des clients si j\'ai de bonnes notes ?',
    a: 'C\'est la surprise de la plupart des artisans. Google Maps ne classe pas le meilleur — il classe le plus actif. Un concurrent avec 3.9 étoiles qui publie un post par semaine et répond à ses avis apparaît AVANT vous si votre fiche est inactive depuis 2-3 mois. L\'algorithme interprète l\'inactivité comme un signal négatif. Ce n\'est pas une opinion — c\'est le fonctionnement documenté de Google Business.',
  },
  {
    q: 'Qu\'est-ce que je reçois exactement pour 39€ ?',
    a: 'Vous recevez par email sous 48h : une description Google optimisée pour votre métier et votre ville (prête à copier-coller), 4 posts Google hebdomadaires, des réponses personnalisées à vos avis récents, un QR code pour collecter plus d\'avis, un plan d\'action prioritaire et un script SMS pour demander des avis à vos clients. Tout est basé sur les vraies données de votre fiche Google — pas de contenu générique.',
  },
  {
    q: 'Pourquoi 39€ et pas 150€ comme une agence ?',
    a: 'Les agences font ce travail manuellement — un consultant passe 2 à 4 heures sur votre dossier. Nous utilisons l\'IA pour analyser votre fiche, étudier vos concurrents et générer le contenu en quelques minutes. On vous fait passer le gain de productivité. Le résultat est identique, le prix est divisé par 5.',
  },
  {
    q: 'Est-ce que ça marche vraiment pour mon type de commerce ?',
    a: 'Si vos clients vous trouvent via Google Maps — oui. Coiffeurs, plombiers, électriciens, restaurants, boulangers, opticiens, garagistes, pharmacies, dentistes... Pour tous les commerces locaux, Google Maps est le principal point de contact avant un appel. L\'algorithme fonctionne de la même façon pour tous.',
  },
  {
    q: 'Et si ce n\'est pas assez bien ? Vous remboursez ?',
    a: 'Oui, intégralement et sans question. Si dans les 30 jours vous n\'êtes pas satisfait du contenu reçu, on vous rembourse. Vous n\'avez rien à perdre à essayer — surtout face à des agences qui vous engagent sur 12 mois dès le départ.',
  },
  {
    q: 'Combien de temps avant de voir des résultats sur Google ?',
    a: 'Les effets sur le classement Google Maps apparaissent généralement en 2 à 6 semaines selon la concurrence dans votre secteur et votre ville. La description optimisée est immédiate. Les 4 posts publiés semaine après semaine envoient un signal d\'activité à Google qui améliore progressivement votre position dans le Pack local.',
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
