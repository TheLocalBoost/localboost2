export default function CTAFinal() {
  return (
    <section className="py-24 px-6" style={{ backgroundColor: '#1e3a5f' }}>
      <div className="max-w-xl mx-auto text-center">
        <h2 className="text-3xl font-extrabold text-white mb-4">
          Prêt à gagner 5h par semaine ?
        </h2>
        <p className="text-blue-200 mb-8 text-lg leading-relaxed">
          Rejoignez les artisans qui ont choisi l'IA pour développer leur activité.
        </p>
        <a
          href="/signup"
          className="inline-block rounded-xl bg-white text-blue-700 font-bold text-sm px-8 py-4 hover:bg-blue-50 transition mb-4"
        >
          Commencer gratuitement →
        </a>
        <p className="text-sm text-blue-200/70">
          ⚡ Configuration en 3 minutes — 7 jours gratuits — Aucune carte requise
        </p>
      </div>
    </section>
  )
}
