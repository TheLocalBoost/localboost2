import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function unsubscribe(token: string) {
  const { data } = await sb.from('pricing_exits').select('email').eq('unsub_token', token).single()
  if (!data?.email) return null
  await sb.from('unsubscribed').upsert({ email: data.email }, { onConflict: 'email' })
  return data.email
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const email = await unsubscribe(token)
  if (!email) return new NextResponse('Lien invalide.', { status: 404 })
  return new NextResponse(
    `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Désinscription</title><style>body{font-family:system-ui,sans-serif;max-width:480px;margin:80px auto;padding:0 24px;text-align:center;color:#1a1a1a;}h1{font-size:22px;font-weight:700;margin-bottom:12px;}p{color:#6b7280;font-size:15px;line-height:1.6;}</style></head><body><h1>✓ Désinscription confirmée</h1><p>${email} ne recevra plus d'emails de notre part.</p></body></html>`,
    { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  )
}

// RFC 8058 one-click
export async function POST(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  await unsubscribe(token)
  return new NextResponse('OK', { status: 200 })
}
