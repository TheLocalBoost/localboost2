import { ImageResponse } from 'next/og'
import { SECTEURS, unslugify } from '@/lib/seo-data'

export const runtime = 'edge'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({ params }: { params: Promise<{ secteur: string; ville: string }> }) {
  const { secteur: secteurSlug, ville: villeSlug } = await params
  const secteur = SECTEURS[secteurSlug]
  const ville = unslugify(villeSlug)

  return new ImageResponse(
    (
      <div style={{
        width: '100%', height: '100%',
        background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        fontFamily: 'system-ui, sans-serif', padding: '60px',
      }}>
        <div style={{
          background: 'rgba(255,255,255,0.1)', borderRadius: '16px',
          padding: '12px 24px', marginBottom: '32px',
          color: '#93c5fd', fontSize: '18px', fontWeight: 600,
        }}>
          📍 LocalBoost — Diagnostic gratuit
        </div>

        <div style={{
          fontSize: '64px', fontWeight: 800, color: '#ffffff',
          textAlign: 'center', lineHeight: 1.2, marginBottom: '24px',
        }}>
          Votre {secteur?.label || secteurSlug}
          <br />
          <span style={{ color: '#93c5fd' }}>à {ville}</span>
          <br />
          est-il visible ?
        </div>

        <div style={{
          fontSize: '24px', color: 'rgba(255,255,255,0.8)',
          textAlign: 'center', marginBottom: '48px',
        }}>
          Analysez votre fiche Google en 30 secondes — gratuit
        </div>

        <div style={{
          background: '#16a34a', color: '#ffffff',
          fontSize: '22px', fontWeight: 700,
          padding: '16px 40px', borderRadius: '12px',
        }}>
          Voir mon score Google →
        </div>
      </div>
    ),
    { ...size }
  )
}
