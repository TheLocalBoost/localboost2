import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import Anthropic from '@anthropic-ai/sdk'

const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY!

// Catégories de photos recommandées par Google Business
const CATEGORIES_BASE = [
  { id: 'facade',    label: 'Façade / devanture',      desc: 'L\'extérieur de votre établissement, de jour', required: true  },
  { id: 'interieur', label: 'Intérieur',                desc: 'L\'ambiance intérieure de votre commerce',     required: true  },
  { id: 'equipe',    label: 'Équipe / vous au travail', desc: 'Photos authentiques de vous ou de votre équipe', required: true },
  { id: 'produits',  label: 'Produits / prestations',  desc: 'Vos produits phares ou vos réalisations',      required: true  },
  { id: 'logo',      label: 'Logo',                    desc: 'Votre logo en haute résolution',                required: true  },
  { id: 'couverture',label: 'Photo de couverture',     desc: 'Image principale de votre fiche Google',       required: true  },
]

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data: lbProfile } = await supabase
    .from('localboost_profiles')
    .select('google_place_id, business_name, business_address')
    .eq('user_id', user.id)
    .single()

  if (!lbProfile?.google_place_id) {
    return NextResponse.json({ error: 'Fiche Google non configurée' }, { status: 400 })
  }

  // Récupérer les infos depuis Google Places
  const fields  = 'name,photos,types,user_ratings_total'
  const url     = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${lbProfile.google_place_id}&fields=${fields}&language=fr&key=${GOOGLE_API_KEY}`
  const details = await fetch(url).then(r => r.json())
  const place   = details.result ?? {}

  const photoCount = place.photos?.length ?? 0
  const types      = place.types ?? []

  // Déduire le secteur lisible
  const SECTOR_MAP: Record<string, string> = {
    plumber: 'plombier', electrician: 'électricien', car_repair: 'garagiste',
    hair_care: 'coiffeur', beauty_salon: 'salon de beauté', restaurant: 'restaurant',
    bakery: 'boulangerie', florist: 'fleuriste', gym: 'salle de sport',
    doctor: 'médecin', dentist: 'dentiste', lodging: 'hôtel',
  }
  const sector = types.map((t: string) => SECTOR_MAP[t]).find(Boolean) ?? 'commerce local'

  // Générer des suggestions IA personnalisées via Claude Haiku
  const anthropic = new Anthropic()
  let suggestions: string[] = []

  try {
    const response = await anthropic.messages.create({
      model:      'claude-haiku-4-5-20251001',
      max_tokens: 400,
      messages: [{
        role:    'user',
        content: `Tu es expert en Google Business Profile pour les TPE françaises.
Pour un(e) ${sector} nommé(e) "${lbProfile.business_name}", génère 6 idées de photos concrètes et percutantes à publier sur Google Business.
Chaque idée doit être spécifique au métier, actionnable, et améliorer la confiance des clients potentiels.
Réponds UNIQUEMENT en JSON : ["idée 1", "idée 2", "idée 3", "idée 4", "idée 5", "idée 6"]`,
      }],
    })
    const text  = response.content[0].type === 'text' ? response.content[0].text : '[]'
    const match = text.match(/\[[\s\S]*\]/)
    if (match) suggestions = JSON.parse(match[0])
  } catch {
    suggestions = [
      `Photo de votre devanture avec une belle lumière naturelle`,
      `Vous en plein travail — authentique et professionnel`,
      `Avant / après d'une réalisation récente`,
      `Votre matériel ou vos produits mis en valeur`,
      `Photo d'équipe souriante`,
      `Zoom sur un détail de qualité de votre travail`,
    ]
  }

  // Score photos
  const scorePhotos =
    photoCount === 0 ? 0 :
    photoCount < 3   ? 20 :
    photoCount < 5   ? 50 :
    photoCount < 10  ? 75 : 100

  return NextResponse.json({
    photoCount,
    scorePhotos,
    sector,
    suggestions,
    categories:    CATEGORIES_BASE,
    businessName:  lbProfile.business_name,
    placeId:       lbProfile.google_place_id,
    conseil:       photoCount < 5
      ? `Vous avez seulement ${photoCount} photo${photoCount > 1 ? 's' : ''}. Les fiches avec 10+ photos reçoivent 35% plus de clics.`
      : photoCount < 10
      ? `Bien — ${photoCount} photos. Visez 10+ pour maximiser votre visibilité.`
      : `Excellent — ${photoCount} photos actives sur votre fiche.`,
  })
}
