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

  const cat = category ?? 'artisan'

  const descriptionPrompt = `Tu es un expert SEO Google Business Profile. Rédige la description Google optimisée de "${name}", ${cat} à ${city}.

Contraintes strictes :
- 150 à 200 mots
- 1ère phrase : mentionne le métier ET la ville (ex: "Plombier à Lyon depuis 2008, ...")
- Intègre naturellement : services principaux, zone d'intervention, atouts différenciants
- Utilise 2 ou 3 expressions de recherche locale (ex: "plombier urgence Lyon", "dépannage Lyon 69")
- Ton professionnel mais humain, pas de jargon marketing
- Dernière phrase : appel à l'action (devis gratuit, contact, etc.)
- Aucun emoji

Réponds uniquement avec la description, rien d'autre.`

  const makePostPrompt = (angle: string) => `Tu es un expert Google Business Profile. Rédige un post Google pour "${name}", ${cat} à ${city}.

Angle : ${angle}

Contraintes :
- 60 à 90 mots
- Accroche directe liée au métier ou à une situation concrète
- Mentionne "${city}" naturellement
- Ton humain, authentique — comme si le professionnel écrit lui-même
- Fin : appel à l'action court (appel ou devis)
- 2 hashtags locaux (#${city.replace(/\s+/g, '')} #${cat.replace(/\s+/g, '')})
- Maximum 1 emoji

Réponds uniquement avec le post, rien d'autre.`

  const categoriesPrompt = `Pour "${name}", ${cat} à ${city}, liste 5 catégories Google Business Profile secondaires pertinentes à ajouter (pas la catégorie principale).

Utilise les libellés officiels Google Business en français.
Réponds avec uniquement 5 catégories, une par ligne, sans numérotation ni tiret.`

  const reviewPrompt = recentReview?.text
    ? `Tu es un expert réputation Google. Rédige la réponse de "${name}" à cet avis :

Auteur : ${recentReview.author}
Note : ${recentReview.rating}/5
Avis : "${recentReview.text}"

Contraintes :
- 40 à 70 mots
- Commence par remercier par le prénom si possible
- Mentionne un détail spécifique de l'avis
- Ton chaleureux et professionnel
- Si note < 4 : reconnaître sans justifier, proposer de recontacter
- Signe avec le nom de l'établissement

Réponds uniquement avec la réponse, rien d'autre.`
    : null

  try {
    const calls = [
      anthropic.messages.create({ model: 'claude-haiku-4-5-20251001', max_tokens: 400, messages: [{ role: 'user', content: descriptionPrompt }] }),
      anthropic.messages.create({ model: 'claude-haiku-4-5-20251001', max_tokens: 300, messages: [{ role: 'user', content: makePostPrompt('conseil pratique de saison ou situation du quotidien') }] }),
      anthropic.messages.create({ model: 'claude-haiku-4-5-20251001', max_tokens: 300, messages: [{ role: 'user', content: makePostPrompt('prestation réalisée récemment ou témoignage client') }] }),
      anthropic.messages.create({ model: 'claude-haiku-4-5-20251001', max_tokens: 200, messages: [{ role: 'user', content: categoriesPrompt }] }),
      reviewPrompt
        ? anthropic.messages.create({ model: 'claude-haiku-4-5-20251001', max_tokens: 200, messages: [{ role: 'user', content: reviewPrompt }] })
        : Promise.resolve(null),
    ] as const

    const [descMsg, post1Msg, post2Msg, catMsg, reviewMsg] = await Promise.all(calls)

    const description    = (descMsg.content[0]   as { text: string }).text.trim()
    const post1          = (post1Msg.content[0]  as { text: string }).text.trim()
    const post2          = (post2Msg.content[0]  as { text: string }).text.trim()
    const categoriesRaw  = (catMsg.content[0]    as { text: string }).text.trim()
    const reviewResponse = reviewMsg ? (reviewMsg.content[0] as { text: string }).text.trim() : null

    const categories = categoriesRaw.split('\n').map(l => l.trim()).filter(Boolean).slice(0, 5)

    return NextResponse.json({ description, posts: [post1, post2], reviewResponse, categories })
  } catch (e) {
    console.error('Claude API error:', e)
    return NextResponse.json({ error: 'Génération impossible' }, { status: 500 })
  }
}
