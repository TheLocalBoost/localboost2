import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const APP_URL = 'https://thelocalboost.fr'

// ── 100 variantes distinctes ─────────────────────────────────────────────────

type Fn = (nom: string, secteur: string, ville: string) => string

interface Variant { subject: Fn; hook: Fn; cta: Fn }

const DEFAULT_CTA: Fn = (n, s, v) => `Voir mon analyse gratuite de votre fiche →`

const VARIANTS: Variant[] = [
  // 0-9 : Angle "test depuis téléphone"
  {
    subject: (n) => `${n} — j'ai fait le test`,
    hook: (n, s, v) => `J'ai tapé "${s} ${v}" sur Google Maps ce matin. Vous apparaissez — mais votre fiche ne raconte pas votre histoire. En 15 secondes, un client décide de vous appeler ou de passer à la suivante. Je vous montre ce qu'il voit exactement.`,
    cta: (n, s, v) => `Voir ce que voient vos clients →`,
  },
  {
    subject: () => `Ce que voient vos clients avant d'entrer`,
    hook: (n, s, v) => `Avant de pousser votre porte, vos clients vous ont déjà jugé. Ils ont regardé vos photos, lu vos avis, vérifié vos horaires — tout ça en moins de 20 secondes. J'ai fait le même parcours sur votre fiche. Il y a des choses à corriger.`,
    cta: DEFAULT_CTA,
  },
  {
    subject: (n) => `${n} : j'ai cherché depuis mon canapé`,
    hook: (n, s, v) => `Hier soir, j'ai cherché "${s} ${v}" depuis mon téléphone comme le ferait n'importe quel client. Vous apparaissez — mais trois éléments de votre fiche font que la plupart des gens cliquent ailleurs avant même de lire votre description.`,
    cta: (n, s, v) => `Voir les 3 éléments à corriger →`,
  },
  {
    subject: (n, s, v) => `Test rapide sur "${s} ${v}"`,
    hook: (n, s, v) => `J'ai simulé le parcours d'un nouveau client cherchant ${s} à ${v}. Résultat : votre fiche a de vrais atouts, mais elle rate la première impression — celle qui déclenche ou non l'appel. Je vous détaille ce que j'ai trouvé.`,
    cta: (n, s, v) => `Voir le résultat de mon test →`,
  },
  {
    subject: () => `J'ai fait semblant d'être votre client`,
    hook: (n, s, v) => `J'ai fait comme si j'avais besoin d'un ${s} à ${v} et je n'avais aucune recommandation. Google Maps, je compare les fiches, je lis, je choisis. Votre fiche m'a attiré mais m'a aussi laissé sur ma faim sur deux points précis.`,
    cta: (n, s, v) => `Voir ce que j'ai trouvé →`,
  },
  {
    subject: (n) => `${n} — 8 secondes pour convaincre`,
    hook: (n, s, v) => `C'est le temps moyen qu'un client passe sur une fiche Google avant de décider. Votre fiche réussit à retenir l'attention — mais elle ne convainc pas encore. Il manque 2 ou 3 signaux précis que les algorithmes et les clients recherchent.`,
    cta: DEFAULT_CTA,
  },
  {
    subject: (n, s, v) => `Ce que Google Maps montre de ${n}`,
    hook: (n, s, v) => `J'ai ouvert votre fiche Google Maps ce matin comme si j'étais un inconnu à ${v} cherchant un ${s}. Ce que j'ai vu n'est pas mauvais — mais ce que je n'ai pas vu m'a poussé à regarder la fiche suivante.`,
    cta: (n, s, v) => `Voir ce qui manque sur votre fiche →`,
  },
  {
    subject: () => `La première impression que vous laissez sur Google`,
    hook: (n, s, v) => `Sur Google Maps, vous n'avez pas deux chances de faire une bonne première impression. J'ai regardé la vôtre. Il y a des points forts — et deux lacunes que des concurrents exploitent probablement sans que vous le sachiez.`,
    cta: DEFAULT_CTA,
  },
  {
    subject: (n) => `${n} vu de l'extérieur`,
    hook: (n, s, v) => `J'ai regardé votre établissement comme le ferait quelqu'un qui ne vous connaît pas — uniquement via Google. La note parle en votre faveur. Mais la fiche elle-même ne capitalise pas encore sur ce que vous avez réellement à offrir.`,
    cta: (n, s, v) => `Voir mon analyse →`,
  },
  {
    subject: (n, s, v) => `"${s} ${v}" — votre position sur Google`,
    hook: (n, s, v) => `J'ai regardé les résultats pour "${s} ${v}". Votre position actuelle ne reflète pas ce que vous valez réellement — il y a une marge d'amélioration concrète et rapide. Je vous la montre.`,
    cta: (n, s, v) => `Voir comment améliorer votre position →`,
  },

  // 10-19 : Angle "concurrent"
  {
    subject: (n, s, v) => `Vos concurrents à ${v} ont une longueur d'avance`,
    hook: (n, s, v) => `J'ai comparé votre fiche Google avec les ${s} qui ressortent en tête à ${v}. La différence n'est pas dans la qualité du service — c'est dans la façon dont la fiche est présentée. Quelques changements, et vous remontez.`,
    cta: (n, s, v) => `Voir la comparaison →`,
  },
  {
    subject: () => `Votre concurrent fait quelque chose que vous ne faites pas`,
    hook: (n, s, v) => `Le ${s} qui apparaît juste avant vous sur Google Maps à ${v} n'est pas nécessairement meilleur que vous. Il a juste une fiche optimisée sur des critères précis. Ces critères sont accessibles à n'importe qui.`,
    cta: DEFAULT_CTA,
  },
  {
    subject: (n) => `${n} : la différence entre vous et le premier résultat`,
    hook: (n, s, v) => `J'ai mis côte à côte votre fiche et celle du ${s} en première position à ${v}. La différence tient à 3 éléments. Aucun n'est lié à la qualité réelle du service — juste à la façon dont la fiche est construite.`,
    cta: (n, s, v) => `Voir les 3 différences →`,
  },
  {
    subject: (n, s, v) => `Pourquoi certains ${s} à ${v} sont toujours devant`,
    hook: (n, s, v) => `Ce n'est pas le hasard si les mêmes fiches reviennent toujours en tête sur Google Maps. Il y a une logique — et elle ne favorise pas forcément les meilleurs commerces, mais les mieux présentés.`,
    cta: DEFAULT_CTA,
  },
  {
    subject: () => `Un concurrent moins bien noté que vous apparaît avant vous`,
    hook: (n, s, v) => `C'est paradoxal — mais fréquent. Certains ${s} à ${v} avec une note inférieure à la vôtre apparaissent systématiquement avant vous. La raison : leur fiche envoie de meilleurs signaux à l'algorithme de Google.`,
    cta: (n, s, v) => `Voir pourquoi et comment corriger →`,
  },
  {
    subject: (n, s, v) => `Ce que font vos concurrents que vous ne faites pas`,
    hook: (n, s, v) => `J'ai analysé les fiches qui dominent la recherche "${s} ${v}". Elles partagent 4 caractéristiques communes. Votre fiche en a 1 sur 4. Le bon côté : les 3 manquantes s'ajoutent facilement.`,
    cta: (n, s, v) => `Voir les 4 caractéristiques →`,
  },
  {
    subject: (n) => `${n} — quelqu'un vous passe devant chaque jour`,
    hook: (n, s, v) => `À chaque recherche "${s} ${v}" sur Google, un client voit d'abord les autres. Pas parce qu'ils sont meilleurs — parce que leur fiche est structurée pour l'algorithme. La vôtre peut l'être aussi.`,
    cta: DEFAULT_CTA,
  },
  {
    subject: () => `Google Maps classe vos concurrents avant vous. Voici pourquoi.`,
    hook: (n, s, v) => `L'algorithme local de Google utilise des signaux précis pour décider qui apparaît en premier. J'ai regardé votre fiche à la lumière de ces signaux — et j'ai vu exactement là où vous perdez du terrain face à vos concurrents.`,
    cta: (n, s, v) => `Voir votre score de visibilité →`,
  },
  {
    subject: (n, s, v) => `${n} vs les autres ${s} de ${v}`,
    hook: (n, s, v) => `J'ai fait une analyse comparative rapide. Votre établissement a des atouts réels — mais votre fiche Google ne les met pas en avant de la même façon que vos concurrents les plus visibles. C'est corrigeable.`,
    cta: DEFAULT_CTA,
  },
  {
    subject: () => `Le classement Google Maps n'est pas neutre`,
    hook: (n, s, v) => `Google favorise les fiches qui répondent à des critères précis — et ces critères sont publics. J'ai vérifié votre fiche par rapport à ces critères. Vous en cochez plusieurs, mais il en manque des importants.`,
    cta: (n, s, v) => `Voir lesquels vous manquez →`,
  },

  // 20-29 : Angle "clients perdus"
  {
    subject: () => `Vous perdez des clients sans le savoir`,
    hook: (n, s, v) => `Ces clients ne vous disent rien. Ils ont cherché ${s} à ${v}, ils ont vu votre fiche, ils ont cliqué ailleurs. Pas parce que vous êtes mauvais — parce que votre fiche n'a pas su les convaincre en 10 secondes.`,
    cta: DEFAULT_CTA,
  },
  {
    subject: (n) => `${n} — des appels que vous ne recevez jamais`,
    hook: (n, s, v) => `Chaque jour, des gens cherchent ${s} à ${v} et ne vous appellent pas — alors qu'ils auraient pu devenir de bons clients. Le problème n'est pas votre service. C'est ce que Google montre d'eux avant qu'ils n'aient la chance de vous contacter.`,
    cta: (n, s, v) => `Voir combien vous en perdez →`,
  },
  {
    subject: () => `Ces clients qui passent devant votre porte sans entrer`,
    hook: (n, s, v) => `Ils ont cherché sur Google, ils ont comparé les fiches, ils ont choisi — mais pas vous. Pourtant ils sont peut-être à deux rues. Votre fiche Google est le premier filtre, et elle laisse passer trop de clients potentiels.`,
    cta: DEFAULT_CTA,
  },
  {
    subject: (n, s, v) => `${v} cherche un ${s} — pas vous`,
    hook: (n, s, v) => `Des dizaines de personnes cherchent "${s} ${v}" chaque semaine sur Google. Certaines arrivent chez vous — c'est bien. Beaucoup d'autres ne verront jamais votre fiche, ou la verront et n'appelleront pas. J'ai vu pourquoi.`,
    cta: DEFAULT_CTA,
  },
  {
    subject: () => `Le coût silencieux d'une fiche Google non optimisée`,
    hook: (n, s, v) => `Il ne se voit pas dans vos chiffres — parce que vous ne savez pas ce que vous auriez pu gagner. Mais chaque mois avec une fiche sous-optimisée, c'est des clients qui ont choisi quelqu'un d'autre. J'ai estimé ce que ça représente pour un ${s} à ${v}.`,
    cta: (n, s, v) => `Voir l'estimation →`,
  },
  {
    subject: (n) => `${n} — ces clients qui cliquent sur la fiche suivante`,
    hook: (n, s, v) => `Sur Google Maps, quand un client n'est pas convaincu par une fiche, il fait défiler. Votre fiche a plusieurs points qui déclenchent ce réflexe — et je les ai identifiés précisément. Ce ne sont pas des problèmes majeurs, mais ils comptent.`,
    cta: DEFAULT_CTA,
  },
  {
    subject: () => `Votre meilleure publicité, c'est votre fiche Google. Elle vous trahit.`,
    hook: (n, s, v) => `La majorité de vos nouveaux clients vous trouvent d'abord sur Google Maps — pas par bouche à oreille, pas par pub. C'est votre vitrine la plus vue. Et en ce moment, elle ne vous représente pas à votre juste valeur.`,
    cta: (n, s, v) => `Voir comment l'améliorer →`,
  },
  {
    subject: (n, s, v) => `Chaque recherche "${s} ${v}" est une occasion manquée`,
    hook: (n, s, v) => `Pas toutes — mais certaines, oui. Les occasions manquées sont invisibles par définition. Je les ai rendues visibles en analysant votre fiche Google par rapport aux standards actuels de visibilité locale.`,
    cta: DEFAULT_CTA,
  },
  {
    subject: () => `Ce client ne vous a pas appelé. Voici pourquoi.`,
    hook: (n, s, v) => `Il cherchait un ${s} à ${v}. Il a vu votre fiche. Il n'a pas appelé. La raison n'est probablement pas votre note — c'est un ou deux détails de présentation qui n'ont pas déclenché la confiance. Je vous montre lesquels.`,
    cta: (n, s, v) => `Voir l'analyse →`,
  },
  {
    subject: (n) => `${n} — visibilité locale, le vrai calcul`,
    hook: (n, s, v) => `Combien de personnes cherchent ${s} à ${v} chaque mois ? Combien voient votre fiche ? Combien cliquent ? Combien appellent ? J'ai estimé ces chiffres pour votre établissement. Le résultat montre une marge d'amélioration réelle.`,
    cta: (n, s, v) => `Voir mes estimations →`,
  },

  // 30-39 : Angle "observation spécifique"
  {
    subject: (n) => `${n} — j'ai une observation`,
    hook: (n, s, v) => `Je suis tombé sur votre fiche Google par hasard, en cherchant un ${s} dans votre secteur. Ce qui m'a frappé : votre établissement semble vraiment bien — mais votre fiche ne le reflète pas. Il y a un écart entre ce que vous êtes et ce que Google montre de vous.`,
    cta: DEFAULT_CTA,
  },
  {
    subject: () => `Juste une remarque sur votre fiche Google`,
    hook: (n, s, v) => `J'analyse régulièrement des fiches Google de commerçants locaux. La vôtre a retenu mon attention — dans le bon sens, d'abord. Mais elle présente aussi deux lacunes que j'aurais du mal à ne pas mentionner.`,
    cta: (n, s, v) => `Voir mes remarques →`,
  },
  {
    subject: (n) => `${n} — j'ai passé 5 minutes sur votre fiche`,
    hook: (n, s, v) => `Ce que j'ai trouvé en 5 minutes : des atouts réels, une note correcte, quelques avis positifs. Et deux problèmes précis qui, selon moi, vous coûtent des clics chaque semaine. Je vous les détaille volontiers.`,
    cta: DEFAULT_CTA,
  },
  {
    subject: () => `Un regard extérieur sur votre présence Google`,
    hook: (n, s, v) => `Parfois, un œil extérieur voit ce qu'on ne voit plus quand on est dedans. J'ai regardé votre fiche Google comme le ferait un nouveau client de passage à ${v}. Voici ce que j'ai vu — le positif et ce qu'on peut améliorer.`,
    cta: (n, s, v) => `Voir mon retour →`,
  },
  {
    subject: (n, s, v) => `Ce que j'ai noté sur ${n}`,
    hook: (n, s, v) => `En cherchant des ${s} bien référencés à ${v}, votre fiche m'est apparue. J'y ai passé quelques minutes. Il y a une chose en particulier qui m'a semblé sous-exploitée — et qui pourrait faire une vraie différence sur votre visibilité.`,
    cta: DEFAULT_CTA,
  },
  {
    subject: (n) => `${n} — votre fiche a quelque chose d'intéressant`,
    hook: (n, s, v) => `En analysant des fiches Google dans votre secteur, la vôtre s'est démarquée — mais pas encore assez. Vous avez des éléments solides. Ce qui manque, c'est la mise en cohérence de ces éléments pour que Google vous valorise davantage.`,
    cta: (n, s, v) => `Voir comment valoriser votre fiche →`,
  },
  {
    subject: () => `Ce que votre fiche Google dit de vous (sans le vouloir)`,
    hook: (n, s, v) => `Une fiche Google communique plus qu'on ne le croit. Les photos choisies, la description, la façon dont les avis sont traités — tout ça construit une image. J'ai lu ce que votre fiche dit de ${n}. Certains messages sont involontaires.`,
    cta: DEFAULT_CTA,
  },
  {
    subject: (n) => `${n} — première impression sur Google Maps`,
    hook: (n, s, v) => `J'ai noté ma première impression en arrivant sur votre fiche Google, comme un client qui ne vous connaît pas. C'est un exercice utile. Le résultat est mitigé — pas négatif, mais il y a clairement mieux à faire.`,
    cta: (n, s, v) => `Voir ce que j'ai noté →`,
  },
  {
    subject: () => `Deux choses que j'ai vues sur votre fiche`,
    hook: (n, s, v) => `La première est un point fort que vous sous-exploitez. La deuxième est un manque qui, selon moi, vous coûte de la visibilité sur "${s} ${v}". Je peux vous montrer l'une et l'autre en quelques minutes.`,
    cta: DEFAULT_CTA,
  },
  {
    subject: (n) => `${n} — votre fiche mérite mieux`,
    hook: (n, s, v) => `J'ai l'habitude d'analyser des fiches Google de commerçants locaux. La vôtre a du fond — mais la forme laisse à désirer. Et sur Google Maps, la forme compte autant que le fond pour décrocher le clic.`,
    cta: (n, s, v) => `Voir l'analyse complète →`,
  },

  // 40-49 : Angle "question"
  {
    subject: (n) => `${n} — savez-vous ce que voient vos clients ?`,
    hook: (n, s, v) => `La plupart des commerçants n'ont jamais cherché leur propre établissement comme le ferait un inconnu. Pas en étant connecté à leur compte Google — en mode privé, depuis un autre appareil. Ce que vous verriez vous surprendrait.`,
    cta: (n, s, v) => `Voir ce que voient vos clients →`,
  },
  {
    subject: () => `Avez-vous vérifié votre position sur Google Maps récemment ?`,
    hook: (n, s, v) => `Les positions sur Google Maps changent régulièrement. Des concurrents montent, d'autres descendent. J'ai regardé la vôtre pour "${s} ${v}". Elle peut être améliorée — et les leviers sont plus simples qu'on ne le croit.`,
    cta: DEFAULT_CTA,
  },
  {
    subject: (n) => `${n} — connaissez-vous votre score de visibilité Google ?`,
    hook: (n, s, v) => `Il existe des indicateurs précis pour mesurer à quel point une fiche Google est optimisée. J'ai évalué la vôtre. Le score global est moyen — ce qui veut dire qu'il y a une vraie marge de progression accessible rapidement.`,
    cta: (n, s, v) => `Voir votre score →`,
  },
  {
    subject: () => `Votre fiche Google vous représente-t-elle vraiment ?`,
    hook: (n, s, v) => `Il y a souvent un écart entre la qualité réelle d'un commerce et ce que sa fiche Google en montre. Cet écart, c'est des clients qui passent à côté de vous. J'ai regardé si c'est le cas pour ${n}.`,
    cta: DEFAULT_CTA,
  },
  {
    subject: (n, s, v) => `Combien de personnes cherchent ${s} à ${v} chaque mois ?`,
    hook: (n, s, v) => `La réponse vous étonnerait — et la part de ces recherches qui atterrit sur votre fiche encore plus. J'ai estimé ces chiffres. Ce qu'ils révèlent, c'est une opportunité concrète que vous n'exploitez probablement pas encore pleinement.`,
    cta: (n, s, v) => `Voir les chiffres →`,
  },
  {
    subject: () => `Saviez-vous que votre fiche Google est votre meilleur commercial ?`,
    hook: (n, s, v) => `Elle travaille 24h/24, 7j/7, sans salaire. Elle reçoit des clients potentiels en permanence. Mais comme tout commercial, elle a besoin d'être bien briefée pour convaincre. La vôtre pourrait faire beaucoup mieux.`,
    cta: DEFAULT_CTA,
  },
  {
    subject: (n) => `${n} — avez-vous comparé avec vos concurrents ?`,
    hook: (n, s, v) => `C'est un exercice que je recommande à tous les commerçants : regardez votre fiche côte à côte avec celles qui apparaissent avant vous sur "${s} ${v}". L'écart est souvent plus visible qu'on ne le pense. Et souvent moins difficile à combler.`,
    cta: (n, s, v) => `Voir la comparaison →`,
  },
  {
    subject: () => `Quand avez-vous mis à jour votre fiche Google pour la dernière fois ?`,
    hook: (n, s, v) => `Une fiche Google qui n'évolue pas perd progressivement de la visibilité. L'algorithme favorise les établissements actifs. J'ai regardé la vôtre — et je pense qu'une mise à jour ciblée changerait votre positionnement rapidement.`,
    cta: DEFAULT_CTA,
  },
  {
    subject: (n) => `${n} — est-ce que Google vous rend justice ?`,
    hook: (n, s, v) => `Votre réputation réelle et ce que Google montre de vous sont deux choses différentes. J'ai regardé la seconde. Je ne peux pas évaluer la première — mais je peux vous dire que la vitrine numérique que vous présentez n'est pas à la hauteur de ce qu'elle pourrait être.`,
    cta: (n, s, v) => `Voir l'analyse →`,
  },
  {
    subject: () => `Votre fiche Google est-elle à jour ?`,
    hook: (n, s, v) => `Horaires, photos, description, catégories — chaque élément de votre fiche envoie un signal à Google et à vos clients. J'ai passé la vôtre en revue. Certains signaux sont bons. D'autres sont manquants ou datés.`,
    cta: DEFAULT_CTA,
  },

  // 50-59 : Angle "statistique"
  {
    subject: () => `76% des recherches locales aboutissent à une visite`,
    hook: (n, s, v) => `C'est une stat Google — 76% des personnes qui cherchent un commerce local sur Maps visitent un établissement dans la journée. Le filtre, c'est la fiche. Celle qui convainc reçoit la visite. J'ai regardé si la vôtre convainc.`,
    cta: DEFAULT_CTA,
  },
  {
    subject: () => `9 clients sur 10 regardent Google avant de choisir`,
    hook: (n, s, v) => `Votre fiche Google est vue bien plus souvent que vous ne le pensez. Et chaque fois qu'elle ne convainc pas, c'est un client potentiel qui choisit quelqu'un d'autre. J'ai identifié ce qui, sur votre fiche, crée ce manque de conviction.`,
    cta: (n, s, v) => `Voir ce qui bloque →`,
  },
  {
    subject: () => `Les photos augmentent les clics de 35% sur Google Maps`,
    hook: (n, s, v) => `C'est prouvé — les fiches avec des photos récentes et de qualité reçoivent significativement plus de clics. J'ai regardé les photos de votre fiche. Il y a un vrai potentiel d'amélioration qui pourrait avoir un impact direct sur votre trafic.`,
    cta: DEFAULT_CTA,
  },
  {
    subject: () => `46% des recherches Google ont une intention locale`,
    hook: (n, s, v) => `Près de la moitié des recherches Google mènent à une intention locale — trouver un commerce près de chez soi. Pour "${s} ${v}", votre fiche est en concurrence directe avec plusieurs autres établissements. J'ai regardé comment vous vous positionnez.`,
    cta: (n, s, v) => `Voir votre position →`,
  },
  {
    subject: () => `Une description complète, c'est +27% de visibilité`,
    hook: (n, s, v) => `Google l'indique clairement dans ses recommandations — les fiches avec une description complète et des mots-clés pertinents ressortent mieux localement. J'ai lu votre description. Elle peut être améliorée.`,
    cta: DEFAULT_CTA,
  },
  {
    subject: () => `3 commerçants sur 4 perdent des clients à cause de leur fiche Google`,
    hook: (n, s, v) => `Ce n'est pas une opinion — c'est ce que montrent les études sur la visibilité locale. Les raisons sont toujours les mêmes : photos insuffisantes, description générique, horaires non vérifiés. J'ai regardé votre fiche à travers ce prisme.`,
    cta: (n, s, v) => `Voir votre diagnostic →`,
  },
  {
    subject: () => `Les avis Google influencent 92% des décisions d'achat locales`,
    hook: (n, s, v) => `Vos avis sont votre actif le plus précieux — mais ils ne travaillent pour vous que si votre fiche les met en valeur correctement. J'ai regardé comment votre fiche présente vos avis et comment vous y répondez. Il y a quelque chose à optimiser.`,
    cta: DEFAULT_CTA,
  },
  {
    subject: () => `Un client décide en moins de 8 secondes sur Google Maps`,
    hook: (n, s, v) => `8 secondes — c'est le temps que vous avez pour convaincre un inconnu sur votre fiche Google. Dans ces 8 secondes, il regarde la note, les photos, la description. J'ai chronométré l'expérience sur votre fiche. Voici ce que j'ai noté.`,
    cta: (n, s, v) => `Voir ce que j'ai noté →`,
  },
  {
    subject: () => `Les horaires incorrects font fuir 68% des clients`,
    hook: (n, s, v) => `Un client qui arrive chez vous fermé — ou qui trouve une heure d'ouverture incorrecte sur Google — ne revient pas. Et il laisse parfois un avis négatif. J'ai vérifié les horaires affichés sur votre fiche Google. Sont-ils exacts ?`,
    cta: DEFAULT_CTA,
  },
  {
    subject: () => `Google Maps génère 2× plus de trafic en magasin que les autres canaux`,
    hook: (n, s, v) => `C'est le canal de découverte n°1 pour les commerces locaux. Si votre fiche n'est pas optimisée, vous laissez passer l'outil qui vous rapporterait le plus de nouveaux clients. J'ai regardé où vous en êtes sur votre fiche.`,
    cta: (n, s, v) => `Voir votre potentiel →`,
  },

  // 60-69 : Angle "algorithme Google"
  {
    subject: () => `Ce que Google regarde vraiment pour vous classer`,
    hook: (n, s, v) => `L'algorithme local de Google utilise trois grands critères : la pertinence, la distance et la notoriété. Vous ne contrôlez pas la distance — mais les deux autres, si. J'ai regardé votre fiche à travers ces critères. Il y a du travail sur l'un d'eux.`,
    cta: DEFAULT_CTA,
  },
  {
    subject: () => `Google vous pénalise sans que vous le sachiez`,
    hook: (n, s, v) => `Ce n'est pas une sanction visible — c'est un sous-classement silencieux. Google favorise les fiches qui répondent à ses critères de complétude et d'activité. Les fiches qui n'y répondent pas descendent progressivement. La vôtre présente certains de ces signaux.`,
    cta: (n, s, v) => `Voir lesquels →`,
  },
  {
    subject: (n) => `${n} — les signaux que Google attend de vous`,
    hook: (n, s, v) => `Pour décider qui apparaît en premier sur "${s} ${v}", Google analyse des dizaines de signaux sur votre fiche. J'ai vérifié les principaux sur la vôtre. Certains sont bons. D'autres manquent — et ce sont souvent les plus faciles à corriger.`,
    cta: DEFAULT_CTA,
  },
  {
    subject: () => `Comment Google choisit qui afficher en premier à ${'' }`,
    hook: (n, s, v) => `Ce n'est pas arbitraire. Google local utilise un système précis. Les fiches qui gagnent ont en commun d'envoyer les bons signaux au bon endroit. J'ai regardé si votre fiche envoie ces signaux pour "${s} ${v}".`,
    cta: (n, s, v) => `Voir l'analyse de votre fiche →`,
  },
  {
    subject: () => `L'algorithme Google Maps favorise les fiches actives`,
    hook: (n, s, v) => `Les publications régulières, les réponses aux avis, les photos récentes — tout ça indique à Google que votre établissement est vivant. Une fiche inactive perd progressivement en visibilité. J'ai regardé le niveau d'activité de la vôtre.`,
    cta: DEFAULT_CTA,
  },
  {
    subject: () => `Ce que Google ne vous dit pas sur votre visibilité`,
    hook: (n, s, v) => `Google ne vous envoie pas de rapport pour vous dire "votre fiche perd du terrain". Il le fait silencieusement — vous descendez dans les résultats, et vous ne savez pas pourquoi. J'ai regardé votre fiche avec les outils qui permettent de voir ça.`,
    cta: (n, s, v) => `Voir votre rapport →`,
  },
  {
    subject: () => `Paramètres cachés qui influencent votre classement Google`,
    hook: (n, s, v) => `La note et le nombre d'avis ne sont que deux des signaux que Google utilise. Il y en a d'autres, moins connus, qui ont pourtant un impact direct sur votre positionnement local. Votre fiche en manque plusieurs.`,
    cta: DEFAULT_CTA,
  },
  {
    subject: (n) => `${n} — pourquoi Google vous classe ainsi`,
    hook: (n, s, v) => `Votre position actuelle sur "${s} ${v}" n'est pas un hasard — c'est le résultat d'un calcul. J'ai regardé les variables qui entrent dans ce calcul pour votre fiche. Et j'ai vu où vous pouvez faire levier.`,
    cta: (n, s, v) => `Voir où faire levier →`,
  },
  {
    subject: () => `Google Maps et les commerces locaux : ce qui a changé`,
    hook: (n, s, v) => `Les critères de classement local de Google évoluent régulièrement. Des éléments qui comptaient peu il y a deux ans sont maintenant décisifs. J'ai regardé votre fiche à la lumière de ces évolutions récentes.`,
    cta: DEFAULT_CTA,
  },
  {
    subject: () => `Le facteur n°1 que Google utilise pour les commerces locaux`,
    hook: (n, s, v) => `Ce n'est pas la note. Ce n'est pas l'ancienneté. C'est la cohérence des informations entre votre fiche Google et ce qu'on trouve ailleurs sur le web. J'ai vérifié cette cohérence pour ${n}. Il y a des écarts.`,
    cta: (n, s, v) => `Voir les écarts →`,
  },

  // 70-79 : Angle "urgence"
  {
    subject: () => `Chaque semaine sans optimisation, vous perdez du terrain`,
    hook: (n, s, v) => `Les fiches Google ne restent pas statiques. Vos concurrents optimisent les leurs — et progressent. La vôtre reste en l'état — et recule relativement. Ce n'est pas une catastrophe, mais c'est un écart qui se creuse.`,
    cta: DEFAULT_CTA,
  },
  {
    subject: (n) => `${n} — vos concurrents n'attendent pas`,
    hook: (n, s, v) => `Pendant que votre fiche reste telle quelle, d'autres ${s} à ${v} travaillent leur présence Google. Ce n'est pas alarmiste — c'est juste la réalité du référencement local. Et il est encore temps de reprendre l'avantage.`,
    cta: (n, s, v) => `Voir comment reprendre l'avantage →`,
  },
  {
    subject: () => `La visibilité locale se joue maintenant`,
    hook: (n, s, v) => `Le référencement local Google prend du temps à évoluer — dans un sens comme dans l'autre. Commencer à optimiser maintenant, c'est récolter les résultats dans quelques semaines. Attendre, c'est laisser la place aux concurrents qui eux n'attendent pas.`,
    cta: DEFAULT_CTA,
  },
  {
    subject: (n) => `${n} — le retard se creuse`,
    hook: (n, s, v) => `J'ai regardé l'évolution des fiches les plus visibles pour "${s} ${v}". Elles ont été optimisées progressivement. Votre fiche est restée stable. L'écart est là — et il se corrige, mais ça prend du temps. Mieux vaut commencer tôt.`,
    cta: (n, s, v) => `Voir comment rattraper →`,
  },
  {
    subject: () => `Pendant que vous lisez cet email, vos concurrents captent vos clients`,
    hook: (n, s, v) => `C'est direct — mais c'est la réalité du référencement local. Les recherches "${s} ${v}" arrivent en permanence, et votre fiche actuelle laisse des opportunités aux autres. Je vous montre précisément où et comment y remédier.`,
    cta: DEFAULT_CTA,
  },
  {
    subject: () => `Chaque jour, des clients vous cherchent et ne vous trouvent pas`,
    hook: (n, s, v) => `Pas "ne vous trouvent pas" au sens littéral — votre fiche existe. Mais "ne vous trouvent pas" au sens où elle ne les convainc pas d'aller plus loin. C'est une nuance importante, et c'est corrigeable.`,
    cta: (n, s, v) => `Voir comment les convaincre →`,
  },
  {
    subject: (n) => `${n} — fenêtre d'opportunité sur Google Maps`,
    hook: (n, s, v) => `Les commerces locaux qui optimisent leur fiche Google maintenant prennent une longueur d'avance sur ceux qui ne l'ont pas encore fait. À ${v}, il y a encore de la place pour remonter sur "${s}". Mais cette fenêtre se referme.`,
    cta: DEFAULT_CTA,
  },
  {
    subject: () => `Votre visibilité Google baisse. En silence.`,
    hook: (n, s, v) => `Une fiche Google non entretenue perd progressivement en pertinence aux yeux de l'algorithme. Ce n'est pas dramatique au début — mais ça s'accumule. J'ai regardé les signaux sur votre fiche. Certains indiquent que ce processus est en cours.`,
    cta: (n, s, v) => `Voir les signaux →`,
  },
  {
    subject: (n) => `${n} — l'avantage du premier qui bouge`,
    hook: (n, s, v) => `Sur un marché local comme ${v}, il n'y a pas 50 ${s}. Celui qui optimise sa fiche Google en premier prend une position qui dure. Ce n'est pas une course — mais il y a un avantage à ne pas traîner.`,
    cta: DEFAULT_CTA,
  },
  {
    subject: () => `Ce que vous gagnez à agir maintenant`,
    hook: (n, s, v) => `Une fiche Google optimisée, c'est plus de clics, plus d'appels, plus de visites. Pas dans un an — dans quelques semaines. J'ai regardé votre fiche et estimé ce que représenterait une amélioration ciblée pour un ${s} à ${v}.`,
    cta: (n, s, v) => `Voir l'estimation →`,
  },

  // 80-89 : Angle "empathie / commerçant dans commerçant"
  {
    subject: () => `Je sais que ce n'est pas votre priorité du moment`,
    hook: (n, s, v) => `Gérer un commerce, c'est déjà beaucoup. La fiche Google, c'est souvent ce qu'on remet à plus tard. Je comprends ça. C'est pourquoi je me contente de vous montrer ce que j'ai vu sur la vôtre — vous décidez ensuite si ça vaut votre attention.`,
    cta: DEFAULT_CTA,
  },
  {
    subject: () => `Personne ne vous a appris à optimiser votre fiche Google`,
    hook: (n, s, v) => `Ce n'est pas enseigné. Ce n'est pas intuitif. Et pourtant, ça a un impact direct sur le nombre de clients qui vous trouvent. J'ai regardé votre fiche et je peux vous montrer, concrètement, ce qui manque et comment y remédier.`,
    cta: (n, s, v) => `Voir ce qui manque →`,
  },
  {
    subject: (n, s, v) => `Ce que j'entends souvent des ${s} à ${v}`,
    hook: (n, s, v) => `"Je suis sur Google, ça devrait suffire." C'est la phrase que j'entends le plus. Être présent ne suffit plus — il faut être bien présenté. Ce sont deux choses très différentes. J'ai regardé comment vous êtes présenté.`,
    cta: DEFAULT_CTA,
  },
  {
    subject: () => `Ce n'est pas de votre faute si votre fiche n'est pas optimisée`,
    hook: (n, s, v) => `Google change ses critères régulièrement. Ce qui fonctionnait il y a 2 ans est parfois devenu contre-productif. Et personne ne vous prévient. J'ai regardé votre fiche à la lumière des critères actuels.`,
    cta: (n, s, v) => `Voir votre fiche à jour →`,
  },
  {
    subject: (n) => `${n} — je travaille avec des commerçants comme vous`,
    hook: (n, s, v) => `Chaque semaine, je travaille avec des ${s} qui ont le même profil que le vôtre — une bonne réputation locale, mais une visibilité Google en dessous de leur potentiel. Les solutions sont toujours plus simples qu'ils ne l'imaginaient.`,
    cta: DEFAULT_CTA,
  },
  {
    subject: () => `La plupart des bons commerçants ont une mauvaise fiche Google`,
    hook: (n, s, v) => `Ce n'est pas une contradiction — c'est une réalité. Les meilleurs commerçants sont souvent les moins bons sur leur fiche Google, parce qu'ils passent leur temps à faire leur métier, pas à gérer leur présence numérique. Votre fiche en est un exemple.`,
    cta: (n, s, v) => `Voir comment corriger ça →`,
  },
  {
    subject: (n) => `${n} — un truc simple que la plupart des commerçants ignorent`,
    hook: (n, s, v) => `Il ne s'agit pas d'une astuce obscure. C'est un élément de base de la fiche Google que la plupart des commerçants n'ont jamais configuré correctement — et qui a un impact direct sur leur position dans les recherches locales.`,
    cta: DEFAULT_CTA,
  },
  {
    subject: () => `Ce qu'un bon commerçant peut faire en 30 minutes`,
    hook: (n, s, v) => `Optimiser une fiche Google correctement prend moins de temps qu'on ne le croit, si on sait exactement où agir. J'ai identifié les points précis à corriger sur la vôtre. Je vous les transmets — vous faites ce que vous voulez avec.`,
    cta: (n, s, v) => `Recevoir les points à corriger →`,
  },
  {
    subject: (n) => `${n} — je voulais juste vous montrer quelque chose`,
    hook: (n, s, v) => `Pas de discours, pas de promesse. Juste une observation concrète sur votre fiche Google, que j'ai faite en cherchant ${s} à ${v}. Vous verrez vous-même si ça vaut la peine d'en parler.`,
    cta: DEFAULT_CTA,
  },
  {
    subject: () => `C'est plus simple qu'on ne le pense`,
    hook: (n, s, v) => `L'optimisation d'une fiche Google effraie souvent les commerçants. En réalité, les changements qui ont le plus d'impact sont souvent les plus simples. J'ai regardé votre fiche et identifié ceux qui s'appliquent à votre cas.`,
    cta: (n, s, v) => `Voir les changements à faire →`,
  },

  // 90-99 : Angle "curiosity gap"
  {
    subject: () => `Il y a un truc que Google ne vous dit pas`,
    hook: (n, s, v) => `Google vous montre votre fiche — mais pas comment elle est perçue par l'algorithme. Il y a un écart entre ce que vous voyez et ce que Google "lit" dans votre fiche. J'ai analysé les deux. Et l'écart est plus important qu'il n'y paraît.`,
    cta: DEFAULT_CTA,
  },
  {
    subject: (n) => `${n} — le vrai facteur qui détermine votre position`,
    hook: (n, s, v) => `Ce n'est pas la note. Ce n'est pas le nombre d'avis. C'est quelque chose que la plupart des commerçants n'ont jamais configuré correctement sur leur fiche Google. Et ça change tout.`,
    cta: (n, s, v) => `Voir ce facteur →`,
  },
  {
    subject: (n, s, v) => `Ce que les ${s} en tête à ${v} ont en commun`,
    hook: (n, s, v) => `J'ai analysé les fiches des ${s} qui dominent les recherches à ${v}. Ils ont un point commun — un seul — que votre fiche n'a pas encore. Et ce n'est pas ce qu'on croit.`,
    cta: DEFAULT_CTA,
  },
  {
    subject: () => `Un paramètre que 9 commerçants sur 10 négligent`,
    hook: (n, s, v) => `Il est dans votre fiche Google. Il influence votre positionnement local. Et pourtant, la grande majorité des commerçants ne l'ont jamais optimisé — soit parce qu'ils ne savent pas qu'il existe, soit parce qu'ils pensent que ça ne compte pas.`,
    cta: (n, s, v) => `Voir ce paramètre sur votre fiche →`,
  },
  {
    subject: () => `Le signal invisible qui change votre classement Google`,
    hook: (n, s, v) => `Google mesure des choses que vous ne pouvez pas voir directement sur votre fiche. Ces signaux indirects ont pourtant un impact direct sur votre position dans les résultats locaux. J'en ai identifié un qui manque sur votre fiche.`,
    cta: DEFAULT_CTA,
  },
  {
    subject: (n) => `${n} — ce que Google voit et que vous ne voyez pas`,
    hook: (n, s, v) => `Il y a la fiche que vous voyez — et la fiche que Google analyse. Ces deux versions ne sont pas identiques. Ce que Google y lit détermine votre position sur "${s} ${v}". J'ai regardé la version que Google voit.`,
    cta: (n, s, v) => `Voir ce que Google voit →`,
  },
  {
    subject: () => `La raison cachée de votre positionnement Google`,
    hook: (n, s, v) => `Votre position actuelle sur Google Maps n'est pas le fruit du hasard. Elle est le résultat d'un calcul complexe — et l'un des facteurs principaux de ce calcul est souvent celui qu'on regarde en dernier. Je vous montre lequel, sur votre fiche.`,
    cta: DEFAULT_CTA,
  },
  {
    subject: () => `L'élément que personne ne vous a dit de configurer`,
    hook: (n, s, v) => `Quand Google a lancé cette fonctionnalité, peu de commerçants ont été formés dessus. Aujourd'hui, elle est pourtant prise en compte dans le classement local. Votre fiche n'en tire pas parti — et c'est corrigeable en quelques minutes.`,
    cta: (n, s, v) => `Voir quel élément →`,
  },
  {
    subject: (n) => `${n} — ce que j'ai découvert en 10 minutes sur votre fiche`,
    hook: (n, s, v) => `J'analyse des fiches Google de commerçants locaux régulièrement. En 10 minutes sur la vôtre, j'ai trouvé quelque chose d'intéressant — pas un problème majeur, mais un levier précis que vous n'avez pas encore actionné.`,
    cta: DEFAULT_CTA,
  },
  {
    subject: () => `Ce que la première page Google Maps ne vous dit pas`,
    hook: (n, s, v) => `Vous pouvez voir qui est devant vous. Ce que vous ne voyez pas, c'est pourquoi — et surtout, ce que vous pourriez faire pour changer ça. J'ai regardé votre fiche avec cet angle précis. La réponse est là.`,
    cta: (n, s, v) => `Voir la réponse →`,
  },
]

const N_VARIANTS = VARIANTS.length // 100

function getVariant(variantId: number) {
  return VARIANTS[variantId % N_VARIANTS]
}

// ── Thompson Sampling ────────────────────────────────────────────────────────

function normalRandom(): number {
  let u = 0, v = 0
  while (u === 0) u = Math.random()
  while (v === 0) v = Math.random()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

function gammaRandom(shape: number): number {
  if (shape < 1) return gammaRandom(1 + shape) * Math.pow(Math.random(), 1 / shape)
  const d = shape - 1 / 3
  const c = 1 / Math.sqrt(9 * d)
  while (true) {
    let x: number, v: number
    do { x = normalRandom(); v = 1 + c * x } while (v <= 0)
    v = v ** 3
    const u = Math.random()
    if (u < 1 - 0.0331 * x ** 4) return d * v
    if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v
  }
}

function sampleBeta(alpha: number, beta: number): number {
  const g1 = gammaRandom(Math.max(alpha, 0.01))
  const g2 = gammaRandom(Math.max(beta, 0.01))
  return g1 / (g1 + g2)
}

async function pickVariant(stats: Map<number, { sends: number; clicks: number }>): Promise<number> {
  let best = 0
  let bestSample = -1
  for (let id = 0; id < N_VARIANTS; id++) {
    const s = stats.get(id) ?? { sends: 0, clicks: 0 }
    const alpha = s.clicks + 1
    const beta  = Math.max(s.sends - s.clicks, 0) + 1
    const sample = sampleBeta(alpha, beta)
    if (sample > bestSample) { bestSample = sample; best = id }
  }
  return best
}

// ── Chargement des stats ─────────────────────────────────────────────────────

async function loadStats(): Promise<Map<number, { sends: number; clicks: number }>> {
  const stats = new Map<number, { sends: number; clicks: number }>()

  // Envois par variante depuis leads
  const { data: sendData } = await supabase
    .from('leads')
    .select('subject_variant')
    .eq('sent', true)
    .not('subject_variant', 'is', null)

  for (const row of sendData ?? []) {
    const id = parseInt(row.subject_variant)
    if (isNaN(id) || id >= N_VARIANTS) continue
    const s = stats.get(id) ?? { sends: 0, clicks: 0 }
    stats.set(id, { ...s, sends: s.sends + 1 })
  }

  // Clics par variante depuis email_clicks
  const { data: clickData } = await supabase
    .from('email_clicks')
    .select('variant_id')

  for (const row of clickData ?? []) {
    const id = row.variant_id
    if (id === undefined || id >= N_VARIANTS) continue
    const s = stats.get(id) ?? { sends: 0, clicks: 0 }
    stats.set(id, { ...s, clicks: s.clicks + 1 })
  }

  return stats
}

// ── Template email ───────────────────────────────────────────────────────────

function buildEmail(nom: string, ville: string, secteur: string, leadId: number, variantId: number, hookText: string, ctaText: string): string {
  const villeLabel = ville && ville !== 'France' ? ville : 'votre ville'
  const dest = `${APP_URL}?nom=${encodeURIComponent(nom)}&ville=${encodeURIComponent(villeLabel)}&utm_source=outreach&utm_medium=email&utm_campaign=cold&vid=${variantId}`
  const trackUrl = `${APP_URL}/api/track?lid=${leadId}&vid=${variantId}&url=${encodeURIComponent(dest)}`

  return `<div style="font-family:Georgia,serif;max-width:500px;margin:0 auto;padding:36px 20px;color:#1a1a1a;font-size:15px;line-height:1.8;">
  <p style="margin:0 0 20px;">Bonjour,</p>

  <p style="margin:0 0 20px;color:#374151;">
    ${hookText}
  </p>

  <p style="margin:0 0 28px;">
    <a href="${trackUrl}" style="display:inline-block;background:#16a34a;color:#fff;font-family:Arial,sans-serif;font-size:14px;font-weight:600;padding:12px 22px;border-radius:6px;text-decoration:none;">${ctaText}</a>
  </p>

  <p style="margin:0 0 4px;font-size:14px;color:#374151;">Brian Mansart<br>
  <span style="color:#6b7280;font-size:13px;">LocalBoost — visibilité Google pour les commerces locaux</span></p>

  <hr style="border:none;border-top:1px solid #e5e7eb;margin:28px 0 16px;">
  <p style="color:#9ca3af;font-size:11px;margin:0;font-family:Arial,sans-serif;">
    Vous recevez cet email car ${nom} est référencé sur Google Maps.
    <a href="mailto:contact@thelocalboost.fr?subject=désinscription ${encodeURIComponent(nom)}" style="color:#9ca3af;">Se désinscrire</a>
  </p>
</div>`
}

// ── Handler ──────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  if (req.headers.get('x-admin-key') !== process.env.ADMIN_SECRET_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { limit = 50, secteur, testEmail } = await req.json()

  let query = supabase
    .from('leads')
    .select('id, nom, email, secteur, ville')
    .eq('sent', false)
    .not('email', 'is', null)
    .or('email_status.is.null,email_status.neq.invalid')
    .limit(limit)

  if (secteur) query = query.eq('secteur', secteur)

  const [{ data: leads, error }, stats] = await Promise.all([query, loadStats()])

  // Mode test : envoie un seul email de démo à l'adresse fournie
  if (testEmail) {
    const lead = leads?.[0] ?? { id: 0, nom: 'Boulangerie Exemple', ville: 'Paris', secteur: 'boulangerie' }
    const variantId = await pickVariant(stats)
    const variant = getVariant(variantId)
    const nom = lead.nom || 'votre établissement'
    const ville = lead.ville || ''
    const secteurLead = lead.secteur || 'commerce'
    const v = ville || 'votre ville'
    const html = buildEmail(nom, ville, secteurLead, lead.id, variantId, variant.hook(nom, secteurLead, v), variant.cta(nom, secteurLead, v))
    await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'api-key': process.env.BREVO_API_KEY! },
      body: JSON.stringify({
        sender: { name: 'Brian de LocalBoost', email: 'contact@thelocalboost.fr' },
        to: [{ email: testEmail }],
        subject: `[TEST] ${variant.subject(nom, secteurLead, v)}`,
        htmlContent: html,
      }),
    })
    return NextResponse.json({ sent: 0, test: true, preview: { nom, secteur: secteurLead, variantId } })
  }

  if (error || !leads?.length) {
    return NextResponse.json({ sent: 0, message: 'Aucun lead à envoyer' })
  }

  let sent = 0
  const errors: string[] = []
  const variantCounts: Record<number, number> = {}

  for (const lead of leads) {
    const nom    = lead.nom   || 'votre établissement'
    const ville  = lead.ville || ''
    const secteur = lead.secteur || 'commerce'

    const variantId = await pickVariant(stats)
    const variant = getVariant(variantId)
    const v = ville || 'votre ville'
    const subjectText = variant.subject(nom, secteur, v)
    const hookText    = variant.hook(nom, secteur, v)
    const ctaText     = variant.cta(nom, secteur, v)

    try {
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'api-key': process.env.BREVO_API_KEY! },
        body: JSON.stringify({
          sender:      { name: 'Brian de LocalBoost', email: 'contact@thelocalboost.fr' },
          to:          [{ email: lead.email, name: nom }],
          subject:     subjectText,
          htmlContent: buildEmail(nom, ville, secteur, lead.id, variantId, hookText, ctaText),
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        errors.push(`${lead.email}: ${err.message}`)
        continue
      }

      await supabase
        .from('leads')
        .update({ sent: true, sent_at: new Date().toISOString(), subject_variant: String(variantId) })
        .eq('id', lead.id)

      // Mettre à jour les stats en mémoire pour que les prochains envois du batch bénéficient du même Thompson Sampling
      const s = stats.get(variantId) ?? { sends: 0, clicks: 0 }
      stats.set(variantId, { ...s, sends: s.sends + 1 })

      variantCounts[variantId] = (variantCounts[variantId] ?? 0) + 1
      sent++
      await new Promise(r => setTimeout(r, 200))
    } catch (e: any) {
      errors.push(`${lead.email}: ${e.message}`)
    }
  }

  // Résumé des variantes utilisées
  const topVariants = Object.entries(variantCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, count]) => {
      const s = stats.get(Number(id))
      const ctr = s && s.sends > 0 ? ((s.clicks / s.sends) * 100).toFixed(1) : '0.0'
      return { variant: Number(id), sent: count, ctr: `${ctr}%` }
    })

  return NextResponse.json({ sent, top_variants: topVariants, errors: errors.length ? errors : undefined })
}
