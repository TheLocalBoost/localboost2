import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { id } = await params
  const { statut } = await req.json()

  const STATUTS_VALIDES = ['brouillon', 'emise', 'envoyee', 'vue', 'payee', 'retard', 'litigieuse']
  if (!STATUTS_VALIDES.includes(statut)) {
    return NextResponse.json({ error: 'Statut invalide' }, { status: 400 })
  }

  const update: any = { statut, updated_at: new Date().toISOString() }
  if (statut === 'payee') update.paid_at = new Date().toISOString()

  const { data: updated, error } = await supabase
    .from('factureboost_factures')
    .update(update)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabase.from('factureboost_logs').insert({
    facture_id: id,
    user_id:    user.id,
    action:     `statut_${statut}`,
    details:    {},
  })

  return NextResponse.json(updated)
}
