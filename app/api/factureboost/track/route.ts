import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

// Pixel de tracking pour détecter l'ouverture des emails de facture
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  if (id) {
    try {
      const supabase = await createClient()
      const { data: facture } = await supabase
        .from('factureboost_factures')
        .select('statut, opened_at')
        .eq('id', id)
        .single()

      if (facture && !facture.opened_at) {
        const newStatut = facture.statut === 'envoyee' ? 'vue' : facture.statut
        await supabase
          .from('factureboost_factures')
          .update({ opened_at: new Date().toISOString(), statut: newStatut })
          .eq('id', id)

        await supabase.from('factureboost_logs').insert({
          facture_id: id,
          user_id:    null,
          action:     'opened',
          details:    {},
        })
      }
    } catch {}
  }

  // Retourner un pixel GIF transparent 1×1
  const pixel = Buffer.from(
    'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
    'base64'
  )

  return new Response(pixel, {
    headers: {
      'Content-Type':  'image/gif',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma':        'no-cache',
    },
  })
}
