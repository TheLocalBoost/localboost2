import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const SUBJECT_LABELS = [
  '{nom} — j\'ai fait le test', 'Ce que voient vos clients avant d\'entrer', '{nom} : j\'ai cherché depuis mon canapé',
  'Test rapide sur "{s} {v}"', 'J\'ai fait semblant d\'être votre client', '{nom} — 8 secondes pour convaincre',
  'Ce que Google Maps montre de {nom}', 'La première impression que vous laissez sur Google', '{nom} vu de l\'extérieur',
  '"{s} {v}" — votre position sur Google', 'Vos concurrents à {v} ont une longueur d\'avance',
  'Votre concurrent fait quelque chose que vous ne faites pas', '{nom} : la différence entre vous et le premier résultat',
  'Pourquoi certains {s} à {v} sont toujours devant', 'Un concurrent moins bien noté que vous apparaît avant vous',
  'Ce que font vos concurrents que vous ne faites pas', '{nom} — quelqu\'un vous passe devant chaque jour',
  'Google Maps classe vos concurrents avant vous. Voici pourquoi.', '{nom} vs les autres {s} de {v}',
  'Le classement Google Maps n\'est pas neutre', 'Vous perdez des clients sans le savoir',
  '{nom} — des appels que vous ne recevez jamais', 'Ces clients qui passent devant votre porte sans entrer',
  '{v} cherche un {s} — pas vous', 'Le coût silencieux d\'une fiche Google non optimisée',
  '{nom} — ces clients qui cliquent sur la fiche suivante', 'Votre meilleure publicité, c\'est votre fiche Google. Elle vous trahit.',
  'Chaque recherche "{s} {v}" est une occasion manquée', 'Ce client ne vous a pas appelé. Voici pourquoi.',
  '{nom} — visibilité locale, le vrai calcul', '{nom} — j\'ai une observation',
  'Juste une remarque sur votre fiche Google', '{nom} — j\'ai passé 5 minutes sur votre fiche',
  'Un regard extérieur sur votre présence Google', 'Ce que j\'ai noté sur {nom}',
  '{nom} — votre fiche a quelque chose d\'intéressant', 'Ce que votre fiche Google dit de vous (sans le vouloir)',
  '{nom} — première impression sur Google Maps', 'Deux choses que j\'ai vues sur votre fiche',
  '{nom} — votre fiche mérite mieux', '{nom} — savez-vous ce que voient vos clients ?',
  'Avez-vous vérifié votre position sur Google Maps récemment ?', '{nom} — connaissez-vous votre score de visibilité Google ?',
  'Votre fiche Google vous représente-t-elle vraiment ?', 'Combien de personnes cherchent {s} à {v} chaque mois ?',
  'Saviez-vous que votre fiche Google est votre meilleur commercial ?', '{nom} — avez-vous comparé avec vos concurrents ?',
  'Quand avez-vous mis à jour votre fiche Google pour la dernière fois ?', '{nom} — est-ce que Google vous rend justice ?',
  'Votre fiche Google est-elle à jour ?', '76% des recherches locales aboutissent à une visite',
  '9 clients sur 10 regardent Google avant de choisir', 'Les photos augmentent les clics de 35% sur Google Maps',
  '46% des recherches Google ont une intention locale', 'Une description complète, c\'est +27% de visibilité',
  '3 commerçants sur 4 perdent des clients à cause de leur fiche Google', 'Les avis Google influencent 92% des décisions d\'achat locales',
  'Un client décide en moins de 8 secondes sur Google Maps', 'Les horaires incorrects font fuir 68% des clients',
  'Google Maps génère 2× plus de trafic en magasin que les autres canaux', 'Ce que Google regarde vraiment pour vous classer',
  'Google vous pénalise sans que vous le sachiez', '{nom} — les signaux que Google attend de vous',
  'Comment Google choisit qui afficher en premier', 'L\'algorithme Google Maps favorise les fiches actives',
  'Ce que Google ne vous dit pas sur votre visibilité', 'Paramètres cachés qui influencent votre classement Google',
  '{nom} — pourquoi Google vous classe ainsi', 'Google Maps et les commerces locaux : ce qui a changé',
  'Le facteur n°1 que Google utilise pour les commerces locaux', 'Chaque semaine sans optimisation, vous perdez du terrain',
  '{nom} — vos concurrents n\'attendent pas', 'La visibilité locale se joue maintenant',
  '{nom} — le retard se creuse', 'Pendant que vous lisez cet email, vos concurrents captent vos clients',
  'Chaque jour, des clients vous cherchent et ne vous trouvent pas', '{nom} — fenêtre d\'opportunité sur Google Maps',
  'Votre visibilité Google baisse. En silence.', '{nom} — l\'avantage du premier qui bouge',
  'Ce que vous gagnez à agir maintenant', 'Je sais que ce n\'est pas votre priorité du moment',
  'Personne ne vous a appris à optimiser votre fiche Google', 'Ce que j\'entends souvent des {s} à {v}',
  'Ce n\'est pas de votre faute si votre fiche n\'est pas optimisée', '{nom} — je travaille avec des commerçants comme vous',
  'La plupart des bons commerçants ont une mauvaise fiche Google', '{nom} — un truc simple que la plupart des commerçants ignorent',
  'Ce qu\'un bon commerçant peut faire en 30 minutes', '{nom} — je voulais juste vous montrer quelque chose',
  'C\'est plus simple qu\'on ne le pense', 'Il y a un truc que Google ne vous dit pas',
  '{nom} — le vrai facteur qui détermine votre position', 'Ce que les {s} en tête à {v} ont en commun',
  'Un paramètre que 9 commerçants sur 10 négligent', 'Le signal invisible qui change votre classement Google',
  '{nom} — ce que Google voit et que vous ne voyez pas', 'La raison cachée de votre positionnement Google',
  'L\'élément que personne ne vous a dit de configurer', '{nom} — ce que j\'ai découvert en 10 minutes sur votre fiche',
  'Ce que la première page Google Maps ne vous dit pas',
]

export async function GET(req: NextRequest) {
  if (req.headers.get('x-admin-key') !== process.env.ADMIN_SECRET_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const [
    { count: total },
    { count: sent },
    { count: withEmail },
    { count: bounces },
    { count: waitlistCount },
    { data: subscriberData },
    { data: variantRaw },
    { data: clickRaw },
    { data: recentSends },
    { data: recentClicksRaw },
    { data: dailyRaw },
    { data: availableSectorsRaw },
  ] = await Promise.all([
    supabase.from('leads').select('*', { count: 'exact', head: true }),
    supabase.from('leads').select('*', { count: 'exact', head: true }).eq('sent', true),
    supabase.from('leads').select('*', { count: 'exact', head: true }).not('email', 'is', null),
    supabase.from('leads').select('*', { count: 'exact', head: true }).eq('email_status', 'bounced'),
    supabase.from('waitlist').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('subscription_status').or('subscription_status.eq.active,subscription_status.eq.trialing'),
    supabase.from('leads').select('subject_variant, secteur').eq('sent', true),
    supabase.from('email_clicks').select('variant_id'),
    supabase.from('leads').select('nom, email, secteur, ville, sent_at').eq('sent', true).order('sent_at', { ascending: false }).limit(10),
    supabase.from('email_clicks').select('variant_id, lead_id, clicked_at').order('clicked_at', { ascending: false }).limit(10),
    supabase.from('leads').select('sent_at').eq('sent', true).gte('sent_at', sevenDaysAgo),
    supabase.from('leads').select('secteur').eq('sent', false).not('email', 'is', null).or('email_status.is.null,email_status.neq.invalid'),
  ])

  // ── Secteurs (envoyés) ──────────────────────────────────────────────────────
  const sectorCounts: Record<string, number> = {}
  variantRaw?.forEach(r => {
    if (r.secteur) sectorCounts[r.secteur] = (sectorCounts[r.secteur] || 0) + 1
  })
  const bySector = Object.entries(sectorCounts).sort((a, b) => b[1] - a[1])

  // ── Secteurs disponibles (non envoyés) ──────────────────────────────────────
  const availableSectorCounts: Record<string, number> = {}
  availableSectorsRaw?.forEach(r => {
    if (r.secteur) availableSectorCounts[r.secteur] = (availableSectorCounts[r.secteur] || 0) + 1
  })
  const availableSectors = Object.entries(availableSectorCounts).sort((a, b) => b[1] - a[1])

  // ── Variantes avec CTR ──────────────────────────────────────────────────────
  const sendsByVariant: Record<number, number> = {}
  variantRaw?.forEach(r => {
    const id = parseInt(r.subject_variant ?? '')
    if (!isNaN(id)) sendsByVariant[id] = (sendsByVariant[id] || 0) + 1
  })

  const clicksByVariant: Record<number, number> = {}
  clickRaw?.forEach(r => {
    clicksByVariant[r.variant_id] = (clicksByVariant[r.variant_id] || 0) + 1
  })

  const totalClicks = clickRaw?.length ?? 0
  const ctrGlobal   = sent && sent > 0 ? ((totalClicks / sent) * 100).toFixed(1) : '0.0'

  const allVariantIds = new Set([
    ...Object.keys(sendsByVariant).map(Number),
    ...Object.keys(clicksByVariant).map(Number),
  ])
  const byVariantCTR = Array.from(allVariantIds)
    .map(id => {
      const sends  = sendsByVariant[id] || 0
      const clicks = clicksByVariant[id] || 0
      const ctr    = sends > 0 ? (clicks / sends) * 100 : 0
      return { id, sends, clicks, ctr: parseFloat(ctr.toFixed(1)), subject: SUBJECT_LABELS[id] ?? `Variante ${id}` }
    })
    .filter(v => v.id < 20) // 20 variantes actives (send.js)
    .sort((a, b) => {
      if (b.sends < 5 && a.sends < 5) return b.sends - a.sends
      if (b.sends < 5) return -1
      if (a.sends < 5) return 1
      return b.ctr - a.ctr
    })

  // ── Abonnés ─────────────────────────────────────────────────────────────────
  const activeSubscribers  = subscriberData?.filter(p => p.subscription_status === 'active').length ?? 0
  const trialingSubscribers = subscriberData?.filter(p => p.subscription_status === 'trialing').length ?? 0

  // ── Activité journalière ────────────────────────────────────────────────────
  const dailyCounts: Record<string, number> = {}
  dailyRaw?.forEach(r => {
    const day = r.sent_at?.split('T')[0] ?? ''
    if (day) dailyCounts[day] = (dailyCounts[day] || 0) + 1
  })
  const dailySends = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() - (6 - i) * 86400000)
    const key = d.toISOString().split('T')[0]
    return { date: key, count: dailyCounts[key] || 0 }
  })

  // ── Clics récents ───────────────────────────────────────────────────────────
  const leadIds = [...new Set(recentClicksRaw?.map(c => c.lead_id).filter(Boolean) ?? [])]
  const { data: clickLeads } = leadIds.length
    ? await supabase.from('leads').select('id, nom, secteur').in('id', leadIds)
    : { data: [] }
  const leadById: Record<number, any> = {}
  clickLeads?.forEach((l: any) => { leadById[l.id] = l })

  const recentClicks = recentClicksRaw?.map(c => ({
    variant_id: c.variant_id,
    clicked_at: c.clicked_at,
    nom:     leadById[c.lead_id]?.nom     ?? null,
    secteur: leadById[c.lead_id]?.secteur ?? null,
  })) ?? []

  return NextResponse.json({
    totalLeads: total || 0,
    sent:       sent  || 0,
    withEmail:  withEmail || 0,
    bounces:    bounces || 0,
    remaining:  (total || 0) - (sent || 0),
    totalClicks,
    ctrGlobal,
    waitlistCount: waitlistCount || 0,
    activeSubscribers,
    trialingSubscribers,
    mrr: activeSubscribers * 29,
    bySector,
    availableSectors,
    byVariantCTR,
    recentSends: recentSends ?? [],
    recentClicks,
    dailySends,
  })
}
