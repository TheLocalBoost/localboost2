import { Document, Page, View, Text, StyleSheet, Image } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page:        { fontFamily: 'Helvetica', fontSize: 9, color: '#1a1a1a', padding: 40, backgroundColor: '#ffffff' },
  header:      { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 32, borderBottomWidth: 2, borderBottomColor: '#16a34a', paddingBottom: 20 },
  logo:        { width: 80, height: 40, objectFit: 'contain' },
  companyName: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: '#1a1a1a' },
  companyInfo: { fontSize: 8, color: '#555', marginTop: 2, lineHeight: 1.5 },
  devisTitle:  { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#16a34a', textAlign: 'right' },
  devisNum:    { fontSize: 9, color: '#555', textAlign: 'right', marginTop: 2 },
  meta:        { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  block:       { backgroundColor: '#f9fafb', borderRadius: 4, padding: 12, width: '48%' },
  blockTitle:  { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#16a34a', textTransform: 'uppercase', marginBottom: 6, letterSpacing: 0.5 },
  blockText:   { fontSize: 9, color: '#374151', lineHeight: 1.6 },
  table:       { marginBottom: 20 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#16a34a', padding: '7 8', borderRadius: 3 },
  tableRow:    { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e5e7eb', padding: '6 8' },
  tableRowAlt: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e5e7eb', padding: '6 8', backgroundColor: '#f9fafb' },
  colDesc:     { flex: 4, color: '#fff', fontSize: 8, fontFamily: 'Helvetica-Bold' },
  colQty:      { flex: 1, color: '#fff', fontSize: 8, fontFamily: 'Helvetica-Bold', textAlign: 'center' },
  colUnit:     { flex: 1, color: '#fff', fontSize: 8, fontFamily: 'Helvetica-Bold', textAlign: 'center' },
  colPU:       { flex: 2, color: '#fff', fontSize: 8, fontFamily: 'Helvetica-Bold', textAlign: 'right' },
  colTotal:    { flex: 2, color: '#fff', fontSize: 8, fontFamily: 'Helvetica-Bold', textAlign: 'right' },
  cellDesc:    { flex: 4, fontSize: 8.5, color: '#1a1a1a' },
  cellQty:     { flex: 1, fontSize: 8.5, color: '#374151', textAlign: 'center' },
  cellUnit:    { flex: 1, fontSize: 8.5, color: '#374151', textAlign: 'center' },
  cellPU:      { flex: 2, fontSize: 8.5, color: '#374151', textAlign: 'right' },
  cellTotal:   { flex: 2, fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: '#1a1a1a', textAlign: 'right' },
  totals:      { alignSelf: 'flex-end', width: 220, marginBottom: 24 },
  totalRow:    { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  totalLabel:  { fontSize: 9, color: '#555' },
  totalValue:  { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#1a1a1a' },
  totalTTCRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#16a34a', padding: '8 10', borderRadius: 4, marginTop: 4 },
  totalTTCLbl: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#fff' },
  totalTTCVal: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: '#fff' },
  notes:       { backgroundColor: '#f9fafb', borderRadius: 4, padding: 12, marginBottom: 20 },
  notesTitle:  { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#16a34a', marginBottom: 5 },
  notesText:   { fontSize: 8.5, color: '#555', lineHeight: 1.6 },
  validity:    { flexDirection: 'row', gap: 24, marginBottom: 20 },
  validBox:    { flex: 1, backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0', borderRadius: 4, padding: 10 },
  validLabel:  { fontSize: 7.5, color: '#16a34a', fontFamily: 'Helvetica-Bold', marginBottom: 3 },
  validValue:  { fontSize: 9, color: '#1a1a1a' },
  signature:   { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  sigBox:      { width: '45%', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 4, padding: 12, height: 80 },
  sigTitle:    { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: '#555', marginBottom: 4 },
  sigText:     { fontSize: 7.5, color: '#9ca3af' },
  footer:      { borderTopWidth: 1, borderTopColor: '#e5e7eb', paddingTop: 10, marginTop: 'auto' },
  footerText:  { fontSize: 7, color: '#9ca3af', textAlign: 'center', lineHeight: 1.5 },
})

function fmt(n: number) {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
}

export interface DevisData {
  numero: string
  titre: string
  created_at: string
  validite_jours: number
  delai_jours: number
  lignes: { description: string; quantite: number; unite: string; prix_unitaire_ht: number; total_ht: number }[]
  total_ht: number
  tva_taux: number
  tva_montant: number
  total_ttc: number
  notes?: string
  conditions?: string
  client?: { name: string; email?: string; phone?: string; address?: string } | null
}

export interface ProfileData {
  company_name?: string
  siret?: string
  metier?: string
  address?: string
  phone?: string
  email?: string
  logo_url?: string
  tva_number?: string
  payment_conditions?: string
  mentions_legales?: string
}

export function DevisPDF({ devis, profile }: { devis: DevisData; profile: ProfileData }) {
  const dateStr = new Date(devis.created_at).toLocaleDateString('fr-FR')
  const validUntil = new Date(new Date(devis.created_at).getTime() + devis.validite_jours * 86400000).toLocaleDateString('fr-FR')

  return (
    <Document title={`Devis ${devis.numero}`} author={profile.company_name}>
      <Page size="A4" style={styles.page}>

        {/* En-tête */}
        <View style={styles.header}>
          <View>
            {profile.logo_url && <Image src={profile.logo_url} style={styles.logo} />}
            <Text style={styles.companyName}>{profile.company_name}</Text>
            <Text style={styles.companyInfo}>
              {profile.metier}{'\n'}
              {profile.address}{'\n'}
              {profile.phone} · {profile.email}{'\n'}
              {profile.siret ? `SIRET : ${profile.siret}` : ''}
              {profile.tva_number ? ` · TVA : ${profile.tva_number}` : ''}
            </Text>
          </View>
          <View>
            <Text style={styles.devisTitle}>DEVIS</Text>
            <Text style={styles.devisNum}>{devis.numero}</Text>
            <Text style={[styles.devisNum, { marginTop: 6 }]}>Date : {dateStr}</Text>
            <Text style={styles.devisNum}>Valable jusqu'au : {validUntil}</Text>
          </View>
        </View>

        {/* Bloc client + infos */}
        <View style={styles.meta}>
          <View style={styles.block}>
            <Text style={styles.blockTitle}>Client</Text>
            <Text style={styles.blockText}>
              {devis.client?.name ?? 'Client non renseigné'}{'\n'}
              {devis.client?.address ?? ''}{'\n'}
              {devis.client?.phone ?? ''}{devis.client?.email ? ' · ' + devis.client.email : ''}
            </Text>
          </View>
          <View style={styles.block}>
            <Text style={styles.blockTitle}>Objet du devis</Text>
            <Text style={styles.blockText}>{devis.titre}</Text>
          </View>
        </View>

        {/* Tableau des prestations */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colDesc}>Description</Text>
            <Text style={styles.colQty}>Qté</Text>
            <Text style={styles.colUnit}>Unité</Text>
            <Text style={styles.colPU}>P.U. HT</Text>
            <Text style={styles.colTotal}>Total HT</Text>
          </View>
          {devis.lignes.map((l, i) => (
            <View key={i} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
              <Text style={styles.cellDesc}>{l.description}</Text>
              <Text style={styles.cellQty}>{l.quantite}</Text>
              <Text style={styles.cellUnit}>{l.unite}</Text>
              <Text style={styles.cellPU}>{fmt(l.prix_unitaire_ht)}</Text>
              <Text style={styles.cellTotal}>{fmt(l.total_ht)}</Text>
            </View>
          ))}
        </View>

        {/* Totaux */}
        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total HT</Text>
            <Text style={styles.totalValue}>{fmt(devis.total_ht)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>TVA ({devis.tva_taux}%)</Text>
            <Text style={styles.totalValue}>{fmt(devis.tva_montant)}</Text>
          </View>
          <View style={styles.totalTTCRow}>
            <Text style={styles.totalTTCLbl}>Total TTC</Text>
            <Text style={styles.totalTTCVal}>{fmt(devis.total_ttc)}</Text>
          </View>
        </View>

        {/* Infos délai + validité */}
        <View style={styles.validity}>
          <View style={styles.validBox}>
            <Text style={styles.validLabel}>DÉLAI D'EXÉCUTION</Text>
            <Text style={styles.validValue}>{devis.delai_jours} jours ouvrés</Text>
          </View>
          <View style={styles.validBox}>
            <Text style={styles.validLabel}>CONDITIONS DE PAIEMENT</Text>
            <Text style={styles.validValue}>{profile.payment_conditions ?? 'Selon conditions convenues'}</Text>
          </View>
          <View style={styles.validBox}>
            <Text style={styles.validLabel}>VALIDITÉ</Text>
            <Text style={styles.validValue}>{devis.validite_jours} jours · jusqu'au {validUntil}</Text>
          </View>
        </View>

        {/* Notes */}
        {devis.notes && (
          <View style={styles.notes}>
            <Text style={styles.notesTitle}>NOTES ET REMARQUES</Text>
            <Text style={styles.notesText}>{devis.notes}</Text>
          </View>
        )}
        {devis.conditions && (
          <View style={[styles.notes, { marginTop: 8 }]}>
            <Text style={styles.notesTitle}>CONDITIONS PARTICULIÈRES</Text>
            <Text style={styles.notesText}>{devis.conditions}</Text>
          </View>
        )}

        {/* Signatures */}
        <View style={styles.signature}>
          <View style={styles.sigBox}>
            <Text style={styles.sigTitle}>Signature du client</Text>
            <Text style={styles.sigText}>Bon pour accord, lu et approuvé{'\n'}Date :</Text>
          </View>
          <View style={styles.sigBox}>
            <Text style={styles.sigTitle}>Signature de l'entreprise</Text>
            <Text style={styles.sigText}>{profile.company_name}</Text>
          </View>
        </View>

        {/* Pied de page */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {profile.company_name}
            {profile.siret ? ` · SIRET ${profile.siret}` : ''}
            {profile.tva_number ? ` · TVA ${profile.tva_number}` : ''}{'\n'}
            {profile.mentions_legales ?? 'Devis sans valeur contractuelle avant acceptation signée par les deux parties.'}
          </Text>
        </View>

      </Page>
    </Document>
  )
}
