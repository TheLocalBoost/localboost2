'use client'
import { useState } from 'react'
import Link from 'next/link'

const INCLUS = [
  { icon: '📊', title: 'Audit mensuel de votre fiche', desc: 'On vérifie chaque mois que votre fiche est à jour et optimisée.' },
  { icon: '📸', title: 'Ajout de photos professionnelles', desc: 'On sélectionne et ajoute vos photos pour maximiser l\'engagement.' },
  { icon: '💬', title: 'Réponses aux avis Google', desc: 'On répond à tous vos avis (bons et mauvais) dans les 48h.' },
  { icon: '🕐', title: 'Mise à jour des horaires', desc: 'Jours fériés, fermetures exceptionnelles — tout est géré.' },
  { icon: '🔍', title: 'Optimisation des mots-clés', desc: 'Votre fiche ressort sur les bonnes recherches dans votre ville.' },
  { icon: '📈', title: 'Rapport mensuel chiffré', desc: 'Vous recevez chaque mois le nombre de vues, appels et itinéraires.' },
]

const FAQ = [
  {
    q: 'Est-ce que je dois faire quelque chose ?',
    a: 'Non. Vous nous donnez accès à votre fiche Google (5 minutes, on vous guide), et on s\'occupe de tout. Vous pouvez continuer à faire votre métier.',
  },
  {
    q: 'Combien de temps avant de voir des résultats ?',
    a: 'La plupart de nos clients voient une hausse des appels dès la 2e semaine. En 30 jours, la fiche est optimisée à 90%.',
  },
  {
    q: 'Et si je ne suis pas satisfait ?',
    a: 'Vous annulez quand vous voulez depuis votre espace, sans justification. Zéro engagement, zéro frais cachés.',
  },
  {
    q: 'C\'est quoi la différence avec LocalBoost en self-service ?',
    a: 'On fait tout à votre place. Pas d\'outil à apprendre, pas de temps à y consacrer. Vous payez pour le résultat, pas pour un logiciel.',
  },
]

export default function PourVousPage() {
  const [form, setForm]   = useState({ nom: '', commerce: '', ville: '', email: '', phone: '' })
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle')

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    try {
      await fetch('/api/contact', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ ...form, subject: 'Demande service "Fait pour vous"' }),
      })
      setStatus('sent')
    } catch {
      setStatus('error')
    }
  }

  const input = 'w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white'

  return (
    <div className="min-h-screen bg-white">

      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-gray-100 max-w-5xl mx-auto">
        <Link href="/">
          <img src="/logo.png.png" alt="LocalBoost" className="h-10 w-auto" />
        </Link>
        <Link href="/signup" className="text-sm text-blue-600 font-medium hover:underline">
          Je préfère le faire moi-même →
        </Link>
      </nav>

      {/* Hero */}
      <section className="max-w-3xl mx-auto px-6 py-20 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-green-50 border border-green-200 px-4 py-1.5 text-sm font-medium text-green-700 mb-6">
          Service géré — zéro effort de votre côté
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 leading-tight mb-6">
          On gère votre fiche Google<br />
          <span className="text-blue-600">pour vous.</span>
        </h1>
        <p className="text-xl text-gray-500 mb-8 max-w-xl mx-auto">
          Vous avez un commerce à faire tourner. On s'occupe de votre visibilité Google — photos, avis, horaires, optimisation — chaque mois, sans que vous ayez à y penser.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4">
          <a href="#contact" className="rounded-2xl bg-blue-600 px-8 py-4 text-base font-bold text-white hover:bg-blue-700 transition shadow-lg shadow-blue-100">
            Je veux que ce soit géré → 29€/mois
          </a>
        </div>
        <p className="text-sm text-gray-400">Sans engagement · Annulation en 1 clic · Résultats en 30 jours</p>
      </section>

      {/* Proof numbers */}
      <section className="bg-gray-50 py-12">
        <div className="max-w-3xl mx-auto px-6 grid grid-cols-3 gap-6 text-center">
          {[
            { value: '+42%', label: 'de demandes en plus avec des photos' },
            { value: '3x', label: 'plus de clics avec horaires complets' },
            { value: '2 sem.', label: 'pour voir les premiers résultats' },
          ].map(({ value, label }) => (
            <div key={value}>
              <p className="text-3xl font-extrabold text-blue-600">{value}</p>
              <p className="text-sm text-gray-500 mt-1">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Ce qui est inclus */}
      <section className="max-w-3xl mx-auto px-6 py-20">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-3">Ce qu'on fait pour vous chaque mois</h2>
        <p className="text-gray-500 text-center mb-12">Tout ce qui améliore votre visibilité Google, géré par notre équipe.</p>
        <div className="grid sm:grid-cols-2 gap-4">
          {INCLUS.map(({ icon, title, desc }) => (
            <div key={title} className="rounded-2xl border border-gray-100 bg-white p-5 flex gap-4">
              <span className="text-2xl shrink-0">{icon}</span>
              <div>
                <p className="font-semibold text-gray-900 text-sm">{title}</p>
                <p className="text-gray-500 text-xs mt-1">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-blue-600 py-16">
        <div className="max-w-md mx-auto px-6 text-center">
          <p className="text-blue-200 text-sm font-semibold uppercase tracking-widest mb-3">Tarif unique</p>
          <p className="text-7xl font-black text-white mb-2">29€</p>
          <p className="text-blue-200 mb-6">par mois · tout inclus · sans engagement</p>
          <a href="#contact" className="block rounded-2xl bg-white px-8 py-4 text-base font-bold text-blue-600 hover:bg-blue-50 transition mb-3">
            Démarrer maintenant →
          </a>
          <p className="text-blue-300 text-xs">Nous contacter pour démarrer · Mise en place en 24h</p>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-2xl mx-auto px-6 py-20">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">Questions fréquentes</h2>
        <div className="space-y-4">
          {FAQ.map(({ q, a }) => (
            <div key={q} className="rounded-2xl border border-gray-100 p-6">
              <p className="font-semibold text-gray-900 mb-2">{q}</p>
              <p className="text-gray-500 text-sm">{a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Formulaire contact */}
      <section id="contact" className="bg-gray-50 py-20">
        <div className="max-w-md mx-auto px-6">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
            {status === 'sent' ? '✅ Demande envoyée !' : 'Démarrer en 2 minutes'}
          </h2>
          <p className="text-gray-500 text-sm text-center mb-8">
            {status === 'sent'
              ? 'On vous contacte sous 24h pour la mise en place.'
              : 'Remplissez ce formulaire — on vous contacte sous 24h.'}
          </p>

          {status !== 'sent' && (
            <form onSubmit={handleSubmit} className="rounded-2xl bg-white border border-gray-100 p-8 space-y-4 shadow-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Votre prénom *</label>
                  <input type="text" value={form.nom} onChange={set('nom')} placeholder="Jean" required className={input} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Téléphone</label>
                  <input type="tel" value={form.phone} onChange={set('phone')} placeholder="06 12 34 56 78" className={input} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom de votre commerce *</label>
                <input type="text" value={form.commerce} onChange={set('commerce')} placeholder="Plomberie Dupont" required className={input} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Ville *</label>
                <input type="text" value={form.ville} onChange={set('ville')} placeholder="Lyon" required className={input} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email *</label>
                <input type="email" value={form.email} onChange={set('email')} placeholder="jean@plomberie-dupont.fr" required className={input} />
              </div>
              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full rounded-xl bg-blue-600 py-3.5 text-sm font-bold text-white hover:bg-blue-700 transition disabled:opacity-60"
              >
                {status === 'loading' ? 'Envoi...' : 'Je veux que ce soit géré → 29€/mois'}
              </button>
              {status === 'error' && (
                <p className="text-xs text-red-500 text-center">Erreur. Écrivez-nous à contact@thelocalboost.fr</p>
              )}
              <p className="text-xs text-gray-400 text-center">Sans engagement · On vous rappelle dans les 24h</p>
            </form>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-6 text-center text-xs text-gray-400">
        <Link href="/" className="hover:underline">LocalBoost</Link>
        {' · '}
        <Link href="/cgv" className="hover:underline">CGV</Link>
        {' · '}
        <Link href="/mentions-legales" className="hover:underline">Mentions légales</Link>
      </footer>
    </div>
  )
}
