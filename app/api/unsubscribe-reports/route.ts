import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function verifyToken(userId: string, token: string): boolean {
  const secret   = process.env.CRON_SECRET ?? 'secret'
  const expected = crypto.createHmac('sha256', secret).update(userId).digest('hex').slice(0, 32)
  return token === expected
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const token  = searchParams.get('token') ?? ''
  const uid    = searchParams.get('uid') ?? ''

  if (!uid || !verifyToken(uid, token)) {
    return new NextResponse('Lien invalide.', { status: 400, headers: { 'Content-Type': 'text/plain' } })
  }

  await supabase.from('profiles').update({ no_weekly_report: true }).eq('id', uid)

  return new NextResponse(
    `<!DOCTYPE html><html><body style="font-family:Arial;max-width:480px;margin:80px auto;text-align:center;color:#374151">
      <h2>Désinscription confirmée</h2>
      <p>Vous ne recevrez plus les rapports hebdomadaires LocalBoost.</p>
      <p style="margin-top:32px"><a href="${process.env.NEXT_PUBLIC_URL}" style="color:#2563eb">Retour au site</a></p>
    </body></html>`,
    { headers: { 'Content-Type': 'text/html' } }
  )
}
