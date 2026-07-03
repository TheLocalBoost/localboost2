export default function Deliverables() {
  const items = [
    { icon: '📝', label: 'Description Google', sub: '1 — prête à publier' },
    { icon: '📅', label: 'Publications', sub: '12 — 3 mois d\'avance' },
    { icon: '⭐', label: 'Réponses aux avis', sub: 'Tous vos avis récents' },
    { icon: '📋', label: '30 modèles réponses', sub: 'Réutilisables à vie' },
    { icon: '📲', label: 'QR code + SMS', sub: 'Pour collecter des avis' },
    { icon: '📈', label: 'Plan d\'action', sub: 'Basé sur vos concurrents' },
  ]

  return (
    <section className="py-20 px-6 bg-gray-50">
      <div className="max-w-2xl mx-auto text-center">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Ce que vous recevez</p>
        <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Votre dossier complet.</h2>
        <p className="text-gray-500 mb-12">Livré par email en 48h. Prêt à publier.</p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-10">
          {items.map(({ icon, label, sub }) => (
            <div key={label} className="bg-white rounded-2xl border border-gray-100 p-5 text-center shadow-sm">
              <p className="text-2xl mb-2">{icon}</p>
              <p className="text-sm font-bold text-gray-900">{label}</p>
              <p className="text-xs text-green-600 font-medium mt-1">✓ {sub}</p>
            </div>
          ))}
        </div>

        <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
          <p className="text-green-800 font-extrabold text-xl mb-1">39€ · livré en 48h</p>
          <p className="text-green-700 text-sm mb-4">Satisfait ou remboursé · Sans engagement</p>
          <a
            href="/analyser"
            className="inline-block rounded-xl bg-green-500 hover:bg-green-400 px-8 py-3.5 text-base font-extrabold text-white transition shadow-lg"
          >
            Analyser ma fiche — gratuit →
          </a>
        </div>
      </div>
    </section>
  )
}
