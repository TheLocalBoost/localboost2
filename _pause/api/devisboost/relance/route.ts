import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { sendTransactional } from '@/lib/email'

const supabase = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  const admin = req.headers.get('x-admin-key')
  if (auth !== `Bearer ${process.env.CRON_SECRET}` && admin !== process.env.ADMIN_SECRET_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const h48 = new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString()
  const d7  = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const results = { relances_48h: 0, relances_7j: 0, expires: 0, errors: [] as string[] }

  // Devis envoyés non ouverts depuis +48h
  const { data: notOpened } = await supabase
    .from('devisboost_devis')
    .select('id, numero, titre, user_id, devisboost_clients(name, email)')
    .eq('statut', 'envoyé')
    .lt('sent_at', h48)
    .is('opened_at', null)
    .is('relance_sent_at', null)

  for (const d of notOpened ?? []) {
    const client = (d as any).devisboost_clients
    if (!client?.email) continue
    try {
      await sendRelance(client.email, client.name, d.numero, d.titre, '48h', d.user_id)
      await supabase.from('devisboost_devis').update({ relance_sent_at: now.toISOString() }).eq('id', d.id)
      results.relances_48h++
    } catch (e: any) { results.errors.push(e.message) }
  }

  // Devis envoyés sans réponse depuis +7j
  const { data: noAnswer } = await supabase
    .from('devisboost_devis')
    .select('id, numero, titre, user_id, devisboost_clients(name, email)')
    .eq('statut', 'envoyé')
    .lt('sent_at', d7)
    .is('accepted_at', null)

  for (const d of noAnswer ?? []) {
    const client = (d as any).devisboost_clients
    if (!client?.email) continue
    try {
      await sendRelance(client.email, client.name, d.numero, d.titre, '7j', d.user_id)
      results.relances_7j++
    } catch (e: any) { results.errors.push(e.message) }
  }

  // Devis expirés (validité 30j dépassée)
  const { data: devisToExpire } = await supabase
    .from('devisboost_devis')
    .select('id, created_at, validite_jours')
    .in('statut', ['brouillon', 'envoyé'])

  for (const d of devisToExpire ?? []) {
    const expiry = new Date(d.created_at).getTime() + (d.validite_jours ?? 30) * 86400000
    if (Date.now() > expiry) {
      await supabase.from('devisboost_devis').update({ statut: 'expiré' }).eq('id', d.id)
      results.expires++
    }
  }

  return NextResponse.json(results)
}

async function sendRelance(email: string, name: string, numero: string, titre: string, type: string, userId: string) {
  const { data: profile } = await supabase
    .from('devisboost_profiles')
    .select('company_name, phone, email')
    .eq('user_id', userId)
    .single()

  const msg48 = `Nous vous contactons car vous n'avez pas encore eu l'occasion de consulter le devis ${numero} que nous vous avons envoyé. N'hésitez pas à nous contacter pour toute question.`
  const msg7  = `Suite à notre devis ${numero} envoyé il y a 7 jours, nous souhaitions vous relancer. Ce devis reste valable. N'hésitez pas à nous contacter pour modifier les conditions ou obtenir des informations complémentaires.`

  await sendTransactional({
    to:      email,
    toName:  name,
    subject: type === '48h' ? `Avez-vous reçu notre devis ${numero} ?` : `Relance — Devis ${numero} — ${titre}`,
    html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px 20px;color:#1a1a1a;">
      <p>Bonjour ${name},</p>
      <p>${type === '48h' ? msg48 : msg7}</p>
      <p>Cordialement,<br><strong>${profile?.company_name ?? ''}</strong><br>${profile?.phone ?? ''}</p>
    </div>`,
  })
}
