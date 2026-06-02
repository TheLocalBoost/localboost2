'use client'

export default function CTASection() {
  function scrollToSearch() {
    document.getElementById('hero-search')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section className="py-20 px-6 bg-blue-600">
      <div className="max-w-3xl mx-auto text-center">
        <p className="text-blue-200 text-sm font-semibold uppercase tracking-wide mb-3">Diagnostic gratuit</p>
        <h2 className="text-3xl lg:text-4xl font-extrabold text-white mb-4 leading-tight">
          Découvrez en 60 secondes pourquoi vos concurrents apparaissent avant vous sur Google Maps
        </h2>
        <p className="text-blue-100 text-lg mb-8 leading-relaxed">
          LocalBoost analyse votre fiche Google et vous montre exactement ce qui vous fait perdre des clients — en clair, sans jargon.
        </p>
        <button
          onClick={scrollToSearch}
          className="inline-block rounded-xl bg-white text-blue-600 font-bold text-base px-8 py-4 hover:bg-blue-50 transition shadow-lg"
        >
          Analyser ma fiche gratuitement →
        </button>
        <p className="text-blue-200 text-sm mt-4">Aucune carte bancaire requise</p>
      </div>
    </section>
  )
}
