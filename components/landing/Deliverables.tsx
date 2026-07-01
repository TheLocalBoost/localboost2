const SECTIONS = [
  {
    icon: '📍',
    title: 'Rendre votre fiche plus convaincante',
    items: [
      { icon: '📝', label: 'Nouvelle description professionnelle', desc: 'Rédigée pour votre métier et votre ville. Prête à publier directement dans votre fiche Google.' },
      { icon: '🛠️', label: 'Services rédigés pour votre fiche', desc: '5 services détaillés à ajouter à votre fiche Google — plus de visibilité sur les recherches spécifiques.' },
      { icon: '❓', label: 'FAQ métier — 20 questions/réponses', desc: 'Les questions que vos clients posent, avec des réponses prêtes à publier sur Google Business.' },
    ],
  },
  {
    icon: '📅',
    title: 'Montrer que votre entreprise est active',
    items: [
      { icon: '📅', label: '12 publications — 1 par semaine pendant 3 mois', desc: 'Saisonnières, conseils, promos, témoignages... Votre fiche reste active sans que vous ayez à y penser.' },
      { icon: '🗓️', label: 'Calendrier éditorial avec dates réelles', desc: '"Publiez le lundi 7 juillet, le lundi 21 juillet..." — tout est planifié, vous n\'avez qu\'à suivre.' },
      { icon: '📸', label: '20 idées de photos adaptées à votre métier', desc: 'Avant/après, équipe, coulisses, matériel... Des idées concrètes à photographier avec votre téléphone.' },
    ],
  },
  {
    icon: '⭐',
    title: 'Donner confiance avant le premier appel',
    items: [
      { icon: '⭐', label: 'Réponses personnalisées à vos avis récents', desc: 'Chaque réponse cite le prénom du client et un détail de son avis. Pas de modèle générique.' },
      { icon: '📋', label: '30 réponses types classées par situation', desc: 'Avis 5★, mitigé, négatif, incident... 30 modèles à adapter selon la situation.' },
      { icon: '📲', label: 'QR code collecte d\'avis + script SMS', desc: 'À afficher en boutique et à envoyer après chaque prestation. Plus d\'avis = mieux classé.' },
    ],
  },
  {
    icon: '⚡',
    title: 'Gagner plusieurs heures',
    items: [
      { icon: '📖', label: 'Guide de mise en ligne pas à pas', desc: 'Où cliquer, dans quel ordre. Tout mettre en ligne en moins de 10 minutes.' },
      { icon: '🎯', label: 'Plan d\'action personnalisé', desc: 'Les priorités concrètes basées sur vos vrais concurrents locaux.' },
    ],
  },
]

export default function Deliverables() {
  return (
    <section className="py-20 px-6 bg-gray-50 border-y border-gray-100">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Ce que vous recevez</p>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            Votre dossier complet livré par email en 48h
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            Tout ce qu'une agence prépare en 2 semaines pour 300€ — préparé à partir de vos vraies données Google, personnalisé pour votre commerce.
          </p>
        </div>

        <div className="space-y-8 mb-10">
          {SECTIONS.map(({ icon, title, items }) => (
            <div key={title}>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">{icon} {title}</p>
              <div className="grid sm:grid-cols-3 gap-3">
                {items.map(({ label, desc }) => (
                  <div key={label} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                    <p className="font-bold text-gray-900 text-sm mb-1">✓ {label}</p>
                    <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-2xl bg-green-50 border border-green-200 p-6 text-center">
          <p className="text-green-800 font-bold text-lg mb-1">Tout ça pour 39€ — livré en 48h</p>
          <p className="text-green-700 text-sm mb-4">Satisfait ou remboursé sous 30 jours · Sans engagement · Sans inscription</p>
          <a
            href="/analyser"
            className="inline-block rounded-xl bg-green-500 hover:bg-green-400 px-8 py-3.5 text-base font-extrabold text-white transition shadow-lg"
          >
            Voir ce qui bloque ma fiche — gratuit →
          </a>
          <p className="text-xs text-green-600 mt-3">L'analyse est gratuite. Vous décidez après.</p>
        </div>
      </div>
    </section>
  )
}
