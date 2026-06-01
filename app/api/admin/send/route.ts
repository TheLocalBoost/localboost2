import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const maxDuration = 300 // Pro/Enterprise uniquement — ignoré sur Hobby (max 10s)

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const APP_URL = 'https://thelocalboost.fr'

// ── 100 variantes — 5 angles × 20 emails ────────────────────────────────────
// Thompson Sampling sélectionne automatiquement les meilleures variantes
// selon le taux de clic réel enregistré dans email_clicks.

type Fn = (nom: string, secteur: string, ville: string) => string
interface Variant { subject: Fn; hook: Fn; cta: Fn }

const VARIANTS: Variant[] = [

  // ── Angle A : Diagnostic / Observation (0-19) ────────────────────────────
  {
    subject: (n,s,v) => `${n} — quelques pistes sur votre fiche Google`,
    hook: (n,s,v) => `J'ai pris quelques minutes pour consulter la fiche Google de <strong>${n}</strong> à <strong>${v}</strong>.\nQuelques ajustements simples pourraient améliorer sa visibilité auprès de vos futurs clients.`,
    cta: () => `Voir les améliorations possibles →`,
  },
  {
    subject: (n,s,v) => `${n} — des opportunités sur votre fiche Google`,
    hook: (n,s,v) => `La fiche Google de <strong>${n}</strong> contient déjà de bons éléments.\nJ'ai toutefois identifié plusieurs opportunités qui pourraient l'aider à ressortir davantage sur Google Maps.`,
    cta: () => `Voir lesquelles →`,
  },
  {
    subject: (n,s,v) => `En cherchant ${s} à ${v}...`,
    hook: (n,s,v) => `En recherchant des commerces de votre secteur à <strong>${v}</strong>, je suis tombé sur la fiche de <strong>${n}</strong>.\nJ'ai remarqué quelques points faciles à optimiser pour gagner en visibilité.`,
    cta: () => `Découvrir les recommandations →`,
  },
  {
    subject: (n,s,v) => `Ce que vos clients voient sur Google — ${n}`,
    hook: (n,s,v) => `La plupart des commerçants ignorent ce que leurs clients voient réellement sur Google.\nJ'ai regardé la fiche de <strong>${n}</strong> à <strong>${v}</strong> — et j'ai identifié plusieurs points faciles à améliorer.`,
    cta: () => `Voir le diagnostic →`,
  },
  {
    subject: (n,s,v) => `${n} — quelques optimisations à portée de main`,
    hook: (n,s,v) => `J'ai passé quelques minutes sur la présence Google de <strong>${n}</strong> à <strong>${v}</strong>.\nIl y a plusieurs petites optimisations qui pourraient avoir un impact réel sur vos résultats.`,
    cta: () => `Les découvrir →`,
  },
  {
    subject: (n,s,v) => `${n} mérite plus de visibilité à ${v}`,
    hook: (n,s,v) => `<strong>${n}</strong> mérite probablement d'être plus visible qu'aujourd'hui sur Google Maps à <strong>${v}</strong>.\nJ'ai relevé quelques pistes d'amélioration concrètes sur votre fiche.`,
    cta: () => `Voir les détails →`,
  },
  {
    subject: (n,s,v) => `Votre fiche Google à ${v} — quelques observations`,
    hook: (n,s,v) => `Une simple recherche sur Google Maps à <strong>${v}</strong> m'a amené sur la fiche de <strong>${n}</strong>.\nJ'y ai repéré plusieurs éléments qui pourraient être optimisés rapidement.`,
    cta: () => `Voir les opportunités →`,
  },
  {
    subject: (n,s,v) => `${n} — analyse rapide de votre fiche Google`,
    hook: (n,s,v) => `J'analyse régulièrement des fiches Google de commerces locaux en France.\nCelle de <strong>${n}</strong> à <strong>${v}</strong> présente quelques leviers intéressants à exploiter.`,
    cta: () => `Les consulter →`,
  },
  {
    subject: (n,s,v) => `${n} — un rapide aperçu Google`,
    hook: (n,s,v) => `Quelques détails sur la fiche Google de <strong>${n}</strong> pourraient influencer la décision de vos futurs clients à <strong>${v}</strong>.\nJe vous ai préparé un rapide aperçu.`,
    cta: () => `Voir l'analyse →`,
  },
  {
    subject: (n,s,v) => `${n} — votre fiche peut faire plus`,
    hook: (n,s,v) => `La fiche Google de <strong>${n}</strong> est déjà en place — mais elle pourrait probablement travailler davantage pour vous.\nJ'ai identifié plusieurs pistes concrètes pour <strong>${v}</strong>.`,
    cta: () => `Voir lesquelles →`,
  },
  {
    subject: (n,s,v) => `${n} — votre fiche pourrait convertir davantage`,
    hook: (n,s,v) => `J'ai consulté la fiche Google de <strong>${n}</strong> ce matin.\nElle est visible — mais elle pourrait convertir bien davantage de curieux en clients réels à <strong>${v}</strong>.`,
    cta: () => `Voir comment →`,
  },
  {
    subject: (n,s,v) => `${n} — quelques ajustements à ${v}`,
    hook: (n,s,v) => `La fiche Google de <strong>${n}</strong> existe. C'est déjà bien.\nMais à <strong>${v}</strong>, quelques ajustements simples pourraient lui donner beaucoup plus de portée.`,
    cta: () => `Voir les pistes →`,
  },
  {
    subject: (n,s,v) => `Quelques observations sur ${n}`,
    hook: (n,s,v) => `En parcourant les fiches Google de commerces à <strong>${v}</strong>, j'ai noté plusieurs choses sur <strong>${n}</strong>.\nCertaines optimisations sont rapides à mettre en place et peuvent avoir un impact direct.`,
    cta: () => `Les voir maintenant →`,
  },
  {
    subject: (n,s,v) => `${n} sur Google Maps — quelques points`,
    hook: (n,s,v) => `J'ai regardé comment <strong>${n}</strong> apparaît sur Google Maps à <strong>${v}</strong>.\nIl y a quelques points simples qui, une fois corrigés, pourraient améliorer nettement votre visibilité.`,
    cta: () => `Voir les détails →`,
  },
  {
    subject: (n,s,v) => `Une fiche Google qui travaille pour vous — ${n}`,
    hook: (n,s,v) => `Une fiche Google bien entretenue peut faire une différence réelle pour un commerce comme <strong>${n}</strong> à <strong>${v}</strong>.\nJ'ai identifié quelques opportunités sur la vôtre.`,
    cta: () => `Les découvrir →`,
  },
  {
    subject: (n,s,v) => `${n} à ${v} — mes recommandations Google`,
    hook: (n,s,v) => `Je travaille sur la visibilité Google des commerces locaux en France.\nJ'ai regardé la fiche de <strong>${n}</strong> à <strong>${v}</strong> — et j'ai quelques recommandations concrètes à vous partager.`,
    cta: () => `Voir les recommandations →`,
  },
  {
    subject: (n,s,v) => `J'ai regardé votre fiche Google ce matin`,
    hook: (n,s,v) => `Ce matin j'ai passé en revue plusieurs fiches Google de ${s} à <strong>${v}</strong>.\nCelle de <strong>${n}</strong> retient mon attention — quelques points méritent votre regard.`,
    cta: () => `Voir ce que j'ai trouvé →`,
  },
  {
    subject: (n,s,v) => `${n} — votre score de visibilité Google`,
    hook: (n,s,v) => `J'ai calculé un score de visibilité pour la fiche Google de <strong>${n}</strong> à <strong>${v}</strong>.\nLe résultat révèle quelques points d'amélioration concrets — pas de refonte, juste des ajustements ciblés.`,
    cta: () => `Voir mon score →`,
  },
  {
    subject: (n,s,v) => `${n} — ce que j'ai noté sur votre fiche`,
    hook: (n,s,v) => `En analysant les fiches de ${s} à <strong>${v}</strong>, j'ai regardé celle de <strong>${n}</strong> de plus près.\nJ'ai noté trois points qui pourraient être améliorés sans effort particulier.`,
    cta: () => `Voir les 3 points →`,
  },
  {
    subject: (n,s,v) => `Votre présence Google à ${v} — quelques réflexions`,
    hook: (n,s,v) => `J'ai réfléchi à la présence en ligne de <strong>${n}</strong> à <strong>${v}</strong>.\nQuelques ajustements sur votre fiche Google pourraient significativement améliorer votre visibilité locale.`,
    cta: () => `Voir les réflexions →`,
  },

  // ── Angle B : Questions / Curiosité (20-39) ──────────────────────────────
  {
    subject: (n,s,v) => `Avez-vous vérifié votre fiche Google récemment ?`,
    hook: (n,s,v) => `Ce que vos clients voient sur Google avant de venir chez vous — avez-vous vérifié récemment ?\nJ'ai consulté la fiche de <strong>${n}</strong> à <strong>${v}</strong> et j'ai quelques observations à partager.`,
    cta: () => `Voir l'analyse →`,
  },
  {
    subject: (n,s,v) => `Savez-vous ce que vos clients voient en vous cherchant ?`,
    hook: (n,s,v) => `Quand un client tape <strong>${n}</strong> sur Google à <strong>${v}</strong>, que voit-il exactement ?\nJ'ai fait la recherche à votre place — et il y a des choses intéressantes à savoir.`,
    cta: () => `Voir ce qu'il voit →`,
  },
  {
    subject: (n,s,v) => `${n} — êtes-vous satisfait de votre visibilité Google ?`,
    hook: (n,s,v) => `La visibilité Google d'un commerce comme <strong>${n}</strong> à <strong>${v}</strong>, ça se travaille.\nJ'ai regardé la vôtre — quelques ajustements simples pourraient changer la donne.`,
    cta: () => `Voir les ajustements →`,
  },
  {
    subject: (n,s,v) => `Vos clients vous trouvent-ils facilement sur Google ?`,
    hook: (n,s,v) => `À <strong>${v}</strong>, trouver un <strong>${s}</strong> sur Google ne prend que quelques secondes.\nJ'ai vérifié comment <strong>${n}</strong> ressort dans ces recherches — le résultat est instructif.`,
    cta: () => `Voir le résultat →`,
  },
  {
    subject: (n,s,v) => `Combien de clients vous ratent sur Google chaque semaine ?`,
    hook: (n,s,v) => `Chaque semaine à <strong>${v}</strong>, des dizaines de personnes cherchent un ${s} sur Google Maps.\nJ'ai regardé comment <strong>${n}</strong> apparaît dans ces recherches. C'est révélateur.`,
    cta: () => `Voir mon analyse →`,
  },
  {
    subject: (n,s,v) => `${n} — votre fiche Google est-elle optimisée ?`,
    hook: (n,s,v) => `Une fiche Google optimisée attire deux fois plus de clients qu'une fiche négligée.\nJ'ai évalué celle de <strong>${n}</strong> à <strong>${v}</strong> — quelques points méritent attention.`,
    cta: () => `Voir l'évaluation →`,
  },
  {
    subject: (n,s,v) => `Qui vient chez vous après une recherche Google ?`,
    hook: (n,s,v) => `86% des clients d'un ${s} commencent leur recherche sur Google avant de se déplacer.\nJ'ai regardé comment <strong>${n}</strong> se positionne à <strong>${v}</strong> — le résultat peut surprendre.`,
    cta: () => `Voir le positionnement →`,
  },
  {
    subject: (n,s,v) => `Votre fiche Google attire-t-elle les bons clients ?`,
    hook: (n,s,v) => `Une fiche Google bien configurée filtre et attire les clients les plus qualifiés.\nJ'ai regardé celle de <strong>${n}</strong> à <strong>${v}</strong> — quelques points peuvent être affinés.`,
    cta: () => `Voir les points →`,
  },
  {
    subject: (n,s,v) => `${n} — où en êtes-vous sur Google Maps ?`,
    hook: (n,s,v) => `Sur Google Maps à <strong>${v}</strong>, la position d'un commerce comme <strong>${n}</strong> peut varier énormément selon quelques paramètres clés.\nJ'ai regardé où vous en êtes.`,
    cta: () => `Voir ma position →`,
  },
  {
    subject: (n,s,v) => `Vos avis Google parlent-ils pour vous ?`,
    hook: (n,s,v) => `Les avis Google sont souvent le premier critère de décision d'un client à <strong>${v}</strong>.\nJ'ai regardé ceux de <strong>${n}</strong> — et la façon dont vous y répondez dit beaucoup.`,
    cta: () => `Voir l'analyse →`,
  },
  {
    subject: (n,s,v) => `${n} — votre fiche génère-t-elle des appels ?`,
    hook: (n,s,v) => `Une fiche Google bien construite génère des appels, des visites et des demandes d'itinéraire.\nJ'ai regardé celle de <strong>${n}</strong> à <strong>${v}</strong> — voici ce que j'ai trouvé.`,
    cta: () => `Voir les résultats →`,
  },
  {
    subject: (n,s,v) => `${s} à ${v} — comment vous comparez-vous ?`,
    hook: (n,s,v) => `J'ai regardé comment <strong>${n}</strong> se compare aux autres ${s} sur Google Maps à <strong>${v}</strong>.\nLe benchmark est instructif — et les pistes d'amélioration sont concrètes.`,
    cta: () => `Voir le benchmark →`,
  },
  {
    subject: (n,s,v) => `${n} — votre fiche reflète-t-elle vraiment votre commerce ?`,
    hook: (n,s,v) => `Votre fiche Google, c'est votre vitrine en ligne à <strong>${v}</strong>.\nJ'ai regardé celle de <strong>${n}</strong> — quelques ajustements la rendraient bien plus convaincante.`,
    cta: () => `Voir les ajustements →`,
  },
  {
    subject: (n,s,v) => `${n} — vos horaires Google sont-ils à jour ?`,
    hook: (n,s,v) => `Un client qui trouve des horaires erronés sur Google Maps ne reviendra pas. C'est l'une des premières choses que j'ai vérifiées sur la fiche de <strong>${n}</strong> à <strong>${v}</strong>.`,
    cta: () => `Voir le diagnostic →`,
  },
  {
    subject: (n,s,v) => `${n} — votre fiche Google est-elle complète ?`,
    hook: (n,s,v) => `Les fiches Google incomplètes sont pénalisées dans les résultats de recherche.\nJ'ai vérifié celle de <strong>${n}</strong> à <strong>${v}</strong> — voici ce qui manque.`,
    cta: () => `Voir ce qui manque →`,
  },
  {
    subject: (n,s,v) => `Vos photos Google donnent-elles envie de venir ?`,
    hook: (n,s,v) => `Les photos sont le premier élément visuel que voient vos futurs clients sur Google.\nJ'ai regardé celles de <strong>${n}</strong> à <strong>${v}</strong> — quelques observations utiles.`,
    cta: () => `Voir les observations →`,
  },
  {
    subject: (n,s,v) => `${n} — vos concurrents Google sont-ils devant vous ?`,
    hook: (n,s,v) => `À <strong>${v}</strong>, j'ai regardé comment les ${s} se positionnent sur Google Maps.\n<strong>${n}</strong> a des atouts — mais certains concurrents ont quelques longueurs d'avance sur des critères précis.`,
    cta: () => `Voir la comparaison →`,
  },
  {
    subject: (n,s,v) => `${n} — que cherchent vos clients sur Google ?`,
    hook: (n,s,v) => `Les recherches Google autour de <strong>${v}</strong> pour votre type de commerce sont précises.\nJ'ai analysé comment la fiche de <strong>${n}</strong> répond à ces attentes.`,
    cta: () => `Voir l'analyse →`,
  },
  {
    subject: (n,s,v) => `${n} — votre description Google est-elle convaincante ?`,
    hook: (n,s,v) => `La description Google d'un commerce, c'est 200 caractères pour convaincre un client de cliquer.\nJ'ai relu celle de <strong>${n}</strong> à <strong>${v}</strong> — et j'ai quelques suggestions.`,
    cta: () => `Voir les suggestions →`,
  },
  {
    subject: (n,s,v) => `${n} — combien de fois apparaissez-vous sur Google cette semaine ?`,
    hook: (n,s,v) => `Les statistiques Google Business montrent souvent des surprises sur la fréquence d'apparition dans les recherches.\nJ'ai regardé les signaux disponibles pour <strong>${n}</strong> à <strong>${v}</strong>.`,
    cta: () => `Voir les signaux →`,
  },

  // ── Angle C : Compétition / Preuve sociale (40-59) ───────────────────────
  {
    subject: (n,s,v) => `Vos futurs clients vous cherchent sur Google`,
    hook: (n,s,v) => `Chaque semaine, des clients potentiels cherchent des commerces comme <strong>${n}</strong> sur Google à <strong>${v}</strong>.\nVotre fiche leur donne-t-elle envie de venir ? J'ai quelques observations.`,
    cta: () => `Voir l'analyse →`,
  },
  {
    subject: (n,s,v) => `${n} — ce que font les meilleurs ${s} sur Google`,
    hook: (n,s,v) => `Les ${s} les mieux positionnés sur Google Maps à <strong>${v}</strong> ont quelques pratiques en commun.\nJ'ai regardé si <strong>${n}</strong> applique ces mêmes pratiques — voici ce que j'ai trouvé.`,
    cta: () => `Voir les pratiques →`,
  },
  {
    subject: (n,s,v) => `${n} — vos voisins sont devant vous sur Google`,
    hook: (n,s,v) => `Sur Google Maps à <strong>${v}</strong>, certains ${s} de votre secteur ont pris de l'avance.\nJ'ai comparé leur fiche à la vôtre — les différences sont instructives.`,
    cta: () => `Voir la comparaison →`,
  },
  {
    subject: (n,s,v) => `Comment les ${s} de ${v} gagnent des clients sur Google`,
    hook: (n,s,v) => `Les ${s} qui attirent le plus de clients via Google à <strong>${v}</strong> ont quelques points en commun.\nJ'ai regardé si <strong>${n}</strong> est sur la même trajectoire.`,
    cta: () => `Voir la trajectoire →`,
  },
  {
    subject: (n,s,v) => `${n} — ce que vos concurrents font différemment`,
    hook: (n,s,v) => `J'ai analysé plusieurs fiches Google de ${s} à <strong>${v}</strong> pour comprendre ce qui différencie les meilleurs.\n<strong>${n}</strong> a des atouts — mais quelques ajustements pourraient changer le classement.`,
    cta: () => `Voir les différences →`,
  },
  {
    subject: (n,s,v) => `${n} — Google Maps vous place où exactement ?`,
    hook: (n,s,v) => `Sur Google Maps, les 3 premiers résultats captent plus de 75% des clics.\nJ'ai regardé où se positionne <strong>${n}</strong> parmi les ${s} à <strong>${v}</strong>.`,
    cta: () => `Voir ma position →`,
  },
  {
    subject: (n,s,v) => `${n} — les ${s} de ${v} qui cartonnent sur Google`,
    hook: (n,s,v) => `Certains ${s} à <strong>${v}</strong> reçoivent 3 à 5 fois plus de visites depuis Google que leurs voisins.\nLa différence tient souvent à quelques détails. J'ai regardé pour <strong>${n}</strong>.`,
    cta: () => `Voir les détails →`,
  },
  {
    subject: (n,s,v) => `${n} — votre réputation Google face à la concurrence`,
    hook: (n,s,v) => `La réputation en ligne d'un commerce local se joue en grande partie sur Google.\nJ'ai comparé la réputation de <strong>${n}</strong> aux autres ${s} à <strong>${v}</strong>.`,
    cta: () => `Voir la comparaison →`,
  },
  {
    subject: (n,s,v) => `${n} — les clients choisissent toujours le mieux noté`,
    hook: (n,s,v) => `Sur Google Maps, 68% des clients choisissent le commerce le mieux noté quand tout est égal.\nJ'ai regardé comment <strong>${n}</strong> se positionne sur ce critère à <strong>${v}</strong>.`,
    cta: () => `Voir le positionnement →`,
  },
  {
    subject: (n,s,v) => `${n} — pendant que vous lisez ceci, des clients choisissent`,
    hook: (n,s,v) => `En ce moment, des clients cherchent un ${s} à <strong>${v}</strong> sur Google Maps.\nIls vont choisir parmi les fiches disponibles — dont celle de <strong>${n}</strong>. J'ai regardé comment elle se présente.`,
    cta: () => `Voir comment →`,
  },
  {
    subject: (n,s,v) => `${s} à ${v} — qui ressort le premier sur Google ?`,
    hook: (n,s,v) => `Quand quelqu'un cherche un ${s} à <strong>${v}</strong> sur Google Maps, qui voit-il en premier ?\nJ'ai fait la recherche — et j'ai regardé où se place <strong>${n}</strong>.`,
    cta: () => `Voir les résultats →`,
  },
  {
    subject: (n,s,v) => `${n} — les avis de vos concurrents sont-ils meilleurs ?`,
    hook: (n,s,v) => `Les avis Google sont le premier filtre des clients à <strong>${v}</strong> pour choisir un ${s}.\nJ'ai comparé ceux de <strong>${n}</strong> aux autres — voici ce que j'ai observé.`,
    cta: () => `Voir l'observation →`,
  },
  {
    subject: (n,s,v) => `${n} — la différence entre vous et le n°1 local`,
    hook: (n,s,v) => `Le ${s} le mieux positionné sur Google à <strong>${v}</strong> a quelques avantages précis sur sa fiche.\nJ'ai regardé la différence avec <strong>${n}</strong> — elle est souvent plus courte qu'on ne le pense.`,
    cta: () => `Voir la différence →`,
  },
  {
    subject: (n,s,v) => `${n} — votre réputation en ligne face à ${v}`,
    hook: (n,s,v) => `La réputation d'un ${s} à <strong>${v}</strong> se construit d'abord sur Google.\nJ'ai regardé comment <strong>${n}</strong> se positionne dans l'esprit des clients potentiels de la zone.`,
    cta: () => `Voir le positionnement →`,
  },
  {
    subject: (n,s,v) => `${n} — êtes-vous visible pour les nouveaux habitants de ${v} ?`,
    hook: (n,s,v) => `Les nouveaux habitants d'une ville cherchent systématiquement leurs commerces sur Google.\nJ'ai regardé comment <strong>${n}</strong> apparaît pour ces recherches à <strong>${v}</strong>.`,
    cta: () => `Voir les résultats →`,
  },
  {
    subject: (n,s,v) => `${n} — vos concurrents publient, vous non ?`,
    hook: (n,s,v) => `Les ${s} les plus visibles sur Google à <strong>${v}</strong> publient régulièrement sur leur fiche Business.\nJ'ai regardé la fréquence de publication de <strong>${n}</strong> — et celle de vos principaux concurrents.`,
    cta: () => `Voir la comparaison →`,
  },
  {
    subject: (n,s,v) => `${n} — Google favorise les fiches actives`,
    hook: (n,s,v) => `L'algorithme Google Maps favorise les fiches qui montrent des signes d'activité réguliers.\nJ'ai regardé le niveau d'activité de la fiche de <strong>${n}</strong> à <strong>${v}</strong>.`,
    cta: () => `Voir l'activité →`,
  },
  {
    subject: (n,s,v) => `${n} — qui attire les clients le vendredi soir à ${v} ?`,
    hook: (n,s,v) => `Les recherches Google Maps de ${s} à <strong>${v}</strong> pic les soirs et week-ends.\nJ'ai regardé si la fiche de <strong>${n}</strong> est positionnée pour capter ces moments clés.`,
    cta: () => `Voir l'analyse →`,
  },
  {
    subject: (n,s,v) => `${n} — comment Google décide de vous montrer`,
    hook: (n,s,v) => `Google décide d'afficher ou non un commerce selon une série de critères précis.\nJ'ai regardé comment la fiche de <strong>${n}</strong> à <strong>${v}</strong> répond à ces critères.`,
    cta: () => `Voir les critères →`,
  },
  {
    subject: (n,s,v) => `${n} — les touristes de ${v} vous trouvent-ils ?`,
    hook: (n,s,v) => `Les visiteurs et touristes à <strong>${v}</strong> utilisent massivement Google Maps pour trouver un ${s}.\nJ'ai regardé si la fiche de <strong>${n}</strong> est positionnée pour capter cette clientèle.`,
    cta: () => `Voir l'analyse →`,
  },

  // ── Angle D : Résultats / ROI (60-79) ────────────────────────────────────
  {
    subject: (n,s,v) => `${n} — quelques idées Google Maps`,
    hook: (n,s,v) => `À <strong>${v}</strong>, les recherches Google vers des commerces comme <strong>${n}</strong> sont quotidiennes.\nJ'ai regardé votre fiche — quelques améliorations simples pourraient faire une vraie différence.`,
    cta: () => `Découvrir lesquelles →`,
  },
  {
    subject: (n,s,v) => `${n} — plus de clients depuis Google, c'est possible`,
    hook: (n,s,v) => `Une fiche Google optimisée génère en moyenne 35% de contacts supplémentaires pour un commerce local.\nJ'ai regardé le potentiel de celle de <strong>${n}</strong> à <strong>${v}</strong>.`,
    cta: () => `Voir le potentiel →`,
  },
  {
    subject: (n,s,v) => `${n} — combien de clients Google vous manquez ?`,
    hook: (n,s,v) => `Les commerces locaux optimisés sur Google captent en moyenne 7x plus de visites que les autres.\nJ'ai estimé l'écart pour <strong>${n}</strong> à <strong>${v}</strong> — le chiffre peut surprendre.`,
    cta: () => `Voir l'estimation →`,
  },
  {
    subject: (n,s,v) => `${n} — un client de plus par semaine depuis Google`,
    hook: (n,s,v) => `Pour un commerce comme <strong>${n}</strong> à <strong>${v}</strong>, un client supplémentaire par semaine via Google représente une différence significative sur l'année.\nJ'ai regardé ce qu'il faudrait pour y arriver.`,
    cta: () => `Voir ce qu'il faut →`,
  },
  {
    subject: (n,s,v) => `${n} — le ROI d'une fiche Google bien tenue`,
    hook: (n,s,v) => `Une heure investie sur votre fiche Google peut générer des dizaines de nouveaux clients sur les mois suivants.\nJ'ai regardé où en est la fiche de <strong>${n}</strong> à <strong>${v}</strong> et les gains potentiels.`,
    cta: () => `Voir les gains →`,
  },
  {
    subject: (n,s,v) => `${n} — votre fiche Google vaut-elle son potentiel ?`,
    hook: (n,s,v) => `Une fiche Google représente un actif commercial précieux pour un ${s} à <strong>${v}</strong>.\nJ'ai évalué si celle de <strong>${n}</strong> exploite vraiment son potentiel.`,
    cta: () => `Voir l'évaluation →`,
  },
  {
    subject: (n,s,v) => `${n} — 5 minutes pour plus de clients`,
    hook: (n,s,v) => `La plupart des optimisations qui font la différence sur Google Maps prennent moins de 5 minutes.\nJ'ai listé celles qui seraient les plus utiles pour <strong>${n}</strong> à <strong>${v}</strong>.`,
    cta: () => `Voir la liste →`,
  },
  {
    subject: (n,s,v) => `${n} — votre fiche Google génère-t-elle des appels ?`,
    hook: (n,s,v) => `Les fiches Google optimisées génèrent entre 3 et 10 appels entrants supplémentaires par semaine.\nJ'ai regardé si celle de <strong>${n}</strong> à <strong>${v}</strong> est configurée pour maximiser ce résultat.`,
    cta: () => `Voir la configuration →`,
  },
  {
    subject: (n,s,v) => `${n} — chaque avis Google vaut de l'argent`,
    hook: (n,s,v) => `Chaque avis positif sur Google augmente statistiquement le taux de conversion des visiteurs en clients.\nJ'ai regardé la situation des avis de <strong>${n}</strong> à <strong>${v}</strong>.`,
    cta: () => `Voir la situation →`,
  },
  {
    subject: (n,s,v) => `${n} — l'impact d'une fiche bien tenue sur votre CA`,
    hook: (n,s,v) => `Pour un ${s} à <strong>${v}</strong>, une fiche Google active peut représenter 20 à 30% du flux client annuel.\nJ'ai regardé si <strong>${n}</strong> capture ce flux efficacement.`,
    cta: () => `Voir l'analyse →`,
  },
  {
    subject: (n,s,v) => `${n} — votre investissement Google est sous-exploité`,
    hook: (n,s,v) => `Votre fiche Google Business est gratuite. C'est probablement l'outil marketing le plus rentable à votre disposition.\nJ'ai regardé si celle de <strong>${n}</strong> à <strong>${v}</strong> est pleinement exploitée.`,
    cta: () => `Voir l'exploitation →`,
  },
  {
    subject: (n,s,v) => `${n} — de la visibilité sans budget publicitaire`,
    hook: (n,s,v) => `Contrairement aux publicités payantes, une fiche Google bien optimisée génère de la visibilité durablement et gratuitement.\nJ'ai regardé le potentiel de celle de <strong>${n}</strong> à <strong>${v}</strong>.`,
    cta: () => `Voir le potentiel →`,
  },
  {
    subject: (n,s,v) => `${n} — chaque semaine sans publication = clients perdus`,
    hook: (n,s,v) => `Google pénalise les fiches inactives dans ses classements. Chaque semaine sans publication, c'est de la visibilité perdue.\nJ'ai regardé la régularité de <strong>${n}</strong> à <strong>${v}</strong>.`,
    cta: () => `Voir la régularité →`,
  },
  {
    subject: (n,s,v) => `${n} — votre fiche Google attire-t-elle des demandes ?`,
    hook: (n,s,v) => `Les fiches Google optimisées reçoivent des demandes d'itinéraire, des appels et des visites en magasin.\nJ'ai regardé si celle de <strong>${n}</strong> à <strong>${v}</strong> génère ces actions.`,
    cta: () => `Voir les actions →`,
  },
  {
    subject: (n,s,v) => `${n} — le coût d'une fiche Google négligée`,
    hook: (n,s,v) => `Une fiche Google négligée, c'est des clients qui passent chez le voisin sans que vous le sachiez.\nJ'ai regardé les signaux de la fiche de <strong>${n}</strong> à <strong>${v}</strong>.`,
    cta: () => `Voir les signaux →`,
  },
  {
    subject: (n,s,v) => `${n} — votre meilleur canal d'acquisition est gratuit`,
    hook: (n,s,v) => `Pour la plupart des ${s} locaux, Google Maps est le premier canal d'acquisition de nouveaux clients — et il est gratuit.\nJ'ai regardé si <strong>${n}</strong> à <strong>${v}</strong> en tire pleinement parti.`,
    cta: () => `Voir l'analyse →`,
  },
  {
    subject: (n,s,v) => `${n} — votre fiche Google doit travailler pour vous`,
    hook: (n,s,v) => `Votre fiche Google peut générer des clients pendant que vous travaillez, dormez ou profitez de vos week-ends.\nJ'ai regardé si celle de <strong>${n}</strong> à <strong>${v}</strong> est configurée pour ça.`,
    cta: () => `Voir la configuration →`,
  },
  {
    subject: (n,s,v) => `${n} — 3 choses simples pour plus de clients Google`,
    hook: (n,s,v) => `J'ai regardé la fiche de <strong>${n}</strong> à <strong>${v}</strong> avec un oeil critique.\nTrois choses simples, si elles étaient ajustées, pourraient générer nettement plus de contacts entrants.`,
    cta: () => `Voir les 3 choses →`,
  },
  {
    subject: (n,s,v) => `${n} — votre fiche Google vaut plus que vous ne pensez`,
    hook: (n,s,v) => `Une fiche Google bien tenue pour un ${s} à <strong>${v}</strong> est un actif commercial qui se valorise dans le temps.\nJ'ai regardé comment celle de <strong>${n}</strong> se situe aujourd'hui.`,
    cta: () => `Voir la valeur →`,
  },
  {
    subject: (n,s,v) => `${n} — les 2 minutes qui changent votre visibilité`,
    hook: (n,s,v) => `Les ajustements les plus impactants sur une fiche Google prennent souvent moins de 2 minutes.\nJ'ai identifié ceux qui feraient le plus d'effet pour <strong>${n}</strong> à <strong>${v}</strong>.`,
    cta: () => `Voir les ajustements →`,
  },

  // ── Angle E : Récit / Émotion (80-99) ────────────────────────────────────
  {
    subject: (n,s,v) => `${n} — une histoire de fiche Google`,
    hook: (n,s,v) => `Il y a quelques semaines, un ${s} à <strong>${v}</strong> a doublé ses appels entrants en ajustant 4 points sur sa fiche Google.\nJ'ai regardé si <strong>${n}</strong> a les mêmes points à ajuster.`,
    cta: () => `Voir les points →`,
  },
  {
    subject: (n,s,v) => `Brian de LocalBoost — un message pour ${n}`,
    hook: (n,s,v) => `Bonjour,\n\nJe m'appelle Brian, je travaille avec des commerces locaux pour améliorer leur présence sur Google.\nJ'ai regardé la fiche de <strong>${n}</strong> à <strong>${v}</strong> — et j'ai envie de vous partager ce que j'ai vu.`,
    cta: () => `Voir ce que j'ai vu →`,
  },
  {
    subject: (n,s,v) => `${n} — je passais par ${v}`,
    hook: (n,s,v) => `En cherchant un ${s} à <strong>${v}</strong> la semaine dernière, je suis tombé sur la fiche de <strong>${n}</strong>.\nElle m'a interpellé — quelques détails pourraient vraiment améliorer l'impression qu'elle donne.`,
    cta: () => `Voir les détails →`,
  },
  {
    subject: (n,s,v) => `${n} — votre travail mérite d'être vu`,
    hook: (n,s,v) => `Beaucoup de commerçants font un travail remarquable mais restent invisibles sur Google faute de quelques ajustements simples.\nJ'ai regardé la fiche de <strong>${n}</strong> à <strong>${v}</strong> — c'est le cas ici.`,
    cta: () => `Voir les ajustements →`,
  },
  {
    subject: (n,s,v) => `${n} — un commerçant qui mérite d'être trouvé`,
    hook: (n,s,v) => `Les bons commerces locaux méritent d'être visibles. C'est pour ça que j'aide les ${s} comme <strong>${n}</strong> à <strong>${v}</strong> à optimiser leur présence Google.\nJ'ai regardé la vôtre — quelques choses sont à améliorer.`,
    cta: () => `Voir ce qui est à améliorer →`,
  },
  {
    subject: (n,s,v) => `${n} — votre client idéal vous cherche en ce moment`,
    hook: (n,s,v) => `En ce moment, votre client idéal cherche peut-être un ${s} à <strong>${v}</strong> sur Google.\nVotre fiche est-elle prête à lui répondre ? J'ai regardé pour vous.`,
    cta: () => `Voir si elle est prête →`,
  },
  {
    subject: (n,s,v) => `${n} — parce que les bons commerçants méritent d'être trouvés`,
    hook: (n,s,v) => `Il y a quelque chose d'injuste dans le fait qu'un bon commerce passe inaperçu sur Google faute d'un peu d'optimisation.\nJ'ai regardé la situation de <strong>${n}</strong> à <strong>${v}</strong>.`,
    cta: () => `Voir la situation →`,
  },
  {
    subject: (n,s,v) => `${n} — le temps que vous passez à fidéliser mérite d'être vu`,
    hook: (n,s,v) => `Vous passez du temps à soigner vos clients, votre qualité, votre service.\nMais si votre fiche Google ne reflète pas ça à <strong>${v}</strong>, les nouveaux clients ne le sauront jamais.`,
    cta: () => `Voir comment la refléter →`,
  },
  {
    subject: (n,s,v) => `${n} — votre histoire mérite d'être racontée sur Google`,
    hook: (n,s,v) => `Chaque commerce local a une histoire, des valeurs, un savoir-faire.\nJ'ai regardé comment ceux de <strong>${n}</strong> ressortent sur Google Maps à <strong>${v}</strong>.`,
    cta: () => `Voir ce qui ressort →`,
  },
  {
    subject: (n,s,v) => `${n} — les clients fidèles vous trouvent. Les nouveaux ?`,
    hook: (n,s,v) => `Vos clients fidèles vous connaissent déjà — ils viennent naturellement.\nMais les nouveaux clients à <strong>${v}</strong> qui cherchent un ${s} sur Google, eux, ont besoin d'être convaincus. J'ai regardé comment <strong>${n}</strong> se présente à eux.`,
    cta: () => `Voir la présentation →`,
  },
  {
    subject: (n,s,v) => `${n} — ce que ressent un client en voyant votre fiche`,
    hook: (n,s,v) => `Un client qui tombe sur la fiche de <strong>${n}</strong> à <strong>${v}</strong> pour la première fois — quelle impression a-t-il ?\nJ'ai regardé avec un oeil neuf — et j'ai quelques observations honnêtes.`,
    cta: () => `Voir les observations →`,
  },
  {
    subject: (n,s,v) => `${n} — votre fiche Google parle à votre place`,
    hook: (n,s,v) => `Quand vous ne pouvez pas vous adresser directement à un futur client, votre fiche Google le fait à votre place.\nJ'ai regardé ce qu'elle dit actuellement pour <strong>${n}</strong> à <strong>${v}</strong>.`,
    cta: () => `Voir ce qu'elle dit →`,
  },
  {
    subject: (n,s,v) => `${n} — le premier regard d'un client sur votre commerce`,
    hook: (n,s,v) => `Pour la plupart des nouveaux clients à <strong>${v}</strong>, votre fiche Google est leur premier contact avec <strong>${n}</strong>.\nJ'ai regardé cette première impression — voici ce que j'ai vu.`,
    cta: () => `Voir la première impression →`,
  },
  {
    subject: (n,s,v) => `${n} — ne laissez pas un concurrent raconter mieux votre histoire`,
    hook: (n,s,v) => `Sur Google Maps à <strong>${v}</strong>, les clients comparent les ${s} en quelques secondes.\nJ'ai regardé si <strong>${n}</strong> raconte son histoire aussi bien que ses concurrents.`,
    cta: () => `Voir la comparaison →`,
  },
  {
    subject: (n,s,v) => `${n} — un regard extérieur sur votre présence Google`,
    hook: (n,s,v) => `On voit rarement sa propre fiche Google comme un client nouveau la voit.\nJe vous offre ce regard extérieur sur <strong>${n}</strong> à <strong>${v}</strong> — quelques choses méritent attention.`,
    cta: () => `Voir le regard →`,
  },
  {
    subject: (n,s,v) => `${n} — votre réputation Google se construit sans vous`,
    hook: (n,s,v) => `Que vous le vouliez ou non, votre réputation sur Google se construit chaque jour à <strong>${v}</strong>.\nJ'ai regardé dans quelle direction elle évolue pour <strong>${n}</strong>.`,
    cta: () => `Voir l'évolution →`,
  },
  {
    subject: (n,s,v) => `${n} — j'ai pensé à vous en cherchant un ${s}`,
    hook: (n,s,v) => `En cherchant un ${s} à <strong>${v}</strong> récemment, j'ai pensé à regarder la fiche de <strong>${n}</strong>.\nJ'y ai vu des choses intéressantes — et quelques opportunités à saisir.`,
    cta: () => `Voir les opportunités →`,
  },
  {
    subject: (n,s,v) => `${n} — ce que j'aurais envie de voir sur votre fiche`,
    hook: (n,s,v) => `En tant que client potentiel qui cherche un ${s} à <strong>${v}</strong>, voici ce que j'aurais envie de voir sur votre fiche.\nJ'ai regardé si <strong>${n}</strong> répond à ces attentes.`,
    cta: () => `Voir les attentes →`,
  },
  {
    subject: (n,s,v) => `${n} — votre fiche Google est votre commercial 24h/24`,
    hook: (n,s,v) => `Votre fiche Google, c'est le seul commercial qui travaille pour vous 24h/24 et 7j/7 à <strong>${v}</strong>.\nJ'ai regardé à quel point ce commercial est efficace pour <strong>${n}</strong>.`,
    cta: () => `Voir l'efficacité →`,
  },
  {
    subject: (n,s,v) => `${n} — quelques mots pour améliorer votre visibilité`,
    hook: (n,s,v) => `Je travaille avec des commerces locaux depuis plusieurs années.\nJ'ai regardé la fiche de <strong>${n}</strong> à <strong>${v}</strong> — et j'ai quelques mots simples mais utiles à partager.`,
    cta: () => `Voir les mots →`,
  },
]

const N_VARIANTS = VARIANTS.length // 100 — Thompson Sampling sélectionne automatiquement les meilleures

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

  const hookHtml = hookText.replace(/\n/g, '<br>')

  return `<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:40px 24px;color:#1a1a1a;font-size:15px;line-height:1.7;">

  <p style="margin:0 0 20px;">Bonjour,</p>

  <p style="margin:0 0 28px;color:#374151;">${hookHtml}</p>

  <p style="margin:0 0 32px;">
    <a href="${trackUrl}" style="display:inline-block;background:#16a34a;color:#fff;font-family:Arial,sans-serif;font-size:14px;font-weight:600;padding:11px 22px;border-radius:6px;text-decoration:none;">${ctaText}</a>
  </p>

  <p style="margin:0;font-size:14px;color:#374151;">Brian<br>
  <span style="color:#9ca3af;font-size:12px;">LocalBoost · <a href="mailto:contact@thelocalboost.fr" style="color:#9ca3af;text-decoration:none;">contact@thelocalboost.fr</a></span></p>

  <hr style="border:none;border-top:1px solid #f3f4f6;margin:32px 0 16px;">
  <p style="color:#d1d5db;font-size:11px;margin:0;">
    Vous recevez cet email car votre établissement est référencé sur Google Maps. ·
    <a href="mailto:contact@thelocalboost.fr?subject=désinscription" style="color:#d1d5db;">Se désinscrire</a>
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
