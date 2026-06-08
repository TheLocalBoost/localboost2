'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

const STARS = ['', '★', '★★', '★★★', '★★★★', '★★★★★']

function ConnectInner() {
  const searchParams = useSearchParams()
  const success  = searchParams.get('success') === '1'
  const errorMsg = searchParams.get('error')
  const multiNb  = searchParams.get('multi')

  const [profile, setProfile]   = useState<any>(null)
  const [insights, setInsights] = useState<any>(null)
  const [reviews, setReviews]   = useState<any[]>([])
  const [posts, setPosts]       = useState<any[]>([])
  const [loading, setLoading]   = useState(true)
  const [tab, setTab]           = useState<'overview' | 'post' | 'reviews'>('overview')
  const [disconnecting, setDisconnecting] = useState(false)

  // Request access
  const [googleEmail, setGoogleEmail]   = useState('')
  const [requesting, setRequesting]     = useState(false)
  const [requested, setRequested]       = useState(false)

  // Post
  const [postContent, setPostContent] = useState('')
  const [posting, setPosting]         = useState(false)
  const [postSuccess, setPostSuccess] = useState(false)

  // Reviews
  const [selectedReview, setSelectedReview] = useState<any>(null)
  const [suggestions, setSuggestions]       = useState<string[]>([])
  const [loadingSugg, setLoadingSugg]       = useState(false)
  const [replyText, setReplyText]           = useState('')
  const [replying, setReplying]             = useState(false)

  useEffect(() => {
    fetch('/api/localboost/setup')
      .then(r => r.json())
      .then(p => {
        setProfile(p)
        if (p?.google_requested_email) setRequested(true)
        if (p?.google_connected) {
          Promise.all([
            fetch('/api/google-business/insights').then(r => r.json()),
            fetch('/api/google-business/reviews').then(r => r.json()),
            fetch('/api/google-business/publish').then(r => r.json()),
          ]).then(([ins, rev, psts]) => {
            setInsights(ins?.error ? null : ins)
            setReviews(Array.isArray(rev) ? rev : [])
            setPosts(Array.isArray(psts) ? psts : [])
          }).finally(() => setLoading(false))
        } else {
          setLoading(false)
        }
      })
  }, [])

  async function requestAccess() {
    if (!googleEmail.trim()) return
    setRequesting(true)
    const r = await fetch('/api/google-business/request-access', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ google_email: googleEmail }),
    })
    if (r.ok) {
      setRequested(true)
      setProfile((p: any) => ({ ...p, google_requested_email: googleEmail }))
    }
    setRequesting(false)
  }

  async function disconnect() {
    if (!confirm('Déconnecter Google Business ?')) return
    setDisconnecting(true)
    await fetch('/api/google-business/disconnect', { method: 'POST' })
    setProfile((p: any) => ({ ...p, google_connected: false }))
    setDisconnecting(false)
  }

  async function publishPost() {
    if (!postContent.trim()) return
    setPosting(true)
    const r = await fetch('/api/google-business/publish', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ content: postContent }),
    })
    const d = await r.json()
    if (d.success) {
      setPostSuccess(true)
      setPosts(prev => [{ content: postContent, published_at: new Date().toISOString(), auto_published: false }, ...prev])
      setPostContent('')
      setTimeout(() => setPostSuccess(false), 3000)
    } else {
      alert('Erreur : ' + d.error)
    }
    setPosting(false)
  }

  async function generateSuggestions(review: any) {
    setSelectedReview(review)
    setSuggestions([])
    setReplyText('')
    setLoadingSugg(true)
    const r = await fetch('/api/google-business/reviews', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        action: 'generate', review_id: review.id,
        reviewer: review.reviewer, rating: review.rating, comment: review.comment,
      }),
    })
    const d = await r.json()
    setSuggestions(d.suggestions ?? [])
    setLoadingSugg(false)
  }

  async function postReply(reviewId: string, reviewer: string, rating: number, comment: string, reply: string) {
    if (!reply.trim()) return
    setReplying(true)
    const r = await fetch('/api/google-business/reviews', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ action: 'reply', review_id: reviewId, reviewer, rating, comment, reply }),
    })
    const d = await r.json()
    if (d.success) {
      setReviews(prev => prev.map(rv => rv.id === reviewId ? { ...rv, hasReply: true } : rv))
      setSelectedReview(null)
      setSuggestions([])
      setReplyText('')
    } else {
      alert('Erreur : ' + d.error)
    }
    setReplying(false)
  }

  const unanswered = reviews.filter(r => !r.hasReply).length

  if (loading) return <div className="text-center py-16 text-gray-400">Chargement...</div>

  // ── CONNECTÉ ──────────────────────────────────────────────────────────────
  if (profile?.google_connected) {
    return (
      <div>
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 bg-green-500 rounded-full inline-block" />
              <span className="text-xs font-semibold text-green-600">Google Business connecté</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{profile.google_location_title || 'Mon établissement'}</h1>
            {success && (
              <p className="text-sm text-green-600 mt-0.5">
                ✓ Connexion réussie !
                {multiNb && ` ${multiNb} établissements détectés — le premier a été sélectionné.`}
              </p>
            )}
          </div>
          <button onClick={disconnect} disabled={disconnecting} className="text-xs text-gray-400 hover:text-red-500 transition">
            {disconnecting ? '...' : 'Déconnecter'}
          </button>
        </div>

        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
          {([
            { key: 'overview', label: '📊 Vue d\'ensemble' },
            { key: 'post',     label: '📝 Publier un post' },
            { key: 'reviews',  label: `⭐ Avis${unanswered > 0 ? ` (${unanswered})` : ''}` },
          ] as const).map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'overview' && (
          <div className="space-y-5">
            {insights ? (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Performances — {insights.periode}</p>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {[
                    { label: 'Vues Maps',   value: insights.vues_maps,   icon: '🗺️' },
                    { label: 'Vues Search', value: insights.vues_search, icon: '🔍' },
                    { label: 'Appels',      value: insights.appels,      icon: '📞' },
                    { label: 'Clics site',  value: insights.sites,       icon: '🌐' },
                    { label: 'Itinéraires', value: insights.itineraires, icon: '📍' },
                  ].map((k, i) => (
                    <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 text-center">
                      <p className="text-xl mb-1">{k.icon}</p>
                      <p className="text-2xl font-bold text-gray-900">{k.value.toLocaleString('fr-FR')}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{k.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
                Les statistiques sont disponibles sous 24–48h après la connexion.
              </div>
            )}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-semibold text-gray-900 text-sm">Posts publiés récemment</h2>
                <button onClick={() => setTab('post')} className="text-xs text-blue-600 hover:underline">+ Nouveau post</button>
              </div>
              {posts.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">Aucun post publié via LocalBoost pour l'instant.</div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {posts.slice(0, 5).map((p, i) => (
                    <div key={i} className="px-5 py-3 flex items-start gap-3">
                      <span className="text-lg shrink-0">{p.auto_published ? '🤖' : '✍️'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-700 line-clamp-2">{p.content}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{new Date(p.published_at).toLocaleDateString('fr-FR')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {unanswered > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between">
                <p className="text-sm text-amber-800"><strong>{unanswered} avis</strong> sans réponse</p>
                <button onClick={() => setTab('reviews')} className="rounded-xl bg-amber-500 text-white text-xs font-semibold px-3 py-2 hover:bg-amber-600 transition ml-4">
                  Répondre →
                </button>
              </div>
            )}
          </div>
        )}

        {tab === 'post' && (
          <div className="max-w-2xl space-y-5">
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h2 className="font-semibold text-gray-900 text-sm mb-4">Publier un post sur Google Business</h2>
              {postSuccess && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-4 text-sm text-green-700">✓ Post publié !</div>
              )}
              <textarea value={postContent} onChange={e => setPostContent(e.target.value)} rows={5} maxLength={1500}
                placeholder="Rédigez votre post Google Business..."
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none resize-none"
              />
              <div className="flex items-center justify-between mt-2 mb-4">
                <p className="text-xs text-gray-400">{postContent.length}/1500</p>
                {postContent.length > 280 && <p className="text-xs text-amber-500">Idéalement moins de 280 caractères</p>}
              </div>
              <button onClick={publishPost} disabled={posting || !postContent.trim()}
                className="w-full rounded-xl bg-blue-600 py-3.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50 transition">
                {posting ? 'Publication...' : '🚀 Publier sur Google Business'}
              </button>
            </div>
          </div>
        )}

        {tab === 'reviews' && (
          <div className="space-y-4">
            {reviews.length === 0 ? (
              <div className="text-center py-12 text-gray-400"><p className="text-4xl mb-3">⭐</p><p>Aucun avis pour l'instant.</p></div>
            ) : reviews.map(review => (
              <div key={review.id} className={`bg-white rounded-2xl border p-5 ${review.hasReply ? 'border-gray-100' : 'border-amber-200'}`}>
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{review.reviewer}</p>
                    <p className="text-amber-400 text-sm">{STARS[review.rating] ?? ''}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{new Date(review.date).toLocaleDateString('fr-FR')}</p>
                  </div>
                  {review.hasReply
                    ? <span className="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-semibold shrink-0">✓ Répondu</span>
                    : <span className="text-xs bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full font-semibold shrink-0">Sans réponse</span>
                  }
                </div>
                {review.comment && <p className="text-sm text-gray-700 mb-3 italic">"{review.comment}"</p>}
                {review.existingReply && (
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-3 text-sm text-blue-800">
                    <p className="text-xs font-semibold text-blue-600 mb-1">Votre réponse :</p>{review.existingReply}
                  </div>
                )}
                {!review.hasReply && (
                  selectedReview?.id === review.id ? (
                    <div className="space-y-3">
                      {loadingSugg ? <p className="text-xs text-gray-400">Génération...</p> : (
                        <>
                          {suggestions.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold text-gray-500 mb-2">Suggestions IA</p>
                              <div className="space-y-2">
                                {suggestions.map((s, i) => (
                                  <button key={i} onClick={() => setReplyText(s)}
                                    className={`w-full text-left rounded-xl border p-3 text-xs text-gray-700 hover:border-blue-300 transition ${replyText === s ? 'border-blue-400 bg-blue-50' : 'border-gray-100'}`}>
                                    {s}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                          <textarea value={replyText} onChange={e => setReplyText(e.target.value)} rows={3}
                            placeholder="Rédigez ou modifiez votre réponse..."
                            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none resize-none"
                          />
                          <div className="flex gap-2">
                            <button onClick={() => { setSelectedReview(null); setSuggestions([]); setReplyText('') }}
                              className="flex-1 rounded-xl border border-gray-200 py-2 text-xs text-gray-600 hover:bg-gray-50 transition">
                              Annuler
                            </button>
                            <button onClick={() => postReply(review.id, review.reviewer, review.rating, review.comment, replyText)}
                              disabled={replying || !replyText.trim()}
                              className="flex-1 rounded-xl bg-blue-600 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50 transition">
                              {replying ? '...' : '📤 Publier la réponse'}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <button onClick={() => generateSuggestions(review)}
                      className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-100 transition">
                      ✨ Générer une réponse IA
                    </button>
                  )
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  // ── DEMANDE EN ATTENTE ────────────────────────────────────────────────────
  if (requested || profile?.google_requested_email) {
    const requestedEmail = profile?.google_requested_email || googleEmail
    return (
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-amber-50 rounded-2xl flex items-center justify-center text-4xl mx-auto mb-4">⏳</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Accès en cours d'activation</h1>
          <p className="text-gray-500 text-sm">
            Votre demande pour <strong>{requestedEmail}</strong> a bien été reçue.<br />
            Vous recevrez un email dès que la connexion est prête (généralement sous 24h).
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-5 space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Étapes</p>
          {[
            { done: true,  label: 'Demande soumise',                      sub: requestedEmail },
            { done: false, label: 'Activation en cours (équipe LocalBoost)', sub: 'Sous 24h' },
            { done: false, label: 'Email de confirmation',                  sub: 'Cliquez le lien pour connecter' },
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${step.done ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                {step.done ? '✓' : i + 1}
              </span>
              <div>
                <p className="text-sm font-medium text-gray-900">{step.label}</p>
                <p className="text-xs text-gray-400">{step.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {errorMsg && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 text-sm text-red-700">{decodeURIComponent(errorMsg)}</div>
        )}

        <p className="text-xs text-gray-400 text-center mb-3">
          Si vous avez déjà reçu la confirmation, cliquez directement :
        </p>
        <a href="/api/google-business/auth"
          className="flex items-center justify-center gap-3 w-full rounded-xl bg-white border-2 border-gray-200 px-6 py-4 text-sm font-bold text-gray-800 hover:border-blue-400 hover:bg-blue-50 transition">
          <GoogleIcon />
          Connecter avec Google Business
        </a>
      </div>
    )
  }

  // ── PAS ENCORE DE DEMANDE ─────────────────────────────────────────────────
  return (
    <div className="max-w-lg mx-auto">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center text-4xl mx-auto mb-4">🔗</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Connecter Google Business</h1>
        <p className="text-gray-500 text-sm leading-relaxed">
          Publiez directement sur votre fiche Google, répondez aux avis en 1 clic et consultez vos vraies statistiques.
        </p>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-5 text-sm text-red-700">
          <p className="font-semibold mb-1">Erreur de connexion</p>
          <p>{decodeURIComponent(errorMsg)}</p>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-5 space-y-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Ce que vous débloquez</p>
        {[
          { icon: '🚀', title: 'Publication directe',        desc: 'Publiez un post sur votre fiche Google en 1 clic' },
          { icon: '⭐', title: 'Réponses aux avis en 1 clic', desc: 'Générez et publiez vos réponses avec l\'IA' },
          { icon: '📊', title: 'Statistiques réelles',       desc: 'Vues, appels, clics — vos métriques Google en temps réel' },
        ].map((item, i) => (
          <div key={i} className="flex items-start gap-3">
            <span className="text-xl shrink-0">{item.icon}</span>
            <div>
              <p className="text-sm font-semibold text-gray-900">{item.title}</p>
              <p className="text-xs text-gray-500">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <p className="text-sm font-semibold text-gray-900 mb-1">Votre adresse email Google</p>
        <p className="text-xs text-gray-500 mb-3">
          L'email du compte Google associé à votre fiche Business (souvent votre Gmail).
        </p>
        <input
          type="email"
          value={googleEmail}
          onChange={e => setGoogleEmail(e.target.value)}
          placeholder="votre@gmail.com"
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none mb-3"
          onKeyDown={e => e.key === 'Enter' && requestAccess()}
        />
        <button
          onClick={requestAccess}
          disabled={requesting || !googleEmail.trim()}
          className="w-full rounded-xl bg-gray-900 py-3.5 text-sm font-bold text-white hover:bg-gray-700 disabled:opacity-50 transition"
        >
          {requesting ? 'Envoi en cours...' : 'Demander l\'accès →'}
        </button>
        <p className="text-xs text-gray-400 text-center mt-2">Activation sous 24h · Vous recevrez un email de confirmation</p>
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20">
      <path fill="#4285F4" d="M23.745 12.27c0-.79-.07-1.54-.19-2.27h-11.3v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/>
      <path fill="#34A853" d="M12.255 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96h-3.98v3.09C3.515 21.3 7.565 24 12.255 24z"/>
      <path fill="#FBBC05" d="M5.525 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62h-3.98a11.86 11.86 0 000 10.76l3.98-3.09z"/>
      <path fill="#EA4335" d="M12.255 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C18.205 1.19 15.495 0 12.255 0c-4.69 0-8.74 2.7-10.71 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/>
    </svg>
  )
}

export default function ConnectPage() {
  return (
    <Suspense fallback={<div className="text-center py-16 text-gray-400">Chargement...</div>}>
      <ConnectInner />
    </Suspense>
  )
}
