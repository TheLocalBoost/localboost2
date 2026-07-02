import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const OWNER_IPS = (process.env.OWNER_IPS ?? '').split(',').map(s => s.trim()).filter(Boolean)

function isOwner(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? ''
  return OWNER_IPS.some(o => ip.startsWith(o))
}

export async function POST(req: NextRequest) {
  if (isOwner(req)) return NextResponse.json({ ok: true })
  const { event, properties } = await req.json()
  if (!event) return NextResponse.json({ ok: false })
  await supabase.from('analytics_events').insert({ name: event, meta: properties ?? {} })
  return NextResponse.json({ ok: true })
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const leadId    = searchParams.get('lid')
  const variantId = searchParams.get('vid')
  const dest      = searchParams.get('url')

  if (!dest) return NextResponse.redirect('https://thelocalboost.fr')

  // Await l'insert AVANT le redirect — sinon Vercel kill la fonction trop tôt
  if (variantId !== null) {
    await supabase.from('email_clicks').insert({
      lead_id:    leadId ? Number(leadId) : null,
      variant_id: Number(variantId),
      clicked_at: new Date().toISOString(),
    })
  }

  return NextResponse.redirect(decodeURIComponent(dest))
}
