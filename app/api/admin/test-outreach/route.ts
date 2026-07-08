import { NextRequest, NextResponse } from 'next/server'

const APP_URL   = process.env.NEXT_PUBLIC_URL ?? 'https://www.thelocalboost.fr'
const BREVO_KEY = process.env.BREVO_API_KEY!

export async function POST(req: NextRequest) {
  const k = req.nextUrl.searchParams.get('k')
  if (k !== process.env.ADMIN_SECRET_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { email, nom = 'votre établissement', ville = 'Paris' } = await req.json()
  if (!email) return NextResponse.json({ error: 'email requis' }, { status: 400 })

  const dest     = `${APP_URL}?nom=${encodeURIComponent(nom)}&ville=${encodeURIComponent(ville)}&utm_source=outreach&utm_medium=email&utm_campaign=test`
  const html = `<div style="font-family:Georgia,serif;font-size:15px;line-height:1.8;color:#222;max-width:520px;margin:0 auto;padding:24px 0">
  <p style="margin:0 0 20px;">Bonjour,</p>
  <p style="margin:0 0 20px;color:#374151;">J'ai consulté la fiche Google de <strong>${nom}</strong> à <strong>${ville}</strong> et j'ai repéré quelques points qui freinent probablement votre visibilité locale.</p>
  <p style="margin:0 0 28px;color:#374151;">Si vous avez 5 minutes cette semaine, je peux vous envoyer une analyse rapide avec les ajustements précis à faire.</p>
  <p style="margin:0 0 32px;"><a href="${dest}" style="display:inline-block;background:#16a34a;color:#fff;font-family:Arial,sans-serif;font-size:14px;font-weight:600;padding:11px 22px;border-radius:6px;text-decoration:none;">Voir l'analyse →</a></p>
  <p style="margin:0;font-size:14px;color:#374151;">Brian<br><span style="color:#9ca3af;font-size:12px;">fichelocal.com</span></p>
  <hr style="border:none;border-top:1px solid #f3f4f6;margin:32px 0 16px;">
  <p style="color:#d1d5db;font-size:11px;margin:0;">Vous recevez cet email car votre établissement est référencé sur Google Maps. · <a href="mailto:contact@fichelocal.com?subject=désinscription" style="color:#d1d5db;">Se désinscrire</a></p>
</div>`

  const textContent = `Bonjour,

J'ai consulté la fiche Google de ${nom} à ${ville} et j'ai repéré quelques points qui freinent probablement votre visibilité locale.

Si vous avez 5 minutes cette semaine, je peux vous envoyer une analyse rapide avec les ajustements précis à faire.

Voir l'analyse : ${dest}

Brian
fichelocal.com

---
Vous recevez cet email car votre établissement est référencé sur Google Maps.
Se désinscrire : mailto:contact@fichelocal.com?subject=désinscription`

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', 'api-key': BREVO_KEY },
    body: JSON.stringify({
      sender:      { name: 'Brian', email: 'contact@fichelocal.com' },
      to:          [{ email, name: nom }],
      replyTo:     { email: 'contact@fichelocal.com', name: 'Brian' },
      subject:     `${nom} — quelques pistes sur votre fiche Google`,
      htmlContent: html,
      textContent,
    }),
  })

  const data = await res.json() as { messageId?: string; message?: string }
  if (!res.ok) return NextResponse.json({ error: data.message }, { status: 500 })

  return NextResponse.json({ ok: true, messageId: data.messageId })
}
