const PAINS = [
  {
    emoji: '😤',
    title: 'Vos concurrents apparaissent avant vous sur Google',
    desc: 'Chaque jour, des clients potentiels cherchent votre métier dans votre ville — et cliquent sur quelqu\'un d\'autre. Pas parce qu\'ils sont meilleurs. Parce que leur fiche est mieux présentée.',
  },
  {
    emoji: '⏰',
    title: 'Vous passez des heures sur vos devis au lieu de travailler',
    desc: 'Calculer les quantités, rédiger les lignes, mettre en page le PDF, envoyer, relancer... Tout ça pour un devis qui prend 2h et finit peut-être dans la corbeille.',
  },
  {
    emoji: '📉',
    title: 'Vos avis clients restent sans réponse et ça se voit',
    desc: 'Un avis sans réponse, c\'est un signal négatif pour Google et pour vos futurs clients. 88% des consommateurs lisent les réponses aux avis avant de choisir.',
  },
]

export default function PainPoints() {
  return (
    <section className="py-20 px-6 bg-white">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">
          Vous perdez des clients chaque jour sans le savoir
        </h2>
        <p className="text-gray-400 text-center mb-12 max-w-xl mx-auto">
          Ce n'est pas un manque de qualité. C'est un manque de temps — et d'outils adaptés.
        </p>
        <div className="grid sm:grid-cols-3 gap-6">
          {PAINS.map(({ emoji, title, desc }) => (
            <div key={title} className="rounded-2xl border border-red-100 bg-red-50/40 p-6">
              <div className="text-3xl mb-3">{emoji}</div>
              <h3 className="font-semibold text-gray-900 mb-2 text-[15px] leading-snug">{title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
