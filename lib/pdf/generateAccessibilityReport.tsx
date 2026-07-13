import React from 'react'
import {
  Document, Page, Text, View, StyleSheet, renderToBuffer,
} from '@react-pdf/renderer'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PageScanResult {
  url: string
  score: number | null
  hasAccessibilityStatement: boolean
  totalViolations: number
  totalNodes: number
  violations: Array<{
    id: string
    impact: 'critical' | 'serious' | 'moderate' | 'minor'
    description: string
    help: string
    helpUrl: string
    occurrences: number
  }>
  error: string | null
}

export interface AccessibilityReportData {
  companyName: string
  domain: string
  score: number | null
  hasAccessibilityStatement: boolean
  declarationRiskFlag: boolean
  totalViolations: number
  totalNodes: number
  pages: PageScanResult[]
  scannedAt: string
}

// ── Design tokens (cohérents avec lib/pdf/generateReport.tsx) ──────────────────

const DARK     = '#111827'
const G700     = '#374151'
const G500     = '#6b7280'
const G400     = '#9ca3af'
const G200     = '#e5e7eb'
const G100     = '#f3f4f6'
const G50      = '#f9fafb'
const RED      = '#dc2626'
const RED_BG   = '#fef2f2'
const RED_BD   = '#fecaca'
const AMBER    = '#d97706'
const AMBER_BG = '#fffbeb'
const AMBER_BD = '#fde68a'
const GREEN    = '#16a34a'
const GREEN_BG = '#f0fdf4'
const GREEN_BD = '#bbf7d0'

const IMPACT_LABEL: Record<string, string> = {
  critical: 'Critique', serious: 'Sérieux', moderate: 'Modéré', minor: 'Mineur',
}
const IMPACT_COLOR: Record<string, string> = {
  critical: RED, serious: '#ea580c', moderate: AMBER, minor: G500,
}

const s = StyleSheet.create({
  page:      { padding: 40, fontSize: 10, color: G700, fontFamily: 'Helvetica' },
  coverPage: { padding: 0, backgroundColor: DARK },

  coverBlock:    { padding: 48 },
  coverBrand:    { fontSize: 12, fontWeight: 700, color: '#93c5fd', letterSpacing: 2, marginBottom: 24 },
  coverTitle:    { fontSize: 26, fontWeight: 700, color: '#fff', marginBottom: 8, lineHeight: 1.3 },
  coverMeta:     { fontSize: 12, color: G400, marginBottom: 32 },
  coverScoreBox: { backgroundColor: '#1f2937', borderRadius: 12, padding: 20, marginBottom: 16 },
  coverScoreLbl: { fontSize: 10, color: G400, marginBottom: 4 },
  coverScoreVal: { fontSize: 32, fontWeight: 700, color: '#fff' },
  coverRiskBox:  { backgroundColor: RED_BG, borderRadius: 10, padding: 14, marginTop: 8 },
  coverRiskText: { fontSize: 10, color: RED, fontWeight: 700, lineHeight: 1.5 },

  sectionTitle: { fontSize: 14, fontWeight: 700, color: DARK, marginBottom: 4 },
  sectionBar:   { height: 2, backgroundColor: DARK, width: 32, marginBottom: 12 },

  kpiRow:   { flexDirection: 'row', gap: 10, marginBottom: 16 },
  kpiBox:   { flex: 1, borderRadius: 10, borderWidth: 1, borderColor: G200, padding: 12 },
  kpiLabel: { fontSize: 8, color: G500, textTransform: 'uppercase', marginBottom: 4 },
  kpiValue: { fontSize: 18, fontWeight: 700, color: DARK },

  pageRow:      { borderWidth: 1, borderColor: G200, borderRadius: 10, padding: 12, marginBottom: 8 },
  pageUrl:      { fontSize: 9, color: G500, marginBottom: 4 },
  pageStatsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  pageScore:    { fontSize: 12, fontWeight: 700, color: DARK },
  pageBadge:    { fontSize: 8, borderRadius: 4, paddingVertical: 2, paddingHorizontal: 6 },

  violationBox:   { borderWidth: 1, borderColor: G200, borderRadius: 10, padding: 12, marginBottom: 8 },
  violationHead:  { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  violationImpact:{ fontSize: 8, fontWeight: 700, borderRadius: 4, paddingVertical: 2, paddingHorizontal: 6 },
  violationTitle: { fontSize: 10, fontWeight: 700, color: DARK, marginBottom: 3 },
  violationDesc:  { fontSize: 9, color: G500, lineHeight: 1.5, marginBottom: 3 },
  violationMeta:  { fontSize: 8, color: G400 },

  legalBox:  { backgroundColor: AMBER_BG, borderWidth: 1, borderColor: AMBER_BD, borderRadius: 10, padding: 14, marginBottom: 10 },
  legalText: { fontSize: 9, color: '#92400e', lineHeight: 1.6 },

  footer: { position: 'absolute', bottom: 20, left: 40, right: 40, fontSize: 7, color: G400, textAlign: 'center' },
})

// ── Sections ─────────────────────────────────────────────────────────────────

function CoverSection({ data }: { data: AccessibilityReportData }) {
  return (
    <View style={s.coverBlock}>
      <Text style={s.coverBrand}>AUDIT ACCESSIBILITÉ NUMÉRIQUE</Text>
      <Text style={s.coverTitle}>{data.companyName || data.domain}</Text>
      <Text style={s.coverMeta}>{data.domain} · scanné le {new Date(data.scannedAt).toLocaleDateString('fr-FR')}</Text>

      <View style={s.coverScoreBox}>
        <Text style={s.coverScoreLbl}>Score global (0-100, indicatif — pas une note RGAA officielle)</Text>
        <Text style={s.coverScoreVal}>{data.score ?? 'N/A'}</Text>
      </View>

      {data.declarationRiskFlag && (
        <View style={s.coverRiskBox}>
          <Text style={s.coverRiskText}>
            Aucune déclaration d'accessibilité détectée sur les pages scannées.
            Son absence est sanctionnée par une amende de 25 000€ ; un service
            non conforme peut être sanctionné jusqu'à 50 000€, renouvelable
            tous les 6 mois en cas de manquement persistant (European
            Accessibility Act, contrôles DGCCRF/Arcom).
          </Text>
        </View>
      )}
    </View>
  )
}

function SummarySection({ data }: { data: AccessibilityReportData }) {
  const validPages = data.pages.filter(p => !p.error)
  return (
    <View>
      <Text style={s.sectionTitle}>Résumé</Text>
      <View style={s.sectionBar} />

      <View style={s.kpiRow}>
        <View style={s.kpiBox}>
          <Text style={s.kpiLabel}>Pages scannées</Text>
          <Text style={s.kpiValue}>{validPages.length}/{data.pages.length}</Text>
        </View>
        <View style={s.kpiBox}>
          <Text style={s.kpiLabel}>Violations totales</Text>
          <Text style={s.kpiValue}>{data.totalViolations}</Text>
        </View>
        <View style={s.kpiBox}>
          <Text style={s.kpiLabel}>Éléments concernés</Text>
          <Text style={s.kpiValue}>{data.totalNodes}</Text>
        </View>
      </View>

      <Text style={[s.violationDesc, { marginBottom: 12 }]}>
        Ce score et ce décompte sont issus d'un scan automatisé (axe-core) — ils
        détectent une partie des critères RGAA (essentiellement ceux vérifiables
        par analyse du DOM) mais ne remplacent pas un audit RGAA complet, qui
        inclut des vérifications manuelles (navigation clavier, lecteur d'écran,
        contraste sur images, structure sémantique fine).
      </Text>
    </View>
  )
}

function PagesSection({ data }: { data: AccessibilityReportData }) {
  return (
    <View>
      <Text style={s.sectionTitle}>Détail par page scannée</Text>
      <View style={s.sectionBar} />
      {data.pages.map((p, i) => (
        <View key={i} style={s.pageRow} wrap={false}>
          <Text style={s.pageUrl}>{p.url}</Text>
          {p.error ? (
            <Text style={[s.violationDesc, { color: RED }]}>Erreur de scan : {p.error}</Text>
          ) : (
            <View style={s.pageStatsRow}>
              <Text style={s.pageScore}>Score {p.score}</Text>
              <Text style={s.pageUrl}>{p.totalViolations} violation{p.totalViolations !== 1 ? 's' : ''}</Text>
              <Text style={[s.pageBadge, {
                color: p.hasAccessibilityStatement ? GREEN : RED,
                backgroundColor: p.hasAccessibilityStatement ? GREEN_BG : RED_BG,
              }]}>
                {p.hasAccessibilityStatement ? 'Déclaration trouvée' : 'Pas de déclaration'}
              </Text>
            </View>
          )}
        </View>
      ))}
    </View>
  )
}

function ViolationsSection({ data }: { data: AccessibilityReportData }) {
  // Dédoublonne par id de règle axe-core à travers toutes les pages, garde
  // le nombre d'occurrences cumulé — évite de répéter la même règle par page.
  const byRule = new Map<string, { impact: string; description: string; help: string; helpUrl: string; occurrences: number; pages: number }>()
  for (const p of data.pages) {
    for (const v of p.violations) {
      const existing = byRule.get(v.id)
      if (existing) { existing.occurrences += v.occurrences; existing.pages += 1 }
      else byRule.set(v.id, { impact: v.impact, description: v.description, help: v.help, helpUrl: v.helpUrl, occurrences: v.occurrences, pages: 1 })
    }
  }
  const sorted = Array.from(byRule.values()).sort((a, b) => {
    const order: Record<string, number> = { critical: 0, serious: 1, moderate: 2, minor: 3 }
    return (order[a.impact] ?? 4) - (order[b.impact] ?? 4)
  })

  if (sorted.length === 0) return null

  return (
    <View>
      <Text style={s.sectionTitle}>Violations détectées (par gravité)</Text>
      <View style={s.sectionBar} />
      {sorted.map((v, i) => (
        <View key={i} style={s.violationBox} wrap={false}>
          <View style={s.violationHead}>
            <Text style={s.violationTitle}>{v.help}</Text>
            <Text style={[s.violationImpact, { color: IMPACT_COLOR[v.impact], backgroundColor: G50 }]}>
              {IMPACT_LABEL[v.impact] ?? v.impact}
            </Text>
          </View>
          <Text style={s.violationDesc}>{v.description}</Text>
          <Text style={s.violationMeta}>
            {v.occurrences} occurrence{v.occurrences !== 1 ? 's' : ''} sur {v.pages} page{v.pages !== 1 ? 's' : ''} · {v.helpUrl}
          </Text>
        </View>
      ))}
    </View>
  )
}

function LegalSection({ data }: { data: AccessibilityReportData }) {
  return (
    <View>
      <Text style={s.sectionTitle}>Cadre légal</Text>
      <View style={s.sectionBar} />
      <View style={s.legalBox}>
        <Text style={s.legalText}>
          Base légale : European Accessibility Act (directive 2019/882),
          transposée en droit français par l'ordonnance du 6 septembre 2023
          (loi DDADUE n°2023-171, art. 16), applicable depuis le 28 juin 2025.
          Sont concernées les entreprises de 10 salariés ou 2M€ de chiffre
          d'affaires ou plus, fournissant un service numérique grand public
          couvert (e-commerce, banque en ligne, réservation, télécoms, livres
          numériques). Sanctions : 25 000€ pour absence de déclaration
          d'accessibilité (ou déclaration affirmant un niveau non atteint),
          jusqu'à 50 000€ par service non conforme, renouvelable tous les 6
          mois en cas de manquement persistant. Contrôles assurés par la
          DGCCRF (e-commerce et services aux consommateurs) et l'Arcom
          (secteur public et audiovisuel).
        </Text>
      </View>
      <Text style={s.violationDesc}>
        Le référentiel RGAA / WCAG 2.1 niveau AA (norme européenne EN 301 549)
        reste la méthode technique de référence pour démontrer la conformité
        EAA — c'est sur cette base que porte l'audit automatisé ci-dessus.
        Ce rapport est un outil de diagnostic technique, pas un avis
        juridique. L'applicabilité exacte des obligations à votre structure
        dépend de votre secteur, chiffre d'affaires et statut — à faire
        confirmer par un professionnel du droit si besoin.
      </Text>
    </View>
  )
}

// ── Document principal ────────────────────────────────────────────────────────

function ReportDocument({ data }: { data: AccessibilityReportData }) {
  return (
    <Document title={`Audit accessibilité — ${data.companyName || data.domain}`}>
      <Page size="A4" style={s.coverPage}>
        <CoverSection data={data} />
      </Page>
      <Page size="A4" style={s.page}>
        <SummarySection data={data} />
        <PagesSection data={data} />
        <ViolationsSection data={data} />
        <LegalSection data={data} />
        <Text style={s.footer} fixed render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
      </Page>
    </Document>
  )
}

// ── Export ────────────────────────────────────────────────────────────────────

export async function generateAccessibilityReportPDF(data: AccessibilityReportData): Promise<Buffer> {
  return renderToBuffer(<ReportDocument data={data} />)
}
