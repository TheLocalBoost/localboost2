import Link from 'next/link'

export default function MentionsLegalesPage() {
  return (
    <div className="min-h-screen bg-gray-50 px-6 py-16">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Link href="/" className="text-sm text-green-600 hover:underline">← Retour à l'accueil</Link>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Mentions légales</h1>

        <div className="bg-white rounded-2xl border border-gray-100 p-8 space-y-8 text-sm text-gray-600 leading-relaxed">

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">1. Éditeur du site</h2>
            <p><strong>Dénomination :</strong> TheLocalBoost</p>
            <p><strong>Forme juridique :</strong> Entrepreneur individuel</p>
            <p><strong>SIREN :</strong> 105 578 884</p>
            <p><strong>RCS :</strong> Val de Briey</p>
            <p><strong>Email :</strong> contact@thelocalboost.fr</p>
            <p><strong>Directeur de la publication :</strong> Brian Mansart</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">2. Hébergement</h2>
            <p><strong>Hébergeur :</strong> Vercel Inc.</p>
            <p><strong>Adresse :</strong> 340 Pine Street Suite 701, San Francisco, CA 94104, États-Unis</p>
            <p><strong>Site :</strong> vercel.com</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">3. Propriété intellectuelle</h2>
            <p>
              L'ensemble des contenus présents sur le site thelocalboost.fr (textes, images, logos, code) est la propriété exclusive de TheLocalBoost, sauf mention contraire. Toute reproduction, représentation ou diffusion, en tout ou partie, est interdite sans autorisation écrite préalable.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">4. Données personnelles</h2>
            <p>
              Les données collectées (email, nom du commerce, ville) sont utilisées uniquement pour fournir le service LocalBoost. Elles ne sont ni vendues ni transmises à des tiers à des fins commerciales. Conformément au RGPD, vous disposez d'un droit d'accès, de rectification et de suppression de vos données en contactant <a href="mailto:contact@thelocalboost.fr" className="text-green-600 hover:underline">contact@thelocalboost.fr</a>.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">5. Cookies</h2>
            <p>
              Le site utilise des cookies techniques nécessaires au bon fonctionnement du service (authentification, session). Aucun cookie publicitaire ou de tracking tiers n'est utilisé.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">6. Contact</h2>
            <p>
              Pour toute question relative aux présentes mentions légales : <a href="mailto:contact@thelocalboost.fr" className="text-green-600 hover:underline">contact@thelocalboost.fr</a>
            </p>
          </section>

        </div>
      </div>
    </div>
  )
}
