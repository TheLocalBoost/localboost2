import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { renderToBuffer } from '@react-pdf/renderer'
import { FacturePDF, genererXmlFacturX } from '@/components/factureboost/FacturePDF'
import React from 'react'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { facture_id, isDuplicate } = await req.json()

  const [{ data: facture }, { data: dbProfile }, { data: fbProfile }] = await Promise.all([
    supabase
      .from('factureboost_factures')
      .select('*')
      .eq('id', facture_id)
      .eq('user_id', user.id)
      .single(),
    supabase
      .from('devisboost_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single(),
    supabase
      .from('factureboost_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single(),
  ])

  if (!facture) return NextResponse.json({ error: 'Facture introuvable' }, { status: 404 })

  const profile = {
    company_name:       dbProfile?.company_name,
    siret:              dbProfile?.siret,
    siren:              fbProfile?.siren ?? (dbProfile?.siret ?? '').slice(0, 9),
    metier:             dbProfile?.metier,
    address:            dbProfile?.address,
    phone:              dbProfile?.phone,
    email:              dbProfile?.email,
    logo_url:           dbProfile?.logo_url,
    tva_number:         fbProfile?.tva_number ?? dbProfile?.tva_number,
    micro_entrepreneur: fbProfile?.micro_entrepreneur ?? false,
    iban:               fbProfile?.iban,
    bic:                fbProfile?.bic,
    banque:             fbProfile?.banque,
  }

  const factureData = {
    ...facture,
    isDuplicate: isDuplicate ?? false,
  }

  // Générer le XML Factur-X
  const xmlContent = genererXmlFacturX(factureData, profile)

  // Générer le PDF
  const buf = await renderToBuffer(
    React.createElement(FacturePDF, { facture: factureData, profile })
  )

  // Archiver en Supabase Storage (bucket factureboost-factures, chemin user_id/numero.pdf)
  const filename = `${user.id}/${facture.numero}.pdf`
  const { data: stored } = await supabase.storage
    .from('factureboost-factures')
    .upload(filename, buf, { contentType: 'application/pdf', upsert: true })

  if (stored) {
    const { data: { publicUrl } } = supabase.storage
      .from('factureboost-factures')
      .getPublicUrl(filename)

    await supabase
      .from('factureboost_factures')
      .update({ pdf_url: publicUrl, xml_facturx: xmlContent })
      .eq('id', facture_id)
  }

  // Log
  await supabase.from('factureboost_logs').insert({
    facture_id,
    user_id: user.id,
    action:  isDuplicate ? 'pdf_duplicate' : 'pdf_generated',
    details: {},
  })

  const nomFichier = `${facture.type === 'avoir' ? 'avoir' : 'facture'}-${facture.numero}.pdf`

  return new Response(buf, {
    headers: {
      'Content-Type':        'application/pdf',
      'Content-Disposition': `attachment; filename="${nomFichier}"`,
    },
  })
}
