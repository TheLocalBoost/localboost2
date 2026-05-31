const GUARANTEE = '✓ 7 jours gratuits · ✓ Satisfait ou remboursé 30 jours · ✓ Annulation en 1 clic'

const LB_FEATURES = [
  'Post Google Business hebdomadaire par IA',
  'Réponses aux avis illimitées',
  'Score de visibilité hebdomadaire',
  'Email récap chaque lundi',
  'Sans engagement',
]
const DB_FEATURES = [
  'Devis IA en 30 secondes',
  'PDF professionnel prêt à envoyer',
  'Carnet clients intégré',
  'Relances automatiques',
  'Sans engagement',
]
const PACK_FEATURES = [
  'Tout LocalBoost inclus',
  'Tout DevisBoost inclus',
  'Économisez 20€/mois vs séparé',
  'Support prioritaire',
  'Sans engagement',
]

function Card({
  title, price, sub, features, cta, href, highlight, badge, strikethrough, ctaClass
}: {
  title: string; price: string; sub?: string; features: string[]; cta: string; href: string
  highlight?: boolean; badge?: string; strikethrough?: string; ctaClass: string
}) {
  return (
    <div className={`rounded-2xl border-2 p-6 flex flex-col ${highlight ? 'border-amber-400 shadow-xl scale-105' : 'border-gray-100 shadow-sm'} bg-white`}>
      {badge && (
        <div className="inline-flex self-start items-center gap-1 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold px-3 py-1 rounded-full mb-4">
          🏆 {badge}
        </div>
      )}
      <h3 className="font-bold text-gray-900 text-lg mb-4">{title}</h3>
      <div className="mb-1">
        {strikethrough && <p className="text-sm text-gray-400 line-through">{strikethrough}</p>}
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-extrabold text-gray-900">{price}</span>
          <span className="text-gray-400">/mois</span>
        </div>
      </div>
      <p className="text-xs italic text-gray-400 mb-1">soit moins d'un café par jour</p>
      <p className="text-xs text-gray-400 mb-6">après 7 jours gratuits</p>
      <ul className="space-y-2.5 mb-6 flex-1">
        {features.map(f => (
          <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
            <span className="text-green-500 mt-0.5 shrink-0">✓</span>{f}
          </li>
        ))}
      </ul>
      <a href={href} className={`block w-full rounded-xl py-3 text-center text-sm font-semibold transition ${ctaClass}`}>
        {cta}
      </a>
      <p className="text-xs text-gray-400 text-center mt-2">{GUARANTEE}</p>
    </div>
  )
}

export default function Pricing() {
  return (
    <section id="pricing" className="py-20 px-6 bg-white">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-3">Simple. Transparent. Sans engagement.</h2>
        <p className="text-gray-400 text-center mb-12">Choisissez votre module — ou les deux pour économiser 20€/mois.</p>

        <div className="grid sm:grid-cols-3 gap-6 items-start">
          <Card
            title="📍 LocalBoost"
            price="59€"
            features={LB_FEATURES}
            cta="Essayer LocalBoost"
            href="/signup"
            ctaClass="bg-blue-600 text-white hover:bg-blue-700"
          />
          <Card
            title="🎁 Pack Complet"
            price="79€"
            strikethrough="98€/mois"
            features={PACK_FEATURES}
            cta="Meilleure offre →"
            href="/signup"
            highlight
            badge="Économisez 20€/mois"
            ctaClass="bg-amber-500 text-white hover:bg-amber-600"
          />
          <Card
            title="📋 DevisBoost"
            price="39€"
            features={DB_FEATURES}
            cta="Essayer DevisBoost"
            href="/devisboost/dashboard"
            ctaClass="bg-green-600 text-white hover:bg-green-700"
          />
        </div>
      </div>
    </section>
  )
}
