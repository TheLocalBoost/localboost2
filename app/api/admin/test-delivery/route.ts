import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { sendTransactional } from '@/lib/email'
import { generateReportPDF, ReportData } from '@/lib/pdf/generateReport'

export const maxDuration = 60

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const APP_URL   = process.env.NEXT_PUBLIC_URL!

export async function POST(req: NextRequest) {
  const k = req.nextUrl.searchParams.get('k')
  if (k !== process.env.ADMIN_SECRET_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { email, nom, ville } = await req.json()
  if (!email || !nom || !ville) {
    return NextResponse.json({ error: 'email, nom, ville requis' }, { status: 400 })
  }

  try {
    // ── 1. Audit Google ──────────────────────────────────────────────────────
    const auditRes = await fetch(`${APP_URL}/api/analyse-public`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ commerce_name: nom, city: ville }),
    })
    const audit = auditRes.ok ? await auditRes.json() : null

    const realName      = (audit?.name      ?? nom)    as string
    const realCity      = (audit?.city      ?? ville)  as string
    const category      = (audit?.category  ?? 'artisan') as string
    const realRating    = (audit?.rating    ?? 0)      as number
    const realReviews   = (audit?.reviews   ?? 0)      as number
    const realPhotos    = (audit?.photos    ?? 0)      as number
    const realPhone     = (audit?.phoneIntl ?? null)   as string | null
    const realProblems  = ((audit?.problems ?? []) as Array<{ text: string }>)
      .slice(0, 3).map(p => p.text)
    const realReviews3  = ((audit?.recentReviews ?? []) as Array<{ author: string; rating: number; text: string }>)
      .filter(r => r.text?.length > 15).slice(0, 2)
    const topCompetitor = (audit?.competitors?.[0] ?? null) as { name: string; rating: number; reviewCount: number } | null
    const lostRevenue   = (audit?.lostRevenue ?? 0)    as number
    const placeId       = (audit?.placeId ?? null)     as string | null
    const reviewUrl     = placeId ? `https://search.google.com/local/writereview?placeid=${placeId}` : null
    const qrUrl         = reviewUrl
      ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(reviewUrl)}&color=1a1a1a&bgcolor=ffffff`
      : null

    const competitorCtx = topCompetitor
      ? `Concurrent principal visible avant ${realName} : ${topCompetitor.name} (${topCompetitor.rating}★ · ${topCompetitor.reviewCount} avis)`
      : ''
    const reviewsCtx = realReviews3.length > 0
      ? realReviews3.map(r => `- ${r.author} (${r.rating}★) : "${r.text.slice(0, 120)}"`).join('\n')
      : ''

    function buildCalendar(n: number): Array<{ date: string; postNum: number }> {
      const now = new Date()
      const daysUntilMon = ((8 - now.getDay()) % 7) || 7
      const start = new Date(now)
      start.setDate(start.getDate() + daysUntilMon)
      return Array.from({ length: n }, (_, i) => {
        const d = new Date(start)
        d.setDate(d.getDate() + i * 7)
        return {
          date: d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
          postNum: i + 1,
        }
      })
    }

    // ── 2. Génération Claude ─────────────────────────────────────────────────
    const prompt1 = `Tu es un expert Google Business Profile. Génère le pack complet pour "${realName}", ${category} à ${realCity}.

SECTEUR : ${category}. Tout le contenu doit correspondre UNIQUEMENT au secteur ${category}.

DONNÉES RÉELLES (ne pas inventer d'autres chiffres) :
- Note Google : ${realRating > 0 ? `${realRating}/5` : 'non renseignée'}
- Nombre d'avis : ${realReviews}
- Photos : ${realPhotos}
${competitorCtx ? `- ${competitorCtx}` : ''}
${realProblems.length > 0 ? `\nProblèmes identifiés :\n${realProblems.map(p => `- ${p}`).join('\n')}` : ''}
${reviewsCtx ? `\nAvis clients récents :\n${reviewsCtx}` : ''}

RÈGLES ABSOLUES :
- Ne jamais créer de témoignage fictif.
- Ne jamais afficher un chiffre qui ne provient pas des données ci-dessus.
- Tout le contenu doit correspondre au secteur ${category} uniquement.

Réponds UNIQUEMENT avec du JSON valide (sans balises markdown) :
{
  "description": "...",
  "posts": ["post1","post2","post3","post4","post5","post6","post7","post8","post9","post10","post11","post12"],
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
- posts : 12 posts distincts (55-75 mots chacun). Couvrir : conseil pratique, printemps, été, automne, hiver, fête des mères, rentrée, Noël, galette des rois, coulisses métier, urgence saisonnière, bilan${realPhone ? `. Post 12 : inclure le numéro ${realPhone}` : ''}. Jamais de témoignage fictif.
- reviewResponses : TABLEAU DE CHAÎNES uniquement. Chaque entrée = texte complet d'une réponse à un avis fourni ci-dessus. Si aucun avis : []
- responseTemplates : 30 modèles (chaînes uniquement), classés, ton chaleureux, mentionnant "${realCity}", adaptés au secteur ${category}
- guideSteps : 6 étapes concrètes pour publier sur Google Business, sans jargon technique
- actionPlan : exactement 3 lignes numérotées, chaque ligne = 1 action concrète avec estimation de temps réaliste`

    const prompt2 = `Tu es un expert Google Business Profile. Génère des contenus complémentaires pour "${realName}" (${category}) à ${realCity}.

SECTEUR : ${category}. Tout le contenu doit correspondre UNIQUEMENT au secteur ${category}.

Réponds UNIQUEMENT avec du JSON valide (sans balises markdown) :
{
  "faq": [{"q": "...", "a": "..."}],
  "services": [{"name": "...", "description": "..."}],
  "photoIdeas": ["idee1", "idee2"]
}

Contraintes :
- faq : 20 questions/réponses que les clients posent à un ${category} à ${realCity}. Concrètes (tarifs, délais, zones, urgences, devis). Réponses 1-2 phrases directes. Pas de témoignage fictif.
- services : 5 services phares d'un ${category}. Noms courts et précis, descriptions 2 lignes concrètes.
- photoIdeas : 20 idées de photos adaptées au métier ${category} (salle, matériel, avant/après, équipe, coulisses).`

    const [msg1, msg2] = await Promise.all([
      anthropic.messages.create({ model: 'claude-haiku-4-5-20251001', max_tokens: 6000, messages: [{ role: 'user', content: prompt1 }] }),
      anthropic.messages.create({ model: 'claude-haiku-4-5-20251001', max_tokens: 3000, messages: [{ role: 'user', content: prompt2 }] }),
    ])

    // ── 3. Parse JSON ────────────────────────────────────────────────────────
    const clean = (s: string) => s.trim().replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
    const pack1 = JSON.parse(clean((msg1.content[0] as { text: string }).text))
    const pack2 = JSON.parse(clean((msg2.content[0] as { text: string }).text))

    // ── 4. Construction ReportData ───────────────────────────────────────────
    const reportData: ReportData = {
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
      reviewUrl,
      qrUrl,
      description:       pack1.description       ?? '',
      posts:             (pack1.posts            ?? []) as string[],
      reviewResponses:   (pack1.reviewResponses  ?? []) as unknown[],
      responseTemplates: (pack1.responseTemplates ?? {}) as Record<string, unknown[]>,
      guideSteps:        (pack1.guideSteps       ?? []) as string[],
      actionPlan:        typeof pack1.actionPlan === 'string' ? pack1.actionPlan : String(pack1.actionPlan ?? ''),
      faq:        (pack2.faq        ?? []) as Array<{ q: string; a: string }>,
      services:   (pack2.services   ?? []) as Array<{ name: string; description: string }>,
      photoIdeas: (pack2.photoIdeas ?? []) as string[],
      calendar:   buildCalendar(12),
    }

    // ── 5. Génération PDF ────────────────────────────────────────────────────
    const pdfBuffer = await generateReportPDF(reportData)
    const filename  = `rapport-${realName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.pdf`

    // ── 6. Envoi email avec PDF en pièce jointe ──────────────────────────────
    await sendTransactional({
      to:      email,
      subject: `Votre dossier d'optimisation — ${realName}`,
      html: `
<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 20px;color:#1a1a1a;">
  <h2 style="font-size:20px;font-weight:800;margin:0 0 6px;">Votre dossier Google est prêt</h2>
  <p style="color:#6b7280;font-size:14px;margin:0 0 24px;">${realName} · ${realCity}</p>

  <p style="font-size:15px;color:#374151;line-height:1.7;margin:0 0 20px;">
    Vous trouverez en pièce jointe votre dossier complet d'optimisation Google Business Profile.
  </p>

  <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:16px;margin:0 0 24px;">
    <p style="font-size:13px;font-weight:700;color:#374151;margin:0 0 8px;">Ce que contient le PDF :</p>
    <ul style="font-size:13px;color:#6b7280;margin:0;padding-left:18px;line-height:2;">
      <li>Description Google professionnelle (150-200 mots)</li>
      <li>12 publications prêtes à copier-coller + calendrier 3 mois</li>
      <li>20 idées de photos adaptées à votre métier</li>
      <li>30 modèles de réponses aux avis classés par situation</li>
      <li>FAQ métier — 20 questions/réponses pour Google</li>
      <li>5 descriptions de services Google</li>
      <li>Guide de mise en ligne pas à pas</li>
      ${reviewUrl ? '<li>QR code avis Google + script SMS</li>' : ''}
      <li>Plan d'action prioritaire personnalisé</li>
    </ul>
  </div>

  <hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 20px;">
  <p style="color:#6b7280;font-size:13px;margin:0 0 4px;">Des questions ? Répondez directement à cet email.</p>
  <p style="color:#6b7280;font-size:13px;margin:0;"><strong>Brian · LocalBoost</strong></p>
</div>`,
      attachments: [{ filename, content: pdfBuffer }],
    })

    return NextResponse.json({ ok: true, name: realName, city: realCity })
  } catch (err) {
    console.error('test-delivery error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
