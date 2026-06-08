'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

const SCORE_CACHE_KEY = 'lb_score_cache'
const SCORE_CACHE_TTL = 24 * 60 * 60 * 1000

const PRIORITY_MAP: Record<string, {
  label: string; why: string; icon: string
  cta: string; href?: string; external?: boolean; aiLabel: string
}> = {
  description: { icon: '✍️', label: 'Écrivez une description de votre activité', why: 'Google comprend mal votre métier — il vous positionne moins bien que vos concurrents.',        cta: 'Ouvrir Google Business', href: 'https://business.google.com', external: true, aiLabel: 'Rédiger ma description' },
  telephone:   { icon: '📞', label: 'Ajoutez votre numéro de téléphone',          why: 'Les clients appellent directement depuis Google — sans numéro, ils appellent un concurrent.',   cta: 'Ouvrir Google Business', href: 'https://business.google.com', external: true, aiLabel: 'Pourquoi c\'est urgent' },
  horaires:    { icon: '🕐', label: 'Renseignez vos horaires d\'ouverture',       why: 'Un client qui ne sait pas si vous êtes ouvert ira chez quelqu\'un d\'autre.',                    cta: 'Ouvrir Google Business', href: 'https://business.google.com', external: true, aiLabel: 'Quels horaires mettre' },
  site:        { icon: '🌐', label: 'Ajoutez votre site web',                      why: 'Les clients font davantage confiance à une fiche avec un site, même une simple page.',          cta: 'Ouvrir Google Business', href: 'https://business.google.com', external: true, aiLabel: 'Comment créer un site' },
  photos:      { icon: '📸', label: 'Ajoutez des photos de votre activité',       why: 'Les fiches avec 10+ photos reçoivent 35% de clics en plus. C\'est l\'action la plus rapide.',  cta: 'Voir les conseils photos', href: '/localboost/photos',          aiLabel: 'Mon plan photo IA' },
  avis20:      { icon: '⭐', label: 'Demandez des avis à vos clients',             why: 'Les fiches avec 20+ avis reçoivent 3× plus d\'appels. Envoyez un email ou SMS après chaque prestation.', cta: 'Envoyer des demandes', href: '/localboost/avis', aiLabel: 'Écrire mon email d\'avis' },
  note4:            { icon: '💬', label: 'Répondez à vos avis sans réponse',     why: 'Une note ≥ 4.0 double le taux de clic. Répondre aux avis négatifs améliore votre note perçue.',  cta: 'Voir mes avis',            href: '/localboost/avis', aiLabel: 'Générer des réponses' },
  premiere_demande: { icon: '📩', label: 'Envoyez votre première demande d\'avis', why: 'Vous n\'avez encore jamais demandé d\'avis. C\'est l\'action qui a le plus d\'impact sur votre fiche.', cta: 'Envoyer maintenant',       href: '/localboost/avis', aiLabel: 'Écrire mon premier email' },
  conversion_nulle: { icon: '📉', label: 'Améliorez votre email de demande d\'avis', why: 'Vous avez envoyé des demandes mais aucun client n\'a laissé d\'avis. L\'email peut être optimisé.',    cta: 'Voir l\'historique',       href: '/localboost/avis', aiLabel: 'Optimiser mon email' },
}

function ScoreGauge({ score }: { score: number }) {
  const r = 48, circ = 2 * Math.PI * r
  const color = score >= 70 ? '#16a34a' : score >= 40 ? '#d97706' : '#dc2626'
  return (
    <svg width="120" height="120" viewBox="0 0 120 120">
      <circle cx="60" cy="60" r={r} fill="none" stroke="#f3f4f6" strokeWidth="10" />
      <circle cx="60" cy="60" r={r} fill="none" stroke={color} strokeWidth="10"
        strokeDasharray={circ} strokeDashoffset={circ - (score / 100) * circ}
        strokeLinecap="round" transform="rotate(-90 60 60)"
        style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
      <text x="60" y="55" textAnchor="middle" fontSize="24" fontWeight="700" fill="#111827">{score}</text>
      <text x="60" y="72" textAnchor="middle" fontSize="10" fill="#6b7280">/100</text>
    </svg>
  )
}

function getPriorities(details: Record<string, boolean>, avisEnvoyes: number, avisRecus: number): string[] {
  const extra: string[] = []
  if (avisEnvoyes === 0) extra.push('premiere_demande')
  else if (avisEnvoyes >= 3 && avisRecus === 0) extra.push('conversion_nulle')

  const google = ['avis20', 'photos', 'horaires', 'description', 'telephone', 'site', 'note4']
    .filter(k => details[k] === false)

  return [...extra, ...google].slice(0, 3)
}

async function fetchScore() {
  const cached = localStorage.getItem(SCORE_CACHE_KEY)
  if (cached) {
    const { data, ts } = JSON.parse(cached)
    if (Date.now() - ts < SCORE_CACHE_TTL) return data
  }
  const data = await fetch('/api/localboost/score').then(r => r.json())
  localStorage.setItem(SCORE_CACHE_KEY, JSON.stringify({ data, ts: Date.now() }))
  return data
}

function PriorityCard({ priorityKey, index }: { priorityKey: string; index: number }) {
  const p = PRIORITY_MAP[priorityKey]
  const [aiResult, setAiResult]   = useState('')
  const [generating, setGenerating] = useState(false)
  const [copied, setCopied]       = useState(false)
  const textRef = useRef<HTMLTextAreaElement>(null)

  async function generate() {
    setGenerating(true)
    setAiResult('')
    const res = await fetch('/api/localboost/ai-action', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ priority: priorityKey }),
    })
    const data = await res.json()
    if (res.status === 402) {
      setAiResult('__free_limit__')
    } else {
      setAiResult(data.content ?? '')
    }
    setGenerating(false)
  }

  function copy() {
    navigator.clipboard.writeText(aiResult)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!p) return null

  return (
    <div className="rounded-xl border border-gray-100 hover:border-blue-200 transition overflow-hidden">
      <div className="flex items-start gap-3 p-4">
        <div className="shrink-0 w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-base">
          {p.icon}
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-xs font-bold text-blue-600">Priorité {index + 1}</span>
          <p className="text-sm font-semibold text-gray-900 leading-snug mt-0.5">{p.label}</p>
          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{p.why}</p>
        </div>
      </div>

      <div className="flex gap-2 px-4 pb-4">
        <button
          onClick={generate}
          disabled={generating}
          className="flex-1 rounded-lg bg-blue-600 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60 transition flex items-center justify-center gap-1.5"
        >
          {generating ? (
            <><span className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" /> Génération...</>
          ) : (
            <>✨ {p.aiLabel}</>
          )}
        </button>
        {p.href && (
          p.external ? (
            <a href={p.href} target="_blank" rel="noopener noreferrer"
              className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition whitespace-nowrap">
              {p.cta} →
            </a>
          ) : (
            <Link href={p.href}
              className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition whitespace-nowrap">
              {p.cta} →
            </Link>
          )
        )}
      </div>

      {(aiResult || generating) && (
        <div className="border-t border-blue-100 bg-blue-50/40 p-4">
          {generating && !aiResult && (
            <div className="flex items-center gap-2 text-xs text-blue-600">
              <span className="w-3 h-3 border border-blue-500 border-t-transparent rounded-full animate-spin" />
              L'IA rédige votre contenu...
            </div>
          )}
          {aiResult === '__free_limit__' && (
            <div className="text-center py-3">
              <p className="text-sm font-semibold text-gray-900 mb-1">Action gratuite déjà utilisée</p>
              <p className="text-xs text-gray-500 mb-3">Passez en Pro pour générer du contenu IA sans limite.</p>
              <Link href="/pricing" className="inline-block rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 transition">
                Passer en Pro — 29€/mois →
              </Link>
            </div>
          )}
          {aiResult && aiResult !== '__free_limit__' && (
            <>
              <textarea
                ref={textRef}
                value={aiResult}
                onChange={e => setAiResult(e.target.value)}
                className="w-full text-xs text-gray-700 bg-transparent resize-none border-none outline-none leading-relaxed min-h-[120px]"
                rows={8}
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={copy}
                  className={`flex-1 rounded-lg py-2 text-xs font-semibold transition ${copied ? 'bg-green-500 text-white' : 'bg-gray-900 text-white hover:bg-gray-700'}`}
                >
                  {copied ? '✓ Copié !' : '📋 Copier le texte'}
                </button>
                <button
                  onClick={generate}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-500 hover:bg-gray-50 transition"
                >
                  ↻ Regénérer
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default function LocalBoostDashboard() {
  const [profile, setProfile]       = useState<any>(null)
  const [score, setScore]           = useState<any>(null)
  const [priorities, setPriorities] = useState<string[]>([])
  const [loading, setLoading]       = useState(true)
  const [onboarded, setOnboarded]   = useState(true)
  const [isPro, setIsPro]           = useState(false)

  useEffect(() => {
    fetch('/api/localboost/setup').then(r => r.json()).then(p => {
      setProfile(p?.google_place_id ? p : null)
      setOnboarded(p?.onboarded !== false)
      setIsPro(p?.is_pro === true)
      setLoading(false)
      if (p?.google_place_id) {
        fetchScore().then(s => {
          setScore(s)
          if (s?.details) setPriorities(getPriorities(s.details, s.avisEnvoyes ?? 0, s.avisRecus ?? 0))
        })
      }
    })
  }, [])

  if (loading) return <div className="text-center py-16 text-gray-400">Chargement...</div>

  return (
    <div>
      {/* Bandeau onboarding incomplet — L9 */}
      {!onboarded && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 mb-6 flex items-center justify-between gap-3">
          <p className="text-sm text-amber-800">
            Terminez votre configuration pour débloquer toutes les fonctionnalités.
          </p>
          <Link href="/localboost/setup"
            className="shrink-0 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-700 transition whitespace-nowrap">
            Reprendre l'installation →
          </Link>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
          <p className="text-sm text-gray-500 mt-0.5">{profile?.business_name ?? 'Bienvenue sur LocalBoost'}</p>
        </div>
        {!profile && (
          <Link href="/localboost/setup" className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition">
            ⚙️ Configurer ma fiche
          </Link>
        )}
      </div>

      {!profile && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6 flex items-start gap-3">
          <span className="text-2xl">⚙️</span>
          <div>
            <p className="font-semibold text-amber-800 mb-1">Commencez par chercher votre entreprise</p>
            <p className="text-sm text-amber-700">Entrez le nom de votre commerce pour que LocalBoost analyse votre présence Google et vous montre quoi améliorer.</p>
            <Link href="/localboost/setup" className="inline-block mt-3 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 transition">
              Trouver mon entreprise →
            </Link>
          </div>
        </div>
      )}

      {profile && (
        <div className="grid sm:grid-cols-3 gap-5 mb-6">
          {/* Score */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col items-center justify-center">
            {score ? (
              <>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Ma visibilité Google</p>
                <ScoreGauge score={score.score} />
                <div className="mt-3 w-full space-y-2">
                  {[
                    { label: 'Fiche Google', val: score.audit, color: 'bg-blue-500' },
                    { label: 'Avis collectés', val: score.avis, color: 'bg-amber-400' },
                  ].map(b => (
                    <div key={b.label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-500">{b.label}</span>
                        <span className="font-semibold text-gray-700">{b.val}/100</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div className={`${b.color} h-1.5 rounded-full transition-all`} style={{ width: `${b.val}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-36">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>

          {/* Priorités IA */}
          <div className="sm:col-span-2 bg-white rounded-2xl border border-gray-100 p-5">
            <p className="text-sm font-bold text-gray-900 mb-3">
              {priorities.length > 0 ? '🎯 Vos priorités cette semaine' : '✅ Votre fiche est bien optimisée'}
            </p>

            {!score && (
              <div className="space-y-3">
                {[1,2,3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}
              </div>
            )}

            {score && priorities.length === 0 && (
              <div className="text-center py-6">
                <p className="text-3xl mb-2">🏆</p>
                <p className="text-sm text-gray-600">Tous les critères essentiels sont remplis.</p>
                <Link href="/localboost/avis" className="inline-block mt-3 text-sm font-semibold text-blue-600 hover:underline">
                  Continuer à collecter des avis →
                </Link>
              </div>
            )}

            {priorities.length > 0 && (
              <div className="space-y-2">
                {priorities.map((key, i) => (
                  isPro || i === 0 ? (
                    <PriorityCard key={key} priorityKey={key} index={i} />
                  ) : (
                    <div key={key} className="rounded-xl border border-gray-100 bg-gray-50 p-4 flex items-center justify-between gap-3 opacity-60">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{PRIORITY_MAP[key]?.icon ?? '🎯'}</span>
                        <div>
                          <span className="text-xs font-bold text-gray-400">Priorité {i + 1}</span>
                          <p className="text-sm font-semibold text-gray-400 blur-sm select-none">
                            {PRIORITY_MAP[key]?.label ?? 'Action recommandée'}
                          </p>
                        </div>
                      </div>
                      <span className="text-lg shrink-0">🔒</span>
                    </div>
                  )
                ))}
                {!isPro && priorities.length > 1 && (
                  <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 text-center">
                    <p className="text-sm font-semibold text-blue-900 mb-1">
                      {priorities.length - 1} action{priorities.length > 2 ? 's' : ''} supplémentaire{priorities.length > 2 ? 's' : ''} disponible{priorities.length > 2 ? 's' : ''}
                    </p>
                    <p className="text-xs text-blue-600 mb-3">
                      Passez en Pro pour débloquer le plan complet, les posts Google et les réponses aux avis IA.
                    </p>
                    <Link href="/pricing"
                      className="inline-block rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700 transition">
                      Passer en Pro — 29€/mois →
                    </Link>
                    <p className="text-xs text-blue-400 mt-2">Satisfait ou remboursé 30 jours</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {profile && score && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Demandes d\'avis',  value: score.avisEnvoyes ?? 0,  color: 'text-gray-900',  href: '/localboost/avis'  },
            { label: 'Avis obtenus',       value: score.avisRecus ?? 0,    color: 'text-green-600', href: '/localboost/avis'  },
            { label: 'Critères manquants', value: Object.values(score.details ?? {}).filter(v => !v).length, color: 'text-red-500', href: '/localboost/audit' },
            { label: 'Score fiche',        value: `${score.audit}%`,       color: 'text-blue-600',  href: '/localboost/audit' },
          ].map((k, i) => (
            <Link key={i} href={k.href} className="bg-white rounded-xl border border-gray-100 p-4 text-center hover:border-blue-200 transition">
              <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
              <p className="text-xs text-gray-500 mt-1">{k.label}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
