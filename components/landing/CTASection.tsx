export default function CTASection() {
  return (
    <section className="py-20 px-6 bg-blue-600">
      <div className="max-w-3xl mx-auto text-center">
        <p className="text-blue-200 text-sm font-semibold uppercase tracking-wide mb-3">
          Ne nous croyez pas sur parole
        </p>
        <h2 className="text-3xl lg:text-4xl font-extrabold text-white mb-4 leading-tight">
          Entrez le nom de votre commerce.<br />
          Voyez votre situation réelle en 60 secondes.
        </h2>
        <p className="text-blue-100 text-lg mb-4 leading-relaxed">
          Comment vous apparaissez sur Google, problèmes détectés, appels perdus par mois, chiffre d'affaires non réalisé — ce sont les données de votre vraie fiche Google.
        </p>
        <p className="text-blue-200 text-sm mb-8">
          La plupart des artisans découvrent entre 3 et 9 appels perdus par mois qu'ils ne soupçonnaient pas.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href="/pricing"
            className="inline-block rounded-xl bg-white text-blue-600 font-bold text-base px-8 py-4 hover:bg-blue-50 transition shadow-lg"
          >
            Passer en Pro — 29€/mois →
          </a>
          <a
            href="/analyser"
            className="inline-block rounded-xl bg-blue-500 text-white font-bold text-base px-8 py-4 hover:bg-blue-400 transition"
          >
            Analyser d'abord →
          </a>
        </div>
        <p className="text-blue-200 text-sm mt-4">Sans engagement · Résiliation en 1 clic</p>
      </div>
    </section>
  )
}
