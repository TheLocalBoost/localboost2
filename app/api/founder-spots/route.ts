import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  const { data, error } = await supabase
    .from('founder_config')
    .select('key, value')
    .in('key', ['spots_total', 'spots_taken'])

  if (error || !data?.length) {
    // Fallback si la table n'existe pas encore
    return NextResponse.json({ total: 50, taken: 3, remaining: 47 }, {
      headers: { 'Cache-Control': 'public, max-age=60' },
    })
  }

  const total = data.find(r => r.key === 'spots_total')?.value ?? 50
  const taken = data.find(r => r.key === 'spots_taken')?.value ?? 0
  return NextResponse.json(
    { total, taken, remaining: Math.max(0, total - taken) },
    { headers: { 'Cache-Control': 'public, max-age=60' } }
  )
}
