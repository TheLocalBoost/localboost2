import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendTransactional } from '@/lib/email'
import { generateWeeklyReport, weeklyReportSubject } from '@/lib/email-templates'
import crypto from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const APP_URL = process.env.NEXT_PUBLIC_URL ?? 'https://www.thelocalboost.fr'
const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY!

function extractCity(address: string): string {
  const parts = address.split(',').map(s => s.trim())
  const cityPart = parts.find(p => /^\d{5}\s+\w/.test(p))
  if (cityPart) return cityPart.replace(/^\d{5}\s+/, '').trim()
  return parts[parts.length - 2] ?? parts[0] ?? ''
}

async function getAuditScore(placeId: string): Promise<{ score: number; details: Record<string, boolean> }> {
  const fields = 'name,formatted_phone_number,opening_hours,website,rating,user_ratings_total,photos,editorial_summary'
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&language=fr&key=${GOOGLE_API_KEY}`
  const data = await fetch(url).then(r => r.json())
  const p = data.result ?? {}
  const details: Record<string, boolean> = {
    telephone:   !!p.formatted_phone_number,
    horaires:    !!(p.opening_hours?.periods?.length),
    site:        !!p.website,
    description: !!p.editorial_summary?.overview,
    photos:      (p.photos?.length ?? 0) >= 5,
    avis20:      (p.user_ratings_total ?? 0) >= 20,
    note4:       (p.rating ?? 0) >= 4.0,
  }
  const score = Math.round((Object.values(details).filter(Boolean).length / Object.keys(details).length) * 100)
  return { score, details }
}

function topActionFromScore(score: number, dashUrl: string): { action: string; url: string } {
  if (score < 40) return { action: 'Rédigez votre description Google cette semaine', url: `${dashUrl.replace('/dashboard', '/audit')}` }
  if (score <= 60) return { action: 'Répondez à vos derniers avis ce soir', url: `${dashUrl.replace('/dashboard', '/avis')}` }
  return { action: 'Publiez un post Google cette semaine', url: dashUrl }
}

function generateUnsubToken(userId: string): string {
  const secret = process.env.CRON_SECRET ?? 'secret'
  return crypto.createHmac('sha256', secret).update(userId).digest('hex').slice(0, 32)
}

export async function GET(req: NextRequest) {
  const auth     = req.headers.get('authorization')
  const adminKey = req.headers.get('x-admin-key')
  if (auth !== `Bearer ${process.env.CRON_SECRET}` && adminKey !== process.env.ADMIN_SECRET_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Abonnés actifs sans flag no_weekly_report
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, no_weekly_report')
    .eq('subscription_status', 'active')

  const activeIds = (profiles ?? [])
    .filter(p => !p.no_weekly_report)
    .map(p => p.id)

  if (!activeIds.length) return NextResponse.json({ sent: 0 })

  const { data: lbProfiles } = await supabase
    .from('localboost_profiles')
    .select('user_id, business_name, business_address, google_place_id')
    .in('user_id', activeIds)
    .not('google_place_id', 'is', null)

  if (!lbProfiles?.length) return NextResponse.json({ sent: 0, skipped: activeIds.length })

  const { data: authData } = await supabase.auth.admin.listUsers({ perPage: 1000 })
  const emailById: Record<string, string> = {}
  ;(authData?.users ?? []).forEach((u: any) => { emailById[u.id] = u.email ?? '' })

  const results = { sent: 0, skipped: 0, errors: [] as string[] }

  for (const lb of lbProfiles) {
    const email = emailById[lb.user_id]
    if (!email) { results.skipped++; continue }

    try {
      const city = extractCity(lb.business_address ?? '')
      const { score } = await getAuditScore(lb.google_place_id)

      // Récupère le score de la semaine précédente depuis scores_history
      const { data: prevRow } = await supabase
        .from('scores_history')
        .select('score')
        .eq('user_id', lb.user_id)
        .order('created_at', { ascending: false })
        .range(1, 1)
        .single()
      const previousScore = prevRow?.score ?? score

      // Enregistre le score de cette semaine
      await supabase.from('scores_history').insert({ user_id: lb.user_id, score })

      const dashUrl    = `${APP_URL}/localboost/dashboard`
      const { action, url: actionUrl } = topActionFromScore(score, dashUrl)
      const clientsLost = Math.round((100 - score) / 10)
      const unsubToken  = generateUnsubToken(lb.user_id)
      const unsubUrl    = `${APP_URL}/api/unsubscribe-reports?token=${unsubToken}&uid=${lb.user_id}`

      const html = generateWeeklyReport({
        establishmentName: lb.business_name,
        city,
        currentScore:  score,
        previousScore,
        clientsLost,
        topAction:    action,
        topActionUrl: actionUrl,
        dashboardUrl: dashUrl,
        unsubscribeUrl: unsubUrl,
      })

      await sendTransactional({
        to:      email,
        toName:  lb.business_name,
        subject: weeklyReportSubject(score, previousScore),
        html,
      })

      results.sent++
      await new Promise(r => setTimeout(r, 500))
    } catch (e: any) {
      results.errors.push(`${lb.business_name}: ${e.message}`)
    }
  }

  return NextResponse.json(results)
}
