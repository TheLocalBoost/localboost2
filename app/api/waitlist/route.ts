import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { email, commerce_name, city } = await req.json()

    await supabaseAdmin.from('waitlist').insert({
      email,
      commerce_name,
      city,
      created_at: new Date().toISOString(),
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Waitlist error:', err)
    return NextResponse.json({ success: true })
  }
}