import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

// ─── Numérotation séquentielle sans trou ──────────────────────────────────────
async function getNextNumero(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  type: 'facture' | 'avoir'
): Promise<string> {
  const prefix = type === 'facture' ? 'FAC' : 'AVO'
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

// ─── Calcul des totaux multi-taux ─────────────────────────────────────────────
function calculerTotaux(lignes: any[]) {
  const tvaMap: Record<number, { base: number; montant: number }> = {}
  let total_ht = 0
  for (const l of lignes) {
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
  return {
    total_ht:   parseFloat(total_ht.toFixed(2)),
    tva_details,
    total_tva:  parseFloat(total_tva.toFixed(2)),
    total_ttc:  parseFloat((total_ht + total_tva).toFixed(2)),
  }
}

// ─── GET : liste des factures ou détail d'une facture ─────────────────────────
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id      = searchParams.get('id')
  const statut  = searchParams.get('statut')
  const mois    = searchParams.get('mois')   // format YYYY-MM
  const q       = searchParams.get('q')
  const action  = searchParams.get('action')

  // Action Stripe : créer un Payment Link
  if (id && action === 'stripe') {
    return NextResponse.json({ error: 'Utilisez POST /api/factureboost/create?id=...&action=stripe' }, { status: 400 })
  }

  // Détail d'une facture
  if (id) {
    const { data } = await supabase
      .from('factureboost_factures')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()
    if (!data) return NextResponse.json({ error: 'Facture introuvable' }, { status: 404 })
    return NextResponse.json(data)
  }

  // Liste
  let query = supabase
    .from('factureboost_factures')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (statut) query = query.eq('statut', statut)
  if (mois) {
    const [y, m] = mois.split('-')
    const debut  = `${y}-${m}-01`
    const finD   = new Date(Number(y), Number(m), 0)
    const fin    = `${y}-${m}-${String(finD.getDate()).padStart(2, '0')}`
    query = query.gte('date_emission', debut).lte('date_emission', fin)
  }
  if (q) {
    query = query.or(`numero.ilike.%${q}%,client_nom.ilike.%${q}%,titre.ilike.%${q}%`)
  }

  const { data } = await query
  return NextResponse.json(data ?? [])
}

// ─── POST : créer une facture ─────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id     = searchParams.get('id')
  const action = searchParams.get('action')

  // Action : activer Stripe Payment Link
  if (id && action === 'stripe') {
    const { data: facture } = await supabase
      .from('factureboost_factures')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()
    if (!facture) return NextResponse.json({ error: 'Facture introuvable' }, { status: 404 })

    try {
      const Stripe = (await import('stripe')).default
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
      const link = await stripe.paymentLinks.create({
        line_items: [{
          price_data: {
            currency: 'eur',
            product_data: { name: `Facture ${facture.numero} — ${facture.titre}` },
            unit_amount: Math.round(facture.total_ttc * 100),
          },
          quantity: 1,
        }],
        metadata: { facture_id: id, user_id: user.id },
      })
      await supabase
        .from('factureboost_factures')
        .update({ stripe_payment_link: link.url })
        .eq('id', id)
      return NextResponse.json({ stripe_payment_link: link.url })
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 500 })
    }
  }

  // Création d'une nouvelle facture
  const body = await req.json()
  const {
    devis_id,
    client_id,
    titre,
    client_b2b        = false,
    client_siren      = '',
    bon_commande      = '',
    adresse_livraison = '',
    nature_transaction = 'prestation',
    echeance_jours    = 30,
  } = body

  // Récupérer le profil FactureBoost pour les defaults
  const [{ data: fbProfile }, { data: dbProfile }] = await Promise.all([
    supabase.from('factureboost_profiles').select('*').eq('user_id', user.id).single(),
    supabase.from('devisboost_profiles').select('*').eq('user_id', user.id).single(),
  ])

  let lignes: any[]        = []
  let clientData: any      = null
  let titreFinale          = titre ?? ''
  let devisData: any       = null

  // Depuis un devis accepté
  if (devis_id) {
    const { data: devis } = await supabase
      .from('devisboost_devis')
      .select('*, devisboost_clients(*)')
      .eq('id', devis_id)
      .eq('user_id', user.id)
      .single()
    if (!devis) return NextResponse.json({ error: 'Devis introuvable' }, { status: 404 })
    devisData = devis
    // Convertir les lignes devis → lignes facture (ajouter taux_tva)
    lignes = (devis.lignes ?? []).map((l: any) => ({
      ...l,
      taux_tva: devis.tva_taux ?? 20,
    }))
    titreFinale = titre || devis.titre
    clientData  = devis.devisboost_clients
  } else if (client_id) {
    const { data: c } = await supabase
      .from('devisboost_clients')
      .select('*')
      .eq('id', client_id)
      .eq('user_id', user.id)
      .single()
    clientData = c
  }

  const dateEmission = new Date()
  const dateEcheance = new Date(dateEmission.getTime() + echeance_jours * 86400000)

  const totaux = lignes.length > 0
    ? calculerTotaux(lignes)
    : { total_ht: 0, tva_details: [], total_tva: 0, total_ttc: 0 }

  const numero = await getNextNumero(supabase, user.id, 'facture')

  const insertData: any = {
    user_id:            user.id,
    devis_id:           devis_id ?? null,
    client_id:          clientData?.id ?? client_id ?? null,
    numero,
    type:               'facture',
    titre:              titreFinale,
    lignes,
    ...totaux,
    montant_regle:      0,
    devise:             'EUR',
    date_emission:      dateEmission.toISOString().slice(0, 10),
    date_echeance:      dateEcheance.toISOString().slice(0, 10),
    conditions_paiement: fbProfile?.conditions_paiement ?? `Paiement à ${echeance_jours} jours`,
    rib:                fbProfile?.iban ? { iban: fbProfile.iban, bic: fbProfile.bic, banque: fbProfile.banque } : null,
    statut:             'brouillon',
    client_b2b,
    client_siren:       client_siren || '',
    client_nom:         clientData?.name ?? '',
    client_adresse:     clientData?.address ?? '',
    client_email:       clientData?.email ?? '',
    bon_commande,
    adresse_livraison,
    nature_transaction,
    penalites_retard:   fbProfile?.penalites_retard ?? 'Pénalités de retard : taux légal × 3 en cas de retard de paiement.',
    escompte:           fbProfile?.escompte ?? "Pas d'escompte pour règlement anticipé.",
  }

  const { data: created, error } = await supabase
    .from('factureboost_factures')
    .insert(insertData)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Log immuable
  await supabase.from('factureboost_logs').insert({
    facture_id: created.id,
    user_id:    user.id,
    action:     'created',
    details:    { numero, from_devis: devis_id ?? null },
  })

  // Marquer le devis comme facturé
  if (devis_id) {
    await supabase
      .from('devisboost_devis')
      .update({ statut: 'accepté' })
      .eq('id', devis_id)
  }

  return NextResponse.json(created)
}

// ─── PATCH : modifier une facture (brouillon uniquement) ─────────────────────
export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID manquant' }, { status: 400 })

  // Vérifier que la facture appartient à l'utilisateur et est modifiable
  const { data: existing } = await supabase
    .from('factureboost_factures')
    .select('statut')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!existing) return NextResponse.json({ error: 'Facture introuvable' }, { status: 404 })

  const body = await req.json()

  // Immutabilité : seul le statut peut être mis à jour si la facture n'est pas brouillon
  if (existing.statut !== 'brouillon') {
    const allowedKeys = ['statut']
    const forbidden = Object.keys(body).filter(k => !allowedKeys.includes(k))
    if (forbidden.length > 0) {
      return NextResponse.json(
        { error: 'Facture émise : seul le statut peut être modifié. Créez un avoir pour toute correction.' },
        { status: 403 }
      )
    }
  }

  // Recalculer les totaux si des lignes sont fournies
  const updateData: any = { ...body, updated_at: new Date().toISOString() }
  if (body.lignes) {
    const t = calculerTotaux(body.lignes)
    Object.assign(updateData, t)
  }

  // Si on émet la facture, log + maj statut
  if (body.statut === 'emise' && existing.statut === 'brouillon') {
    await supabase.from('factureboost_logs').insert({
      facture_id: id,
      user_id:    user.id,
      action:     'emise',
      details:    {},
    })
  }

  const { data: updated, error } = await supabase
    .from('factureboost_factures')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(updated)
}
