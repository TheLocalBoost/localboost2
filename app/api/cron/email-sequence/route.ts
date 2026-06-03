import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendTransactional } from '@/lib/email'
import { generateSequenceEmail1, generateSequenceEmail2 } from '@/lib/email-templates'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const APP_URL = process.env.NEXT_PUBLIC_URL ?? 'https://www.thelocalboost.fr'

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const { data: leads, error } = await supabase
    .from('email_leads')
    .select('*')
    .lte('next_send_at', new Date().toISOString())
    .eq('converted', false)
    .in('sequence_step', [1, 2])

  if (error) {
    console.error('email-sequence fetch error:', error)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }

  if (!leads?.length) return NextResponse.json({ processed: 0 })

  // Récupère les places fondateur restantes pour le step 2
  const { data: spotsData } = await supabase
    .from('founder_config')
    .select('key, value')
    .in('key', ['spots_total', 'spots_taken'])
  const total  = spotsData?.find(r => r.key === 'spots_total')?.value  ?? 50
  const taken  = spotsData?.find(r => r.key === 'spots_taken')?.value  ?? 0
  const remaining = Math.max(0, total - taken)

  let processed = 0

  for (const lead of leads) {
    const planUrl = `${APP_URL}/pricing?city=${encodeURIComponent(lead.city ?? '')}&category=${encodeURIComponent(lead.category ?? '')}&score=${lead.score}`

    try {
      if (lead.sequence_step === 1) {
        await sendTransactional({
          to:      lead.email,
          subject: 'Comment ce plombier est passé de 31 à 67 en 3 semaines',
          html:    generateSequenceEmail1({
            establishmentName: lead.establishment_name,
            score:             lead.score,
            planUrl,
          }),
        })
        // Programmer le step 2 à J+5 (3 jours après le J+2 courant)
        await supabase.from('email_leads').update({
          sequence_step: 2,
          next_send_at:  new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        }).eq('id', lead.id)

      } else if (lead.sequence_step === 2) {
        await sendTransactional({
          to:      lead.email,
          subject: 'Votre fiche perd encore des clients aujourd\'hui',
          html:    generateSequenceEmail2({
            establishmentName: lead.establishment_name,
            score:             lead.score,
            spotsRemaining:    remaining,
            planUrl,
          }),
        })
        // Fin de séquence
        await supabase.from('email_leads').update({
          sequence_step: 3,
          next_send_at:  null,
        }).eq('id', lead.id)
      }

      processed++
      await new Promise(r => setTimeout(r, 300))
    } catch (err) {
      console.error('email-sequence send error:', lead.email, err)
    }
  }

  return NextResponse.json({ processed, total: leads.length })
}
