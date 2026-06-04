export const SECTEURS: Record<string, { label: string; labelPluriel: string; description: string; urgence: string }> = {
  boulangerie: {
    label: 'boulangerie',
    labelPluriel: 'boulangeries',
    description: 'Les clients cherchent une boulangerie ouverte le matin avant d\'aller travailler.',
    urgence: 'Un horaire incorrect sur votre fiche Google et ils vont chez le concurrent.',
  },
  plombier: {
    label: 'plombier',
    labelPluriel: 'plombiers',
    description: 'En cas de fuite, les clients appellent le premier plombier trouvé sur Google Maps.',
    urgence: 'Si votre fiche n\'est pas optimisée, cet appel va à votre concurrent.',
  },
  electricien: {
    label: 'électricien',
    labelPluriel: 'électriciens',
    description: 'Les demandes d\'électriciens viennent majoritairement de Google Maps.',
    urgence: 'Le premier résultat reçoit 70% des appels.',
  },
  coiffeur: {
    label: 'coiffeur',
    labelPluriel: 'coiffeurs',
    description: 'Le samedi matin, des dizaines de personnes cherchent un coiffeur disponible près de chez elles.',
    urgence: 'Votre fiche doit afficher vos horaires, vos photos et permettre d\'appeler en un clic.',
  },
  restaurant: {
    label: 'restaurant',
    labelPluriel: 'restaurants',
    description: 'Avant de réserver, les clients comparent les fiches Google des restaurants.',
    urgence: 'Photos, note, horaires — si un élément manque, ils choisissent un autre établissement.',
  },
  garage: {
    label: 'garage automobile',
    labelPluriel: 'garages automobiles',
    description: 'Les clients cherchent un garage de confiance sur Google Maps avant d\'appeler.',
    urgence: 'Un garage avec une fiche complète obtient 3x plus d\'appels qu\'un garage sans photos.',
  },
  pharmacie: {
    label: 'pharmacie',
    labelPluriel: 'pharmacies',
    description: 'En urgence, les patients cherchent une pharmacie ouverte sur Google Maps.',
    urgence: 'Des horaires incorrects sur votre fiche et le patient va ailleurs.',
  },
  hotel: {
    label: 'hôtel',
    labelPluriel: 'hôtels',
    description: 'Les voyageurs comparent les hôtels sur Google Maps avant de réserver.',
    urgence: 'Une fiche incomplète fait perdre des réservations directes chaque semaine.',
  },
  fleuriste: {
    label: 'fleuriste',
    labelPluriel: 'fleuristes',
    description: 'Pour les occasions importantes, les clients cherchent un fleuriste en urgence sur Google.',
    urgence: 'Le premier fleuriste avec une fiche complète et des photos reçoit l\'appel.',
  },
  opticien: {
    label: 'opticien',
    labelPluriel: 'opticiens',
    description: 'Les clients comparent les opticiens sur Google Maps avant de se déplacer.',
    urgence: 'Photos, horaires, avis récents — chaque élément manquant coûte des visites.',
  },
  dentiste: {
    label: 'dentiste',
    labelPluriel: 'dentistes',
    description: 'Les nouveaux patients cherchent un dentiste sur Google Maps avant de prendre rendez-vous.',
    urgence: 'Un cabinet sans avis récents perd des patients au profit de confrères mieux référencés.',
  },
  medecin: {
    label: 'médecin',
    labelPluriel: 'médecins',
    description: 'Les patients cherchent un médecin disponible sur Google avant d\'appeler.',
    urgence: 'Un médecin avec une fiche à jour attire davantage de nouveaux patients.',
  },
}

export const VILLES = [
  'Paris', 'Marseille', 'Lyon', 'Toulouse', 'Nice', 'Nantes', 'Montpellier', 'Strasbourg',
  'Bordeaux', 'Lille', 'Rennes', 'Reims', 'Saint-Étienne', 'Le Havre', 'Toulon', 'Grenoble',
  'Dijon', 'Angers', 'Nîmes', 'Villeurbanne', 'Le Mans', 'Aix-en-Provence', 'Clermont-Ferrand',
  'Brest', 'Tours', 'Amiens', 'Limoges', 'Annecy', 'Perpignan', 'Boulogne-Billancourt',
  'Metz', 'Besançon', 'Orléans', 'Rouen', 'Argenteuil', 'Mulhouse', 'Montreuil', 'Caen',
  'Nancy', 'Roubaix', 'Tourcoing', 'Nanterre', 'Avignon', 'Créteil', 'Dunkerque', 'Poitiers',
  'Versailles', 'Courbevoie', 'Vitry-sur-Seine', 'Colombes', 'Aulnay-sous-Bois', 'Asnières-sur-Seine',
  'Rueil-Malmaison', 'Pau', 'Champigny-sur-Marne', 'La Rochelle', 'Saint-Denis', 'Mérignac',
  'Calais', 'Antibes', 'Cannes', 'Beziers', 'Valence', 'Bourges', 'Quimper', 'Lorient',
  'Troyes', 'Ajaccio', 'Massy', 'Évry', 'Levallois-Perret', 'Cergy', 'Issy-les-Moulineaux',
  'Noisy-le-Grand', 'Vénissieux', 'Pessac', 'Ivry-sur-Seine', 'Clichy', 'Saint-Nazaire',
  'Chambéry', 'Niort', 'Toulon', 'Villepinte', 'Laval', 'Belfort', 'Bayonne', 'Biarritz',
  'Hyères', 'Quimper', 'Vannes', 'Chartres', 'Auxerre', 'Arras', 'Cambrai', 'Valenciennes',
  'Lens', 'Béziers', 'Fréjus', 'Gap', 'Thionville', 'Colmar', 'Épinal', 'Charleville-Mézières',
  'Châlon-sur-Saône', 'Mâcon', 'Bourg-en-Bresse', 'Annemasse', 'Thonon-les-Bains', 'Évreux',
  'Cherbourg', 'Alençon', 'Saint-Brieuc', 'Brest', 'Quimper', 'Lorient', 'Vannes', 'Rennes',
  'Caen', 'Rouen', 'Le Havre', 'Amiens', 'Lille', 'Dunkerque', 'Calais', 'Arras',
  'Reims', 'Troyes', 'Châlons-en-Champagne', 'Metz', 'Nancy', 'Strasbourg', 'Mulhouse',
  'Colmar', 'Dijon', 'Besançon', 'Belfort', 'Lyon', 'Grenoble', 'Annecy', 'Chambéry',
  'Valence', 'Bordeaux', 'Pau', 'Bayonne', 'Agen', 'Périgueux', 'Angoulême', 'Poitiers',
  'La Rochelle', 'Niort', 'Limoges', 'Clermont-Ferrand', 'Aurillac', 'Moulins', 'Vichy',
  'Montluçon', 'Roanne', 'Saint-Étienne', 'Villefranche-sur-Saône', 'Béziers', 'Perpignan',
  'Montpellier', 'Nîmes', 'Avignon', 'Aix-en-Provence', 'Marseille', 'Toulon', 'Nice',
  'Cannes', 'Antibes', 'Grasse', 'Fréjus', 'Draguignan', 'Ajaccio', 'Bastia',
  'Toulouse', 'Albi', 'Castres', 'Tarbes', 'Lourdes', 'Nantes', 'Angers', 'Le Mans',
  'Tours', 'Orléans', 'Chartres', 'Bourges', 'Paris', 'Versailles', 'Argenteuil',
  'Boulogne-Billancourt', 'Montreuil', 'Nanterre', 'Créteil', 'Vincennes', 'Pantin',
  'Aubervilliers', 'Bobigny', 'Champigny-sur-Marne', 'Vitry-sur-Seine', 'Ivry-sur-Seine',
  'Fontenay-sous-Bois', 'Neuilly-sur-Seine', 'Levallois-Perret', 'Issy-les-Moulineaux',
  'Clichy', 'Colombes', 'Courbevoie', 'Asnières-sur-Seine', 'Rueil-Malmaison',
]

// Déduplique et nettoie
export const VILLES_UNIQUES = [...new Set(VILLES)].sort()

export function slugify(str: string) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function unslugify(slug: string) {
  // Trouve la ville correspondante au slug
  return VILLES_UNIQUES.find(v => slugify(v) === slug) || slug
}
