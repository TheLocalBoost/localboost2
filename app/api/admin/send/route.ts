import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const SUBJECT_VARIANTS = [
  (nom: string, _s: string, _v: string) => `${nom} — votre fiche Google`,
  (nom: string, _s: string, _v: string) => `${nom} sur Google Maps`,
  (_n: string, _s: string, _v: string) => `Votre visibilité locale`,
  (_n: string, _s: string, _v: string) => `Une remarque sur votre fiche Google`,
]

function getVariantIndex(nom: string): number {
  let hash = 0
  for (let i = 0; i < nom.length; i++) {
    hash = (hash * 31 + nom.charCodeAt(i)) >>> 0
  }
  return hash % SUBJECT_VARIANTS.length
}

const HOOKS: Record<string, string> = {
  boulangerie: `J'ai regardé votre fiche Google et j'ai remarqué plusieurs leviers simples pour améliorer sa visibilité locale — notamment sur les horaires du week-end et la régularité des publications.`,
  restaurant:  `J'ai regardé votre fiche Google et j'ai remarqué quelques points qui mériteraient d'être optimisés pour mieux apparaître quand les gens cherchent un restaurant dans votre secteur.`,
  coiffeur:    `J'ai regardé votre fiche Google et j'ai noté des leviers concrets pour améliorer votre positionnement local — en particulier sur la fréquence des publications et la gestion des avis.`,
  pharmacie:   `J'ai regardé votre fiche Google et j'ai identifié quelques points d'amélioration simples, notamment sur les horaires et les informations de contact affichées.`,
  plombier:    `J'ai regardé votre fiche Google et j'ai repéré plusieurs éléments qui pourraient être optimisés pour apparaître plus facilement dans les recherches locales urgentes.`,
  electricien: `J'ai regardé votre fiche Google et j'ai remarqué des marges d'amélioration concrètes sur votre visibilité dans les recherches locales.`,
  garage:      `J'ai regardé votre fiche Google et j'ai identifié quelques leviers simples pour améliorer votre présence quand les automobilistes recherchent un garage dans votre zone.`,
  medecin:     `J'ai regardé votre fiche Google et j'ai noté des points d'amélioration sur votre visibilité auprès des patients qui cherchent un praticien en ligne.`,
  dentiste:    `J'ai regardé votre fiche Google et j'ai remarqué des leviers concrets pour améliorer votre présence auprès des patients qui comparent les cabinets en ligne.`,
  hotel:       `J'ai regardé votre fiche Google et j'ai identifié quelques optimisations simples qui pourraient améliorer votre positionnement dans les recherches locales.`,
  fleuriste:   `J'ai regardé votre fiche Google et j'ai repéré plusieurs améliorations possibles pour mieux apparaître lors des recherches de dernière minute.`,
  opticien:    `J'ai regardé votre fiche Google et j'ai noté des pistes concrètes pour renforcer votre visibilité locale auprès de nouveaux clients.`,
}

function buildEmail(nom: string, ville: string, secteur: string): string {
  const hook = HOOKS[secteur] ?? `J'ai regardé votre fiche Google et j'ai remarqué plusieurs leviers simples pour améliorer sa visibilité locale.`
  const villeLabel = ville && ville !== 'France' ? ville : 'votre ville'
  const ctaUrl = `https://thelocalboost.fr?nom=${encodeURIComponent(nom)}&ville=${encodeURIComponent(villeLabel)}&utm_source=outreach&utm_medium=email&utm_campaign=cold`
  const ctaText = `Voir ce que voit un client quand il cherche ${secteur} à ${villeLabel} →`

  return `<div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 20px; color: #1a1a1a; font-size: 15px; line-height: 1.75;">
  <p style="margin: 0 0 16px;">Bonjour,</p>

  <p style="margin: 0 0 16px;">
    Je suis tombé sur votre établissement <strong>${nom}</strong> en cherchant ${secteur} à ${villeLabel} sur Google Maps.
  </p>

  <p style="margin: 0 0 24px; padding: 14px 18px; background: #f9fafb; border-left: 3px solid #16a34a; color: #374151;">
    ${hook}
  </p>

  <p style="margin: 0 0 24px;">
    <a href="${ctaUrl}" style="color: #16a34a; font-weight: 600;">${ctaText}</a>
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
    .neq('email_status', 'invalid')
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
    const subject = SUBJECT_VARIANTS[variantIndex](nom, lead.secteur || 'commerce', ville || 'votre ville')

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
