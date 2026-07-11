import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Vue admin minimale — pas d'UI dédiée pour l'instant, mais la table reste
// facilement requêtable et modifiable via ces deux endpoints protégés.

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  if (searchParams.get('k') !== process.env.ADMIN_SECRET_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const status = searchParams.get('status') ?? undefined
  const limit  = Math.min(parseInt(searchParams.get('limit') ?? '200'), 1000)

  let q = supabase
    .from('report_requests')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (status) q = q.eq('status', status)

  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ count: data.length, requests: data })
}

export async function PATCH(req: NextRequest) {
  const { searchParams } = req.nextUrl
  if (searchParams.get('k') !== process.env.ADMIN_SECRET_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id, status } = await req.json().catch(() => ({}))
  if (!id || !['nouvelle', 'traitee'].includes(status)) {
    return NextResponse.json({ error: 'id et status ("nouvelle"|"traitee") requis' }, { status: 400 })
  }

  const { error } = await supabase.from('report_requests').update({ status }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
