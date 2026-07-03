export default function CTASection() {
  return (
    <section className="py-20 px-6 bg-green-600">
      <div className="max-w-xl mx-auto text-center">
        <h2 className="text-3xl font-extrabold text-white mb-4 leading-tight">
          Voyez votre situation réelle<br />en 60 secondes.
        </h2>
        <p className="text-green-100 mb-8">
          Concurrents qui vous devancent, problèmes sur votre fiche, appels perdus — les vraies données de votre fiche Google.
        </p>
        <a
          href="/analyser"
          className="inline-block rounded-xl bg-white text-green-700 font-bold text-base px-8 py-4 hover:bg-green-50 transition shadow-lg"
        >
          Analyser ma fiche — gratuit →
        </a>
        <p className="text-green-200 text-sm mt-3">Sans inscription · Résultat immédiat</p>
      </div>
    </section>
  )
}
