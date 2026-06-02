import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  const { count } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .in('subscription_status', ['trialing', 'active'])
  return NextResponse.json({ count: count ?? 0 }, {
    headers: { 'Cache-Control': 'public, s-maxage=60' },
  })
}
