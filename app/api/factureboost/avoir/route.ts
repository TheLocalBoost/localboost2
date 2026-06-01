import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

async function getNextNumero(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  type: 'facture' | 'avoir'
): Promise<string> {
  const prefix = type === 'avoir' ? 'AVO' : 'FAC'
  const year   = new Date().getFullYear()
  const { count } = await supabase
    .from('factureboost_factures')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('type', type)
    .gte('created_at', `${year}-01-01`)
  const num = String((count ?? 0) + 1).padStart(3, '0')
  return `${prefix}-${year}-${num}`
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { facture_id, lignes, motif } = await req.json()

  // Récupérer la facture originale
  const { data: original } = await supabase
    .from('factureboost_factures')
    .select('*')
    .eq('id', facture_id)
    .eq('user_id', user.id)
    .single()

  if (!original) return NextResponse.json({ error: 'Facture originale introuvable' }, { status: 404 })
  if (original.type === 'avoir') return NextResponse.json({ error: 'Impossible de créer un avoir sur un avoir' }, { status: 400 })

  // Calculer les totaux de l'avoir
  const lignesAvoir = lignes ?? original.lignes
  let total_ht = 0
  const tvaMap: Record<number, { base: number; montant: number }> = {}
  for (const l of lignesAvoir) {
    total_ht += l.total_ht ?? 0
    const taux = l.taux_tva ?? 0
    if (!tvaMap[taux]) tvaMap[taux] = { base: 0, montant: 0 }
    tvaMap[taux].base    += l.total_ht ?? 0
    tvaMap[taux].montant += parseFloat(((l.total_ht ?? 0) * taux / 100).toFixed(2))
  }
  const tva_details = Object.entries(tvaMap)
    .filter(([, v]) => v.base > 0)
    .map(([taux, v]) => ({ taux: Number(taux), ...v }))
  const total_tva = tva_details.reduce((s, t) => s + t.montant, 0)
  const total_ttc = total_ht + total_tva

  const numero = await getNextNumero(supabase, user.id, 'avoir')
  const now    = new Date().toISOString().slice(0, 10)

  const { data: avoir, error } = await supabase
    .from('factureboost_factures')
    .insert({
      user_id:             user.id,
      client_id:           original.client_id,
      numero,
      type:                'avoir',
      avoir_de:            facture_id,
      titre:               `Avoir sur ${original.numero}${motif ? ' — ' + motif : ''}`,
      lignes:              lignesAvoir,
      total_ht:            parseFloat(total_ht.toFixed(2)),
      tva_details,
      total_tva:           parseFloat(total_tva.toFixed(2)),
      total_ttc:           parseFloat(total_ttc.toFixed(2)),
      montant_regle:       0,
      devise:              'EUR',
      date_emission:       now,
      date_echeance:       now,
      conditions_paiement: original.conditions_paiement,
      rib:                 original.rib,
      statut:              'emise',
      client_b2b:          original.client_b2b,
      client_siren:        original.client_siren,
      client_nom:          original.client_nom,
      client_adresse:      original.client_adresse,
      client_email:        original.client_email,
      nature_transaction:  original.nature_transaction,
      penalites_retard:    original.penalites_retard,
      escompte:            original.escompte,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Log sur l'avoir et sur la facture originale
  await Promise.all([
    supabase.from('factureboost_logs').insert({
      facture_id: avoir.id,
      user_id:    user.id,
      action:     'avoir_created',
      details:    { avoir_de: facture_id, motif },
    }),
    supabase.from('factureboost_logs').insert({
      facture_id,
      user_id:    user.id,
      action:     'avoir_emis',
      details:    { avoir_numero: numero, motif },
    }),
  ])

  return NextResponse.json(avoir)
}
