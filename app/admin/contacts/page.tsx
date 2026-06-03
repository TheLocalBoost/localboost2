'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'

const ADMIN_EMAIL = 'mansartbrian68@gmail.com'

interface Message {
  id:         string
  name:       string
  email:      string
  message:    string
  replied:    boolean
  reply_text: string | null
  created_at: string
}

export default function AdminContactsPage() {
  const router   = useRouter()
  const supabase = createClient()

  const [messages, setMessages]   = useState<Message[]>([])
  const [loading, setLoading]     = useState(true)
  const [replyId, setReplyId]     = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [sending, setSending]     = useState(false)
  const [filter, setFilter]       = useState<'all' | 'pending'>('pending')

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user || user.email !== ADMIN_EMAIL) {
        router.push('/login')
        return
      }
      loadMessages()
    })
  }, [])

  async function loadMessages() {
    setLoading(true)
    const { data } = await supabase
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false })
    setMessages(data ?? [])
    setLoading(false)
  }

  async function sendReply(msg: Message) {
    if (!replyText.trim()) return
    setSending(true)
    try {
      const res = await fetch('/api/admin/reply', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          messageId: msg.id,
          replyText,
          toEmail:   msg.email,
          toName:    msg.name,
        }),
      })
      if (res.ok) {
        setReplyId(null)
        setReplyText('')
        await loadMessages()
      }
    } finally {
      setSending(false)
    }
  }

  const displayed = filter === 'pending'
    ? messages.filter(m => !m.replied)
    : messages

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Messages de contact</h1>
            <p className="text-sm text-gray-500 mt-1">
              {messages.filter(m => !m.replied).length} en attente · {messages.length} total
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('pending')}
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition
                ${filter === 'pending' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}
            >
              En attente
            </button>
            <button
              onClick={() => setFilter('all')}
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition
                ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}
            >
              Tous
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16 text-gray-400">Chargement...</div>
        ) : displayed.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            {filter === 'pending' ? 'Aucun message en attente.' : 'Aucun message.'}
          </div>
        ) : (
          <div className="space-y-4">
            {displayed.map(msg => (
              <div
                key={msg.id}
                className={`bg-white rounded-2xl border p-5 ${msg.replied ? 'border-gray-100 opacity-70' : 'border-gray-200'}`}
              >
                {/* En-tête */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="font-semibold text-gray-900">{msg.name}</p>
                    <a href={`mailto:${msg.email}`} className="text-xs text-blue-600 hover:underline">{msg.email}</a>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold
                      ${msg.replied ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                      {msg.replied ? 'Répondu' : 'En attente'}
                    </span>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(msg.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>

                {/* Message */}
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap bg-gray-50 rounded-xl p-3 mb-3">
                  {msg.message}
                </p>

                {/* Réponse précédente */}
                {msg.reply_text && (
                  <div className="bg-blue-50 rounded-xl p-3 mb-3">
                    <p className="text-xs font-semibold text-blue-600 mb-1">Votre réponse :</p>
                    <p className="text-sm text-blue-800 whitespace-pre-wrap">{msg.reply_text}</p>
                  </div>
                )}

                {/* Zone de réponse */}
                {!msg.replied && (
                  <>
                    {replyId === msg.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={replyText}
                          onChange={e => setReplyText(e.target.value)}
                          placeholder="Rédigez votre réponse..."
                          rows={4}
                          autoFocus
                          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none resize-none"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => sendReply(msg)}
                            disabled={sending || !replyText.trim()}
                            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60 transition"
                          >
                            {sending ? 'Envoi...' : 'Envoyer la réponse →'}
                          </button>
                          <button
                            onClick={() => { setReplyId(null); setReplyText('') }}
                            className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-500 hover:bg-gray-50 transition"
                          >
                            Annuler
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setReplyId(msg.id); setReplyText('') }}
                        className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700 transition"
                      >
                        ✉ Répondre
                      </button>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
