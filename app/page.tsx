import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-xl">🚀</span>
          <span className="font-bold text-gray-900">LocalBoost</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900">
            Connexion
          </Link>
          <Link href="/signup" className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 transition">
            Essai gratuit
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="max-w-4xl mx-auto px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-green-50 border border-green-200 px-4 py-1.5 text-sm font-medium text-green-700 mb-6">
          🎯 Spécialisé commerçants locaux français
        </div>
        <h1 className="text-5xl font-extrabold text-gray-900 mb-6 leading-tight">
          Votre fiche Google Business<br />
          <span className="text-green-600">gérée par l'IA</span>
        </h1>
        <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto">
          Posts Google Business et réponses aux avis générés automatiquement chaque semaine. Vos clients vous trouvent avant vos concurrents.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/signup" className="rounded-xl bg-green-600 px-8 py-4 text-base font-semibold text-white hover:bg-green-700 transition w-full sm:w-auto">
            Commencer 7 jours gratuits
          </Link>
          <p className="text-sm text-gray-400">59€/mois après. Sans engagement.</p>
        </div>
      </div>

      {/* Problème */}
      <div className="bg-gray-50 py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Vos concurrents apparaissent avant vous sur Google Maps
          </h2>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              { emoji: '😓', title: 'Vous manquez de temps', desc: 'Entre le four, les clients et la gestion — le marketing passe toujours après.' },
              { emoji: '😕', title: 'Vous ne savez pas quoi écrire', desc: 'Une page blanche chaque semaine. Résultat : votre fiche n\'est jamais à jour.' },
              { emoji: '📉', title: 'Vous perdez des clients', desc: 'Google favorise les fiches actives. Vos concurrents qui publient vous dépassent.' },
            ].map((item) => (
              <div key={item.title} className="bg-white rounded-2xl p-6 border border-gray-100">
                <div className="text-3xl mb-3">{item.emoji}</div>
                <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Solution */}
      <div className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            LocalBoost fait le travail à votre place
          </h2>
          <p className="text-gray-500 mb-12">Chaque semaine, automatiquement, sans que vous ayez à y penser.</p>
          <div className="grid sm:grid-cols-2 gap-6 text-left">
            {[
              { emoji: '📍', title: 'Post Google Business hebdomadaire', desc: 'L\'IA génère chaque semaine un post calibré pour votre commerce, votre ville et la saison.' },
              { emoji: '⭐', title: 'Réponses aux avis en 60 secondes', desc: 'Collez un avis, recevez 3 réponses personnalisées prêtes à publier.' },
              { emoji: '📊', title: 'Score de visibilité', desc: 'Suivez votre progression sur Google Maps chaque semaine.' },
              { emoji: '📧', title: 'Email hebdomadaire automatique', desc: 'Chaque lundi matin, votre contenu de la semaine directement dans votre boîte mail.' },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-gray-100 p-6">
                <div className="text-2xl mb-3">{item.emoji}</div>
                <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="bg-gray-50 py-20 px-6">
        <div className="max-w-md mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Un seul plan. Simple.</h2>
          <div className="bg-white rounded-2xl border-2 border-green-500 p-8 shadow-sm">
            <div className="inline-flex items-center gap-2 rounded-full bg-green-50 border border-green-200 px-3 py-1 text-xs font-medium text-green-700 mb-4">
              Accès bêta
            </div>
            <div className="flex items-baseline justify-center gap-1 mb-2">
              <span className="text-5xl font-extrabold text-gray-900">59€</span>
              <span className="text-gray-500">/mois</span>
            </div>
            <p className="text-sm text-gray-400 mb-6">après 7 jours gratuits</p>
            <ul className="space-y-3 mb-8 text-left">
              {[
                'Posts Google Business illimités',
                'Réponses aux avis illimitées',
                'Score de visibilité hebdomadaire',
                'Email hebdo automatique',
                'Calibré pour votre commerce',
                'Sans engagement',
              ].map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="text-green-500">✓</span>{f}
                </li>
              ))}
            </ul>
            <Link href="/signup" className="block w-full rounded-xl bg-green-600 py-4 text-sm font-semibold text-white hover:bg-green-700 transition text-center">
              Commencer 7 jours gratuits
            </Link>
            <p className="mt-3 text-xs text-gray-400">Carte requise. Annulation en 1 clic.</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 px-6">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span>🚀</span>
            <span className="font-bold text-gray-900">LocalBoost</span>
          </div>
          <div className="flex gap-6 text-sm text-gray-400">
            <Link href="/cgv" className="hover:text-gray-600">CGV</Link>
            <Link href="/privacy" className="hover:text-gray-600">Confidentialité</Link>
            <Link href="/mentions-legales" className="hover:text-gray-600">Mentions légales</Link>
          </div>
          <p className="text-sm text-gray-400">© 2025 LocalBoost</p>
        </div>
      </footer>
    </div>
  )
}