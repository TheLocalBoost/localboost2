import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  if (req.headers.get('x-admin-key') !== process.env.ADMIN_SECRET_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { limit = 50, secteur } = await req.json()

  let query = supabase
    .from('leads')
    .select('secteur, ville')
    .eq('sent', false)
    .neq('email_status', 'invalid')
    .limit(limit)

  if (secteur) query = query.eq('secteur', secteur)

  const { data: leads, count } = await query

  if (!leads?.length) {
    return NextResponse.json({ available: 0, sectors: [], cities: [] })
  }

  const sectorCounts: Record<string, number> = {}
  const cityCounts: Record<string, number> = {}
  leads.forEach(l => {
    if (l.secteur) sectorCounts[l.secteur] = (sectorCounts[l.secteur] || 0) + 1
    if (l.ville && l.ville !== 'France') cityCounts[l.ville] = (cityCounts[l.ville] || 0) + 1
  })

  return NextResponse.json({
    available: leads.length,
    sectors: Object.entries(sectorCounts).sort((a, b) => b[1] - a[1]).slice(0, 5),
    cities:  Object.entries(cityCounts).sort((a, b) => b[1] - a[1]).slice(0, 5),
  })
}
