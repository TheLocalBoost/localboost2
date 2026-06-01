import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const mois = searchParams.get('mois') // format YYYY-MM, défaut = mois courant

  let debut: string
  let fin: string

  if (mois) {
    const [y, m] = mois.split('-')
    const finD = new Date(Number(y), Number(m), 0)
    debut = `${y}-${m}-01`
    fin   = `${y}-${m}-${String(finD.getDate()).padStart(2, '0')}`
  } else {
    const now = new Date()
    const y = now.getFullYear()
    const m = String(now.getMonth() + 1).padStart(2, '0')
    const finD = new Date(y, now.getMonth() + 1, 0)
    debut = `${y}-${m}-01`
    fin   = `${y}-${m}-${String(finD.getDate()).padStart(2, '0')}`
  }

  const { data: factures } = await supabase
    .from('factureboost_factures')
    .select('*')
    .eq('user_id', user.id)
    .gte('date_emission', debut)
    .lte('date_emission', fin)
    .order('date_emission', { ascending: true })

  if (!factures?.length) {
    return new Response('Numéro,Type,Date émission,Date échéance,Client,SIREN client,Total HT,TVA,Total TTC,Statut,Payée le\n', {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="factures-${mois ?? 'mois'}.csv"`,
      },
    })
  }

  const lignes = [
    'Numéro,Type,Date émission,Date échéance,Client,SIREN client,Total HT,TVA,Total TTC,Statut,Payée le',
    ...factures.map(f => {
      const cols = [
        f.numero,
        f.type === 'avoir' ? 'Avoir' : 'Facture',
        new Date(f.date_emission).toLocaleDateString('fr-FR'),
        new Date(f.date_echeance).toLocaleDateString('fr-FR'),
        `"${(f.client_nom ?? '').replace(/"/g, '""')}"`,
        f.client_siren ?? '',
        f.total_ht.toFixed(2).replace('.', ','),
        f.total_tva.toFixed(2).replace('.', ','),
        f.total_ttc.toFixed(2).replace('.', ','),
        f.statut,
        f.paid_at ? new Date(f.paid_at).toLocaleDateString('fr-FR') : '',
      ]
      return cols.join(',')
    }),
  ]

  const csv = lignes.join('\n')

  return new Response('﻿' + csv, { // BOM UTF-8 pour Excel
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="factures-${mois ?? 'mois'}.csv"`,
    },
  })
}
