'use client'

export default function CTAFinal() {
  return (
    <section className="py-20 px-6 bg-blue-600">
      <div className="max-w-xl mx-auto text-center">
        <p className="text-blue-200 text-sm font-semibold uppercase tracking-wide mb-4">
          Pendant que vous lisez ces lignes
        </p>
        <h2 className="text-3xl font-extrabold text-white mb-4 leading-tight">
          Des clients cherchent votre métier sur Google Maps.
          Sont-ils en train de vous trouver ?
        </h2>
        <p className="text-blue-200 mb-8 leading-relaxed">
          Calculez votre score gratuitement — résultat en 30 secondes.
        </p>
        <button
          onClick={() => document.getElementById('hero-search')?.scrollIntoView({ behavior: 'smooth' })}
          className="inline-block rounded-xl bg-white text-blue-700 font-bold text-sm px-8 py-4 hover:bg-blue-50 transition mb-3"
        >
          Analyser ma fiche gratuitement →
        </button>
        <p className="text-blue-300 text-xs">
          Aucune carte bancaire requise · Résultats en 60 secondes
        </p>
      </div>
    </section>
  )
}
