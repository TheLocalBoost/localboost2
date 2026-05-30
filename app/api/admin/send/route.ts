import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const APP_URL = 'https://thelocalboost.fr'

// ── 20 variantes — 4 angles × 5 emails ──────────────────────────────────────

type Fn = (nom: string, secteur: string, ville: string) => string

interface Variant { subject: Fn; hook: Fn; cta: Fn }

const VARIANTS: Variant[] = [
  // 0-4 : Observation
  {
    subject: () => `Juste une remarque sur votre fiche Google`,
    hook: (n, s, v) => `J'analyse régulièrement des fiches Google de commerçants locaux. La vôtre a retenu mon attention — dans le bon sens, d'abord. Mais elle présente aussi deux lacunes que j'aurais du mal à ne pas mentionner.`,
    cta: (n) => `Voir mes remarques sur ${n} →`,
  },
  {
    subject: (n) => `${n} — j'ai passé 5 minutes sur votre fiche`,
    hook: (n, s, v) => `Ce que j'ai trouvé en 5 minutes : des atouts réels, une note correcte, quelques avis positifs. Et deux problèmes précis qui, selon moi, vous coûtent des clics chaque semaine. Je vous les détaille volontiers.`,
    cta: () => `Voir l'analyse complète →`,
  },
  {
    subject: () => `Un regard extérieur sur votre présence Google`,
    hook: (n, s, v) => `Parfois, un œil extérieur voit ce qu'on ne voit plus quand on est dedans. J'ai regardé votre fiche comme le ferait un nouveau client de passage à ${v}. Voici ce que j'ai vu — le positif et ce qu'on peut améliorer.`,
    cta: () => `Voir mon retour →`,
  },
  {
    subject: () => `Deux choses que j'ai vues sur votre fiche`,
    hook: (n, s, v) => `La première est un point fort que vous sous-exploitez. La deuxième est un manque qui, selon moi, vous coûte de la visibilité sur "${s} ${v}". Je peux vous montrer l'une et l'autre en quelques minutes.`,
    cta: () => `Voir ces deux points →`,
  },
  {
    subject: (n) => `${n} — votre fiche mérite mieux`,
    hook: (n, s, v) => `J'ai l'habitude d'analyser des fiches Google de commerçants locaux. La vôtre a du fond — mais la forme laisse à désirer. Et sur Google Maps, la forme compte autant que le fond pour décrocher le clic.`,
    cta: () => `Voir comment l'améliorer →`,
  },

  // 5-9 : Question
  {
    subject: (n) => `${n} — savez-vous ce que voient vos clients ?`,
    hook: (n, s, v) => `La plupart des commerçants n'ont jamais cherché leur propre établissement comme le ferait un inconnu — en mode privé, depuis un autre appareil. Ce que vous verriez vous surprendrait probablement.`,
    cta: () => `Voir ce que voient vos clients →`,
  },
  {
    subject: (n) => `${n} — connaissez-vous votre score de visibilité Google ?`,
    hook: (n, s, v) => `Il existe des indicateurs précis pour mesurer à quel point une fiche Google est optimisée. J'ai évalué la vôtre. Le score global est moyen — ce qui veut dire qu'il y a une vraie marge de progression accessible rapidement.`,
    cta: () => `Voir votre score →`,
  },
  {
    subject: () => `Votre fiche Google vous représente-t-elle vraiment ?`,
    hook: (n, s, v) => `Il y a souvent un écart entre la qualité réelle d'un commerce et ce que sa fiche Google en montre. Cet écart, c'est des clients qui passent à côté de vous. J'ai regardé si c'est le cas pour ${n}.`,
    cta: () => `Voir le résultat →`,
  },
  {
    subject: (n) => `${n} — avez-vous comparé avec vos concurrents ?`,
    hook: (n, s, v) => `C'est un exercice que je recommande : regardez votre fiche côte à côte avec celles qui apparaissent avant vous sur "${s} ${v}". L'écart est souvent plus visible qu'on ne le pense. Et souvent moins difficile à combler.`,
    cta: () => `Voir la comparaison →`,
  },
  {
    subject: (n) => `${n} — est-ce que Google vous rend justice ?`,
    hook: (n, s, v) => `Votre réputation réelle et ce que Google montre de vous sont deux choses différentes. J'ai regardé la seconde. La vitrine numérique que vous présentez n'est pas encore à la hauteur de ce qu'elle pourrait être.`,
    cta: () => `Voir l'analyse →`,
  },

  // 10-14 : Empathie
  {
    subject: () => `Je sais que ce n'est pas votre priorité du moment`,
    hook: (n, s, v) => `Gérer un commerce, c'est déjà beaucoup. La fiche Google, c'est souvent ce qu'on remet à plus tard. Je comprends ça. C'est pourquoi je me contente de vous montrer ce que j'ai vu sur la vôtre — vous décidez ensuite si ça vaut votre attention.`,
    cta: () => `Voir ce que j'ai trouvé →`,
  },
  {
    subject: () => `Personne ne vous a appris à optimiser votre fiche Google`,
    hook: (n, s, v) => `Ce n'est pas enseigné. Ce n'est pas intuitif. Et pourtant, ça a un impact direct sur le nombre de clients qui vous trouvent. J'ai regardé votre fiche et je peux vous montrer, concrètement, ce qui manque.`,
    cta: () => `Voir ce qui manque →`,
  },
  {
    subject: () => `Ce n'est pas de votre faute si votre fiche n'est pas optimisée`,
    hook: (n, s, v) => `Google change ses critères régulièrement. Ce qui fonctionnait il y a 2 ans est parfois devenu contre-productif. Et personne ne vous prévient. J'ai regardé votre fiche à la lumière des critères actuels.`,
    cta: () => `Voir votre fiche à jour →`,
  },
  {
    subject: (n) => `${n} — je voulais juste vous montrer quelque chose`,
    hook: (n, s, v) => `Pas de discours, pas de promesse. Juste une observation concrète sur votre fiche Google, que j'ai faite en cherchant ${s} à ${v}. Vous verrez vous-même si ça vaut la peine d'en parler.`,
    cta: () => `Voir l'observation →`,
  },
  {
    subject: () => `La plupart des bons commerçants ont une mauvaise fiche Google`,
    hook: (n, s, v) => `Ce n'est pas une contradiction — c'est une réalité. Les meilleurs commerçants passent leur temps à faire leur métier, pas à gérer leur présence numérique. C'est compréhensible. Et c'est corrigeable.`,
    cta: () => `Voir comment corriger ça →`,
  },

  // 15-19 : Curiosité
  {
    subject: () => `Il y a un truc que Google ne vous dit pas`,
    hook: (n, s, v) => `Google vous montre votre fiche — mais pas comment elle est perçue par l'algorithme. Il y a un écart entre ce que vous voyez et ce que Google "lit" dans votre fiche. J'ai analysé les deux. L'écart est plus important qu'il n'y paraît.`,
    cta: () => `Voir cet écart →`,
  },
  {
    subject: (n) => `${n} — le vrai facteur qui détermine votre position`,
    hook: (n, s, v) => `Ce n'est pas la note. Ce n'est pas le nombre d'avis. C'est quelque chose que la plupart des commerçants n'ont jamais configuré correctement sur leur fiche Google. Et ça change tout pour le classement local.`,
    cta: () => `Voir ce facteur →`,
  },
  {
    subject: () => `Un paramètre que 9 commerçants sur 10 négligent`,
    hook: (n, s, v) => `Il est dans votre fiche Google. Il influence votre positionnement local. Et pourtant, la grande majorité des commerçants ne l'ont jamais optimisé — soit parce qu'ils ne savent pas qu'il existe, soit parce qu'ils pensent que ça ne compte pas.`,
    cta: () => `Voir ce paramètre →`,
  },
  {
    subject: (n) => `${n} — ce que Google voit et que vous ne voyez pas`,
    hook: (n, s, v) => `Il y a la fiche que vous voyez — et la fiche que Google analyse. Ces deux versions ne sont pas identiques. Ce que Google y lit détermine votre position sur "${s} ${v}". J'ai regardé la version que Google voit.`,
    cta: () => `Voir ce que Google voit →`,
  },
  {
    subject: (n) => `${n} — ce que j'ai découvert en 10 minutes sur votre fiche`,
    hook: (n, s, v) => `J'analyse des fiches Google de commerçants locaux régulièrement. En 10 minutes sur la vôtre, j'ai trouvé quelque chose d'intéressant — pas un problème majeur, mais un levier précis que vous n'avez pas encore actionné.`,
    cta: () => `Voir ce levier →`,
  },
]

const N_VARIANTS = VARIANTS.length // 100

function getVariant(variantId: number) {
  return VARIANTS[variantId % N_VARIANTS]
}

// ── Thompson Sampling ────────────────────────────────────────────────────────

function normalRandom(): number {
  let u = 0, v = 0
  while (u === 0) u = Math.random()
  while (v === 0) v = Math.random()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

function gammaRandom(shape: number): number {
  if (shape < 1) return gammaRandom(1 + shape) * Math.pow(Math.random(), 1 / shape)
  const d = shape - 1 / 3
  const c = 1 / Math.sqrt(9 * d)
  while (true) {
    let x: number, v: number
    do { x = normalRandom(); v = 1 + c * x } while (v <= 0)
    v = v ** 3
    const u = Math.random()
    if (u < 1 - 0.0331 * x ** 4) return d * v
    if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v
  }
}

function sampleBeta(alpha: number, beta: number): number {
  const g1 = gammaRandom(Math.max(alpha, 0.01))
  const g2 = gammaRandom(Math.max(beta, 0.01))
  return g1 / (g1 + g2)
}

async function pickVariant(stats: Map<number, { sends: number; clicks: number }>): Promise<number> {
  let best = 0
  let bestSample = -1
  for (let id = 0; id < N_VARIANTS; id++) {
    const s = stats.get(id) ?? { sends: 0, clicks: 0 }
    const alpha = s.clicks + 1
    const beta  = Math.max(s.sends - s.clicks, 0) + 1
    const sample = sampleBeta(alpha, beta)
    if (sample > bestSample) { bestSample = sample; best = id }
  }
  return best
}

// ── Chargement des stats ─────────────────────────────────────────────────────

async function loadStats(): Promise<Map<number, { sends: number; clicks: number }>> {
  const stats = new Map<number, { sends: number; clicks: number }>()

  // Envois par variante depuis leads
  const { data: sendData } = await supabase
    .from('leads')
    .select('subject_variant')
    .eq('sent', true)
    .not('subject_variant', 'is', null)

  for (const row of sendData ?? []) {
    const id = parseInt(row.subject_variant)
    if (isNaN(id) || id >= N_VARIANTS) continue
    const s = stats.get(id) ?? { sends: 0, clicks: 0 }
    stats.set(id, { ...s, sends: s.sends + 1 })
  }

  // Clics par variante depuis email_clicks
  const { data: clickData } = await supabase
    .from('email_clicks')
    .select('variant_id')

  for (const row of clickData ?? []) {
    const id = row.variant_id
    if (id === undefined || id >= N_VARIANTS) continue
    const s = stats.get(id) ?? { sends: 0, clicks: 0 }
    stats.set(id, { ...s, clicks: s.clicks + 1 })
  }

  return stats
}

// ── Template email ───────────────────────────────────────────────────────────

function buildEmail(nom: string, ville: string, secteur: string, leadId: number, variantId: number, hookText: string, ctaText: string): string {
  const villeLabel = ville && ville !== 'France' ? ville : 'votre ville'
  const dest = `${APP_URL}?nom=${encodeURIComponent(nom)}&ville=${encodeURIComponent(villeLabel)}&utm_source=outreach&utm_medium=email&utm_campaign=cold&vid=${variantId}`
  const trackUrl = `${APP_URL}/api/track?lid=${leadId}&vid=${variantId}&url=${encodeURIComponent(dest)}`

  return `<div style="font-family:Georgia,serif;max-width:500px;margin:0 auto;padding:36px 20px;color:#1a1a1a;font-size:15px;line-height:1.8;">
  <p style="margin:0 0 20px;">Bonjour,</p>

  <p style="margin:0 0 20px;color:#374151;">
    ${hookText}
  </p>

  <p style="margin:0 0 28px;">
    <a href="${trackUrl}" style="display:inline-block;background:#16a34a;color:#fff;font-family:Arial,sans-serif;font-size:14px;font-weight:600;padding:12px 22px;border-radius:6px;text-decoration:none;">${ctaText}</a>
  </p>

  <p style="margin:0 0 4px;font-size:14px;color:#374151;">Brian Mansart<br>
  <span style="color:#6b7280;font-size:13px;">LocalBoost — visibilité Google pour les commerces locaux</span></p>

  <hr style="border:none;border-top:1px solid #e5e7eb;margin:28px 0 16px;">
  <p style="color:#9ca3af;font-size:11px;margin:0;font-family:Arial,sans-serif;">
    Vous recevez cet email car ${nom} est référencé sur Google Maps.
    <a href="mailto:contact@thelocalboost.fr?subject=désinscription ${encodeURIComponent(nom)}" style="color:#9ca3af;">Se désinscrire</a>
  </p>
</div>`
}

// ── Handler ──────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  if (req.headers.get('x-admin-key') !== process.env.ADMIN_SECRET_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { limit = 50, secteur, testEmail } = await req.json()

  let query = supabase
    .from('leads')
    .select('id, nom, email, secteur, ville')
    .eq('sent', false)
    .not('email', 'is', null)
    .or('email_status.is.null,email_status.neq.invalid')
    .limit(limit)

  if (secteur) query = query.eq('secteur', secteur)

  const [{ data: leads, error }, stats] = await Promise.all([query, loadStats()])

  // Mode test : envoie un seul email de démo à l'adresse fournie
  if (testEmail) {
    const lead = leads?.[0] ?? { id: 0, nom: 'Boulangerie Exemple', ville: 'Paris', secteur: 'boulangerie' }
    const variantId = await pickVariant(stats)
    const variant = getVariant(variantId)
    const nom = lead.nom || 'votre établissement'
    const ville = lead.ville || ''
    const secteurLead = lead.secteur || 'commerce'
    const v = ville || 'votre ville'
    const html = buildEmail(nom, ville, secteurLead, lead.id, variantId, variant.hook(nom, secteurLead, v), variant.cta(nom, secteurLead, v))
    await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'api-key': process.env.BREVO_API_KEY! },
      body: JSON.stringify({
        sender: { name: 'Brian de LocalBoost', email: 'contact@thelocalboost.fr' },
        to: [{ email: testEmail }],
        subject: `[TEST] ${variant.subject(nom, secteurLead, v)}`,
        htmlContent: html,
      }),
    })
    return NextResponse.json({ sent: 0, test: true, preview: { nom, secteur: secteurLead, variantId } })
  }

  if (error || !leads?.length) {
    return NextResponse.json({ sent: 0, message: 'Aucun lead à envoyer' })
  }

  let sent = 0
  const errors: string[] = []
  const variantCounts: Record<number, number> = {}

  for (const lead of leads) {
    const nom    = lead.nom   || 'votre établissement'
    const ville  = lead.ville || ''
    const secteur = lead.secteur || 'commerce'

    const variantId = await pickVariant(stats)
    const variant = getVariant(variantId)
    const v = ville || 'votre ville'
    const subjectText = variant.subject(nom, secteur, v)
    const hookText    = variant.hook(nom, secteur, v)
    const ctaText     = variant.cta(nom, secteur, v)

    try {
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'api-key': process.env.BREVO_API_KEY! },
        body: JSON.stringify({
          sender:      { name: 'Brian de LocalBoost', email: 'contact@thelocalboost.fr' },
          to:          [{ email: lead.email, name: nom }],
          subject:     subjectText,
          htmlContent: buildEmail(nom, ville, secteur, lead.id, variantId, hookText, ctaText),
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        errors.push(`${lead.email}: ${err.message}`)
        continue
      }

      await supabase
        .from('leads')
        .update({ sent: true, sent_at: new Date().toISOString(), subject_variant: String(variantId) })
        .eq('id', lead.id)

      // Mettre à jour les stats en mémoire pour que les prochains envois du batch bénéficient du même Thompson Sampling
      const s = stats.get(variantId) ?? { sends: 0, clicks: 0 }
      stats.set(variantId, { ...s, sends: s.sends + 1 })

      variantCounts[variantId] = (variantCounts[variantId] ?? 0) + 1
      sent++
      await new Promise(r => setTimeout(r, 200))
    } catch (e: any) {
      errors.push(`${lead.email}: ${e.message}`)
    }
  }

  // Résumé des variantes utilisées
  const topVariants = Object.entries(variantCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, count]) => {
      const s = stats.get(Number(id))
      const ctr = s && s.sends > 0 ? ((s.clicks / s.sends) * 100).toFixed(1) : '0.0'
      return { variant: Number(id), sent: count, ctr: `${ctr}%` }
    })

  return NextResponse.json({ sent, top_variants: topVariants, errors: errors.length ? errors : undefined })
}
