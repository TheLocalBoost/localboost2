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

  const { name, city, category, problems } = await req.json()
  if (!name || !city) return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })

  const problemList = (problems ?? []).slice(0, 3).map((p: { text: string }) => `- ${p.text}`).join('\n')

  const prompt = `Tu es un expert en référencement local Google. Rédige la description Google Business Profile de "${name}", ${category ?? 'artisan'} à ${city}.

Cette description sera publiée demain matin sur la vraie fiche Google de "${name}".

Problèmes actuels de la fiche (à corriger implicitement dans la description) :
${problemList || '- Description absente'}

Contraintes strictes :
- 150 à 220 mots exactement
- Commence par le métier exercé et la ville, jamais par "Bienvenue" ou "Nous"
- Cite le nom "${name}" et la ville "${city}" dans les deux premières phrases (SEO local)
- Ton humain, direct, comme si un artisan parlait lui-même — pas de jargon marketing
- Un seul appel à l'action à la fin (appel téléphonique ou devis)
- Aucune mention des lacunes listées ci-dessus

Réponds uniquement avec la description rédigée, rien d'autre.`

  try {
    const msg = await anthropic.messages.create({
      model:      'claude-haiku-4-5-20251001',
      max_tokens: 400,
      messages:   [{ role: 'user', content: prompt }],
    })
    const description = (msg.content[0] as { text: string }).text.trim()
    return NextResponse.json({ description })
  } catch (e) {
    console.error('Claude API error:', e)
    return NextResponse.json({ error: 'Génération impossible' }, { status: 500 })
  }
}
