import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { sendTransactional } from '@/lib/email'

const APP_URL = 'https://thelocalboost.fr'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { devis_id } = await req.json()

  const [{ data: devis }, { data: profile }] = await Promise.all([
    supabase
      .from('devisboost_devis')
      .select('*, devisboost_clients(id, name, email, phone)')
      .eq('id', devis_id)
      .eq('user_id', user.id)
      .single(),
    supabase
      .from('devisboost_profiles')
      .select('company_name, email, phone')
      .eq('user_id', user.id)
      .single(),
  ])

  if (!devis) return NextResponse.json({ error: 'Devis introuvable' }, { status: 404 })

  const client = devis.devisboost_clients as any
  if (!client?.email) return NextResponse.json({ error: 'Email client manquant' }, { status: 400 })

  // Générer le PDF
  const pdfRes = await fetch(`${APP_URL}/api/devisboost/pdf`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: req.headers.get('cookie') ?? '' },
    body: JSON.stringify({ devis_id }),
  })
  const pdfBuffer = await pdfRes.arrayBuffer()
  const pdfBase64 = Buffer.from(pdfBuffer).toString('base64')

  const htmlEmail = `
<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 20px;color:#1a1a1a;">
  <h2 style="font-size:18px;font-weight:700;margin:0 0 8px;">Votre devis ${devis.numero}</h2>
  <p style="color:#555;font-size:15px;margin:0 0 20px;">${devis.titre}</p>

  <div style="background:#f9fafb;border-radius:10px;padding:18px;margin-bottom:24px;">
    <table style="width:100%;font-size:14px;">
      <tr><td style="color:#888;padding:4px 0;">Total HT</td><td style="text-align:right;font-weight:600;">${devis.total_ht.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</td></tr>
      <tr><td style="color:#888;padding:4px 0;">TVA (${devis.tva_taux}%)</td><td style="text-align:right;font-weight:600;">${devis.tva_montant.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</td></tr>
      <tr style="border-top:2px solid #16a34a;"><td style="color:#16a34a;font-weight:700;padding:8px 0 4px;">Total TTC</td><td style="text-align:right;font-weight:800;color:#16a34a;font-size:16px;">${devis.total_ttc.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</td></tr>
    </table>
  </div>

  <p style="color:#555;font-size:14px;margin:0 0 8px;">Vous trouverez le devis détaillé en pièce jointe.</p>
  <p style="color:#555;font-size:14px;margin:0 0 24px;">Ce devis est valable 30 jours.</p>

  <p style="color:#555;font-size:14px;margin:0;">Cordialement,<br><strong>${profile?.company_name ?? 'L\'entreprise'}</strong><br>${profile?.phone ?? ''} · ${profile?.email ?? ''}</p>

  <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0 16px;">
  <p style="color:#bbb;font-size:12px;margin:0;">Ce devis a été généré avec DevisBoost.</p>
</div>`

  await sendTransactional({
    to:      client.email,
    toName:  client.name,
    subject: `Devis ${devis.numero} — ${devis.titre}`,
    html:    htmlEmail,
    attachments: [{ filename: `devis-${devis.numero}.pdf`, content: Buffer.from(pdfBuffer) }],
  })

  await supabase
    .from('devisboost_devis')
    .update({ statut: 'envoyé', sent_at: new Date().toISOString() })
    .eq('id', devis_id)

  return NextResponse.json({ success: true })
}
