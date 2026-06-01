import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic()

const PROMPTS: Record<string, (b: { name: string; address: string; phone?: string; website?: string }) => string> = {
  description: (b) => `Tu es expert en Google Business Profile pour les TPE françaises.
Rédige une description Google Business pour "${b.name}" situé à ${b.address}.
Contraintes :
- 200 à 280 mots
- Commence par le type d'activité et la zone géographique
- Inclure les mots-clés naturellement (pas de liste)
- Ton professionnel mais chaleureux
- Termine par un appel à l'action (devis gratuit, prise de contact...)
- AUCUN hashtag, AUCUNE majuscule abusive
Réponds UNIQUEMENT avec la description, sans commentaire.`,

  avis20: (b) => `Tu es expert en relation client pour artisans français.
Rédige un email de demande d'avis Google pour "${b.name}".
Contraintes :
- Court (6-8 lignes max)
- Ton sincère et humain, pas commercial
- Mentionne que ça prend 30 secondes
- Inclure [NOM_CLIENT] et [PRESTATION] comme variables
- Inclure [LIEN_AVIS] pour le bouton
- Objet de l'email inclus en première ligne sous la forme "Objet : ..."
Réponds UNIQUEMENT avec l'email complet (objet + corps), sans commentaire.`,

  note4: (b) => `Tu es expert en gestion de réputation pour TPE françaises.
Rédige 3 réponses types aux avis négatifs pour "${b.name}".
Pour chaque réponse :
- Commence par remercier le client d'avoir pris le temps
- Reconnaître la déception sans admettre de faute systématique
- Proposer de résoudre en privé (email ou téléphone${b.phone ? ` : ${b.phone}` : ''})
- Ton professionnel et empathique
- Maximum 4-5 lignes par réponse
Format : "Réponse 1 :", "Réponse 2 :", "Réponse 3 :"
Réponds UNIQUEMENT avec les 3 réponses, sans commentaire.`,

  photos: (b) => `Tu es expert en marketing visuel pour artisans français.
Crée un plan photo complet pour "${b.name}" (${b.address}).
Pour chaque photo (minimum 10) donne :
- Le sujet exact à photographier
- Le moment idéal (heure, lumière, contexte)
- Pourquoi cette photo attire des clients

Organise par ordre de priorité. Sois très concret et spécifique au métier.
Réponds UNIQUEMENT avec le plan photo, sans introduction ni commentaire.`,

  horaires: (b) => `Tu es consultant en développement commercial pour TPE françaises.
Pour "${b.name}" (${b.address}), propose les horaires d'ouverture optimaux à afficher sur Google Business.
Prends en compte :
- Le type d'activité détecté depuis le nom et l'adresse
- Les habitudes des clients en France
- La concurrence locale

Donne :
1. Les horaires recommandés (lundi-dimanche)
2. 3 raisons concrètes pourquoi ces horaires maximisent les appels entrants
3. Comment les saisir sur Google Business (étapes simples)
Réponds directement, sans introduction.`,

  telephone: (b) => `Pour "${b.name}", rédige un message court (3-4 lignes) qui explique à l'artisan pourquoi ajouter son numéro de téléphone sur Google Business est urgent, avec un exemple chiffré de l'impact sur les appels entrants. Puis donne les 3 étapes exactes pour l'ajouter. Ton direct et motivant.`,

  site: (b) => `Pour "${b.name}" (${b.address}), rédige un message court qui explique pourquoi avoir un lien web sur sa fiche Google est important, même si c'est une page simple. Puis propose 3 options concrètes classées par difficulté (de la plus rapide à la plus complète) pour créer une présence web minimale sans compétences techniques. Inclure des outils gratuits ou peu chers. Ton pratique et encourageant.`,

  premiere_demande: (b) => `Tu es expert en relation client pour artisans français.
Rédige un email de demande d'avis Google pour "${b.name}" — c'est le PREMIER email que cet artisan va envoyer à ses clients.
Contraintes :
- Court (6-8 lignes max), ton sincère et humain
- Mentionne que ça prend 30 secondes
- Variables : [NOM_CLIENT], [PRESTATION], [LIEN_AVIS]
- Objet de l'email en première ligne : "Objet : ..."
- Inspire confiance, pas commercial
Ensuite, donne 3 conseils courts pour maximiser le taux de réponse sur les premières demandes.
Réponds UNIQUEMENT avec l'email + les conseils, sans commentaire.`,

  conversion_nulle: (b) => `Tu es expert en relation client pour artisans français.
"${b.name}" a envoyé des demandes d'avis à ses clients mais n'a obtenu aucune réponse.
Analyse les 3 raisons les plus probables pour un artisan en France et propose :
1. Une version améliorée de l'objet d'email (plus engageant)
2. Une version améliorée du corps du message (plus court, plus direct)
3. 2 conseils sur le timing d'envoi (quel moment envoyer pour maximiser l'ouverture)
Variables à utiliser : [NOM_CLIENT], [PRESTATION], [LIEN_AVIS]
Réponds directement avec les améliorations concrètes, sans introduction.`,
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { priority } = await req.json()
  if (!PROMPTS[priority]) return NextResponse.json({ error: 'Priorité inconnue' }, { status: 400 })

  const { data: profile } = await supabase
    .from('localboost_profiles')
    .select('business_name, business_address, business_phone, business_website')
    .eq('user_id', user.id)
    .single()

  if (!profile?.business_name) return NextResponse.json({ error: 'Fiche non configurée' }, { status: 400 })

  const prompt = PROMPTS[priority]({
    name:    profile.business_name,
    address: profile.business_address ?? '',
    phone:   profile.business_phone ?? undefined,
    website: profile.business_website ?? undefined,
  })

  const response = await anthropic.messages.create({
    model:      'claude-haiku-4-5-20251001',
    max_tokens: 600,
    messages: [{ role: 'user', content: prompt }],
  })

  const content = response.content[0].type === 'text' ? response.content[0].text : ''
  return NextResponse.json({ content })
}
