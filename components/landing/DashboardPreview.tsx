'use client'
import { useState } from 'react'

const AI_DESCRIPTION = `Plomberie Dupont intervient à Lyon et dans toute la métropole pour tous vos travaux de plomberie : dépannage d'urgence, rénovation salle de bain, installation sanitaire et remplacement chauffe-eau.

Artisan qualifié avec plus de 15 ans d'expérience, nous garantissons des interventions rapides (sous 2h pour les urgences), soignées et au juste prix. Devis gratuit sous 24h.

Appelez-nous ou demandez votre devis en ligne — votre satisfaction est notre priorité.`

function ScoreGauge({ score }: { score: number }) {
  const r = 38, circ = 2 * Math.PI * r
  const color = '#d97706'
  return (
    <svg width="96" height="96" viewBox="0 0 96 96">
      <circle cx="48" cy="48" r={r} fill="none" stroke="#f3f4f6" strokeWidth="8" />
      <circle cx="48" cy="48" r={r} fill="none" stroke={color} strokeWidth="8"
        strokeDasharray={circ} strokeDashoffset={circ - (score / 100) * circ}
        strokeLinecap="round" transform="rotate(-90 48 48)" />
      <text x="48" y="44" textAnchor="middle" fontSize="18" fontWeight="700" fill="#111827">{score}</text>
      <text x="48" y="58" textAnchor="middle" fontSize="9" fill="#6b7280">/100</text>
    </svg>
  )
}

const PRIORITIES = [
  {
    key: 'photos',
    icon: '📸',
    label: 'Ajoutez des photos de votre activité',
    why: 'Les fiches avec 10+ photos reçoivent 35% de clics en plus.',
    aiLabel: 'Mon plan photo IA',
    aiResult: `1. Façade de l'atelier ou du véhicule en tenue de travail — lumière naturelle, matin
2. Intervention en cours : pose d'un lavabo, remplacement d'un chauffe-eau
3. Avant / après une rénovation salle de bain
4. Vos outils professionnels bien disposés
5. Vous souriant devant un chantier terminé
6. Robinetterie neuve installée, gros plan sur la qualité de finition`,
  },
  {
    key: 'avis20',
    icon: '⭐',
    label: 'Demandez des avis à vos clients',
    why: 'Les fiches avec 20+ avis reçoivent 3× plus d\'appels.',
    aiLabel: 'Écrire mon email d\'avis',
    aiResult: `Objet : Votre avis compte beaucoup pour moi

Bonjour [NOM_CLIENT],

Merci de m'avoir fait confiance pour [PRESTATION]. C'est toujours un plaisir de travailler pour des clients comme vous.

Si vous êtes satisfait(e), un avis Google m'aiderait énormément — cela prend moins de 30 secondes :
→ [LIEN_AVIS]

Merci d'avance,
Plomberie Dupont`,
  },
  {
    key: 'description',
    icon: '✍️',
    label: 'Écrivez une description de votre activité',
    why: 'Google vous comprend mal et vous positionne moins bien que vos concurrents.',
    aiLabel: 'Rédiger ma description',
    aiResult: AI_DESCRIPTION,
  },
]

export default function DashboardPreview() {
  const [open, setOpen] = useState<string | null>('photos')
  const [copied, setCopied] = useState<string | null>(null)

  function copy(key: string, text: string) {
    navigator.clipboard.writeText(text).catch(() => {})
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <section className="py-20 px-6 bg-gray-50">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-2">Ce que vous verrez en 2 minutes</p>
          <h2 className="text-3xl font-extrabold text-gray-900 mb-3">
            Votre plan d'action personnalisé, généré par l'IA
          </h2>
          <p className="text-gray-500 text-lg">
            Voici à quoi ressemble votre tableau de bord pour <strong>Plomberie Dupont, Lyon</strong>
          </p>
        </div>

        {/* Dashboard mockup */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          {/* Barre nav */}
          <div className="bg-white border-b border-gray-100 px-5 py-3 flex items-center gap-4">
            <span className="font-bold text-gray-900 flex items-center gap-1.5 text-sm">📍 LocalBoost</span>
            {['Tableau de bord', 'Avis clients', 'Photos', 'Analyser ma fiche', 'Mes annuaires'].map(n => (
              <span key={n} className={`text-xs px-2 py-1 rounded-lg ${n === 'Tableau de bord' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-400'}`}>{n}</span>
            ))}
          </div>

          <div className="p-5 grid sm:grid-cols-3 gap-4">
            {/* Score */}
            <div className="bg-gray-50 rounded-xl p-4 flex flex-col items-center">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Ma visibilité Google</p>
              <ScoreGauge score={42} />
              <div className="mt-3 w-full space-y-2">
                {[{ label: 'Fiche Google', val: 44, color: 'bg-blue-500' }, { label: 'Avis collectés', val: 40, color: 'bg-amber-400' }].map(b => (
                  <div key={b.label}>
                    <div className="flex justify-between text-xs mb-0.5">
                      <span className="text-gray-500">{b.label}</span>
                      <span className="font-semibold text-gray-700">{b.val}/100</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div className={`${b.color} h-1.5 rounded-full`} style={{ width: `${b.val}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Priorités */}
            <div className="sm:col-span-2">
              <p className="text-sm font-bold text-gray-900 mb-3">🎯 Vos priorités cette semaine</p>
              <div className="space-y-2">
                {PRIORITIES.map((p, i) => (
                  <div key={p.key} className="rounded-xl border border-gray-200 overflow-hidden">
                    <div className="flex items-start gap-3 p-3">
                      <div className="shrink-0 w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center text-sm">{p.icon}</div>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-bold text-blue-600">Priorité {i + 1}</span>
                        <p className="text-xs font-semibold text-gray-900 leading-snug">{p.label}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{p.why}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 px-3 pb-3">
                      <button
                        onClick={() => setOpen(open === p.key ? null : p.key)}
                        className="flex-1 rounded-lg bg-blue-600 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition"
                      >
                        ✨ {p.aiLabel}
                      </button>
                      <button className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs text-gray-500">
                        Ouvrir →
                      </button>
                    </div>

                    {open === p.key && (
                      <div className="border-t border-blue-100 bg-blue-50/50 p-3">
                        <p className="text-xs text-gray-700 whitespace-pre-line leading-relaxed">{p.aiResult}</p>
                        <button
                          onClick={() => copy(p.key, p.aiResult)}
                          className={`mt-2 w-full rounded-lg py-1.5 text-xs font-semibold transition ${copied === p.key ? 'bg-green-500 text-white' : 'bg-gray-900 text-white hover:bg-gray-700'}`}
                        >
                          {copied === p.key ? '✓ Copié !' : '📋 Copier le texte'}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mt-8">
          <a
            href="/signup"
            className="inline-block rounded-xl bg-blue-600 px-8 py-4 text-sm font-bold text-white hover:bg-blue-700 transition shadow-md"
          >
            Voir mon vrai tableau de bord →
          </a>
          <p className="text-xs text-gray-400 mt-2">Sans carte bancaire · 7 jours d'essai gratuit</p>
        </div>
      </div>
    </section>
  )
}
