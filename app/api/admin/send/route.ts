import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const SUBJECT_VARIANTS = [
  (secteur: string, ville: string) => `Votre fiche Google — ${secteur} à ${ville}`,
  (_s: string, _v: string) => `Une remarque sur votre présence Google`,
  (secteur: string, ville: string) => `${secteur} à ${ville} : votre visibilité locale`,
  (_s: string, _v: string) => `Audit gratuit de votre fiche Google Business`,
]

function getVariantIndex(nom: string): number {
  let hash = 0
  for (let i = 0; i < nom.length; i++) {
    hash = (hash * 31 + nom.charCodeAt(i)) >>> 0
  }
  return hash % SUBJECT_VARIANTS.length
}

const HOOKS: Record<string, string> = {
  boulangerie: `La plupart des boulangeries perdent des ventes le week-end faute d'être bien positionnées sur Google Maps le matin.`,
  restaurant:  `73 % des gens consultent Google avant de choisir un restaurant. Une fiche incomplète redirige ces clients vers la concurrence.`,
  coiffeur:    `De nombreux salons de coiffure voient leurs concurrents directs apparaître avant eux sur Google Maps — même lorsqu'ils sont moins bien notés.`,
  pharmacie:   `Des horaires incorrects ou un numéro manquant sur Google peuvent décourager des patients en urgence de vous contacter.`,
  plombier:    `En cas d'urgence, les clients appellent le premier plombier visible sur Google. La vitesse de chargement de votre fiche compte autant que votre réputation.`,
  electricien: `Les interventions urgentes se décident en quelques secondes sur Google. Une fiche bien optimisée peut faire toute la différence.`,
  garage:      `8 automobilistes sur 10 recherchent un garage sur Google avant d'appeler. Une fiche incomplète, c'est autant d'appels manqués.`,
  medecin:     `Les patients comparent les praticiens en ligne avant de prendre rendez-vous. Votre fiche Google est souvent leur premier contact avec vous.`,
  dentiste:    `Un cabinet dentaire avec des avis récents et des photos à jour reçoit significativement plus de nouveaux patients en ligne.`,
  hotel:       `Sur Google, une différence d'une fraction de point dans les avis peut représenter des dizaines de réservations en moins chaque mois.`,
  fleuriste:   `Pour les occasions importantes — mariage, anniversaire, deuil — les clients cherchent un fleuriste en urgence sur Google. Votre disponibilité en ligne est déterminante.`,
  opticien:    `Une fiche Google complète et régulièrement mise à jour peut représenter une part significative des nouveaux clients d'un opticien.`,
}

function buildEmail(nom: string, ville: string, secteur: string): string {
  const hook = HOOKS[secteur] ?? `La plupart des commerces locaux laissent échapper des clients faute de visibilité sur Google.`
  const url = `https://localboost2.vercel.app?utm_source=outreach&utm_medium=email&utm_campaign=cold&secteur=${secteur}&ville=${encodeURIComponent(ville)}`
  const villeLabel = ville && ville !== 'France' ? ` à ${ville}` : ''

  return `<div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 20px; color: #1a1a1a; font-size: 15px; line-height: 1.75;">
  <p style="margin: 0 0 16px;">Bonjour,</p>

  <p style="margin: 0 0 16px;">
    Je regardais les fiches Google Maps pour les ${secteur}s${villeLabel} et je suis tombé sur votre établissement : <strong>${nom}</strong>.
  </p>

  <p style="margin: 0 0 16px; padding: 14px 18px; background: #f9fafb; border-left: 3px solid #16a34a;">
    ${hook}
  </p>

  <p style="margin: 0 0 16px;">
    J'ai développé <strong>LocalBoost</strong>, un outil qui analyse votre fiche Google en 30 secondes et identifie les points à améliorer : avis, photos, horaires, positionnement local. Gratuit, sans inscription.
  </p>

  <p style="margin: 0 0 24px;">
    Voir votre diagnostic : <a href="${url}" style="color: #16a34a;">${url}</a>
  </p>

  <p style="margin: 0 0 4px;">Brian<br>
  <span style="color: #888; font-size: 13px;">LocalBoost · contact@thelocalboost.fr</span></p>

  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0 14px;">
  <p style="color: #bbb; font-size: 12px; margin: 0;">
    Vous recevez cet email car votre établissement est référencé publiquement sur Google.
    <a href="mailto:contact@thelocalboost.fr?subject=désinscription" style="color: #bbb;">Se désinscrire</a>
  </p>
</div>`
}

export async function POST(req: NextRequest) {
  if (req.headers.get('x-admin-key') !== process.env.ADMIN_SECRET_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { limit = 50 } = await req.json()

  const { data: leads, error } = await supabase
    .from('leads')
    .select('id, nom, email, secteur, ville')
    .eq('sent', false)
    .limit(limit)

  if (error || !leads?.length) {
    return NextResponse.json({ sent: 0, message: 'Aucun lead à envoyer' })
  }

  let sent = 0
  const errors: string[] = []

  for (let i = 0; i < leads.length; i++) {
    const lead = leads[i]
    const nom   = lead.nom   || 'votre établissement'
    const ville = lead.ville || ''

    const variantIndex = getVariantIndex(nom)
    const subject = SUBJECT_VARIANTS[variantIndex](lead.secteur || 'commerce', ville || 'votre ville')

    try {
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': process.env.BREVO_API_KEY!,
        },
        body: JSON.stringify({
          sender:      { name: 'Brian de LocalBoost', email: 'contact@thelocalboost.fr' },
          to:          [{ email: lead.email, name: nom }],
          subject,
          htmlContent: buildEmail(nom, ville, lead.secteur || ''),
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        errors.push(`${lead.email}: ${err.message}`)
        continue
      }

      await supabase
        .from('leads')
        .update({ sent: true, sent_at: new Date().toISOString(), subject_variant: String(variantIndex) })
        .eq('id', lead.id)

      sent++
      await new Promise(r => setTimeout(r, 200))
    } catch (e: any) {
      errors.push(`${lead.email}: ${e.message}`)
    }
  }

  return NextResponse.json({ sent, errors: errors.length ? errors : undefined })
}
