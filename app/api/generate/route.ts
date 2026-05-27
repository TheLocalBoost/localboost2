import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

function getContext() {
  const now = new Date()
  const days = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi']
  const months = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']
  const seasons: Record<number, string> = { 0: 'hiver', 1: 'hiver', 2: 'printemps', 3: 'printemps', 4: 'printemps', 5: 'été', 6: 'été', 7: 'été', 8: 'automne', 9: 'automne', 10: 'automne', 11: 'hiver' }
  return { day: days[now.getDay()], month: months[now.getMonth()], season: seasons[now.getMonth()] }
}

function buildPrompt(type: string, profile: any, reviewText?: string, feedback?: string, previousVariants?: string[]) {
  const { day, month, season } = getContext()
  const feedbackSection = feedback && previousVariants ? `\nVARIANTES PRÉCÉDENTES :\n${previousVariants.map((v, i) => `${i + 1}. ${v}`).join('\n')}\nDEMANDE D'AMÉLIORATION : "${feedback}"\nTiens compte de cette demande pour générer de meilleures variantes.` : ''

  if (type === 'google') {
    return `Tu es un expert en marketing local français pour commerçants de proximité.

COMMERCE : ${profile.commerce_name}
VILLE : ${profile.city}
TYPE : ${profile.commerce_type}
SPÉCIALITÉS : ${profile.specialties}
TON : ${profile.tone}
CONTEXTE : ${day}, ${month} (${season})
${feedbackSection}

Génère 3 variantes de posts Google Business authentiques et efficaces.
- Écris comme un vrai commerçant local, pas une agence
- Produits SPÉCIFIQUES, pas "nos produits"
- Maximum 300 caractères, 1 emoji maximum
- Varie : 1 informatif, 1 émotionnel, 1 promotionnel
- Exploite le contexte saisonnier

Réponds UNIQUEMENT avec JSON valide sans markdown :
{"variants": ["post1", "post2", "post3"]}`
  }

  if (type === 'review') {
    return `Tu es un expert en relation client pour commerçants locaux français.

COMMERCE : ${profile.commerce_name}
VILLE : ${profile.city}
TYPE : ${profile.commerce_type}
TON : ${profile.tone}

AVIS CLIENT REÇU :
"${reviewText || 'Super expérience, je reviendrai !'}"
${feedbackSection}

Génère 3 réponses authentiques à cet avis.
- Réponds DIRECTEMENT au contenu de l'avis
- Mentionne un élément spécifique de l'avis
- Chaleureux et authentique comme le propriétaire
- 80-180 caractères, 1 emoji maximum

Réponds UNIQUEMENT avec JSON valide sans markdown :
{"variants": ["reponse1", "reponse2", "reponse3"]}`
  }

  return ''
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { type, reviewText, feedback, previousVariants } = await req.json()

    const { data: profile } = await supabase
      .from('merchant_profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (!profile) return NextResponse.json({ error: 'Profil commerce manquant' }, { status: 400 })

    const prompt = buildPrompt(type, profile, reviewText, feedback, previousVariants)

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    })

    const content = message.content[0]
    if (content.type !== 'text') throw new Error('Réponse inattendue')

    const clean = content.text.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)

    await supabase.from('generations').insert({
      user_id: user.id,
      type,
      content: parsed.variants[0],
    })

    return NextResponse.json({ variants: parsed.variants })
  } catch (err) {
    console.error('Generate error:', err)
    return NextResponse.json({ error: 'Erreur de génération' }, { status: 500 })
  }
}