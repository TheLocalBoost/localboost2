'use client'
import { useState } from 'react'

const FAQS = [
  {
    q: 'Pourquoi je ne peux pas gérer ma fiche Google moi-même ?',
    a: 'Vous pouvez. Mais maintenir une fiche qui génère des appels demande une discipline hebdomadaire sans faille : publier régulièrement, répondre à chaque avis, ajouter des photos récentes, mettre à jour vos horaires selon les saisons... En pratique, la plupart des artisans font une belle mise à jour, puis oublient pendant 4 à 6 mois. C\'est exactement à ce moment que Google passe votre fiche après celles de vos concurrents actifs. LocalBoost existe pour que ça n\'arrive jamais — indépendamment de votre emploi du temps.',
  },
  {
    q: 'Combien de temps ça me prend vraiment avec LocalBoost ?',
    a: 'Environ 5 minutes par semaine. Chaque lundi, vous recevez votre contenu prêt dans votre tableau de bord : un post rédigé, des réponses aux avis personnalisées, vos actions concrètes de la semaine. Vous publiez en copier-coller depuis votre téléphone. C\'est tout ce que LocalBoost vous demande.',
  },
  {
    q: 'Est-ce que ça marche vraiment pour un petit commerce avec peu de clients actuels ?',
    a: 'C\'est précisément là que l\'effet est le plus fort. Un commerce qui reçoit peu d\'appels a souvent une fiche inactive ou incomplète — pas un problème de notoriété. En publiant régulièrement et en répondant aux avis, vous passez devant des concurrents mieux établis mais moins actifs. Les résultats apparaissent en 2 à 4 semaines sur le classement local.',
  },
  {
    q: 'Que se passe-t-il si mes concurrents ont déjà une bonne fiche ?',
    a: 'Google ne classe pas en fonction de qui a la meilleure fiche à un instant T — il récompense la régularité. Un concurrent qui a publié il y a 3 mois sera dépassé par une fiche active, même moins parfaite. C\'est l\'avantage de LocalBoost : votre fiche ne s\'arrête jamais de travailler.',
  },
  {
    q: 'Est-ce que LocalBoost publie automatiquement sur Google ?',
    a: 'Non — Google Business ne permet pas la publication automatique via des outils externes. LocalBoost génère le contenu et vous le présente dans votre tableau de bord. Vous publiez en 30 secondes avec un simple copier-coller. Zéro effort de rédaction, vous gardez le contrôle.',
  },
  {
    q: 'En quoi c\'est différent de faire ça moi-même avec ChatGPT ?',
    a: 'ChatGPT génère du texte — vous devez encore penser aux sujets chaque semaine, rédiger le prompt, adapter au contexte de votre fiche, surveiller votre classement, analyser vos avis, planifier les photos... C\'est 1h de travail quand vous y êtes attentif. LocalBoost fait tout ça automatiquement, spécifiquement pour votre fiche, chaque lundi, sans que vous y pensiez.',
  },
  {
    q: 'Est-ce que je suis engagé si je m\'abonne ?',
    a: 'Non. Vous pouvez annuler à tout moment depuis votre espace client en un clic. Aucun préavis, aucune question posée. Vous restez actif jusqu\'à la fin de la période payée.',
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
