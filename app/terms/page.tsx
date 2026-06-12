export default function TermsPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16 text-gray-700">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Conditions d'utilisation</h1>
      <p className="text-sm text-gray-400 mb-10">Dernière mise à jour : juin 2026</p>

      <section className="mb-8">
        <h2 className="text-lg font-bold text-gray-900 mb-3">1. Objet</h2>
        <p className="text-sm leading-relaxed">
          LocalBoost (thelocalboost.fr) est un service d'optimisation de fiche Google Business Profile destiné aux artisans et commerçants locaux.
          Les présentes conditions régissent l'utilisation du service.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-bold text-gray-900 mb-3">2. Abonnement et tarification</h2>
        <ul className="text-sm leading-relaxed space-y-2 list-disc list-inside">
          <li>Le service est proposé à 29€/mois sans engagement</li>
          <li>Le paiement est prélevé mensuellement via Stripe</li>
          <li>Vous pouvez résilier à tout moment depuis votre espace client</li>
          <li>Garantie satisfait ou remboursé 30 jours sans condition</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-bold text-gray-900 mb-3">3. Accès Google Business Profile</h2>
        <p className="text-sm leading-relaxed">
          En connectant votre fiche Google Business Profile à LocalBoost, vous autorisez le service à lire et modifier les informations de votre établissement (posts, réponses aux avis, description) dans le cadre du service souscrit.
          Vous pouvez révoquer cet accès à tout moment.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-bold text-gray-900 mb-3">4. Responsabilités</h2>
        <p className="text-sm leading-relaxed">
          LocalBoost s'engage à fournir le service avec soin et diligence. LocalBoost ne peut être tenu responsable des décisions algorithmiques de Google concernant le référencement local.
          Les estimations de clients perdus ou de chiffre d'affaires non réalisé sont fournies à titre indicatif.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-bold text-gray-900 mb-3">5. Résiliation</h2>
        <p className="text-sm leading-relaxed">
          Vous pouvez résilier votre abonnement à tout moment depuis votre tableau de bord. La résiliation prend effet à la fin de la période en cours.
          En cas de demande de remboursement dans les 30 jours suivant la souscription, le remboursement est effectué intégralement.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-bold text-gray-900 mb-3">6. Droit applicable</h2>
        <p className="text-sm leading-relaxed">
          Les présentes conditions sont soumises au droit français. En cas de litige, les parties rechercheront une solution amiable avant tout recours judiciaire.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-3">7. Contact</h2>
        <p className="text-sm leading-relaxed">
          LocalBoost — SIREN 105 578 884<br />
          <a href="mailto:contact@thelocalboost.fr" className="text-blue-600 underline">contact@thelocalboost.fr</a>
        </p>
      </section>
    </div>
  )
}
