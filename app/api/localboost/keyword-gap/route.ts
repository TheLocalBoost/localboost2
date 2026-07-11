import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  checkKeywordPosition, extractServicesFromWebsite, pickCandidateKeywords,
  generateComparativeTeaser, PositionCheckResult,
} from '@/lib/keywordPositioning'

const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY!

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const CACHE_TTL_MS = 24 * 60 * 60 * 1000

function normalizeStr(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '')
}

async function resolvePlace(name: string, city: string): Promise<{ placeId: string; category: string } | null> {
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(`${name} ${city}`)}&language=fr&region=fr&key=${GOOGLE_API_KEY}`
  const data = await fetch(url).then(r => r.json())
  const results = (data.results ?? []) as any[]
  if (!results.length) return null
  const cityNorm = normalizeStr(city)
  const place = results.find(r => normalizeStr(r.formatted_address ?? r.vicinity ?? '').includes(cityNorm)) ?? results[0]
  return { placeId: place.place_id, category: place.types?.[0] ?? 'commerce' }
}

export const maxDuration = 45

export async function POST(req: NextRequest) {
  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 })
  }

  const { commerce_name, city, website } = body
  const category: string | undefined = body.category
  const placeIdIn: string | undefined = body.place_id
  const maxPages = Math.max(1, Math.min(3, body.maxPages ?? 1))

  if (!commerce_name || !city) {
    return NextResponse.json({ error: 'commerce_name et city requis' }, { status: 400 })
  }

  const reliabilityNotes: string[] = []

  // 1. Résolution du place_id (réutilise celui fourni si déjà connu, ex: depuis /api/analyse-public)
  let placeId = placeIdIn
  let resolvedCategory = category
  if (!placeId) {
    const resolved = await resolvePlace(commerce_name, city)
    if (!resolved) {
      return NextResponse.json({ error: 'Établissement introuvable sur Google Maps.' }, { status: 404 })
    }
    placeId = resolved.placeId
    resolvedCategory = resolvedCategory ?? resolved.category
  }
  const categoryKeyword = resolvedCategory ?? 'commerce'

  // 2. Cache 24h — évite de re-consommer du quota Places API à chaque rechargement
  const { data: cachedRows } = await supabase
    .from('keyword_rankings')
    .select('keyword, is_generic, position, scanned, rating, review_count, checked_at')
    .eq('place_id', placeId)
    .gte('checked_at', new Date(Date.now() - CACHE_TTL_MS).toISOString())
    .order('checked_at', { ascending: false })

  let genericResult: PositionCheckResult | null = null
  let serviceResults: PositionCheckResult[] = []

  if (cachedRows && cachedRows.length > 0) {
    const seen = new Set<string>()
    for (const row of cachedRows) {
      if (seen.has(row.keyword)) continue
      seen.add(row.keyword)
      const result: PositionCheckResult = {
        keyword: row.keyword, position: row.position, scanned: row.scanned,
        rating: row.rating, reviewCount: row.review_count, error: false,
      }
      if (row.is_generic) genericResult = result
      else serviceResults.push(result)
    }
    if (genericResult) {
      reliabilityNotes.push(`Résultats servis depuis le cache (vérifiés il y a moins de 24h) — pas de nouvelle requête Google Places pour cet appel.`)
    }
  }

  // 3. Pas de cache exploitable → vérification en temps réel
  if (!genericResult) {
    if (website) {
      try {
        const extracted = await extractServicesFromWebsite(website)
        if (extracted.length === 0) {
          reliabilityNotes.push(`Aucun service identifiable extrait de ${website} — structure de site non reconnue par l'heuristique d'extraction (site en JS côté client, builder sans balises sémantiques, etc.).`)
        }
        const services = pickCandidateKeywords(extracted, categoryKeyword, 2)
        if (extracted.length > 0 && services.length === 0) {
          reliabilityNotes.push('Services extraits du site mais trop vagues (un seul mot) pour être recherchés isolément sur Google Maps.')
        }

        genericResult = await checkKeywordPosition(placeId, `${categoryKeyword} ${city}`, { maxPages })
        for (const svc of services) {
          const r = await checkKeywordPosition(placeId, `${svc} ${city}`, { maxPages })
          serviceResults.push(r)
        }
      } catch {
        reliabilityNotes.push(`Échec du scraping de ${website} — comparaison limitée au métier générique.`)
        genericResult = await checkKeywordPosition(placeId, `${categoryKeyword} ${city}`, { maxPages })
      }
    } else {
      reliabilityNotes.push('Aucun site web renseigné pour ce prospect — comparaison limitée au métier générique (pas de service à comparer).')
      genericResult = await checkKeywordPosition(placeId, `${categoryKeyword} ${city}`, { maxPages })
    }

    if (genericResult.error) {
      reliabilityNotes.push('La vérification du métier générique a échoué (erreur API Google Places) — aucune position affichée, réessayer plus tard.')
    }
    for (const r of serviceResults) {
      if (r.error) reliabilityNotes.push(`La vérification de "${r.keyword}" a échoué (erreur API) — exclue de la comparaison.`)
    }

    // 4. Persistance (best effort — n'échoue pas la requête si l'insert échoue)
    const rows = [
      { place_id: placeId, city, keyword: genericResult.keyword, is_generic: true, position: genericResult.position, scanned: genericResult.scanned, rating: genericResult.rating, review_count: genericResult.reviewCount },
      ...serviceResults.filter(r => !r.error).map(r => ({
        place_id: placeId, city, keyword: r.keyword, is_generic: false,
        position: r.position, scanned: r.scanned, rating: r.rating, review_count: r.reviewCount,
      })),
    ].filter(r => !(r.is_generic && genericResult!.error))
    if (rows.length > 0) {
      const { error: insertError } = await supabase.from('keyword_rankings').insert(rows)
      if (insertError) console.error('[keyword-gap] cache insert failed', insertError)
    }
  }

  const validServices = serviceResults.filter(r => !r.error)
  const teaser = genericResult && !genericResult.error
    ? generateComparativeTeaser(genericResult, validServices)
    : null

  if (!teaser && validServices.length > 0) {
    reliabilityNotes.push("Aucun écart significatif détecté entre le métier générique et les services testés — ne pas forcer cet angle dans l'accroche commerciale, utiliser un autre axe du diagnostic générique.")
  }

  return NextResponse.json({
    placeId,
    category: categoryKeyword,
    city,
    generic: genericResult,
    services: serviceResults,
    teaser,
    reliabilityNotes,
  })
}
