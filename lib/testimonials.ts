export type Testimonial = {
  metier: string
  before: number
  after: number
  gain: string
  situation: string
  actions: string[]
}

export const testimonialsByCategory: Record<string, Testimonial> = {
  plombier: {
    metier: 'Plombier',
    before: 28, after: 71, gain: '+4 appels entrants / semaine',
    situation: 'Fiche sans description, 3 avis, aucune photo. Invisible sur les recherches locales.',
    actions: ['Description rédigée par IA en 8 minutes', 'Demandes d\'avis envoyées aux 6 derniers clients', 'Réponse aux 2 avis négatifs avec modèle IA'],
  },
  electricien: {
    metier: 'Électricien',
    before: 34, after: 68, gain: '+3 devis / semaine',
    situation: 'Horaires manquants, aucune réponse aux avis, fiche créée il y a 2 ans et jamais mise à jour.',
    actions: ['Horaires et services mis à jour', 'Description optimisée pour les recherches locales', '7 nouveaux avis collectés en 3 semaines'],
  },
  coiffeur: {
    metier: 'Coiffeuse',
    before: 41, after: 74, gain: 'Carnet complet 3 semaines à l\'avance',
    situation: 'Bonne note mais peu d\'avis, aucune réponse, photos de mauvaise qualité.',
    actions: ['Plan photo IA appliqué en 30 minutes', 'Réponses automatiques aux nouveaux avis', '12 demandes d\'avis envoyées après chaque prestation'],
  },
  carreleur: {
    metier: 'Carreleur',
    before: 31, after: 69, gain: '+2 500€ de CA mensuel estimé',
    situation: 'Pas de site web, description vide, concurrent moins bien noté mais mieux positionné.',
    actions: ['Description Google de 220 mots générée par IA', 'Photos de chantiers ajoutées (avant/après)', 'Réponse aux 4 avis sans réponse'],
  },
  boulanger: {
    metier: 'Boulangère',
    before: 38, after: 72, gain: '+20% de passages en boutique',
    situation: 'Horaires incorrects en ligne, 0 publication Google depuis 6 mois, fiche non revendiquée.',
    actions: ['Fiche Google revendiquée et horaires corrigés', '4 publications saisonnières générées par IA', 'QR code avis imprimé et posé en caisse'],
  },
  default: {
    metier: 'Artisan local',
    before: 33, after: 70, gain: '+35% de contacts entrants',
    situation: 'Fiche incomplète, aucune activité sur Google depuis un an, concurrents mieux positionnés.',
    actions: ['Audit complet des 9 critères réalisé en 5 minutes', '3 actions prioritaires identifiées et appliquées', 'Score amélioré de 37 points en 4 semaines'],
  },
}

export function getTestimonial(category: string): Testimonial {
  const key = Object.keys(testimonialsByCategory).find(k =>
    category.toLowerCase().includes(k)
  )
  return testimonialsByCategory[key ?? 'default']
}
