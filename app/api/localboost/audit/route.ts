import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY!

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data: lbProfile } = await supabase
    .from('localboost_profiles')
    .select('google_place_id, business_name')
    .eq('user_id', user.id)
    .single()

  if (!lbProfile?.google_place_id) {
    return NextResponse.json({ error: 'Fiche Google non configurée' }, { status: 400 })
  }

  // Google Places Details — champs pour l'audit
  const fields = [
    'name', 'formatted_address', 'formatted_phone_number',
    'opening_hours', 'website', 'rating', 'user_ratings_total',
    'photos', 'types', 'editorial_summary', 'business_status',
  ].join(',')

  const url  = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${lbProfile.google_place_id}&fields=${fields}&language=fr&key=${GOOGLE_API_KEY}`
  const data = await fetch(url).then(r => r.json())
  const p    = data.result ?? {}

  // ─── Checklist de complétude ─────────────────────────────────────────────
  const checklist = [
    {
      id:      'name',
      label:   'Nom de l\'établissement',
      ok:      !!p.name,
      impact:  'élevé',
      action:  'Vérifiez que le nom correspond exactement à votre enseigne.',
    },
    {
      id:      'address',
      label:   'Adresse complète',
      ok:      !!p.formatted_address,
      impact:  'élevé',
      action:  'Ajoutez votre adresse complète dans Google Business.',
    },
    {
      id:      'phone',
      label:   'Numéro de téléphone',
      ok:      !!p.formatted_phone_number,
      impact:  'élevé',
      action:  'Ajoutez votre numéro de téléphone — c\'est le 1er point de contact des clients.',
    },
    {
      id:      'hours',
      label:   'Horaires d\'ouverture',
      ok:      !!(p.opening_hours?.periods?.length),
      impact:  'élevé',
      action:  'Renseignez vos horaires — un client sans info horaire ira chez un concurrent.',
    },
    {
      id:      'website',
      label:   'Site web renseigné',
      ok:      !!p.website,
      impact:  'moyen',
      action:  'Ajoutez l\'URL de votre site web (même une page Facebook ou Instagram).',
    },
    {
      id:      'description',
      label:   'Description du commerce',
      ok:      !!p.editorial_summary?.overview,
      impact:  'moyen',
      action:  'Rédigez une description de 150–300 mots avec vos mots-clés principaux.',
    },
    {
      id:      'photos',
      label:   'Photos (minimum 5)',
      ok:      (p.photos?.length ?? 0) >= 5,
      impact:  'moyen',
      action:  'Ajoutez au moins 5 photos de qualité : devanture, intérieur, équipe, réalisations.',
    },
    {
      id:      'reviews_20',
      label:   '20 avis ou plus',
      ok:      (p.user_ratings_total ?? 0) >= 20,
      impact:  'élevé',
      action:  'Demandez des avis à vos clients satisfaits — utilisez l\'outil "Collecter des avis".',
    },
    {
      id:      'rating_4',
      label:   'Note ≥ 4.0/5',
      ok:      (p.rating ?? 0) >= 4.0,
      impact:  'élevé',
      action:  'Répondez aux avis négatifs et encouragez vos clients satisfaits à laisser un avis.',
    },
  ]

  const score   = Math.round((checklist.filter(c => c.ok).length / checklist.length) * 100)
  const missing = checklist.filter(c => !c.ok)

  return NextResponse.json({
    place: {
      name:    p.name,
      address: p.formatted_address,
      phone:   p.formatted_phone_number,
      website: p.website,
      rating:  p.rating,
      reviews: p.user_ratings_total,
      photos:  p.photos?.length ?? 0,
      hours:   p.opening_hours?.weekday_text ?? [],
    },
    score,
    checklist,
    missing,
  })
}
