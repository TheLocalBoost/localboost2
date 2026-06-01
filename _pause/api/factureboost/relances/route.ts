import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { sendTransactional } from '@/lib/email'
import Anthropic from '@anthropic-ai/sdk'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://thelocalboost.fr'

// Cron job : appelé 1x/jour par Vercel
// Configurer dans vercel.json : { "crons": [{ "path": "/api/factureboost/relances", "schedule": "0 8 * * *" }] }

export async function GET(req: NextRequest) {
  // Sécurité : vérifier le header Vercel Cron
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const supabase = await createClient()
  const now      = new Date()

  // Récupérer toutes les factures en retard ou envoyées non payées
  const { data: factures } = await supabase
    .from('factureboost_factures')
    .select('*')
    .in('statut', ['emise', 'envoyee', 'vue', 'retard'])
    .eq('type', 'facture')
    .not('client_email', 'is', null)

  if (!factures?.length) return NextResponse.json({ processed: 0 })

  const anthropic = new Anthropic()
  let processed   = 0

  for (const f of factures) {
    const dateEmission = new Date(f.date_emission)
    const dateEcheance = new Date(f.date_echeance)
    const joursDepuisEmission  = Math.floor((now.getTime() - dateEmission.getTime()) / 86400000)
    const joursDepuisEcheance  = Math.floor((now.getTime() - dateEcheance.getTime()) / 86400000)

    // Marquer en retard si dépassée
    if (joursDepuisEcheance > 0 && f.statut !== 'retard') {
      await supabase
        .from('factureboost_factures')
        .update({ statut: 'retard' })
        .eq('id', f.id)
    }

    let typeRelance: 'douce' | 'ferme' | 'finale' | null = null

    // J+30 après émission — 1ère relance (si pas encore faite)
    if (joursDepuisEmission >= 30 && !f.relance_1_at) {
      typeRelance = 'douce'
    }
    // J+45 — 2ème relance
    else if (joursDepuisEmission >= 45 && f.relance_1_at && !f.relance_2_at) {
      typeRelance = 'ferme'
    }
    // J+60 — 3ème relance (mise en demeure)
    else if (joursDepuisEmission >= 60 && f.relance_2_at && !f.relance_3_at) {
      typeRelance = 'finale'
    }

    if (!typeRelance) continue

    try {
      // Générer la relance avec Claude
      const response = await anthropic.messages.create({
        model:      'claude-sonnet-4-6',
        max_tokens: 512,
        messages: [{
          role:    'user',
          content: `Tu es expert en recouvrement amiable en France.
Génère une relance ${typeRelance} professionnelle pour la facture ${f.numero} d'un montant de ${f.total_ttc.toFixed(2)}€ TTC émise le ${new Date(f.date_emission).toLocaleDateString('fr-FR')} pour ${f.client_nom}.
${typeRelance === 'finale' ? 'Mentionne la mise en demeure et les voies de recours possibles.' : ''}
Ton rate légal si applicable. Maximum 5 phrases.
Réponse uniquement en JSON valide : { "sujet": "...", "corps": "..." }`,
        }],
      })

      const rawText = response.content[0].type === 'text' ? response.content[0].text : ''
      const jsonMatch = rawText.match(/\{[\s\S]*\}/)
      if (!jsonMatch) continue

      const { sujet, corps } = JSON.parse(jsonMatch[0])

      const htmlEmail = `
<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 20px;color:#1a1a1a;">
  <div style="border-left:4px solid #ea580c;padding-left:16px;margin-bottom:20px;">
    <h2 style="font-size:17px;font-weight:700;margin:0 0 4px;">Rappel : Facture ${f.numero}</h2>
    <p style="color:#555;font-size:14px;margin:0;">${f.titre}</p>
  </div>

  <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:14px;margin-bottom:20px;">
    <p style="margin:0;font-size:14px;font-weight:600;color:#ea580c;">
      Montant dû : ${f.total_ttc.toFixed(2)} € TTC
    </p>
    <p style="margin:4px 0 0;font-size:13px;color:#666;">
      Échéance : ${new Date(f.date_echeance).toLocaleDateString('fr-FR')}
    </p>
  </div>

  <p style="font-size:14px;color:#374151;line-height:1.6;white-space:pre-line;">${corps}</p>

  ${f.stripe_payment_link ? `
  <div style="text-align:center;margin:24px 0;">
    <a href="${f.stripe_payment_link}"
       style="display:inline-block;background:#ea580c;color:white;font-weight:700;padding:12px 28px;border-radius:8px;text-decoration:none;">
      Payer en ligne →
    </a>
  </div>
  ` : ''}

  ${f.rib?.iban ? `
  <div style="background:#f9fafb;border-radius:6px;padding:12px;font-size:13px;color:#555;">
    <strong>Virement :</strong> IBAN ${f.rib.iban}${f.rib.bic ? ' · BIC ' + f.rib.bic : ''}
  </div>
  ` : ''}
</div>`

      await sendTransactional({
        to:      f.client_email,
        toName:  f.client_nom,
        subject: sujet,
        html:    htmlEmail,
      })

      // Mettre à jour la facture
      const updateData: any = {}
      if (typeRelance === 'douce')  updateData.relance_1_at = now.toISOString()
      if (typeRelance === 'ferme')  updateData.relance_2_at = now.toISOString()
      if (typeRelance === 'finale') updateData.relance_3_at = now.toISOString()

      await supabase
        .from('factureboost_factures')
        .update(updateData)
        .eq('id', f.id)

      await supabase.from('factureboost_logs').insert({
        facture_id: f.id,
        user_id:    f.user_id,
        action:     `relance_${typeRelance}`,
        details:    { sujet },
      })

      processed++
    } catch (err) {
      console.error(`Erreur relance facture ${f.id}:`, err)
    }
  }

  return NextResponse.json({ processed, total: factures.length })
}
