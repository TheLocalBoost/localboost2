'use client'

export default function CTAFinal() {
  return (
    <section className="py-20 px-6 bg-gray-900">
      <div className="max-w-xl mx-auto text-center">
        <p className="text-gray-400 text-sm font-semibold uppercase tracking-wide mb-4">
          Deux options. Pas trois.
        </p>
        <h2 className="text-3xl font-extrabold text-white mb-5 leading-tight">
          Consacrer 2h30 chaque semaine à votre fiche Google.<br />
          <span className="text-blue-400">Ou déléguer à LocalBoost pour 29€/mois.</span>
        </h2>
        <p className="text-gray-300 mb-4 leading-relaxed">
          Si vous ne faites ni l'un ni l'autre, votre fiche descend. Vos concurrents remontent. Et vous perdez des clients sans le savoir.
        </p>
        <p className="text-gray-400 text-sm mb-8">
          Commencez par voir où vous en êtes. L'analyse est gratuite et prend 60 secondes.
        </p>
        <a
          href="/analyser"
          className="inline-block rounded-xl bg-blue-600 text-white font-bold text-sm px-10 py-4 hover:bg-blue-700 transition shadow-lg mb-3"
        >
          Analyser ma fiche gratuitement →
        </a>
        <p className="text-gray-500 text-xs">
          Sans inscription · Données réelles depuis Google Maps · Résultats en 60 secondes
        </p>
      </div>
    </section>
  )
}
