import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { searchParams } = req.nextUrl
  const statut  = searchParams.get('statut')
  const search  = searchParams.get('q')

  let query = supabase
    .from('devisboost_devis')
    .select('*, devisboost_clients(id, name, email, phone)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (statut) query = query.eq('statut', statut)
  if (search) query = query.or(`titre.ilike.%${search}%,numero.ilike.%${search}%`)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body = await req.json()

  // Numéro auto
  const { data: numData } = await supabase.rpc('generate_devis_numero', { p_user_id: user.id })
  const numero = numData as string

  const { data, error } = await supabase
    .from('devisboost_devis')
    .insert({ ...body, user_id: user.id, numero })
    .select('*, devisboost_clients(id, name, email, phone)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
