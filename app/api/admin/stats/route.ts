import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const VARIANT_LABELS: Record<string, string> = {
  '0': 'Fiche Google — secteur à ville',
  '1': 'Remarque sur votre présence Google',
  '2': 'Secteur à ville : visibilité locale',
  '3': 'Audit gratuit fiche Google Business',
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('x-admin-key')
  if (authHeader !== process.env.ADMIN_SECRET_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { count: total } = await supabase
    .from('leads').select('*', { count: 'exact', head: true })

  const { count: sent } = await supabase
    .from('leads').select('*', { count: 'exact', head: true }).eq('sent', true)

  const { data: bySectorRaw } = await supabase
    .from('leads')
    .select('secteur')

  const sectorCounts: Record<string, number> = {}
  bySectorRaw?.forEach(r => {
    sectorCounts[r.secteur] = (sectorCounts[r.secteur] || 0) + 1
  })
  const bySector = Object.entries(sectorCounts).sort((a, b) => b[1] - a[1])

  // Breakdown par variante d'objet (uniquement les envoyés)
  const { data: variantRaw } = await supabase
    .from('leads')
    .select('subject_variant')
    .eq('sent', true)

  const variantCounts: Record<string, number> = {}
  variantRaw?.forEach(r => {
    const k = r.subject_variant ?? 'inconnu'
    variantCounts[k] = (variantCounts[k] || 0) + 1
  })
  const byVariant = Object.entries(variantCounts)
    .map(([k, count]) => ({ variant: k, label: VARIANT_LABELS[k] ?? k, count }))
    .sort((a, b) => b.count - a.count)

  const { data: recent } = await supabase
    .from('leads')
    .select('nom, email, secteur, ville, sent_at, subject_variant')
    .eq('sent', true)
    .order('sent_at', { ascending: false })
    .limit(10)

  return NextResponse.json({
    total:     total || 0,
    sent:      sent  || 0,
    remaining: (total || 0) - (sent || 0),
    bySector,
    byVariant,
    recent,
  })
}
