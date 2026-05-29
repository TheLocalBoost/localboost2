import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const leadId    = searchParams.get('lid')
  const variantId = searchParams.get('vid')
  const dest      = searchParams.get('url')

  if (!dest) return NextResponse.redirect('https://thelocalboost.fr')

  // Enregistrer le clic sans bloquer la redirection
  if (leadId && variantId !== null) {
    void supabase.from('email_clicks').insert({
      lead_id:    Number(leadId),
      variant_id: Number(variantId),
      clicked_at: new Date().toISOString(),
    })
  }

  return NextResponse.redirect(decodeURIComponent(dest))
}
