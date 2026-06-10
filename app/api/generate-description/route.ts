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

  const prompt = `Tu es un expert en référencement local Google. Rédige une description Google Business Profile pour cet établissement.

Établissement : ${name}
Ville : ${city}
Secteur : ${category ?? 'artisan'}
Problèmes actuels de la fiche :
${problemList || '- Description manquante'}

Contraintes :
- Entre 150 et 220 mots
- Commence directement par le service (pas "Bienvenue chez" ou "Nous sommes")
- Inclure le nom de la ville et le secteur pour le référencement local
- Ton professionnel mais humain, pas corporate
- Terminer par un appel à l'action simple (appel, visite, devis)
- Ne pas mentionner les problèmes listés ci-dessus

Réponds uniquement avec la description, rien d'autre.`

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
