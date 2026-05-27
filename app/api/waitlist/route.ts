import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { email, commerce_name, city } = await req.json()

    // Sauvegarde en base
    await supabaseAdmin.from('waitlist').insert({
      email,
      commerce_name,
      city,
      created_at: new Date().toISOString(),
    })

    // Email de confirmation via Brevo
    await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': process.env.BREVO_API_KEY!,
      },
      body: JSON.stringify({
        sender: {
          name: 'LocalBoost',
          email: process.env.BREVO_SENDER_EMAIL,
        },
        to: [{ email }],
        subject: '🚀 Vous êtes sur la liste — LocalBoost',
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="text-align: center; margin-bottom: 32px;">
              <img src="https://localboost2.vercel.app/logo.png.png" alt="LocalBoost" style="height: 60px; width: auto;" />
            </div>
            
            <h2 style="font-size: 20px; color: #111; margin-bottom: 16px;">
              Vous êtes bien inscrit !
            </h2>
            
            <p style="color: #555; line-height: 1.6; margin-bottom: 16px;">
              Bonjour${commerce_name ? ` et bienvenue à <strong>${commerce_name}</strong>` : ''} 👋
            </p>
            
            <p style="color: #555; line-height: 1.6; margin-bottom: 16px;">
              Vous faites partie des premiers commerçants à rejoindre LocalBoost. 
              Dès le lancement, vous recevrez votre <strong>plan d'amélioration Google Business personnalisé</strong>.
            </p>

            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 20px; margin: 24px 0;">
              <p style="color: #166534; font-weight: 600; margin: 0 0 8px;">Ce que vous allez recevoir au lancement :</p>
              <ul style="color: #15803d; margin: 0; padding-left: 20px; line-height: 1.8;">
                <li>Votre score de visibilité Google détaillé</li>
                <li>Un post Google Business prêt à publier</li>
                <li>7 jours d'essai gratuit complet</li>
              </ul>
            </div>

            <p style="color: #555; line-height: 1.6; margin-bottom: 24px;">
              Lancement prévu dans <strong>moins de 15 jours</strong>. On vous contacte en priorité.
            </p>

            <p style="color: #555; line-height: 1.6;">
              À très bientôt,<br>
              <strong>L'équipe LocalBoost</strong>
            </p>

            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">
            <p style="color: #9ca3af; font-size: 12px; text-align: center;">
              LocalBoost — Votre fiche Google Business gérée par l'IA<br>
              Vous recevez cet email car vous vous êtes inscrit sur localboost2.vercel.app
            </p>
          </div>
        `,
      }),
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Waitlist error:', err)
    return NextResponse.json({ success: true })
  }
}