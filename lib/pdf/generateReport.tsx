import React from 'react'
import {
  Document, Page, Text, View, StyleSheet, Image, renderToBuffer,
} from '@react-pdf/renderer'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ReportData {
  // 'express' = pack conversion rapide (prix bas) ; 'surMesure' = pack complet (69-99€)
  tier: 'express' | 'surMesure'
  name: string
  city: string
  category: string
  rating: number
  reviews: number
  photos: number
  phoneIntl?: string | null
  problems: string[]
  recentReviews: Array<{ author: string; rating: number; text: string }>
  topCompetitor?: { name: string; rating: number; reviewCount: number } | null
  lostRevenue: number
  placeId?: string | null
  reviewUrl?: string | null
  qrUrl?: string | null
  // Score de complétude de fiche — argument commercial principal (voir Section1).
  // "7x" = clics, pas apparition/classement — seule formulation vérifiable (source Google).
  completeness: { percent: number; filled: number; total: number }
  // Diagnostic de positionnement par mot-clé (tier sur-mesure) — absent si non
  // vérifié ou si aucun écart significatif n'a été trouvé (jamais de valeur inventée)
  positioning?: {
    generic: { keyword: string; position: number | null; scanned: number }
    services: Array<{ keyword: string; position: number | null; scanned: number }>
    teaser: string | null
  } | null
  description: string
  reviewResponses: unknown[]
  responseTemplates: Record<string, unknown[]>
  guideSteps: string[]
  actionPlan: string
  faq: Array<{ q: string; a: string }>
  services: Array<{ name: string; description: string }>
  photoIdeas: string[]
}

// Défensif contre [object Object] : extrait toujours une chaîne
function txt(val: unknown): string {
  if (typeof val === 'string') return val.trim()
  if (val && typeof val === 'object') {
    const o = val as Record<string, unknown>
    const v = o.text ?? o.response ?? o.reponse ?? o.content ?? o.value
    if (typeof v === 'string') return v.trim()
  }
  return ''
}

// ── Design tokens ─────────────────────────────────────────────────────────────

const G        = '#16a34a'
const DARK     = '#111827'
const G700     = '#374151'
const G500     = '#6b7280'
const G400     = '#9ca3af'
const G200     = '#e5e7eb'
const G100     = '#f3f4f6'
const G50      = '#f9fafb'
const GREEN_BG = '#f0fdf4'
const GREEN_BD = '#bbf7d0'
const YEL_BG   = '#fefce8'
const YEL_BD   = '#fde68a'
const RED_BG   = '#fef2f2'
const RED_BD   = '#fecaca'

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  // ── Pages ──
  coverPage: { fontFamily: 'Helvetica', backgroundColor: '#fff' },
  page: {
    fontFamily: 'Helvetica',
    backgroundColor: '#fff',
    paddingTop: 58,
    paddingBottom: 58,
    paddingHorizontal: 48,
    fontSize: 10,
    color: DARK,
  },

  // ── Fixed header ──
  fixedHeader: {
    position: 'absolute',
    top: 16,
    left: 48,
    right: 48,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: G200,
    borderBottomStyle: 'solid',
    paddingBottom: 6,
  },
  fixedHeaderL: { fontSize: 8, color: G400 },
  fixedHeaderR: { fontSize: 8, color: G, fontFamily: 'Helvetica-Bold' },

  // ── Fixed footer ──
  fixedFooter: {
    position: 'absolute',
    bottom: 16,
    left: 48,
    right: 48,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: G200,
    borderTopStyle: 'solid',
    paddingTop: 6,
  },
  fixedFooterText: { fontSize: 8, color: G400 },

  // ── Section ──
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: G,
    marginTop: 24,
    marginBottom: 4,
  },
  sectionBar: { height: 2, width: 28, backgroundColor: G, marginBottom: 10 },
  explainBox: {
    backgroundColor: G50,
    borderLeftWidth: 3,
    borderLeftColor: G,
    borderLeftStyle: 'solid',
    padding: 10,
    marginBottom: 14,
  },
  explainText: { fontSize: 9.5, color: G500, lineHeight: 1.6 },

  // ── Subsection ──
  subTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: G700,
    marginTop: 18,
    marginBottom: 3,
  },
  subHint: { fontSize: 9, color: G500, marginBottom: 9, lineHeight: 1.55 },

  // ── Copy box ──
  copyBox: {
    backgroundColor: G50,
    borderWidth: 1,
    borderColor: G200,
    borderStyle: 'solid',
    borderRadius: 6,
    padding: 12,
    marginBottom: 12,
  },
  copyText: { fontSize: 10, color: DARK, lineHeight: 1.75 },

  // ── Publications ──
  pubBox: {
    backgroundColor: G50,
    borderWidth: 1,
    borderColor: G200,
    borderStyle: 'solid',
    borderRadius: 8,
    padding: 12,
    marginBottom: 9,
  },
  pubLabel: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: G500,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 5,
  },
  pubText: { fontSize: 10, color: DARK, lineHeight: 1.75 },

  // ── Réponses avis ──
  reviewBox: {
    backgroundColor: GREEN_BG,
    borderWidth: 1,
    borderColor: GREEN_BD,
    borderStyle: 'solid',
    borderRadius: 6,
    padding: 12,
    marginBottom: 10,
  },
  reviewLabel: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: G, marginBottom: 4 },
  reviewText:  { fontSize: 10, color: DARK, lineHeight: 1.75 },

  // ── Modèles ──
  tplCat: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: G500,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginTop: 14,
    marginBottom: 5,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: G200,
    borderBottomStyle: 'solid',
  },
  tplBox: {
    backgroundColor: G50,
    borderWidth: 1,
    borderColor: G200,
    borderStyle: 'solid',
    borderRadius: 5,
    padding: 9,
    marginBottom: 5,
  },
  tplText: { fontSize: 9.5, color: G700, lineHeight: 1.6 },

  // ── Calendrier ──
  calHeaderRow: {
    flexDirection: 'row',
    backgroundColor: G50,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: G200,
    borderBottomStyle: 'solid',
  },
  calRow: {
    flexDirection: 'row',
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: G100,
    borderBottomStyle: 'solid',
  },
  calDate: { flex: 1, fontSize: 9.5, color: G500 },
  calPub:  { fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: G700 },

  // ── FAQ ──
  faqItem: {
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: G100,
    borderBottomStyle: 'solid',
  },
  faqNum: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: G, marginBottom: 2 },
  faqQ:   { fontSize: 10, fontFamily: 'Helvetica-Bold', color: G700, marginBottom: 3 },
  faqA:   { fontSize: 10, color: G500, lineHeight: 1.5 },

  // ── Services ──
  svcBox: {
    backgroundColor: G50,
    borderWidth: 1,
    borderColor: G200,
    borderStyle: 'solid',
    borderRadius: 6,
    padding: 10,
    marginBottom: 7,
  },
  svcName: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: G700, marginBottom: 3 },
  svcDesc: { fontSize: 9.5, color: G500, lineHeight: 1.5 },

  // ── Photos checklist ──
  checkItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: G100,
    borderBottomStyle: 'solid',
  },
  checkBox: {
    width: 11,
    height: 11,
    borderWidth: 1,
    borderColor: G200,
    borderStyle: 'solid',
    borderRadius: 2,
    marginRight: 8,
    marginTop: 1,
    flexShrink: 0,
  },
  checkText: { flex: 1, fontSize: 10, color: G700, lineHeight: 1.4 },

  // ── Guide ──
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  stepCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: G,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    flexShrink: 0,
  },
  stepNum:  { fontSize: 9, color: '#fff', fontFamily: 'Helvetica-Bold' },
  stepText: { flex: 1, fontSize: 10, color: G700, lineHeight: 1.5, paddingTop: 3 },

  // ── Plan d'action ──
  priorityBox: {
    backgroundColor: YEL_BG,
    borderWidth: 1,
    borderColor: YEL_BD,
    borderStyle: 'solid',
    borderRadius: 6,
    padding: 12,
    marginBottom: 8,
  },
  priorityText: { fontSize: 10, color: '#92400e', lineHeight: 1.75 },

  // ── Situation ──
  situBox: {
    backgroundColor: RED_BG,
    borderWidth: 1,
    borderColor: RED_BD,
    borderStyle: 'solid',
    borderRadius: 8,
    padding: 14,
    marginBottom: 14,
  },
  situTitle: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#991b1b', marginBottom: 10 },
  situRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: RED_BD,
    borderBottomStyle: 'solid',
  },
  situRowLast: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  situLabel: { fontSize: 10, color: G700 },
  situVal:   { fontSize: 10, fontFamily: 'Helvetica-Bold', color: G700 },

  // ── Bullets ──
  bullet:     { flexDirection: 'row', marginBottom: 7 },
  bulletMark: { width: 14, fontSize: 10, color: G, fontFamily: 'Helvetica-Bold' },
  bulletText: { flex: 1, fontSize: 10, color: G700, lineHeight: 1.5 },

  // ── Cover ──
  coverGreen: {
    backgroundColor: G,
    paddingHorizontal: 48,
    paddingTop: 80,
    paddingBottom: 60,
  },
  coverBrand: {
    fontSize: 10,
    color: '#bbf7d0',
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 1.5,
    marginBottom: 20,
  },
  coverTitle: {
    fontSize: 28,
    fontFamily: 'Helvetica-Bold',
    color: '#fff',
    lineHeight: 1.3,
    marginBottom: 8,
  },
  coverMeta: { fontSize: 13, color: '#bbf7d0', lineHeight: 1.5 },
  coverWhite: { paddingHorizontal: 48, paddingTop: 36, paddingBottom: 48 },
  coverIntro: {
    fontSize: 12,
    color: G700,
    lineHeight: 1.75,
    marginBottom: 30,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: G200,
    borderBottomStyle: 'solid',
  },
  coverTocTitle: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: DARK, marginBottom: 12 },
  coverTocRow:   { flexDirection: 'row', marginBottom: 7 },
  coverTocNum:   { width: 24, fontSize: 10, fontFamily: 'Helvetica-Bold', color: G },
  coverTocText:  { flex: 1, fontSize: 10, color: G700 },

  // ── Dernière page ──
  lastTitle: { fontSize: 15, fontFamily: 'Helvetica-Bold', color: G, marginBottom: 16 },
  lastItem:  { flexDirection: 'row', marginBottom: 12, alignItems: 'flex-start' },
  lastDot:   {
    width: 6, height: 6, borderRadius: 3, backgroundColor: G,
    marginRight: 10, marginTop: 5, flexShrink: 0,
  },
  lastLabel: { fontFamily: 'Helvetica-Bold' },
  lastText:  { flex: 1, fontSize: 11, color: G700, lineHeight: 1.65 },

  // ── Corps ──
  body: { fontSize: 10, color: G700, lineHeight: 1.6, marginBottom: 8 },
  bold: { fontFamily: 'Helvetica-Bold' },
})

// ── Composants communs ────────────────────────────────────────────────────────

function PageHeader({ name, city }: { name: string; city: string }) {
  return (
    <View style={s.fixedHeader} fixed>
      <Text style={s.fixedHeaderL}>LocalBoost — Rapport Google · {name} · {city}</Text>
      <Text style={s.fixedHeaderR} render={({ pageNumber, totalPages }) => `Page ${pageNumber} / ${totalPages}`} />
    </View>
  )
}

function SectionHeader({ num, title, explain }: { num: string; title: string; explain: string }) {
  return (
    <View>
      <Text style={s.sectionTitle}>{num} — {title}</Text>
      <View style={s.sectionBar} />
      <View style={s.explainBox}>
        <Text style={s.explainText}>{explain}</Text>
      </View>
    </View>
  )
}

// ── Sections ─────────────────────────────────────────────────────────────────

function CoverSection({ data }: { data: ReportData }) {
  const isExpress = data.tier === 'express'
  const TOC = [
    'Votre situation aujourd\'hui',
    'Ce que nous avons préparé pour vous',
    ...(isExpress ? [] : ['Questions fréquentes pour votre fiche', 'Vos services sur Google']),
    'Idées de photos',
    ...(isExpress ? [] : ['Comment mettre tout ça en ligne', 'Votre plan d\'action', 'Collecter plus d\'avis']),
  ]
  return (
    <View>
      <View style={s.coverGreen}>
        <Text style={s.coverBrand}>LOCALBOOST</Text>
        <Text style={s.coverTitle}>Votre dossier{'\n'}Google est prêt.</Text>
        <Text style={s.coverMeta}>{data.name} · {data.city} · {data.category}</Text>
      </View>
      <View style={s.coverWhite}>
        <Text style={s.coverIntro}>
          Voici ce qu'on a préparé pour améliorer votre fiche Google et vous aider
          à attirer plus de clients. Tout est prêt à copier-coller ou à imprimer —
          vous n'avez rien à rédiger.
        </Text>
        <Text style={s.coverTocTitle}>Sommaire</Text>
        {TOC.map((t, i) => (
          <View key={i} style={s.coverTocRow}>
            <Text style={s.coverTocNum}>{String(i + 1).padStart(2, '0')}</Text>
            <Text style={s.coverTocText}>{t}</Text>
          </View>
        ))}
      </View>
    </View>
  )
}

function Section1({ data, num }: { data: ReportData; num: string }) {
  return (
    <View>
      <SectionHeader
        num={num}
        title="Votre situation aujourd'hui"
        explain={`Voici ce qu'un client potentiel voit quand il tape "${data.category} à ${data.city}" sur Google. Ces données sont issues de votre fiche réelle.`}
      />
      <View style={s.situBox}>
        <Text style={s.situTitle}>Votre fiche Google — état actuel</Text>
        <View style={s.situRow}>
          <Text style={s.situLabel}>Note Google</Text>
          <Text style={s.situVal}>
            {data.rating > 0 ? `${data.rating}/5` : 'Non renseignée'} · {data.reviews} avis
          </Text>
        </View>
        <View style={s.situRow}>
          <Text style={s.situLabel}>Photos publiées</Text>
          <Text style={s.situVal}>{data.photos} photo{data.photos !== 1 ? 's' : ''}</Text>
        </View>
        {data.topCompetitor ? (
          <View style={s.situRowLast}>
            <Text style={s.situLabel}>Concurrent principal visible</Text>
            <Text style={s.situVal}>
              {data.topCompetitor.name} ({data.topCompetitor.reviewCount} avis)
            </Text>
          </View>
        ) : (
          <View style={s.situRowLast}>
            <Text style={s.situLabel}>Concurrent principal</Text>
            <Text style={s.situVal}>Non détecté</Text>
          </View>
        )}
      </View>

      <View style={s.situBox}>
        <Text style={s.situTitle}>
          Votre fiche est complète à {data.completeness.percent}% ({data.completeness.filled} informations sur {data.completeness.total} renseignées)
        </Text>
        <Text style={s.bulletText}>
          Plus une fiche est complète, plus elle est vue et cliquée par vos clients — jusqu'à 7 fois plus qu'une fiche incomplète (source : données Google).
        </Text>
      </View>

      {data.problems.length > 0 && (
        <View>
          <Text style={[s.body, s.bold]}>Ce qui limite votre visibilité :</Text>
          {data.problems.map((p, i) => (
            <View key={i} style={s.bullet}>
              <Text style={s.bulletMark}>•</Text>
              <Text style={s.bulletText}>{p}</Text>
            </View>
          ))}
        </View>
      )}

      {data.positioning?.teaser && (
        <View style={s.situBox}>
          <Text style={s.situTitle}>Votre position sur Google Maps, par mot-clé</Text>
          <Text style={s.bulletText}>{data.positioning.teaser}</Text>
        </View>
      )}
    </View>
  )
}

function Section2a({ data, num }: { data: ReportData; num: string }) {
  return (
    <View>
      <SectionHeader
        num={num}
        title="Ce que nous avons préparé pour vous"
        explain="Vous n'avez rien à rédiger. Chaque élément ci-dessous est prêt à copier-coller ou à imprimer."
      />

      <Text style={s.subTitle}>Description de votre fiche</Text>
      <Text style={s.subHint}>
        {'Quoi : un texte qui explique votre activité aux visiteurs de Google.\n' +
         'Où le mettre : Google Business → Infos → Description.\n' +
         'Comment : copiez le texte ci-dessous tel quel.'}
      </Text>
      <View style={s.copyBox}>
        <Text style={s.copyText}>{data.description}</Text>
      </View>
    </View>
  )
}

function Section2c({ data }: { data: ReportData }) {
  const responses = data.reviewResponses.map(txt).filter(Boolean)
  if (responses.length === 0) return null
  return (
    <View>
      <Text style={s.subTitle}>Réponses à vos avis récents</Text>
      <Text style={s.subHint}>
        {'Quoi : des réponses prêtes pour vos avis récents (si vous n\'y avez pas encore répondu).\n' +
         'Où : sur votre fiche Google, sous chaque avis, bouton "Répondre".\n' +
         'Comment : copiez-collez le texte, ajustez le prénom si besoin.'}
      </Text>
      {responses.map((r, i) => {
        const review = data.recentReviews[i]
        return (
          <View key={i} style={s.reviewBox} wrap={false}>
            {review && (
              <Text style={[s.reviewLabel, { color: G500, marginBottom: 4 }]}>
                Avis de {review.author} ({review.rating}★)
              </Text>
            )}
            <Text style={s.reviewLabel}>Votre réponse :</Text>
            <Text style={s.reviewText}>{r}</Text>
          </View>
        )
      })}
    </View>
  )
}

const TEMPLATE_LABELS: Record<string, string> = {
  '5etoiles':  'Avis 5 étoiles',
  sansTexte:   'Avis sans commentaire',
  mitige:      'Avis mitigé (3 ou 4 étoiles)',
  negatif:     'Avis négatif (1 ou 2 étoiles)',
  incident:    'En cas d\'incident ou d\'erreur',
  fidele:      'Client fidèle',
}

function Section2d({ data }: { data: ReportData }) {
  const entries = Object.entries(data.responseTemplates)
    .map(([key, arr]) => ({
      label: TEMPLATE_LABELS[key] ?? key,
      items: arr.map(txt).filter(Boolean),
    }))
    .filter(e => e.items.length > 0)

  if (entries.length === 0) return null

  return (
    <View>
      <Text style={s.subTitle}>Modèles pour vos futurs avis</Text>
      <Text style={s.subHint}>
        {'Quoi : des réponses toutes prêtes pour tout avis que vous recevrez plus tard.\n' +
         'Comment : gardez cette page sous la main et choisissez le modèle selon le type d\'avis.'}
      </Text>
      {entries.map(({ label, items }) => (
        <View key={label}>
          <Text style={s.tplCat}>{label}</Text>
          {items.map((item, i) => (
            <View key={i} style={s.tplBox} wrap={false}>
              <Text style={s.tplText}>{item}</Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  )
}

function Section4({ data, num }: { data: ReportData; num: string }) {
  return (
    <View>
      <SectionHeader
        num={num}
        title="Questions fréquentes pour votre fiche"
        explain={'Ajoutez ces questions et réponses dans la section "Questions & Réponses" de votre fiche Google. Elles rassurent les clients avant même qu\'ils vous contactent.'}
      />
      {data.faq.map(({ q, a }, i) => (
        <View key={i} style={s.faqItem} wrap={false}>
          <Text style={s.faqNum}>{String(i + 1).padStart(2, '0')}</Text>
          <Text style={s.faqQ}>{q}</Text>
          <Text style={s.faqA}>{a}</Text>
        </View>
      ))}
    </View>
  )
}

function Section5({ data, num }: { data: ReportData; num: string }) {
  return (
    <View>
      <SectionHeader
        num={num}
        title="Vos services sur Google"
        explain={'Ajoutez ces services dans Google Business → Infos → Services. Ils apparaissent sur votre fiche et aident les clients à comprendre ce que vous proposez.'}
      />
      {data.services.map(({ name, description }, i) => (
        <View key={i} style={s.svcBox} wrap={false}>
          <Text style={s.svcName}>{name}</Text>
          <Text style={s.svcDesc}>{description}</Text>
        </View>
      ))}
    </View>
  )
}

function Section6({ data, num }: { data: ReportData; num: string }) {
  return (
    <View>
      <SectionHeader
        num={num}
        title="Idées de photos à publier"
        explain="Prenez ces photos avec votre téléphone, ça suffit. Elles donnent confiance aux visiteurs et améliorent votre position sur Google."
      />
      {data.photoIdeas.map((idea, i) => (
        <View key={i} style={s.checkItem}>
          <View style={s.checkBox} />
          <Text style={s.checkText}>{idea}</Text>
        </View>
      ))}
    </View>
  )
}

function Section7({ data, num }: { data: ReportData; num: string }) {
  return (
    <View>
      <SectionHeader
        num={num}
        title="Comment mettre tout ça en ligne"
        explain="Suivez ces étapes dans l'ordre. Comptez 10 à 15 minutes en tout. Vous n'avez besoin que de votre téléphone ou d'un ordinateur."
      />
      {data.guideSteps.map((step, i) => (
        <View key={i} style={s.stepRow} wrap={false}>
          <View style={s.stepCircle}>
            <Text style={s.stepNum}>{i + 1}</Text>
          </View>
          <Text style={s.stepText}>{step}</Text>
        </View>
      ))}
    </View>
  )
}

function Section8({ data, num }: { data: ReportData; num: string }) {
  const lines = data.actionPlan.split('\n').filter(Boolean)
  return (
    <View>
      <SectionHeader
        num={num}
        title="Votre plan d'action"
        explain="3 priorités dans l'ordre. Commencez par la première dès cette semaine. Pas de jargon — uniquement des actions concrètes avec une estimation de temps."
      />
      <View style={s.priorityBox}>
        {lines.map((line, i) => (
          <Text key={i} style={s.priorityText}>{line}</Text>
        ))}
      </View>
    </View>
  )
}

function Section9({ data, num }: { data: ReportData; num: string }) {
  return (
    <View>
      <SectionHeader
        num={num}
        title="Collecter plus d'avis"
        explain="Plus vous avez d'avis récents et de réponses, mieux vous êtes classé sur Google. Voici les outils prêts à utiliser."
      />

      {data.qrUrl && (
        <View>
          <Text style={s.subTitle}>QR code — à imprimer et afficher</Text>
          <Text style={s.subHint}>
            {'Vos clients scannent avec leur téléphone et laissent un avis en 30 secondes.\n' +
             'À afficher : en salle d\'attente, sur vos factures, en vitrine.'}
          </Text>
          <View style={{ alignItems: 'center', marginBottom: 16 }}>
            <Image src={data.qrUrl} style={{ width: 160, height: 160 }} />
          </View>
        </View>
      )}

      <Text style={s.subTitle}>Script oral — à dire après chaque consultation</Text>
      <View style={s.copyBox}>
        <Text style={s.copyText}>
          {"« Si vous êtes satisfait de votre rendez-vous, est-ce que vous auriez 30 secondes pour nous laisser un avis sur Google ? Ça nous aide énormément. Je peux vous envoyer le lien directement par SMS si vous voulez. »"}
        </Text>
      </View>

      {data.reviewUrl && (
        <View>
          <Text style={s.subTitle}>SMS à envoyer après la prestation</Text>
          <Text style={s.subHint}>Copiez-collez ce message dans votre téléphone :</Text>
          <View style={s.copyBox}>
            <Text style={s.copyText}>
              {`Bonjour [Prénom] ! C'est ${data.name}. Merci pour votre confiance. Si vous avez 30 secondes, un avis Google nous aiderait beaucoup : ${data.reviewUrl}`}
            </Text>
          </View>
        </View>
      )}
    </View>
  )
}

function LastSection({ data }: { data: ReportData }) {
  return (
    <View>
      <Text style={s.lastTitle}>Et maintenant ?</Text>
      <View style={s.lastItem}>
        <View style={s.lastDot} />
        <Text style={s.lastText}>
          <Text style={s.lastLabel}>Cette semaine : </Text>
          publiez votre nouvelle description sur votre fiche Google.
        </Text>
      </View>
      <View style={s.lastItem}>
        <View style={s.lastDot} />
        <Text style={s.lastText}>
          <Text style={s.lastLabel}>Ce mois-ci : </Text>
          répondez aux avis en attente et ajoutez vos nouvelles photos.
        </Text>
      </View>
      <View style={s.lastItem}>
        <View style={s.lastDot} />
        <Text style={s.lastText}>
          <Text style={s.lastLabel}>Dans 3 mois : </Text>
          votre fiche sera active et à jour, sans rien avoir rédigé vous-même.
        </Text>
      </View>
      <View style={[s.copyBox, { marginTop: 24 }]}>
        <Text style={s.copyText}>
          Une question ? Répondez directement à l'email que vous avez reçu.{'\n'}
          {data.name} est géré par Brian · LocalBoost · contact@thelocalboost.fr
        </Text>
      </View>
    </View>
  )
}

// ── Document principal ────────────────────────────────────────────────────────

function ReportDocument({ data }: { data: ReportData }) {
  return (
    <Document title={`Rapport Google — ${data.name}`} author="LocalBoost">
      {/* Page de garde — sans header */}
      <Page size="A4" style={s.coverPage}>
        <CoverSection data={data} />
      </Page>

      {/* Toutes les sections — header fixe sur chaque page.
          Numérotation calculée dynamiquement : le tier "express" n'inclut pas
          FAQ/services/guide/plan d'action/collecte d'avis, donc les numéros
          restent contigus plutôt que de sauter (ex: 01, 02, 04 avec un trou). */}
      <Page size="A4" style={s.page}>
        <PageHeader name={data.name} city={data.city} />
        {(() => {
          const isExpress = data.tier === 'express'
          let n = 0
          const num = () => String(++n).padStart(2, '0')
          return (
            <>
              <Section1  data={data} num={num()} />
              <Section2a data={data} num={num()} />
              <Section2c data={data} />
              {!isExpress && <Section2d data={data} />}
              {!isExpress && <Section4 data={data} num={num()} />}
              {!isExpress && <Section5 data={data} num={num()} />}
              <Section6  data={data} num={num()} />
              {!isExpress && <Section7 data={data} num={num()} />}
              {!isExpress && <Section8 data={data} num={num()} />}
              {!isExpress && <Section9 data={data} num={num()} />}
            </>
          )
        })()}
        <LastSection data={data} />
      </Page>
    </Document>
  )
}

// ── Export ────────────────────────────────────────────────────────────────────

export async function generateReportPDF(data: ReportData): Promise<Buffer> {
  const buf = await renderToBuffer(<ReportDocument data={data} />)
  return Buffer.from(buf)
}
