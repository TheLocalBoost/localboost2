import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { description, metier } = await req.json()
  if (!description) return NextResponse.json({ error: 'Description requise' }, { status: 400 })

  const { data: profile } = await supabase
    .from('devisboost_profiles')
    .select('metier, payment_conditions')
    .eq('user_id', user.id)
    .single()

  const metierLabel = metier || profile?.metier || 'artisan'

  const prompt = `Tu es un expert en chiffrage de travaux BTP en France.
Tu génères des devis professionnels précis et réalistes pour des artisans français.
Les prix doivent être cohérents avec le marché français en 2026.
Réponds UNIQUEMENT en JSON valide, sans texte avant ou après.

ARTISAN : ${metierLabel}
CHANTIER DÉCRIT : ${description}

Génère un devis complet avec ce format exact :
{
  "titre": "string (titre court et professionnel du devis)",
  "lignes": [
    {
      "description": "string (description précise de la prestation)",
      "quantite": number,
      "unite": "string (m², ml, h, forfait, u, m³, etc.)",
      "prix_unitaire_ht": number,
      "total_ht": number
    }
  ],
  "total_ht": number,
  "tva_taux": 10,
  "tva_montant": number,
  "total_ttc": number,
  "delai_jours": number,
  "notes": "string (conseils, précisions techniques)"
}

Règles importantes :
- TVA 10% pour travaux de rénovation, 20% pour construction neuve
- Prix HT cohérents avec le marché français 2026
- Au moins 4 lignes de détail, maximum 12
- Délai en jours ouvrés réaliste
- total_ht doit être la somme exacte des total_ht de chaque ligne
- tva_montant = total_ht × tva_taux / 100
- total_ttc = total_ht + tva_montant`

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }],
  })

  const content = message.content[0]
  if (content.type !== 'text') return NextResponse.json({ error: 'Erreur IA' }, { status: 500 })

  const clean = content.text.replace(/```json|```/g, '').trim()
  const devis = JSON.parse(clean)

  return NextResponse.json(devis)
}
