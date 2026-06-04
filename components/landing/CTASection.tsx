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
          Score de visibilité, problèmes détectés, appels perdus par mois, chiffre d'affaires non réalisé — ce sont les données de votre vraie fiche Google.
        </p>
        <p className="text-blue-200 text-sm mb-8">
          La plupart des artisans qui analysent leur fiche découvrent qu'ils perdent entre 3 et 9 appels par mois sans le savoir.
        </p>
        <a
          href="/analyser"
          className="inline-block rounded-xl bg-white text-blue-600 font-bold text-base px-8 py-4 hover:bg-blue-50 transition shadow-lg"
        >
          Analyser ma fiche gratuitement →
        </a>
        <p className="text-blue-200 text-sm mt-4">Gratuit · Sans inscription · Données issues de Google Maps</p>
      </div>
    </section>
  )
}
