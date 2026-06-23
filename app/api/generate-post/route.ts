import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const rl = new Map<string, { count: number; resetAt: number }>()
function checkRL(ip: string) {
  const now = Date.now()
  const e = rl.get(ip)
  if (!e || now > e.resetAt) { rl.set(ip, { count: 1, resetAt: now + 60_000 }); return true }
  if (e.count >= 20) return false
  e.count++; return true
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (!checkRL(ip)) return NextResponse.json({ error: 'Trop de requêtes' }, { status: 429 })

  const { name, city, category, recentReview } = await req.json()
  if (!name || !city) return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })

  const postPrompt = `Tu es un expert en Google Business Profile. Rédige le prochain post Google de "${name}", ${category ?? 'artisan'} à ${city}.

Ce post sera publié cette semaine sur la vraie fiche Google de "${name}".

Contraintes strictes :
- 60 à 90 mots exactement
- Commence par une accroche directe liée au métier ou à une situation concrète (intervention, saison, conseil pratique)
- Mentionne "${city}" naturellement dans le texte
- Ton humain, authentique, comme si l'artisan écrit lui-même — pas de jargon marketing
- Termine par un appel à l'action court (appel ou devis)
- 2 ou 3 hashtags locaux à la fin (#${city.replace(/\s+/g, '')} #${category ?? 'artisan'})
- Aucun emoji excessif, au maximum 1

Réponds uniquement avec le post rédigé, rien d'autre.`

  const reviewPrompt = recentReview?.text ? `Tu es un expert en gestion de réputation Google. Rédige la réponse de "${name}" à cet avis client :

Auteur : ${recentReview.author}
Note : ${recentReview.rating}/5
Avis : "${recentReview.text}"
Date : ${recentReview.time}

Contraintes strictes :
- 40 à 70 mots
- Commence par remercier par le prénom si possible
- Mentionne un détail spécifique de l'avis pour montrer qu'on l'a lu
- Ton chaleureux, professionnel, humain
- Si note < 4 : reconnaître, ne pas justifier, proposer de recontacter
- Si note >= 4 : remercier, valoriser la confiance, inviter à revenir
- Signe avec le prénom du gérant ou le nom de l'établissement

Réponds uniquement avec la réponse rédigée, rien d'autre.` : null

  try {
    const [postMsg, reviewMsg] = await Promise.all([
      anthropic.messages.create({
        model:    'claude-haiku-4-5-20251001',
        max_tokens: 300,
        messages: [{ role: 'user', content: postPrompt }],
      }),
      reviewPrompt ? anthropic.messages.create({
        model:    'claude-haiku-4-5-20251001',
        max_tokens: 200,
        messages: [{ role: 'user', content: reviewPrompt }],
      }) : Promise.resolve(null),
    ])

    const post = (postMsg.content[0] as { text: string }).text.trim()
    const reviewResponse = reviewMsg
      ? (reviewMsg.content[0] as { text: string }).text.trim()
      : null

    return NextResponse.json({ post, reviewResponse })
  } catch (e) {
    console.error('Claude API error:', e)
    return NextResponse.json({ error: 'Génération impossible' }, { status: 500 })
  }
}
