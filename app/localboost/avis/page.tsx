'use client'

import { useState, useEffect, useRef } from 'react'
import { QRCodeCanvas } from 'qrcode.react'

export default function AvisPage() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const qrRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/localboost/setup').then(r => r.json()).then(p => {
      setProfile(p?.google_place_id ? p : null)
      setLoading(false)
    })
  }, [])

  function downloadQR() {
    const canvas = qrRef.current?.querySelector('canvas') as HTMLCanvasElement | null
    if (!canvas) return
    const url = canvas.toDataURL('image/png')
    const a   = document.createElement('a')
    a.download = `qr-avis-${profile?.business_name?.replace(/\s+/g, '-') ?? 'google'}.png`
    a.href = url
    a.click()
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
    <div className="max-w-lg">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Collecter des avis</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Vos clients scannent le QR code et laissent un avis en 30 secondes — sans que vous ayez à demander leur email.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex flex-col items-center gap-5">
          <div ref={qrRef} className="bg-white p-4 rounded-2xl border-2 border-gray-100 shadow-sm">
            <QRCodeCanvas
              value={profile.google_review_link}
              size={220}
              level="H"
              includeMargin
              imageSettings={{ src: '/favicon.ico', width: 32, height: 32, excavate: true }}
            />
          </div>

          <p className="text-sm text-gray-500 text-center">{profile.business_name}</p>

          <button
            onClick={downloadQR}
            className="w-full rounded-xl bg-gray-900 py-3.5 text-sm font-bold text-white hover:bg-gray-700 transition"
          >
            ⬇️ Télécharger le QR code (PNG)
          </button>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-xl text-xs text-blue-700 space-y-1.5">
          <p className="font-semibold text-blue-800 mb-2">Où le mettre :</p>
          <p>• Au dos de vos factures et devis</p>
          <p>• À l'accueil ou en caisse</p>
          <p>• Sur vos cartes de visite</p>
          <p>• En signature d'email</p>
          <p>• Sur un écran ou une affiche dans votre local</p>
        </div>
      </div>
    </div>
  )
}
