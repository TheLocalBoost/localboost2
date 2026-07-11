import * as cheerio from 'cheerio'

const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY!

// ── Vérification de position (Google Places Text Search) ──────────────────────
//
// Limite connue : l'API Places Text Search n'est PAS le classement "local pack"
// que voit un utilisateur réel dans Google Maps/Search (pas de géolocalisation
// précise, pas de personnalisation, algorithme distinct). C'est un proxy
// raisonnable, pas une vérité terrain. Toujours présenté comme tel côté produit.

export interface PositionCheckResult {
  keyword: string
  position: number | null   // null = absent des résultats consultés, OU échec de vérification (voir `error`)
  scanned: number           // nombre de résultats effectivement parcourus (20 par page)
  rating: number | null
  reviewCount: number | null
  error: boolean            // true = la vérification a échoué (position=null ne veut PAS dire "absent" dans ce cas)
}

async function textSearchPage(query: string, pagetoken?: string) {
  let url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&language=fr&region=fr&key=${GOOGLE_API_KEY}`
  if (pagetoken) url += `&pagetoken=${pagetoken}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Places API HTTP ${res.status}`)
  const data = await res.json()
  if (data.status && !['OK', 'ZERO_RESULTS'].includes(data.status)) {
    throw new Error(`Places API status ${data.status}`)
  }
  return data as { results?: any[]; next_page_token?: string }
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Vérifie la position d'un établissement (par place_id) sur un mot-clé donné,
 * en temps réel — aucune valeur mise en cache ou estimée n'est renvoyée ici.
 * maxPages=1 → 20 résultats consultés (1 requête). maxPages=3 → jusqu'à 60
 * résultats (3 requêtes, ~4s de délai Google entre pages) — plus fiable mais
 * 3x plus coûteux en quota API.
 */
export async function checkKeywordPosition(
  placeId: string,
  keyword: string,
  opts: { maxPages?: number } = {}
): Promise<PositionCheckResult> {
  const maxPages = Math.max(1, Math.min(3, opts.maxPages ?? 1))
  const all: any[] = []
  try {
    let data = await textSearchPage(keyword)
    all.push(...(data.results ?? []))
    let token = data.next_page_token
    let page = 1
    while (token && page < maxPages) {
      await sleep(2000) // next_page_token a besoin de ce délai avant d'être actif côté Google
      data = await textSearchPage(keyword, token)
      all.push(...(data.results ?? []))
      token = data.next_page_token
      page++
    }
  } catch {
    return { keyword, position: null, scanned: 0, rating: null, reviewCount: null, error: true }
  }

  const idx = all.findIndex(r => r.place_id === placeId)
  const match = idx >= 0 ? all[idx] : null
  return {
    keyword,
    position: idx >= 0 ? idx + 1 : null,
    scanned: all.length,
    rating: match?.rating ?? null,
    reviewCount: match?.user_ratings_total ?? null,
    error: false,
  }
}

// ── Extraction de services depuis le site du prospect ──────────────────────────
//
// Limite connue : heuristique de scraping (titres + blocs "service"/"prestation"
// + meta keywords), pas de classification NLP. Sur des sites mal structurés
// (tout-en-JS côté client, sites builders sans balises sémantiques, PDF-only),
// l'extraction peut renvoyer un tableau vide. C'est un échec silencieux
// volontaire : mieux vaut se rabattre sur le métier générique seul que
// d'inventer des services.

export interface ExtractedService {
  label: string
  source: 'heading' | 'nav' | 'meta'
}

const GENERIC_LABELS = [
  'accueil', 'contact', 'à propos', 'a propos', 'qui sommes', 'mentions légales',
  'mentions legales', 'blog', 'actualit', 'devis gratuit', 'tarifs', 'avis clients',
  'politique de confidentialité', 'cgv', 'cgu', 'plan du site', 'recrutement',
]

// Libellés de menu type "Nos services" / "Nos prestations" — ce sont des liens de
// navigation vers la page services, pas des noms de services eux-mêmes.
const NAV_LABEL_ONLY = /^(nos|notre|vos|voir|d[ée]couvrez?)?\s*(services?|prestations?|activit[ée]s?|expertises?)$/i

export async function extractServicesFromWebsite(url: string): Promise<ExtractedService[]> {
  let html: string
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; LocalBoostBot/1.0; +https://thelocalboost.fr)' },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return []
    html = await res.text()
  } catch {
    return [] // site injoignable / timeout — pas de fallback inventé
  }

  const $ = cheerio.load(html)
  $('script,style,noscript').remove()

  const candidates = new Map<string, ExtractedService>()
  const push = (raw: string | undefined, source: ExtractedService['source']) => {
    if (!raw) return
    // Les sites générés (builders, JS côté client) omettent souvent l'espace entre
    // deux éléments inline adjacents dans le HTML source (ex: "EntrepriseRénovation").
    // On le réintroduit à la frontière minuscule/majuscule — heuristique imparfaite
    // mais qui évite la majorité des concaténations parasites.
    const label = raw.replace(/([a-zà-ÿ0-9])([A-ZÀ-Ÿ])/g, '$1 $2').replace(/\s+/g, ' ').trim()
    if (label.length < 6 || label.length > 60) return
    if (/\d/.test(label)) return // écarte les chiffres-clés ("20 ans d'expertise") = tagline, pas un service
    const key = label.toLowerCase()
    if (GENERIC_LABELS.some(g => key.includes(g))) return
    if (NAV_LABEL_ONLY.test(label.trim())) return
    if (!candidates.has(key)) candidates.set(key, { label, source })
  }

  $('h1,h2,h3,h4').each((_, el) => push($(el).text(), 'heading'))
  $('[class*="service" i] li, [id*="service" i] li, [class*="prestation" i] li, [id*="prestation" i] li, nav [class*="service" i] a')
    .each((_, el) => push($(el).text(), 'nav'))
  const metaKeywords = $('meta[name="keywords"]').attr('content')
  if (metaKeywords) metaKeywords.split(',').forEach(k => push(k, 'meta'))

  return Array.from(candidates.values()).slice(0, 20)
}

/**
 * Sélectionne 1 à `max` libellés de services suffisamment spécifiques
 * (au moins 2 mots, pas déjà couverts par le métier générique) pour être
 * cherchés séparément sur Google Maps.
 */
export function pickCandidateKeywords(
  services: ExtractedService[],
  category: string,
  max = 2
): string[] {
  const categoryNorm = category.toLowerCase()
  const isUsable = (s: ExtractedService) => {
    const l = s.label.toLowerCase()
    if (l.split(' ').length < 2) return false // un seul mot = trop vague pour être recherché isolément
    if (l === categoryNorm) return false
    // Les titres (h1-h4) captent souvent des accroches marketing plutôt que des noms
    // de services ("20 ans d'expertise en bâtiment") — on les garde en dernier recours
    // seulement, et on les limite en longueur pour écarter les phrases complètes.
    if (s.source === 'heading' && s.label.length > 40) return false
    return true
  }
  // Priorité aux libellés issus de blocs "service"/"prestation" (nav), plus fiables
  // que les titres génériques de page.
  const nav = services.filter(s => s.source === 'nav' && isUsable(s))
  const rest = services.filter(s => s.source !== 'nav' && isUsable(s))
  return [...nav, ...rest].slice(0, max).map(s => s.label)
}

// ── Constat comparatif ──────────────────────────────────────────────────────

function formatPosition(r: PositionCheckResult): string {
  if (r.error) return 'non vérifiable actuellement'
  if (r.position == null) return `absent(e) des ${r.scanned} premiers résultats`
  if (r.position === 1) return '1ère'
  return `${r.position}ème`
}

/**
 * Génère le texte comparatif "sur X vous êtes ... sur Y vous êtes ..." si et
 * seulement si un écart significatif existe. Retourne null sinon — l'appelant
 * doit alors utiliser un autre axe du diagnostic générique plutôt que de
 * forcer un angle qui n'existe pas (règle produit explicite).
 */
export function generateComparativeTeaser(
  generic: PositionCheckResult,
  services: PositionCheckResult[],
  gapThreshold = 8
): string | null {
  if (generic.error || generic.position == null) return null // pas de référence fiable pour comparer

  const validServices = services.filter(s => !s.error)
  const gaps = validServices.filter(s => s.position == null || (s.position - generic.position!) >= gapThreshold)
  if (gaps.length === 0) return null

  // `keyword` contient déjà la requête complète (mot-clé + ville) telle qu'envoyée à Places API
  const worst = gaps.sort((a, b) => (b.position ?? 999) - (a.position ?? 999))[0]
  return `Sur "${generic.keyword}", vous êtes ${formatPosition(generic)}. Sur "${worst.keyword}", vous êtes ${formatPosition(worst)} — un écart qui représente une opportunité de visibilité manquée.`
}
