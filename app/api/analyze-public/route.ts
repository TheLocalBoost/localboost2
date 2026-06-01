import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY!
const DAILY_LIMIT   = 350

// ─── Benchmarks sectoriels ────────────────────────────────────────────────────
const SECTOR_BENCHMARKS: Record<string, { label: string; average: number; valeur_client: number }> = {
  bakery:         { label: 'Boulangerie',     average: 72, valeur_client: 18  },
  restaurant:     { label: 'Restaurant',      average: 65, valeur_client: 40  },
  cafe:           { label: 'Café',            average: 63, valeur_client: 20  },
  bar:            { label: 'Bar',             average: 60, valeur_client: 25  },
  hair_care:      { label: 'Coiffeur',        average: 58, valeur_client: 50  },
  beauty_salon:   { label: 'Salon de beauté', average: 60, valeur_client: 60  },
  pharmacy:       { label: 'Pharmacie',       average: 75, valeur_client: 35  },
  plumber:        { label: 'Plombier',        average: 52, valeur_client: 280 },
  electrician:    { label: 'Électricien',     average: 48, valeur_client: 230 },
  car_repair:     { label: 'Garage',          average: 55, valeur_client: 200 },
  doctor:         { label: 'Médecin',         average: 68, valeur_client: 30  },
  dentist:        { label: 'Dentiste',        average: 70, valeur_client: 150 },
  lodging:        { label: 'Hôtel',           average: 78, valeur_client: 130 },
  florist:        { label: 'Fleuriste',       average: 55, valeur_client: 45  },
  optician:       { label: 'Opticien',        average: 62, valeur_client: 120 },
  supermarket:    { label: 'Supermarché',     average: 70, valeur_client: 30  },
  clothing_store: { label: 'Boutique',        average: 56, valeur_client: 65  },
  gym:            { label: 'Salle de sport',  average: 64, valeur_client: 45  },
}

function getSector(types: string[]) {
  for (const t of (types || [])) {
    if (SECTOR_BENCHMARKS[t]) return SECTOR_BENCHMARKS[t]
  }
  return { label: 'Commerce local', average: 60, valeur_client: 80 }
}

// ─── Impact business via Claude Haiku (mis en cache 24h) ─────────────────────
async function computeBusinessImpact(
  commerceName: string,
  city: string,
  score: number,
  position: number,
  sector: { label: string; average: number; valeur_client: number },
  own: any,
  gaps: string[]
) {
  const Anthropic = (await import('@anthropic-ai/sdk')).default
  const client    = new Anthropic()

  const rating  = own?.rating || 0
  const reviews = own?.user_ratings_total || 0

  const prompt = `Tu es expert en performance Google Business pour TPE/artisans français.

DONNÉES :
- Commerce : ${commerceName}
- Secteur : ${sector.label}
- Ville : ${city}
- Score de visibilité : ${score}/100
- Position Google Maps : ${position === -1 ? 'absent des résultats' : `#${position + 1}`}
- Note Google : ${rating > 0 ? `${rating.toFixed(1)}/5` : 'inconnue'}
- Nombre d'avis : ${reviews}
- Valeur client estimée secteur : ${sector.valeur_client}€
- Lacunes détectées : ${gaps.join(' | ') || 'aucune lacune majeure détectée'}

RÈGLES STRICTES :
- Ne donne JAMAIS de chiffre exact, toujours une fourchette réaliste
- Baser les estimations sur la logique (position, secteur, ville, avis)
- Évite toute surestimation agressive
- Ton factuel, non alarmiste, orienté entrepreneur local
- Si ville < 50 000 hab., être plus conservateur sur les fourchettes
- L'accroche doit être percutante mais honnête (max 15 mots)

Réponds UNIQUEMENT en JSON valide (aucun texte avant ou après) :
{
  "appels_min": <nombre entier>,
  "appels_max": <nombre entier>,
  "perte_min": <nombre entier arrondi à la dizaine>,
  "perte_max": <nombre entier arrondi à la dizaine>,
  "accroche": "<phrase courte sur la cause principale, max 15 mots>",
  "action_1": "<action concrète prioritaire>",
  "action_2": "<deuxième action concrète>",
  "action_3": "<troisième action concrète>"
}`

  try {
    const response = await client.messages.create({
      model:      'claude-haiku-4-5-20251001',
      max_tokens: 300,
      messages:   [{ role: 'user', content: prompt }],
    })

    const text  = response.content[0].type === 'text' ? response.content[0].text : ''
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('JSON non trouvé')
    return JSON.parse(match[0])
  } catch {
    // Fallback déterministe si Claude échoue
    let appelMin = position === -1 ? 5 : position === 0 ? 1 : position <= 2 ? 3 : 4
    let appelMax = position === -1 ? 12 : position === 0 ? 3 : position <= 2 ? 7 : 10
    if (rating > 0 && rating < 4.0) { appelMin += 1; appelMax += 2 }
    if (reviews < 10)               { appelMin += 1; appelMax += 2 }
    appelMin = Math.min(appelMin, 8); appelMax = Math.min(appelMax, 18)
    return {
      appels_min: appelMin, appels_max: appelMax,
      perte_min:  appelMin * sector.valeur_client,
      perte_max:  appelMax * sector.valeur_client,
      accroche:   'Votre fiche ne travaille pas assez pour vous chaque semaine.',
      action_1:   'Publier un post Google Business cette semaine',
      action_2:   'Répondre à tous vos avis en attente',
      action_3:   'Compléter les informations manquantes de votre fiche',
    }
  }
}

function computeGaps(own: any, position: number): string[] {
  const gaps: string[] = []
  const rating  = own?.rating || 0
  const reviews = own?.user_ratings_total || 0

  if (position === -1) {
    gaps.push("Fiche introuvable dans les 10 premiers résultats Google Maps — vos clients potentiels ne vous voient pas.")
  } else if (position >= 3) {
    gaps.push(`Position ${position + 1} sur Google Maps — 80% des clics vont aux 3 premiers résultats.`)
  }
  if (rating > 0 && rating < 4.0) {
    gaps.push(`Note de ${rating.toFixed(1)}/5 — en dessous du seuil de 4.0/5 qui déclenche la confiance client.`)
  }
  if (reviews === 0) {
    gaps.push("Aucun avis Google — une fiche sans avis est ignorée au profit des concurrents.")
  } else if (reviews < 10) {
    gaps.push(`Seulement ${reviews} avis — les fiches bien placées dans votre secteur en ont 20 ou plus.`)
  } else if (reviews < 25) {
    gaps.push(`${reviews} avis — encore sous le seuil de crédibilité (25+) que les clients recherchent.`)
  }
  return gaps.slice(0, 3)
}

function today() { return new Date().toISOString().split('T')[0] }

async function getDailyCount() {
  const { data } = await supabase.from('api_quota').select('count').eq('date', today()).eq('key_index', 0).single()
  return data?.count || 0
}
async function incrementQuota() {
  await supabase.rpc('increment_api_quota', { p_date: today(), p_key_index: 0 })
}
async function searchPlaces(query: string) {
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&language=fr&region=fr&key=${GOOGLE_API_KEY}`
  const data = await fetch(url).then(r => r.json())
  return { results: data.results || [], status: data.status }
}
function matchesName(resultName: string, searchName: string) {
  const words = searchName.toLowerCase().split(/\s+/).filter(w => w.length > 2)
  return words.every(w => resultName.toLowerCase().includes(w))
}

export async function POST(req: NextRequest) {
  try {
    const { commerce_name, city } = await req.json()
    if (!commerce_name || !city) return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })

    const force    = req.nextUrl.searchParams.get('force') === '1'
    const cacheKey = `${commerce_name.toLowerCase().trim()}__${city.toLowerCase().trim()}`

    // ── Cache 24h ─────────────────────────────────────────────────────────────
    if (!force) {
      const { data: cached } = await supabase
        .from('search_cache')
        .select('score, competitors, created_at, own_listing, sector, gaps, business_impact')
        .eq('cache_key', cacheKey)
        .single()
      if (cached && (Date.now() - new Date(cached.created_at).getTime()) < 86400000) {
        return NextResponse.json({
          score:          cached.score,
          competitors:    cached.competitors,
          ownListing:     cached.own_listing,
          sector:         cached.sector,
          gaps:           cached.gaps,
          businessImpact: cached.business_impact,
        })
      }
    }

    // ── Quota ─────────────────────────────────────────────────────────────────
    if (await getDailyCount() >= DAILY_LIMIT) {
      return NextResponse.json({ error: 'Quota journalier atteint. Revenez demain.' }, { status: 429 })
    }

    // ── Google Places ─────────────────────────────────────────────────────────
    const { results, status } = await searchPlaces(`${commerce_name} ${city}`)
    await incrementQuota()
    if (status === 'REQUEST_DENIED') return NextResponse.json({ error: 'Clé Google API invalide' }, { status: 500 })

    const position    = results.findIndex((r: any) => matchesName(r.name || '', commerce_name))
    const own         = position >= 0 ? results[position] : null
    const competitors = results.slice(0, 3).map((r: any, i: number) => ({
      name: r.name, rating: r.rating, reviews: r.user_ratings_total || 0, position: i + 1,
    }))

    // ── Score ─────────────────────────────────────────────────────────────────
    let score = 50
    if (position === 0)       score = 95
    else if (position === 1)  score = 80
    else if (position === 2)  score = 65
    else if (position === -1) score = 30
    if ((own?.rating || 0) >= 4.5)            score += 5
    if ((own?.user_ratings_total || 0) >= 50) score += 5
    if (score > 100) score = 100

    const sector         = getSector(own?.types || results[0]?.types || [])
    const gaps           = computeGaps(own, position)
    const ownListing     = own ? { name: own.name, rating: own.rating, reviews: own.user_ratings_total || 0 } : null
    const businessImpact = await computeBusinessImpact(commerce_name, city, score, position, sector, own, gaps)

    // ── Cache ─────────────────────────────────────────────────────────────────
    await supabase.from('search_cache').upsert(
      { cache_key: cacheKey, score, competitors, own_listing: ownListing, sector, gaps, business_impact: businessImpact, created_at: new Date().toISOString() },
      { onConflict: 'cache_key' }
    )

    return NextResponse.json({ score, position: position + 1, competitors, ownListing, sector, gaps, businessImpact })
  } catch (err) {
    console.error('Analyze error:', err)
    return NextResponse.json({ error: 'Erreur analyse' }, { status: 500 })
  }
}
