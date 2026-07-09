import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const APP_URL = process.env.NEXT_PUBLIC_URL ?? 'https://www.thelocalboost.fr'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  if (searchParams.get('k') !== process.env.ADMIN_SECRET_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const ville      = searchParams.get('ville')     ?? undefined
  const secteur    = searchParams.get('secteur')   ?? undefined
  const region     = searchParams.get('region')    ?? undefined   // "idf" → liste de villes
  const format     = searchParams.get('format')    ?? 'json'
  const limit      = Math.min(parseInt(searchParams.get('limit') ?? '200'), 1000)
  const premium    = searchParams.get('premium') === '1'         // inclut email si premium

  // Exclure leads déjà convertis en clients Stripe (via payments table)
  const { data: paidLeads } = await supabase
    .from('payments')
    .select('email')
    .eq('status', 'succeeded')
  const paidEmails = new Set((paidLeads ?? []).map((r: any) => (r.email ?? '').toLowerCase()))

  // Exclure désinscrits
  const { data: unsubs } = await supabase
    .from('unsubscribed')
    .select('email')
  const unsubEmails = new Set((unsubs ?? []).map((r: any) => (r.email ?? '').toLowerCase()))

  // Construction de la requête
  let q = supabase
    .from('leads')
    .select('id, nom, ville, secteur' + (premium ? ', email' : ''))
    .not('nom', 'is', null)
    .not('ville', 'is', null)
    .not('secteur', 'is', null)
    .neq('nom', '')
    .neq('ville', '')
    // Exclure leads à risque de géolocalisation douteuse (communes IDF denses)
    // à activer si l'Incident 2 est confirmé systémique
    .limit(limit)

  if (ville)   q = q.ilike('ville', `%${ville}%`)
  if (secteur) q = q.eq('secteur', secteur)

  // Filtre région IDF
  const IDF_VILLES = ['Paris','Boulogne-Billancourt','Saint-Denis','Argenteuil','Montreuil',
    'Nanterre','Vitry-sur-Seine','Créteil','Colombes','Saint-Paul','Aubervilliers','Aulnay-sous-Bois',
    'Courbevoie','Champigny-sur-Marne','Rueil-Malmaison','Asnières-sur-Seine','Versailles',
    'Clamart','Fontenay-aux-Roses','Issy-les-Moulineaux','Levallois-Perret','Neuilly-sur-Seine',
    'Vincennes','Charenton-le-Pont','Saint-Maur-des-Fossés','Ivry-sur-Seine','Maisons-Alfort']
  if (region === 'idf') q = q.in('ville', IDF_VILLES)

  const { data: leads, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Filtrer convertis + désinscrits (si email dispo en jointure Supabase difficile, filtre post-fetch)
  const filtered = (leads ?? []).filter((l: any) => {
    const em = (l.email ?? '').toLowerCase()
    return !paidEmails.has(em) && !unsubEmails.has(em)
  })

  // Construire l'export
  const rows = filtered.map((l: any) => ({
    nom:          l.nom,
    ville:        l.ville,
    secteur:      l.secteur,
    analyse_url:  `${APP_URL}/analyser?nom=${encodeURIComponent(l.nom)}&ville=${encodeURIComponent(l.ville)}&utm_source=agence&utm_medium=export`,
    ...(premium && l.email ? { email: l.email } : {}),
  }))

  if (format === 'csv') {
    const cols = ['nom', 'ville', 'secteur', 'analyse_url', ...(premium ? ['email'] : [])]
    const header = cols.map(c => `"${c}"`).join(',')
    const body   = rows.map(r =>
      cols.map(c => `"${String((r as any)[c] ?? '').replace(/"/g, '""')}"`).join(',')
    ).join('\n')
    return new NextResponse(`${header}\n${body}`, {
      headers: {
        'Content-Type':        'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="leads-localboost-${Date.now()}.csv"`,
      },
    })
  }

  return NextResponse.json({ count: rows.length, leads: rows })
}
