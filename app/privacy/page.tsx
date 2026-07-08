export default function PrivacyPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16 text-gray-700">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Politique de confidentialité</h1>
      <p className="text-sm text-gray-400 mb-10">Dernière mise à jour : juin 2026</p>

      <section className="mb-8">
        <h2 className="text-lg font-bold text-gray-900 mb-3">1. Responsable du traitement</h2>
        <p className="text-sm leading-relaxed">
          LocalBoost — entreprise individuelle enregistrée en France (SIREN 105 578 884).<br />
          Contact : <a href="mailto:contact@thelocalboost.fr" className="text-blue-600 underline">contact@thelocalboost.fr</a>
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-bold text-gray-900 mb-3">2. Données collectées</h2>
        <ul className="text-sm leading-relaxed space-y-2 list-disc list-inside">
          <li>Adresse email (inscription, contact)</li>
          <li>Nom de l'établissement et ville (analyse de fiche Google)</li>
          <li>Données de connexion Google Business Profile (via OAuth Google, avec votre consentement explicite)</li>
          <li>Données de navigation anonymisées (pages visitées, source de trafic)</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-bold text-gray-900 mb-3">3. Finalités du traitement</h2>
        <ul className="text-sm leading-relaxed space-y-2 list-disc list-inside">
          <li>Fourniture du service LocalBoost (analyse et optimisation de fiche Google Business)</li>
          <li>Envoi d'emails liés au service (rapports, notifications)</li>
          <li>Suivi commercial B2B : si vous consultez la page de tarification avec un email identifié sans finaliser votre achat, vous pouvez recevoir un email de suivi unique vous invitant à poser vos questions ou à finaliser. Cet email est envoyé sur la base de l'intérêt légitime (art. 6.1.f RGPD), dans le cadre d'une relation commerciale B2B. Chaque email contient un lien de désinscription opérationnel conformément à la RFC 8058.</li>
          <li>Amélioration du service</li>
          <li>Facturation et gestion des abonnements (via Stripe)</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-bold text-gray-900 mb-3">4. Connexion Google Business Profile</h2>
        <p className="text-sm leading-relaxed">
          Lorsque vous connectez votre fiche Google Business Profile à LocalBoost via OAuth, nous accédons aux données de votre établissement (posts, avis, statistiques) uniquement dans le cadre du service souscrit.
          Nous ne partageons pas ces données avec des tiers. Vous pouvez révoquer cet accès à tout moment depuis votre tableau de bord ou depuis votre compte Google.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-bold text-gray-900 mb-3">5. Durée de conservation</h2>
        <p className="text-sm leading-relaxed">
          Vos données sont conservées pendant la durée de votre abonnement, puis supprimées dans un délai de 30 jours suivant la résiliation, sauf obligation légale contraire.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-bold text-gray-900 mb-3">6. Vos droits (RGPD)</h2>
        <p className="text-sm leading-relaxed">
          Conformément au RGPD, vous disposez d'un droit d'accès, de rectification, de suppression et de portabilité de vos données.
          Pour exercer ces droits : <a href="mailto:contact@thelocalboost.fr" className="text-blue-600 underline">contact@thelocalboost.fr</a>
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-bold text-gray-900 mb-3">7. Hébergement</h2>
        <p className="text-sm leading-relaxed">
          Le service est hébergé sur Vercel (Union Européenne) et Supabase (Union Européenne).
          Les paiements sont traités par Stripe (conforme PCI-DSS).
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-3">8. Contact</h2>
        <p className="text-sm leading-relaxed">
          Pour toute question relative à vos données personnelles :<br />
          <a href="mailto:contact@thelocalboost.fr" className="text-blue-600 underline">contact@thelocalboost.fr</a>
        </p>
      </section>
    </div>
  )
}
