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

  const title = `Fiche Google ${secteur.label} à ${ville} — Analysez votre visibilité gratuit`
  const description = `Votre fiche Google ${secteur.label} à ${ville} est-elle visible ? Analysez gratuitement en 30 secondes : score, points faibles, clients perdus. Sans inscription.`

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
            Votre fiche Google <span className="text-blue-600">{secteur.label} à {ville}</span> est-elle visible ?
          </h1>
          <p className="text-xl text-gray-500 mb-8">
            {secteur.description} {secteur.urgence}
          </p>
          <Link
            href={analyserUrl}
            className="inline-flex items-center gap-2 bg-green-600 text-white font-bold text-lg px-8 py-4 rounded-xl hover:bg-green-700 transition shadow-lg"
          >
            Analyser ma fiche Google gratuitement →
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
              { step: '2', title: 'Analyse en 30s', desc: 'LocalBoost analyse votre fiche Google Maps en temps réel' },
              { step: '3', title: 'Votre score', desc: 'Recevez un score sur 100 et la liste des points à corriger' },
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
            Analysez votre {secteur.label} à {ville} maintenant
          </h2>
          <p className="text-blue-100 mb-6">Gratuit · Sans inscription · Résultat immédiat</p>
          <Link
            href={analyserUrl}
            className="inline-flex items-center gap-2 bg-white text-blue-600 font-bold text-lg px-8 py-4 rounded-xl hover:bg-blue-50 transition"
          >
            Voir mon score Google →
          </Link>
        </section>

        {/* FAQ SEO */}
        <section className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Questions fréquentes</h2>
          <div className="space-y-6">
            {[
              {
                q: `Comment améliorer la visibilité de mon ${secteur.label} sur Google Maps à ${ville} ?`,
                a: `Pour améliorer la visibilité de votre ${secteur.label} sur Google Maps à ${ville}, commencez par vérifier que votre fiche Google Business est complète : horaires à jour, photos récentes, description, catégorie principale correcte et réponses aux avis. LocalBoost analyse ces points en 30 secondes.`,
              },
              {
                q: `Pourquoi mon ${secteur.label} n'apparaît pas en premier sur Google Maps à ${ville} ?`,
                a: `Google Maps classe les commerces selon l'activité de leur fiche, la proximité et la pertinence. Un ${secteur.label} avec une fiche inactive peut être dépassé par des concurrents moins bien notés mais plus actifs. Notre outil identifie précisément ce qui limite votre classement.`,
              },
              {
                q: `L'analyse de fiche Google est-elle vraiment gratuite ?`,
                a: `Oui, l'analyse de base est 100% gratuite et sans inscription. Vous obtenez un score sur 100 et les principaux points à corriger immédiatement.`,
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
