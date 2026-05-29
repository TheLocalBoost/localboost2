import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const APP_URL = 'https://www.thelocalboost.fr'

// ── 100 variantes : 10 sujets × 10 accroches ────────────────────────────────

type Fn = (nom: string, secteur: string, ville: string) => string

const SUBJECTS: Fn[] = [
  (n)       => `${n} — votre fiche Google`,
  (n)       => `${n} sur Google Maps`,
  (n, s, v) => `Votre visibilité à ${v || 'votre ville'}`,
  ()        => `Une remarque sur votre fiche Google`,
  (n)       => `${n} : j'ai regardé votre position`,
  ()        => `Votre concurrent vous devance sur Google`,
  (n, s, v) => `${s} à ${v || 'votre ville'} — quelque chose à vous montrer`,
  (n)       => `Question rapide, ${n}`,
  ()        => `Votre fiche Google perd des clients`,
  (n)       => `${n} — audit Google gratuit`,
]

const HOOKS: Fn[] = [
  (n, s, v) => `J'ai regardé votre fiche Google et j'ai repéré plusieurs leviers simples pour améliorer votre visibilité locale — notamment sur les horaires et la régularité des publications.`,
  (n, s, v) => `En cherchant ${s} à ${v || 'votre ville'}, j'ai trouvé votre établissement. Voici ce que j'ai remarqué sur votre fiche.`,
  (n, s, v) => `Je travaille avec des commerçants locaux sur leur référencement Google. Votre fiche a attiré mon attention — il y a quelque chose à faire.`,
  (n, s, v) => `Votre fiche Google manque de quelques optimisations simples qui pourraient vous rapporter des clients supplémentaires chaque semaine.`,
  (n, s, v) => `En 2 minutes, j'ai analysé votre présence Google. Le résultat est clair : il y a un vrai potentiel inexploité sur votre fiche.`,
  (n, s, v) => `Les clients qui cherchent ${s} à ${v || 'votre ville'} voient plusieurs fiches avant la vôtre. Voici pourquoi — et comment y remédier rapidement.`,
  (n, s, v) => `Saviez-vous que 3 commerçants sur 4 perdent des clients à cause d'une fiche Google non optimisée ? Votre fiche présente exactement ces signaux.`,
  (n, s, v) => `J'ai comparé votre fiche Google avec celle de vos concurrents directs à ${v || 'votre ville'}. La différence est visible — et facile à corriger.`,
  (n, s, v) => `Votre fiche Google a du potentiel. Voici exactement ce qui vous manque pour apparaître plus souvent dans les recherches locales.`,
  (n, s, v) => `Je suis tombé sur ${n} en cherchant ${s} dans votre secteur. Votre fiche mérite d'être mieux positionnée — voici ce que j'ai trouvé.`,
]

// variant_id = subject_idx * 10 + hook_idx  → 0..99
const N_VARIANTS = SUBJECTS.length * HOOKS.length // 100

function getVariant(variantId: number) {
  const sIdx = Math.floor(variantId / HOOKS.length)
  const hIdx = variantId % HOOKS.length
  return { subject: SUBJECTS[sIdx], hook: HOOKS[hIdx] }
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

function buildEmail(nom: string, ville: string, secteur: string, leadId: number, variantId: number, hookText: string): string {
  const villeLabel = ville && ville !== 'France' ? ville : 'votre ville'
  const dest = `${APP_URL}?nom=${encodeURIComponent(nom)}&ville=${encodeURIComponent(villeLabel)}&utm_source=outreach&utm_medium=email&utm_campaign=cold&vid=${variantId}`
  const trackUrl = `${APP_URL}/api/track?lid=${leadId}&vid=${variantId}&url=${encodeURIComponent(dest)}`
  const ctaText = `Voir ce que voit un client quand il cherche ${secteur} à ${villeLabel} →`

  return `<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px 20px;color:#1a1a1a;font-size:15px;line-height:1.75;">
  <p style="margin:0 0 16px;">Bonjour,</p>

  <p style="margin:0 0 16px;">
    Je suis tombé sur votre établissement <strong>${nom}</strong> en cherchant ${secteur} à ${villeLabel} sur Google Maps.
  </p>

  <p style="margin:0 0 24px;padding:14px 18px;background:#f9fafb;border-left:3px solid #16a34a;color:#374151;">
    ${hookText}
  </p>

  <p style="margin:0 0 24px;">
    <a href="${trackUrl}" style="color:#16a34a;font-weight:600;">${ctaText}</a>
  </p>

  <p style="margin:0 0 4px;">Brian<br>
  <span style="color:#888;font-size:13px;">LocalBoost · contact@thelocalboost.fr</span></p>

  <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0 14px;">
  <p style="color:#bbb;font-size:12px;margin:0;">
    Vous recevez cet email car votre établissement est référencé publiquement sur Google.
    <a href="mailto:contact@thelocalboost.fr?subject=désinscription" style="color:#bbb;">Se désinscrire</a>
  </p>
</div>`
}

// ── Handler ──────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  if (req.headers.get('x-admin-key') !== process.env.ADMIN_SECRET_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { limit = 50 } = await req.json()

  const [{ data: leads, error }, stats] = await Promise.all([
    supabase
      .from('leads')
      .select('id, nom, email, secteur, ville')
      .eq('sent', false)
      .neq('email_status', 'invalid')
      .limit(limit),
    loadStats(),
  ])

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
    const { subject, hook } = getVariant(variantId)
    const subjectText = subject(nom, secteur, ville || 'votre ville')
    const hookText    = hook(nom, secteur, ville || 'votre ville')

    try {
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'api-key': process.env.BREVO_API_KEY! },
        body: JSON.stringify({
          sender:      { name: 'Brian de LocalBoost', email: 'contact@thelocalboost.fr' },
          to:          [{ email: lead.email, name: nom }],
          subject:     subjectText,
          htmlContent: buildEmail(nom, ville, secteur, lead.id, variantId, hookText),
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
