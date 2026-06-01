import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { renderToBuffer } from '@react-pdf/renderer'
import { DevisPDF } from '@/components/devisboost/DevisPDF'
import React from 'react'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { devis_id } = await req.json()

  const [{ data: devis }, { data: profile }] = await Promise.all([
    supabase
      .from('devisboost_devis')
      .select('*, devisboost_clients(id, name, email, phone, address)')
      .eq('id', devis_id)
      .eq('user_id', user.id)
      .single(),
    supabase
      .from('devisboost_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single(),
  ])

  if (!devis) return NextResponse.json({ error: 'Devis introuvable' }, { status: 404 })

  const devisData = {
    ...devis,
    client: devis.devisboost_clients ?? null,
  }

  const buf = await renderToBuffer(
    React.createElement(DevisPDF, { devis: devisData, profile: profile ?? {} })
  )

  // Sauvegarder en Supabase Storage
  const filename = `${user.id}/${devis.numero}.pdf`
  const { data: stored } = await supabase.storage
    .from('devisboost-logos')
    .upload(filename, buf, { contentType: 'application/pdf', upsert: true })

  if (stored) {
    const { data: { publicUrl } } = supabase.storage.from('devisboost-logos').getPublicUrl(filename)
    await supabase.from('devisboost_devis').update({ pdf_url: publicUrl }).eq('id', devis_id)
  }

  return new Response(buf, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="devis-${devis.numero}.pdf"`,
    },
  })
}
