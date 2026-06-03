export type Testimonial = {
  name: string
  city: string
  metier: string
  before: number
  after: number
  gain: string
  quote: string
}

export const testimonialsByCategory: Record<string, Testimonial> = {
  plombier: {
    name: 'Marc D.', city: 'Bordeaux', metier: 'Plombier',
    before: 28, after: 71, gain: '+4 appels par semaine',
    quote: 'Je savais pas que ma fiche était dans cet état. En 3 semaines j\'ai eu 4 appels de plus par semaine.',
  },
  electricien: {
    name: 'Thomas R.', city: 'Nantes', metier: 'Électricien',
    before: 34, after: 68, gain: '+3 devis par semaine',
    quote: 'La description rédigée par l\'IA m\'a surpris. Elle parle mieux de mon activité que ce que j\'aurais écrit moi-même.',
  },
  coiffeur: {
    name: 'Sophie L.', city: 'Lyon', metier: 'Coiffeuse',
    before: 41, after: 74, gain: 'carnet plein 3 semaines',
    quote: 'La partie réponse aux avis m\'a sauvé la mise. Je répondais jamais avant, maintenant c\'est automatique.',
  },
  carreleur: {
    name: 'Karim B.', city: 'Marseille', metier: 'Carreleur',
    before: 31, after: 69, gain: '+2 500€ de CA mensuel',
    quote: '29€ par mois pour gagner 3 ou 4 chantiers en plus, c\'est rentabilisé en une heure de travail.',
  },
  boulanger: {
    name: 'Isabelle M.', city: 'Strasbourg', metier: 'Boulangère',
    before: 38, after: 72, gain: '+20% de passages en boutique',
    quote: 'On pensait que Google Maps c\'était pour les restaurants. On avait tort.',
  },
  default: {
    name: 'Julien F.', city: 'Paris', metier: 'Artisan',
    before: 33, after: 70, gain: '+35% de contacts entrants',
    quote: 'En moins d\'un mois mon téléphone a recommencé à sonner pour de nouveaux clients.',
  },
}

export function getTestimonial(category: string): Testimonial {
  const key = Object.keys(testimonialsByCategory).find(k =>
    category.toLowerCase().includes(k)
  )
  return testimonialsByCategory[key ?? 'default']
}
