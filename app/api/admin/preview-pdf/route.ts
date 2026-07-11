import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { generateReportPDF, ReportData } from '@/lib/pdf/generateReport'
import {
  checkKeywordPosition, extractServicesFromWebsite, pickCandidateKeywords,
  generateComparativeTeaser,
} from '@/lib/keywordPositioning'

export const maxDuration = 60

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const APP_URL   = process.env.NEXT_PUBLIC_URL!

export async function POST(req: NextRequest) {
  const k = req.nextUrl.searchParams.get('k')
  if (k !== process.env.ADMIN_SECRET_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { nom, ville, tier: tierIn } = await req.json()
  if (!nom || !ville) {
    return NextResponse.json({ error: 'nom et ville requis' }, { status: 400 })
  }
  const tier: 'express' | 'surMesure' = tierIn === 'express' ? 'express' : 'surMesure'
  const isExpress = tier === 'express'

  // ── 1. Audit Google ────────────────────────────────────────────────────────
  const auditRes = await fetch(`${APP_URL}/api/analyse-public`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ commerce_name: nom, city: ville }),
  })
  const audit = auditRes.ok ? await auditRes.json() : null

  const realName      = audit?.name ?? nom
  const realCity      = audit?.city ?? ville
  const category      = (audit?.category ?? 'artisan') as string
  const realRating    = (audit?.rating   ?? 0)  as number
  const realReviews   = (audit?.reviews  ?? 0)  as number
  const realPhotos    = (audit?.photos   ?? 0)  as number
  const realPhone     = (audit?.phoneIntl ?? null) as string | null
  const realProblems  = ((audit?.problems ?? []) as Array<{ text: string }>)
    .slice(0, 3).map(p => p.text)
  const realReviews3  = ((audit?.recentReviews ?? []) as Array<{ author: string; rating: number; text: string }>)
    .filter(r => r.text?.length > 15).slice(0, 2)
  const topCompetitor = (audit?.competitors?.[0] ?? null) as { name: string; rating: number; reviewCount: number } | null
  const lostRevenue   = (audit?.lostRevenue ?? 0) as number
  const placeId       = (audit?.placeId ?? null) as string | null
  const completeness  = (audit?.completeness ?? { percent: 0, filled: 0, total: 0 }) as ReportData['completeness']
  const reviewUrl     = placeId ? `https://search.google.com/local/writereview?placeid=${placeId}` : null
  const qrUrl         = reviewUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(reviewUrl)}&color=1a1a1a&bgcolor=ffffff`
    : null

  // ── 1b. Diagnostic de positionnement (tier sur-mesure uniquement — consomme
  // des requêtes Places API supplémentaires, pas activé sur les aperçus standards) ──
  let positioning: ReportData['positioning'] = null
  if (!isExpress && placeId) {
    try {
      const website = (audit?.website ?? null) as string | null
      let services: string[] = []
      if (website) {
        const extracted = await extractServicesFromWebsite(website)
        services = pickCandidateKeywords(extracted, category, 2)
      }
      const generic = await checkKeywordPosition(placeId, `${category} ${realCity}`, { maxPages: 1 })
      const serviceResults = []
      for (const svc of services) {
        serviceResults.push(await checkKeywordPosition(placeId, `${svc} ${realCity}`, { maxPages: 1 }))
      }
      const teaser = !generic.error
        ? generateComparativeTeaser(generic, serviceResults.filter(r => !r.error))
        : null
      positioning = {
        generic:  { keyword: generic.keyword, position: generic.position, scanned: generic.scanned },
        services: serviceResults.map(r => ({ keyword: r.keyword, position: r.position, scanned: r.scanned })),
        teaser,
      }
    } catch (e) {
      console.error('[preview-pdf] positioning failed', e)
      // best effort — un échec ici ne doit jamais bloquer la génération du PDF
    }
  }

  const competitorCtx = topCompetitor
    ? `Concurrent principal visible avant ${realName} : ${topCompetitor.name} (${topCompetitor.rating}★ · ${topCompetitor.reviewCount} avis)`
    : ''

  const reviewsCtx = realReviews3.length > 0
    ? realReviews3.map(r => `- ${r.author} (${r.rating}★) : "${r.text.slice(0, 120)}"`).join('\n')
    : ''

  // ── 2. Génération Claude (prompts corrigés) ────────────────────────────────

  // Bug 1 fix : reviewResponses = tableau de CHAÎNES, jamais d'objets
  // Bug 2 fix : secteur ${category} répété explicitement dans les deux prompts
  // Bug 3 fix : témoignages fictifs interdits
  // Bug 4 fix : pas de "score X/100" — supprimé du template PDF
  // Bug 5 fix : aucun chiffre inventé — toutes les données viennent de l'audit
  // Publications retirées (Part 1) : plus de champ "posts" ni de calendrier généré.
  // Tier "express" : on ne génère même plus les modèles/guide/plan/FAQ/services —
  // pas seulement exclus du rendu, économise aussi les tokens Claude.

  const dataCtx = `DONNÉES RÉELLES (ne pas inventer d'autres chiffres) :
- Note Google : ${realRating > 0 ? `${realRating}/5` : 'non renseignée'}
- Nombre d'avis : ${realReviews}
- Photos : ${realPhotos}
${competitorCtx ? `- ${competitorCtx}` : ''}
${realProblems.length > 0 ? `\nProblèmes identifiés :\n${realProblems.map(p => `- ${p}`).join('\n')}` : ''}
${reviewsCtx ? `\nAvis clients récents :\n${reviewsCtx}` : ''}`

  const absoluteRules = `RÈGLES ABSOLUES :
- Ne jamais créer de témoignage fictif (citation attribuée à un prénom inventé).
- Ne jamais écrire "Comme m'a dit [Prénom]" ou toute citation attribuée à un client imaginaire.
- Ne jamais afficher un chiffre qui ne provient pas des données ci-dessus.
- Tout le contenu doit correspondre au secteur ${category} uniquement.`

  const prompt1 = isExpress
    ? `Tu es un expert Google Business Profile. Génère le pack pour "${realName}", ${category} à ${realCity}.

SECTEUR : ${category}. Tout le contenu doit correspondre UNIQUEMENT au secteur ${category}.

${dataCtx}

${absoluteRules}

Réponds UNIQUEMENT avec du JSON valide (sans balises markdown) :
{
  "description": "...",
  "reviewResponses": ["texte de réponse 1", "texte de réponse 2"]
}

Contraintes détaillées :
- description : 150-200 mots, mentionne "${realName}" et "${realCity}", ton direct et professionnel, spécifique au secteur ${category}
- reviewResponses : TABLEAU DE CHAÎNES DE TEXTE UNIQUEMENT (pas d'objets JSON). Chaque entrée est le texte complet d'une réponse à un avis fourni ci-dessus, en s'adressant par prénom. Si aucun avis fourni : []`
    : `Tu es un expert Google Business Profile. Génère le pack complet pour "${realName}", ${category} à ${realCity}.

SECTEUR : ${category}. Tout le contenu doit correspondre UNIQUEMENT au secteur ${category}.

${dataCtx}

${absoluteRules}

Réponds UNIQUEMENT avec du JSON valide (sans balises markdown) :
{
  "description": "...",
  "reviewResponses": ["texte de réponse 1", "texte de réponse 2"],
  "responseTemplates": {
    "5etoiles": ["t1","t2","t3","t4","t5","t6","t7","t8"],
    "sansTexte": ["t1","t2","t3","t4","t5"],
    "mitige": ["t1","t2","t3","t4","t5"],
    "negatif": ["t1","t2","t3","t4","t5"],
    "incident": ["t1","t2","t3"],
    "fidele": ["t1","t2","t3","t4"]
  },
  "guideSteps": ["etape1","etape2","etape3","etape4","etape5","etape6"],
  "actionPlan": "1. Action concrète (temps estimé)\\n2. Action concrète (temps estimé)\\n3. Action concrète (temps estimé)"
}

Contraintes détaillées :
- description : 150-200 mots, mentionne "${realName}" et "${realCity}", ton direct et professionnel, spécifique au secteur ${category}
- reviewResponses : TABLEAU DE CHAÎNES DE TEXTE UNIQUEMENT (pas d'objets JSON). Chaque entrée est le texte complet d'une réponse à un avis fourni ci-dessus, en s'adressant par prénom. Si aucun avis fourni : []
- responseTemplates : 30 modèles (CHAÎNES DE TEXTE uniquement, pas d'objets), classés, ton chaleureux, mentionnant "${realCity}", adaptés au secteur ${category}
- guideSteps : 6 étapes concrètes pour publier sur Google Business, sans jargon technique
- actionPlan : exactement 3 lignes numérotées, chaque ligne = 1 action concrète avec estimation de temps réaliste`

  const photoCount = isExpress ? 6 : 20

  const prompt2 = isExpress
    ? `Tu es un expert Google Business Profile. Génère des idées de photos pour "${realName}" (${category}) à ${realCity}.

SECTEUR : ${category}.

Réponds UNIQUEMENT avec du JSON valide (sans balises markdown) :
{ "photoIdeas": ["idee1", "idee2"] }

Contraintes :
- photoIdeas : ${photoCount} idées de photos ciblées en priorité sur les manques identifiés de la fiche (${realProblems.slice(0, 2).join('; ') || 'photos et confiance visuelle'}), à prendre avec un téléphone, adaptées au métier ${category}. Pas de mise en scène avec des clients fictifs.`
    : `Tu es un expert Google Business Profile. Génère des contenus complémentaires pour "${realName}" (${category}) à ${realCity}.

SECTEUR : ${category}. Tout le contenu doit correspondre UNIQUEMENT au secteur ${category}. Ne jamais générer de contenu pour un autre secteur médical ou professionnel.

Réponds UNIQUEMENT avec du JSON valide (sans balises markdown) :
{
  "faq": [{"q": "...", "a": "..."}],
  "services": [{"name": "...", "description": "..."}],
  "photoIdeas": ["idee1", "idee2"]
}

Contraintes :
- faq : 20 questions/réponses que les clients posent à un ${category} à ${realCity}. Concrètes (tarifs, délais, zones d'intervention, urgences, devis). Réponses 1-2 phrases directes. Pas de témoignage fictif.
- services : 5 services phares d'un ${category}. Noms courts et précis, descriptions 2 lignes concrètes. Adaptés au secteur ${category}.
- photoIdeas : ${photoCount} idées de photos à prendre avec un téléphone, adaptées au métier ${category} (salle, matériel, avant/après, équipe, coulisses). Pas de mise en scène avec des clients fictifs.`

  const [msg1, msg2] = await Promise.all([
    anthropic.messages.create({
      model:     'claude-haiku-4-5-20251001',
      max_tokens: isExpress ? 1000 : 4000,
      messages:  [{ role: 'user', content: prompt1 }],
    }),
    anthropic.messages.create({
      model:     'claude-haiku-4-5-20251001',
      max_tokens: isExpress ? 800 : 3000,
      messages:  [{ role: 'user', content: prompt2 }],
    }),
  ])

  // ── 3. Parse JSON ──────────────────────────────────────────────────────────
  const raw1  = (msg1.content[0] as { text: string }).text.trim()
  const raw2  = (msg2.content[0] as { text: string }).text.trim()
  const clean = (s: string) => s.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
  const pack1 = JSON.parse(clean(raw1))
  const pack2 = JSON.parse(clean(raw2))

  // ── 4. Construction ReportData ─────────────────────────────────────────────
  const reportData: ReportData = {
    tier,
    name:        realName,
    city:        realCity,
    category,
    rating:      realRating,
    reviews:     realReviews,
    photos:      realPhotos,
    phoneIntl:   realPhone,
    problems:    realProblems,
    recentReviews: realReviews3,
    topCompetitor,
    lostRevenue,
    placeId,
    reviewUrl:  isExpress ? null : reviewUrl,
    qrUrl:      isExpress ? null : qrUrl,
    completeness,
    positioning,
    description:       pack1.description       ?? '',
    reviewResponses:   (pack1.reviewResponses  ?? []) as unknown[],
    responseTemplates: (pack1.responseTemplates ?? {}) as Record<string, unknown[]>,
    guideSteps:        (pack1.guideSteps       ?? []) as string[],
    actionPlan:        typeof pack1.actionPlan === 'string'
      ? pack1.actionPlan
      : String(pack1.actionPlan ?? ''),
    faq:        (pack2.faq        ?? []) as Array<{ q: string; a: string }>,
    services:   (pack2.services   ?? []) as Array<{ name: string; description: string }>,
    photoIdeas: (pack2.photoIdeas ?? []) as string[],
  }

  // ── 5. Génération PDF ──────────────────────────────────────────────────────
  const pdfBuffer = await generateReportPDF(reportData)

  const filename = `rapport-${realName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.pdf`
  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type':        'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
