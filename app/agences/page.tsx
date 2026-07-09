'use client'
import { useEffect } from 'react'
import Link from 'next/link'
import { track } from '@/lib/track'

const EXAMPLE_LEADS = [
  { nom: 'Boulangerie du Marché',   ville: 'Lyon',    secteur: 'boulanger',  points: ['Pas de description', '2 avis sans réponse', 'Aucune publication depuis 4 mois'] },
  { nom: 'Plomberie Rapide',        ville: 'Bordeaux', secteur: 'plombier',  points: ['Horaires absents', '7 avis, note 3.8/5', 'Pas de site web'] },
  { nom: 'Salon Coiffure Éclat',    ville: 'Nantes',  secteur: 'coiffeur',  points: ['3 photos seulement', 'Description incomplète', 'Dernier avis il y a 6 mois'] },
]

export default function AgencesPage() {
  useEffect(() => {
    track('agence_page_view', {})
  }, [])

  return (
    <main className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-gray-100 px-6 py-4 flex items-center justify-between max-w-5xl mx-auto">
        <Link href="/" className="text-sm font-semibold text-gray-900">LocalBoost</Link>
        <a
          href="mailto:contact@fichelocal.com?subject=Offre agences — demande d'informations"
          className="text-sm font-semibold text-[#16a34a] hover:underline"
        >
          Nous contacter
        </a>
      </nav>

      {/* Hero */}
      <section className="max-w-3xl mx-auto px-6 pt-16 pb-12 text-center">
        <span className="inline-block text-xs font-semibold text-[#16a34a] bg-green-50 px-3 py-1 rounded-full mb-6 tracking-wide uppercase">
          Offre agences & freelances
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight mb-4">
          Leads artisans pré-qualifiés<br className="hidden sm:block" /> avec diagnostic Google Business inclus
        </h1>
        <p className="text-lg text-gray-500 max-w-xl mx-auto mb-8">
          Obtenez des listes de commerces locaux avec les points faibles de leur fiche Google déjà identifiés — pour cibler vos campagnes sur les prospects qui en ont le plus besoin.
        </p>
        <a
          href="mailto:contact@fichelocal.com?subject=Offre agences — demande d'informations"
          onClick={() => track('agence_contact_request', { source: 'hero_cta' })}
          className="inline-block bg-gray-900 text-white text-sm font-bold px-6 py-3.5 rounded-xl hover:bg-gray-800 transition"
        >
          Demander un accès →
        </a>
      </section>

      {/* Ce qu'on fournit */}
      <section className="max-w-3xl mx-auto px-6 py-12 border-t border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Ce que vous recevez pour chaque lead</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: 'Nom & ville',       desc: "Nom de l'établissement, commune, secteur d'activité" },
            { label: 'Points faibles',     desc: "Liste des problèmes détectés sur la fiche Google (photos, horaires, avis, description...)" },
            { label: 'Lien diagnostic',    desc: "URL directe vers l'analyse complète de la fiche, pré-remplie pour votre commercial" },
            { label: 'Concurrent n°1',     desc: "Le concurrent le mieux positionné sur la même requête locale" },
          ].map(({ label, desc }) => (
            <div key={label} className="border border-gray-200 rounded-xl p-4">
              <p className="text-sm font-bold text-gray-900 mb-1">{label}</p>
              <p className="text-sm text-gray-500">{desc}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-4">
          Les exports standard n&apos;incluent pas l&apos;email personnel de l&apos;artisan. Disponible sur demande dans une offre premium avec accord contractuel RGPD.
        </p>
      </section>

      {/* Méthodologie */}
      <section className="max-w-3xl mx-auto px-6 py-12 border-t border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Méthodologie</h2>
        <ol className="space-y-3">
          {[
            'Collecte via Google Maps et Bing — uniquement des établissements avec fiche Google Business publique.',
            'Diagnostic automatique sur 30+ critères : complétude de la fiche, photos, horaires, avis, description, activité récente.',
            'Filtres qualité : nom valide, email vérifié (MX check), exclusion des établissements hors France.',
            'Données jamais mockées — chaque score reflète l\'état réel de la fiche au moment de l\'analyse.',
          ].map((step, i) => (
            <li key={i} className="flex gap-3 text-sm text-gray-600">
              <span className="shrink-0 w-5 h-5 rounded-full bg-[#16a34a] text-white text-xs font-bold flex items-center justify-center mt-0.5">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </section>

      {/* Exemple anonymisé */}
      <section className="max-w-3xl mx-auto px-6 py-12 border-t border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Exemple de leads fournis</h2>
        <p className="text-sm text-gray-400 mb-6">Données fictives pour illustration — les exports réels utilisent les mêmes colonnes.</p>
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Établissement', 'Ville', 'Secteur', 'Points faibles', 'Diagnostic'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-400 px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {EXAMPLE_LEADS.map((lead, i) => (
                <tr key={i} className="border-t border-gray-100">
                  <td className="px-4 py-3 font-medium text-gray-900">{lead.nom}</td>
                  <td className="px-4 py-3 text-gray-600">{lead.ville}</td>
                  <td className="px-4 py-3 text-gray-500 capitalize">{lead.secteur}</td>
                  <td className="px-4 py-3">
                    <ul className="space-y-0.5">
                      {lead.points.map((p, j) => (
                        <li key={j} className="flex items-center gap-1.5 text-gray-500">
                          <span className="text-orange-400 text-xs font-bold">✗</span>
                          {p}
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-[#16a34a] font-medium">Lien fourni →</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Tarifs & contact */}
      <section className="max-w-3xl mx-auto px-6 py-12 border-t border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Tarifs et accès</h2>
        <p className="text-sm text-gray-500 mb-6">
          Cette offre est adaptée selon votre volume et vos critères de ciblage (ville, secteur, taille du lot).
          Contactez-nous pour recevoir une proposition personnalisée — pas de paiement en ligne, nous échangeons directement.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {[
            { label: 'Lot ponctuel',   desc: '100–500 leads filtrés par ville et secteur. Livraison CSV sous 24h.' },
            { label: 'Flux mensuel',   desc: 'Nouveaux leads chaque mois, toujours frais. Accès API disponible.' },
          ].map(({ label, desc }) => (
            <div key={label} className="border border-gray-200 rounded-xl p-5">
              <p className="font-bold text-gray-900 mb-1">{label}</p>
              <p className="text-sm text-gray-500">{desc}</p>
            </div>
          ))}
        </div>
        <a
          href="mailto:contact@fichelocal.com?subject=Offre agences — demande d'informations"
          onClick={() => track('agence_contact_request', { source: 'bottom_cta' })}
          className="inline-block bg-[#16a34a] text-white text-sm font-bold px-6 py-3.5 rounded-xl hover:bg-green-700 transition"
        >
          Demander un accès →
        </a>
      </section>

      {/* RGPD note */}
      <section className="max-w-3xl mx-auto px-6 pb-16 border-t border-gray-100 pt-8">
        <p className="text-xs text-gray-400">
          Les données exportées concernent des établissements professionnels référencés publiquement sur Google Maps.
          Leur utilisation doit respecter le RGPD et les obligations légales applicables à votre activité.
          Tout acheteur s&apos;engage contractuellement à utiliser ces données uniquement dans le cadre de prospection B2B conforme.
        </p>
      </section>
    </main>
  )
}
