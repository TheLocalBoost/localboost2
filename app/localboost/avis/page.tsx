'use client'

import { useState, useEffect, useRef } from 'react'
import { QRCodeCanvas } from 'qrcode.react'

const STATUTS: Record<string, { label: string; color: string }> = {
  sent:     { label: 'Envoyée',    color: 'bg-blue-100 text-blue-700'   },
  reminded: { label: 'Relancée',  color: 'bg-amber-100 text-amber-700' },
  done:     { label: 'Avis reçu', color: 'bg-green-100 text-green-700' },
}

export default function AvisPage() {
  const [requests, setRequests] = useState<any[]>([])
  const [profile, setProfile]   = useState<any>(null)
  const [loading, setLoading]   = useState(true)
  const [sending, setSending]   = useState(false)
  const [tab, setTab]           = useState<'email' | 'qr'>('email')
  const [form, setForm]         = useState({ client_name: '', client_email: '', client_phone: '', prestation: '', send_sms: false })
  const [success, setSuccess]   = useState<string | null>(null)
  const qrRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/localboost/avis').then(r => r.json()),
      fetch('/api/localboost/setup').then(r => r.json()),
    ]).then(([avis, p]) => {
      setRequests(Array.isArray(avis) ? avis : [])
      setProfile(p?.google_place_id ? p : null)
      setLoading(false)
    })
  }, [])

  async function send(e: React.FormEvent) {
    e.preventDefault()
    if (!profile) return
    setSending(true)
    const r = await fetch('/api/localboost/avis', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(form),
    })
    const data = await r.json()
    if (!data.error) {
      setRequests(prev => [data, ...prev])
      const channels = [form.client_email && 'email', form.client_phone && form.send_sms && 'SMS'].filter(Boolean)
      setSuccess(`✓ ${channels.join(' + ')} envoyé${channels.length > 1 ? 's' : ''} à ${form.client_name}`)
      setForm({ client_name: '', client_email: '', client_phone: '', prestation: '', send_sms: false })
      setTimeout(() => setSuccess(null), 4000)
    }
    setSending(false)
  }

  function downloadQR() {
    const canvas = qrRef.current?.querySelector('canvas') as HTMLCanvasElement | null
    if (!canvas) return
    const url = canvas.toDataURL('image/png')
    const a = document.createElement('a')
    a.download = `qr-avis-${profile?.business_name?.replace(/\s+/g, '-') ?? 'google'}.png`
    a.href = url
    a.click()
  }

  async function markDone(id: string) {
    await fetch('/api/localboost/avis', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ id, status: 'done' }),
    })
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'done' } : r))
  }

  const input = 'w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none'
  const stats = {
    envoyes:  requests.length,
    recus:    requests.filter(r => r.status === 'done').length,
    en_cours: requests.filter(r => r.status !== 'done').length,
  }

  if (loading) return <div className="text-center py-16 text-gray-400">Chargement...</div>

  if (!profile) {
    return (
      <div className="text-center py-16">
        <p className="text-4xl mb-4">⚙️</p>
        <p className="font-semibold text-gray-900 mb-2">Configurez votre fiche Google d'abord</p>
        <a href="/localboost/setup" className="text-blue-600 underline text-sm">Configurer →</a>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Collecter des avis</h1>
        <p className="text-sm text-gray-500 mt-0.5">Obtenez plus d'avis Google avec l'email, le SMS ou un QR code</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Demandes envoyées', value: stats.envoyes,  color: 'text-gray-900'  },
          { label: 'Avis obtenus',      value: stats.recus,    color: 'text-green-600' },
          { label: 'En attente',        value: stats.en_cours, color: 'text-amber-600' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        {/* Formulaire / QR */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-gray-100">
            {(['email', 'qr'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-3 text-sm font-medium transition ${tab === t ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {t === 'email' ? '📧 Email / SMS' : '📱 QR Code'}
              </button>
            ))}
          </div>

          <div className="p-5">
            {tab === 'email' && (
              <>
                {success && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-4 text-sm text-green-700">
                    {success}
                  </div>
                )}
                <form onSubmit={send} className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-gray-500 block mb-1.5">Nom du client *</label>
                    <input value={form.client_name} onChange={e => setForm(f => ({ ...f, client_name: e.target.value }))} placeholder="Marie Dupont" required className={input} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 block mb-1.5">Email du client *</label>
                    <input type="email" value={form.client_email} onChange={e => setForm(f => ({ ...f, client_email: e.target.value }))} placeholder="marie@email.fr" required className={input} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 block mb-1.5">
                      Téléphone <span className="text-gray-400 font-normal">(optionnel — pour SMS)</span>
                    </label>
                    <input
                      type="tel"
                      value={form.client_phone}
                      onChange={e => setForm(f => ({ ...f, client_phone: e.target.value }))}
                      placeholder="06 12 34 56 78"
                      className={input}
                    />
                    {form.client_phone && (
                      <label className="flex items-center gap-2 mt-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.send_sms}
                          onChange={e => setForm(f => ({ ...f, send_sms: e.target.checked }))}
                          className="rounded border-gray-300 text-blue-600"
                        />
                        <span className="text-xs text-gray-600">Envoyer aussi un SMS (taux d'ouverture 95%)</span>
                      </label>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 block mb-1.5">Prestation réalisée</label>
                    <input value={form.prestation} onChange={e => setForm(f => ({ ...f, prestation: e.target.value }))} placeholder="Ex : réfection salle de bain" className={input} />
                  </div>
                  <button type="submit" disabled={sending} className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition">
                    {sending ? 'Envoi...' : '📧 Envoyer la demande d\'avis'}
                  </button>
                </form>
                <div className="mt-4 p-3 bg-gray-50 rounded-xl text-xs text-gray-500 space-y-0.5">
                  <p className="font-medium text-gray-700 mb-1">Ce que reçoit votre client :</p>
                  <p>• Email avec bouton direct vers votre fiche Google</p>
                  {form.send_sms && form.client_phone && <p>• SMS avec lien court vers votre fiche</p>}
                  <p>• Relance automatique à J+3 si pas d'avis</p>
                </div>
              </>
            )}

            {tab === 'qr' && (
              <div className="flex flex-col items-center gap-4 py-2">
                <p className="text-sm text-gray-600 text-center">
                  Affichez ce QR code sur vos devis, à votre caisse ou en vitrine.<br />
                  Vos clients scannent et laissent un avis en 30 secondes.
                </p>
                <div ref={qrRef} className="bg-white p-4 rounded-2xl border-2 border-gray-100 shadow-sm">
                  <QRCodeCanvas
                    value={profile.google_review_link}
                    size={200}
                    level="H"
                    includeMargin
                    imageSettings={{ src: '/favicon.ico', width: 32, height: 32, excavate: true }}
                  />
                </div>
                <p className="text-xs text-gray-400 text-center max-w-xs">{profile.business_name}</p>
                <button
                  onClick={downloadQR}
                  className="w-full rounded-xl bg-gray-900 py-3 text-sm font-semibold text-white hover:bg-gray-700 transition"
                >
                  ⬇️ Télécharger le QR code (PNG)
                </button>
                <div className="w-full p-3 bg-blue-50 rounded-xl text-xs text-blue-700 space-y-0.5">
                  <p className="font-medium mb-1">💡 Idées d'utilisation :</p>
                  <p>• Imprimé au dos de vos factures / devis</p>
                  <p>• Affiché à l'accueil ou en caisse</p>
                  <p>• Sur vos cartes de visite</p>
                  <p>• Envoyé en signature d'email</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Historique */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 text-sm">Historique des demandes</h2>
          </div>
          {requests.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">Aucune demande envoyée pour l'instant.</div>
          ) : (
            <div className="divide-y divide-gray-50 max-h-[480px] overflow-y-auto">
              {requests.map(r => (
                <div key={r.id} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{r.client_name}</p>
                    <p className="text-xs text-gray-400">
                      {r.prestation && `${r.prestation} · `}
                      {new Date(r.created_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUTS[r.status]?.color}`}>
                      {STATUTS[r.status]?.label}
                    </span>
                    {r.status !== 'done' && (
                      <button onClick={() => markDone(r.id)} className="text-xs text-gray-400 hover:text-green-600" title="Marquer comme avis reçu">✓</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
