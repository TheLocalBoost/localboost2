// Google Business Profile API client
// Docs : https://developers.google.com/my-business/reference/rest

const TOKEN_URL   = 'https://oauth2.googleapis.com/token'
const REVOKE_URL  = 'https://oauth2.googleapis.com/revoke'
const ACCOUNTS_URL = 'https://mybusinessaccountmanagement.googleapis.com/v1/accounts'
const LOCATIONS_BASE = 'https://mybusinessbusinessinformation.googleapis.com/v1'
const GBP_V4      = 'https://mybusiness.googleapis.com/v4'
const PERFORMANCE_BASE = 'https://businessprofileperformance.googleapis.com/v1'

export const GBP_SCOPES = [
  'https://www.googleapis.com/auth/business.manage',
].join(' ')

// ─── OAuth ────────────────────────────────────────────────────────────────────

export function getOAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id:     process.env.GOOGLE_BUSINESS_CLIENT_ID!,
    redirect_uri:  process.env.GBP_REDIRECT_URI ?? process.env.GOOGLE_BUSINESS_REDIRECT_URI!,
    response_type: 'code',
    scope:         GBP_SCOPES,
    access_type:   'offline',
    prompt:        'consent',  // force refresh_token à chaque fois
    state,
  })
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`
}

export async function exchangeCode(code: string): Promise<{
  access_token: string
  refresh_token: string
  expires_in: number
}> {
  const r = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id:     process.env.GOOGLE_BUSINESS_CLIENT_ID!,
      client_secret: process.env.GOOGLE_BUSINESS_CLIENT_SECRET!,
      redirect_uri:  process.env.GBP_REDIRECT_URI ?? process.env.GOOGLE_BUSINESS_REDIRECT_URI!,
      grant_type:    'authorization_code',
    }),
  })
  const data = await r.json()
  if (data.error) throw new Error(data.error_description ?? data.error)
  return data
}

export async function refreshAccessToken(refreshToken: string): Promise<{
  access_token: string
  expires_in: number
}> {
  const r = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id:     process.env.GOOGLE_BUSINESS_CLIENT_ID!,
      client_secret: process.env.GOOGLE_BUSINESS_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type:    'refresh_token',
    }),
  })
  const data = await r.json()
  if (data.error) throw new Error(data.error_description ?? data.error)
  return data
}

export async function revokeToken(token: string): Promise<void> {
  await fetch(`${REVOKE_URL}?token=${token}`, { method: 'POST' })
}

// ─── Token management ─────────────────────────────────────────────────────────

export async function getValidToken(supabase: any, userId: string): Promise<string> {
  const { data: profile } = await supabase
    .from('localboost_profiles')
    .select('google_access_token, google_refresh_token, google_token_expires_at, google_connected')
    .eq('user_id', userId)
    .single()

  if (!profile?.google_connected || !profile?.google_refresh_token) {
    throw new Error('Google Business non connecté')
  }

  const expiresAt = profile.google_token_expires_at
    ? new Date(profile.google_token_expires_at)
    : new Date(0)

  // Token encore valide (marge de 5 min)
  if (expiresAt > new Date(Date.now() + 5 * 60 * 1000)) {
    return profile.google_access_token
  }

  // Refresh
  const { access_token, expires_in } = await refreshAccessToken(profile.google_refresh_token)
  await supabase
    .from('localboost_profiles')
    .update({
      google_access_token:     access_token,
      google_token_expires_at: new Date(Date.now() + expires_in * 1000).toISOString(),
    })
    .eq('user_id', userId)

  return access_token
}

// ─── API client ───────────────────────────────────────────────────────────────

export async function gbpFetch(
  accessToken: string,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  url: string,
  body?: Record<string, any>
): Promise<any> {
  const r = await fetch(url, {
    method,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type':  'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  if (r.status === 204) return null

  const data = await r.json()
  if (!r.ok) {
    const msg = data?.error?.message ?? JSON.stringify(data)
    throw new Error(`GBP API ${r.status}: ${msg}`)
  }
  return data
}

// ─── Accounts & Locations ─────────────────────────────────────────────────────

export async function listAccounts(accessToken: string) {
  const data = await gbpFetch(accessToken, 'GET', ACCOUNTS_URL)
  return data.accounts ?? []
}

export async function listLocations(accessToken: string, accountName: string) {
  const url = `${LOCATIONS_BASE}/${accountName}/locations?readMask=name,title,storefrontAddress,websiteUri`
  const data = await gbpFetch(accessToken, 'GET', url)
  return data.locations ?? []
}

// ─── Posts ────────────────────────────────────────────────────────────────────

export async function createPost(
  accessToken: string,
  locationName: string,
  text: string
) {
  const url = `${GBP_V4}/${locationName}/localPosts`
  return gbpFetch(accessToken, 'POST', url, {
    languageCode: 'fr',
    summary:      text,
    topicType:    'STANDARD',
    state:        'LIVE',
  })
}

export async function listPosts(accessToken: string, locationName: string) {
  const url = `${GBP_V4}/${locationName}/localPosts`
  const data = await gbpFetch(accessToken, 'GET', url)
  return data.localPosts ?? []
}

export async function deletePost(accessToken: string, postName: string) {
  return gbpFetch(accessToken, 'DELETE', `${GBP_V4}/${postName}`)
}

// ─── Reviews ──────────────────────────────────────────────────────────────────

export async function listReviews(accessToken: string, locationName: string) {
  const url = `${GBP_V4}/${locationName}/reviews?orderBy=updateTime+desc&pageSize=20`
  const data = await gbpFetch(accessToken, 'GET', url)
  return data.reviews ?? []
}

export async function replyToReview(
  accessToken: string,
  locationName: string,
  reviewId: string,
  comment: string
) {
  const url = `${GBP_V4}/${locationName}/reviews/${reviewId}/reply`
  return gbpFetch(accessToken, 'PUT', url, { comment })
}

export async function deleteReviewReply(
  accessToken: string,
  locationName: string,
  reviewId: string
) {
  return gbpFetch(accessToken, 'DELETE', `${GBP_V4}/${locationName}/reviews/${reviewId}/reply`)
}

// ─── Insights / Performance ───────────────────────────────────────────────────

export async function getInsights(accessToken: string, locationName: string) {
  const endDate  = new Date()
  const startDate = new Date(endDate.getTime() - 28 * 86400000) // 28 derniers jours

  const fmt = (d: Date) => ({
    year:  d.getFullYear(),
    month: d.getMonth() + 1,
    day:   d.getDate(),
  })

  const metrics = [
    'BUSINESS_IMPRESSIONS_DESKTOP_MAPS',
    'BUSINESS_IMPRESSIONS_MOBILE_MAPS',
    'BUSINESS_IMPRESSIONS_DESKTOP_SEARCH',
    'BUSINESS_IMPRESSIONS_MOBILE_SEARCH',
    'CALL_CLICKS',
    'WEBSITE_CLICKS',
    'BUSINESS_DIRECTION_REQUESTS',
  ]

  const params = new URLSearchParams()
  metrics.forEach(m => params.append('dailyMetrics', m))
  const s = fmt(startDate)
  const e = fmt(endDate)
  params.set('dailyRange.startDate.year',  String(s.year))
  params.set('dailyRange.startDate.month', String(s.month))
  params.set('dailyRange.startDate.day',   String(s.day))
  params.set('dailyRange.endDate.year',    String(e.year))
  params.set('dailyRange.endDate.month',   String(e.month))
  params.set('dailyRange.endDate.day',     String(e.day))

  const url = `${PERFORMANCE_BASE}/${locationName}:fetchMultiDailyMetrics?${params}`

  try {
    const data = await gbpFetch(accessToken, 'GET', url)
    return data.multiDailyMetricTimeSeries ?? []
  } catch {
    return []
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function summarizeInsights(series: any[]) {
  const totals: Record<string, number> = {}

  for (const s of series) {
    const metric = s.dailyMetric as string
    const values = (s.timeSeries?.datedValues ?? []) as any[]
    totals[metric] = values.reduce((sum: number, v: any) => sum + (Number(v.value) || 0), 0)
  }

  return {
    vues_maps:   (totals['BUSINESS_IMPRESSIONS_DESKTOP_MAPS'] ?? 0) + (totals['BUSINESS_IMPRESSIONS_MOBILE_MAPS'] ?? 0),
    vues_search: (totals['BUSINESS_IMPRESSIONS_DESKTOP_SEARCH'] ?? 0) + (totals['BUSINESS_IMPRESSIONS_MOBILE_SEARCH'] ?? 0),
    appels:      totals['CALL_CLICKS']                    ?? 0,
    sites:       totals['WEBSITE_CLICKS']                 ?? 0,
    itineraires: totals['BUSINESS_DIRECTION_REQUESTS']    ?? 0,
  }
}

export const STAR_LABELS: Record<string, number> = {
  ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5,
}
