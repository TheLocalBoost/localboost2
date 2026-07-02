import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { SECTEURS, VILLES_UNIQUES, slugify, unslugify } from '@/lib/seo-data'

interface Props {
  params: Promise<{ secteur: string; ville: string }>
}

export async function generateStaticParams() {
  const params = []
  for (const secteurSlug of Object.keys(SECTEURS)) {
    for (const ville of VILLES_UNIQUES) {
      params.push({ secteur: secteurSlug, ville: slugify(ville) })
    }
  }
  return params
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { secteur: secteurSlug, ville: villeSlug } = await params
  const secteur = SECTEURS[secteurSlug]
  const ville = unslugify(villeSlug)
  if (!secteur || !ville) return {}

  const title = `${secteur.label} à ${ville} — Pourquoi votre fiche Google laisse partir des clients`
  const description = `Votre fiche Google ${secteur.label} à ${ville} est-elle convaincante ? En 30 secondes, découvrez ce qui bloque votre visibilité et recevez les corrections déjà préparées. Gratuit, sans inscription.`

  return {
    title,
    description,
    openGraph: { title, description, url: `https://thelocalboost.fr/${secteurSlug}/${villeSlug}` },
    alternates: { canonical: `https://thelocalboost.fr/${secteurSlug}/${villeSlug}` },
  }
}

export default async function SeoPage({ params }: Props) {
  const { secteur: secteurSlug, ville: villeSlug } = await params
  const secteur = SECTEURS[secteurSlug]
  const ville = unslugify(villeSlug)
  if (!secteur || !ville) notFound()

  const analyserUrl = `/analyser?ville=${encodeURIComponent(ville)}&utm_source=seo&utm_medium=organic&utm_campaign=${secteurSlug}`

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="font-bold text-gray-900 text-lg flex items-center gap-2">
          <span>📍</span><span>LocalBoost</span>
        </Link>
        <Link href="/pricing" className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition">
          Voir les tarifs →
        </Link>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-16">

        {/* Hero */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 rounded-full bg-red-50 border border-red-200 px-4 py-1.5 text-sm font-medium text-red-600 mb-6">
            ⚠️ Diagnostic gratuit — résultat en 30 secondes
          </div>
          <h1 className="text-4xl font-extrabold text-gray-900 leading-tight mb-4">
            Pourquoi votre fiche Google <span className="text-blue-600">{secteur.label} à {ville}</span> laisse partir des clients
          </h1>
          <p className="text-xl text-gray-500 mb-8">
            {secteur.description} {secteur.urgence}
          </p>
          <Link
            href={analyserUrl}
            className="inline-flex items-center gap-2 bg-green-600 text-white font-bold text-lg px-8 py-4 rounded-xl hover:bg-green-700 transition shadow-lg"
          >
            Voir ce qui bloque ma fiche — gratuit →
          </Link>
          <p className="text-sm text-gray-400 mt-3">Aucune inscription · Aucune carte bancaire · Résultat immédiat</p>
        </div>

        {/* Problème */}
        <section className="bg-gray-50 rounded-2xl p-8 mb-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Pourquoi certains {secteur.labelPluriel} à {ville} apparaissent avant vous
          </h2>
          <p className="text-gray-600 mb-4">
            Google Maps ne classe pas les commerces par ordre de qualité. Il classe les fiches les mieux optimisées.
            Un concurrent moins bien noté peut apparaître avant vous si sa fiche est plus complète et plus active.
          </p>
          <ul className="space-y-3">
            {[
              'Horaires incorrects ou manquants',
              'Pas de photos récentes sur la fiche',
              'Absence de réponses aux avis clients',
              'Description incomplète ou absente',
              'Catégorie principale mal configurée',
            ].map((p, i) => (
              <li key={i} className="flex items-center gap-3 text-gray-700">
                <span className="text-red-500 font-bold">✗</span> {p}
              </li>
            ))}
          </ul>
        </section>

        {/* Comment ça marche */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Comment fonctionne l'analyse
          </h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { step: '1', title: 'Entrez votre nom', desc: `Saisissez le nom de votre ${secteur.label} et la ville de ${ville}` },
              { step: '2', title: 'Analyse en 30s', desc: 'LocalBoost analyse votre fiche et compare avec vos concurrents locaux en temps réel' },
              { step: '3', title: 'Corrections préparées', desc: 'Recevez les améliorations déjà rédigées pour votre fiche — description, publications, réponses aux avis' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="text-center">
                <div className="w-12 h-12 rounded-full bg-blue-600 text-white font-bold text-xl flex items-center justify-center mx-auto mb-3">{step}</div>
                <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
                <p className="text-sm text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA final */}
        <section className="bg-blue-600 rounded-2xl p-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-3">
            Voyez ce qui bloque votre {secteur.label} à {ville}
          </h2>
          <p className="text-blue-100 mb-6">Gratuit · Sans inscription · Corrections déjà préparées</p>
          <Link
            href={analyserUrl}
            className="inline-flex items-center gap-2 bg-white text-blue-600 font-bold text-lg px-8 py-4 rounded-xl hover:bg-blue-50 transition"
          >
            Voir ce qui bloque ma fiche — gratuit →
          </Link>
        </section>

        {/* FAQ SEO */}
        <section className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Questions fréquentes</h2>
          <div className="space-y-6">
            {[
              {
                q: `Comment faire apparaître mon ${secteur.label} en premier sur Google Maps à ${ville} ?`,
                a: `Google Maps classe les fiches selon leur activité récente (publications, réponses aux avis), leur complétude (description, horaires, photos) et la confiance des avis. Un ${secteur.label} avec une fiche active et bien renseignée à ${ville} apparaît avant ses concurrents, même moins bien notés. LocalBoost identifie ce qui manque et prépare les corrections en 30 secondes.`,
              },
              {
                q: `Pourquoi des concurrents moins bien notés apparaissent avant mon ${secteur.label} à ${ville} ?`,
                a: `C'est l'algorithme Google Maps. La note ne suffit pas — une fiche sans publications récentes ni réponses aux avis est considérée comme inactive et descend dans les résultats. À ${ville}, un concurrent moins bien noté mais plus actif sur sa fiche vous devance chaque semaine. Notre diagnostic identifie précisément ce qui vous freine.`,
              },
              {
                q: `Qu'est-ce que LocalBoost prépare concrètement pour ma fiche ?`,
                a: `Après l'analyse gratuite, LocalBoost génère un dossier complet personnalisé : nouvelle description optimisée pour votre ${secteur.label} à ${ville}, 12 publications prêtes à publier, réponses à vos avis clients, QR code collecte d'avis et plan d'action. Tout est prêt à mettre en ligne en 10 minutes.`,
              },
            ].map(({ q, a }, i) => (
              <div key={i} className="border-b border-gray-100 pb-6">
                <h3 className="font-semibold text-gray-900 mb-2">{q}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </section>

      </main>

      <footer className="border-t border-gray-100 py-8 text-center text-sm text-gray-400">
        <Link href="/" className="hover:text-gray-600">LocalBoost</Link> · Analyse de fiche Google Business gratuite
      </footer>
    </div>
  )
}
