import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { sendTransactional } from '@/lib/email'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://thelocalboost.fr'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { facture_id } = await req.json()

  const [{ data: facture }, { data: dbProfile }] = await Promise.all([
    supabase
      .from('factureboost_factures')
      .select('*')
      .eq('id', facture_id)
      .eq('user_id', user.id)
      .single(),
    supabase
      .from('devisboost_profiles')
      .select('company_name, email, phone')
      .eq('user_id', user.id)
      .single(),
  ])

  if (!facture) return NextResponse.json({ error: 'Facture introuvable' }, { status: 404 })
  if (!facture.client_email) return NextResponse.json({ error: 'Email client manquant' }, { status: 400 })

  // Générer le PDF via la route interne
  const pdfRes = await fetch(`${APP_URL}/api/factureboost/generate-pdf`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', Cookie: req.headers.get('cookie') ?? '' },
    body:    JSON.stringify({ facture_id }),
  })
  const pdfBuffer  = await pdfRes.arrayBuffer()
  const isAvoir    = facture.type === 'avoir'

  const fmt = (n: number) =>
    n.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) + ' €'

  const colorPrimary = '#ea580c'

  const htmlEmail = `
<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 20px;color:#1a1a1a;">
  <div style="border-left:4px solid ${colorPrimary};padding-left:16px;margin-bottom:24px;">
    <h2 style="font-size:18px;font-weight:700;margin:0 0 4px;">${isAvoir ? 'Avoir' : 'Facture'} ${facture.numero}</h2>
    <p style="color:#555;font-size:14px;margin:0;">${facture.titre}</p>
  </div>

  <div style="background:#f9fafb;border-radius:10px;padding:18px;margin-bottom:24px;">
    <table style="width:100%;font-size:14px;">
      <tr><td style="color:#888;padding:4px 0;">Total HT</td>
          <td style="text-align:right;font-weight:600;">${fmt(facture.total_ht)}</td></tr>
      ${(facture.tva_details ?? []).map((td: any) =>
        `<tr><td style="color:#888;padding:4px 0;">TVA ${td.taux}%</td>
             <td style="text-align:right;font-weight:600;">${fmt(td.montant)}</td></tr>`
      ).join('')}
      <tr style="border-top:2px solid ${colorPrimary};">
        <td style="color:${colorPrimary};font-weight:700;padding:8px 0 4px;">Total TTC</td>
        <td style="text-align:right;font-weight:800;color:${colorPrimary};font-size:16px;">${fmt(facture.total_ttc)}</td>
      </tr>
    </table>
  </div>

  ${!isAvoir ? `
  <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:14px;margin-bottom:20px;font-size:14px;">
    <strong style="color:${colorPrimary};">Échéance de paiement :</strong>
    ${new Date(facture.date_echeance).toLocaleDateString('fr-FR')}
    ${facture.conditions_paiement ? `<br><span style="color:#666;">${facture.conditions_paiement}</span>` : ''}
  </div>
  ` : ''}

  ${facture.rib?.iban ? `
  <div style="background:#f9fafb;border-radius:8px;padding:14px;margin-bottom:20px;font-size:13px;color:#374151;">
    <strong>Virement bancaire :</strong><br>
    IBAN : ${facture.rib.iban}${facture.rib.bic ? ' · BIC : ' + facture.rib.bic : ''}
    ${facture.rib.banque ? '<br>Banque : ' + facture.rib.banque : ''}
  </div>
  ` : ''}

  ${facture.stripe_payment_link ? `
  <div style="text-align:center;margin-bottom:24px;">
    <a href="${facture.stripe_payment_link}"
       style="display:inline-block;background:${colorPrimary};color:white;font-weight:700;padding:14px 32px;border-radius:10px;text-decoration:none;font-size:15px;">
      💳 Payer en ligne
    </a>
  </div>
  ` : ''}

  <p style="color:#555;font-size:14px;margin:0 0 8px;">
    ${isAvoir ? 'Veuillez trouver votre avoir en pièce jointe.' : 'Veuillez trouver votre facture en pièce jointe.'}
  </p>
  <p style="color:#555;font-size:14px;margin:0 0 24px;">
    ${facture.penalites_retard ?? ''}
  </p>

  <p style="color:#555;font-size:14px;margin:0;">
    Cordialement,<br>
    <strong>${dbProfile?.company_name ?? 'L\'entreprise'}</strong><br>
    ${[dbProfile?.phone, dbProfile?.email].filter(Boolean).join(' · ')}
  </p>

  <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0 16px;">
  <p style="color:#bbb;font-size:12px;margin:0;">
    Cette facture a été générée avec FactureBoost — Format Factur-X.
    <img src="${APP_URL}/api/factureboost/track?id=${facture_id}" width="1" height="1" style="display:none;">
  </p>
</div>`

  const nomFichier = `${isAvoir ? 'avoir' : 'facture'}-${facture.numero}.pdf`

  await sendTransactional({
    to:      facture.client_email,
    toName:  facture.client_nom,
    subject: `${isAvoir ? 'Avoir' : 'Facture'} ${facture.numero} — ${facture.titre}`,
    html:    htmlEmail,
    attachments: [{ filename: nomFichier, content: Buffer.from(pdfBuffer) }],
  })

  // Marquer comme envoyée
  const newStatut = facture.statut === 'brouillon' || facture.statut === 'emise' ? 'envoyee' : facture.statut
  await supabase
    .from('factureboost_factures')
    .update({ statut: newStatut, sent_at: new Date().toISOString() })
    .eq('id', facture_id)

  // Log
  await supabase.from('factureboost_logs').insert({
    facture_id,
    user_id: user.id,
    action:  'sent',
    details: { to: facture.client_email },
  })

  return NextResponse.json({ success: true })
}
