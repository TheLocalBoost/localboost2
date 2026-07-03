'use client'

export default function CTAFinal() {
  return (
    <section className="py-20 px-6 bg-gray-900">
      <div className="max-w-lg mx-auto text-center">
        <h2 className="text-3xl font-extrabold text-white mb-4 leading-tight">
          Votre fiche Google travaille pour vous.<br />
          <span className="text-green-400">Ou pour vos concurrents.</span>
        </h2>
        <p className="text-gray-400 mb-8">Commencez par voir ce qui bloque — gratuitement.</p>
        <a
          href="/analyser"
          className="inline-block rounded-xl bg-green-500 hover:bg-green-400 text-white font-bold text-base px-10 py-4 transition shadow-lg mb-3"
        >
          Analyser ma fiche →
        </a>
        <p className="text-gray-500 text-xs">Sans inscription · Résultat en 60 secondes</p>
      </div>
    </section>
  )
}
