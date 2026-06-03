import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase-server'
import { sendTransactional } from '@/lib/email'

const ADMIN_EMAIL = 'mansartbrian68@gmail.com'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  // Vérifie que l'utilisateur connecté est l'admin
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const { messageId, replyText, toEmail, toName } = await req.json()
  if (!messageId || !replyText?.trim() || !toEmail) {
    return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
  }

  // Envoie la réponse via Resend
  await sendTransactional({
    to:      toEmail,
    toName:  toName,
    subject: 'Re: votre message à LocalBoost',
    html: `
<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px 20px;color:#1a1a1a;">
  <p style="font-size:15px;line-height:1.7;white-space:pre-wrap;">${replyText.replace(/\n/g, '<br>')}</p>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0 16px;">
  <p style="color:#9ca3af;font-size:12px;margin:0;">Brian — LocalBoost · contact@thelocalboost.fr</p>
</div>`,
  })

  // Marque le message comme répondu
  await supabaseAdmin.from('contact_messages').update({
    replied:    true,
    reply_text: replyText.trim(),
  }).eq('id', messageId)

  return NextResponse.json({ ok: true })
}
