import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  const { count } = await supabase
    .from('analytics_events')
    .select('*', { count: 'exact', head: true })
    .eq('name', 'analyzer_result')

  return NextResponse.json({ count: count ?? 0 }, {
    headers: { 'Cache-Control': 'public, s-maxage=300' },
  })
}
