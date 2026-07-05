import Link from 'next/link'
import { SECTEURS, VILLES_UNIQUES, slugify } from '@/lib/seo-data'

const TOP_VILLES = [
  'Paris', 'Lyon', 'Marseille', 'Toulouse', 'Nice', 'Nantes', 'Bordeaux',
  'Lille', 'Strasbourg', 'Rennes', 'Grenoble', 'Montpellier', 'Toulon', 'Dijon',
]

const SECTEURS_LIST = Object.entries(SECTEURS).slice(0, 8)

export default function SeoLinks() {
  return (
    <section className="py-16 px-6 bg-gray-50 border-t border-gray-100">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">
          Analyser votre fiche Google par secteur et ville
        </h2>
        <p className="text-gray-500 text-center mb-10">
          Diagnostic gratuit · Sans inscription · Résultat en 60 secondes
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {SECTEURS_LIST.map(([slug, secteur]) => (
            <div key={slug} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-3 capitalize">{secteur.label}</h3>
              <ul className="space-y-1.5">
                {TOP_VILLES.slice(0, 6).map(ville => (
                  <li key={ville}>
                    <Link
                      href={`/${slug}/${slugify(ville)}`}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {secteur.label} à {ville}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-400 mb-3">Toutes les villes</p>
          <div className="flex flex-wrap justify-center gap-2">
            {TOP_VILLES.map(ville => (
              <Link
                key={ville}
                href={`/boulangerie/${slugify(ville)}`}
                className="text-xs text-gray-500 hover:text-blue-600 bg-white border border-gray-200 rounded-full px-3 py-1"
              >
                {ville}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
