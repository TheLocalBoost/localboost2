const STATS = [
  { val: '86%', desc: 'des clients cherchent un artisan sur Google avant de l\'appeler', src: 'Google' },
  { val: '7×',  desc: 'plus de visites pour une fiche active vs une fiche négligée',    src: 'Google Business' },
  { val: '35%', desc: 'de clients en plus avec une fiche mise à jour régulièrement',     src: 'BrightLocal 2024' },
]

export default function PainPoints() {
  return (
    <section className="py-14 px-6 bg-gray-50 border-y border-gray-100">
      <div className="max-w-5xl mx-auto">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide text-center mb-8">
          Pourquoi Google Maps est votre meilleur commercial — si votre fiche est entretenue
        </p>
        <div className="grid sm:grid-cols-3 gap-6">
          {STATS.map((s, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
              <p className="text-4xl font-extrabold text-blue-600 mb-2">{s.val}</p>
              <p className="text-sm text-gray-600 leading-relaxed mb-3">{s.desc}</p>
              <p className="text-xs text-gray-400">Source : {s.src}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
