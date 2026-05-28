import Link from 'next/link'

export default function CGVPage() {
  return (
    <div className="min-h-screen bg-gray-50 px-6 py-16">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Link href="/" className="text-sm text-green-600 hover:underline">← Retour à l'accueil</Link>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Conditions Générales de Vente</h1>

        <div className="bg-white rounded-2xl border border-gray-100 p-8 space-y-8 text-sm text-gray-600 leading-relaxed">

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">1. Objet</h2>
            <p>
              Les présentes Conditions Générales de Vente régissent les relations contractuelles entre TheLocalBoost (entrepreneur individuel, SIREN 105 578 884, RCS Val de Briey) et tout client souscrivant au service LocalBoost accessible sur thelocalboost.fr.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">2. Description du service</h2>
            <p>LocalBoost est un service par abonnement qui fournit chaque semaine :</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Un post Google Business personnalisé généré par intelligence artificielle</li>
              <li>Des réponses aux avis Google rédigées par IA</li>
              <li>Un score de visibilité Google hebdomadaire</li>
              <li>Un email récapitulatif chaque lundi matin</li>
            </ul>
            <p className="mt-2">
              Le service génère du contenu prêt à copier-coller. La publication sur Google Business reste à la charge du client, Google ne permettant pas la publication automatique via des tiers.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">3. Prix et facturation</h2>
            <p><strong>Tarif :</strong> 59 € TTC par mois (TVA non applicable — article 293 B du CGI).</p>
            <p className="mt-2"><strong>Période d'essai :</strong> 7 jours gratuits à compter de l'inscription. Aucun débit n'est effectué pendant cette période. Une carte bancaire valide est requise pour démarrer l'essai.</p>
            <p className="mt-2"><strong>Facturation :</strong> À l'issue de la période d'essai, l'abonnement est renouvelé automatiquement chaque mois par prélèvement via Stripe.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">4. Résiliation</h2>
            <p>
              Le client peut résilier son abonnement à tout moment depuis son espace client (rubrique "Compte"). La résiliation prend effet à la fin de la période de facturation en cours. Aucun remboursement partiel n'est effectué pour les jours non utilisés.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">5. Droit de rétractation</h2>
            <p>
              Conformément à l'article L.221-28 du Code de la consommation, le droit de rétractation ne s'applique pas aux services pleinement exécutés avant la fin du délai de rétractation, avec l'accord préalable du consommateur. En démarrant l'utilisation du service pendant la période d'essai, le client reconnaît renoncer à son droit de rétractation pour la période déjà consommée.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">6. Obligations du prestataire</h2>
            <p>
              TheLocalBoost s'engage à fournir le service avec soin et à assurer la disponibilité de la plateforme dans la mesure du possible. En cas d'indisponibilité technique prolongée, le client sera informé par email.
            </p>
            <p className="mt-2">
              Le contenu généré par intelligence artificielle est fourni à titre indicatif. TheLocalBoost ne peut garantir des résultats spécifiques en termes de référencement ou de chiffre d'affaires.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">7. Responsabilité</h2>
            <p>
              TheLocalBoost ne saurait être tenu responsable des dommages indirects résultant de l'utilisation du service, ni des décisions prises par le client sur la base du contenu généré. La responsabilité de TheLocalBoost est limitée au montant des sommes versées par le client au cours des 3 derniers mois.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">8. Données personnelles</h2>
            <p>
              Les données collectées sont traitées conformément au RGPD. Elles sont utilisées exclusivement pour fournir le service. Pour exercer vos droits : <a href="mailto:contact@thelocalboost.fr" className="text-green-600 hover:underline">contact@thelocalboost.fr</a>.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">9. Loi applicable et juridiction</h2>
            <p>
              Les présentes CGV sont soumises au droit français. En cas de litige, et à défaut de résolution amiable, les tribunaux du ressort de Val de Briey seront seuls compétents.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">10. Contact</h2>
            <p>
              Pour toute question : <a href="mailto:contact@thelocalboost.fr" className="text-green-600 hover:underline">contact@thelocalboost.fr</a>
            </p>
          </section>

          <p className="text-xs text-gray-400 pt-4 border-t border-gray-100">Dernière mise à jour : mai 2026</p>

        </div>
      </div>
    </div>
  )
}
