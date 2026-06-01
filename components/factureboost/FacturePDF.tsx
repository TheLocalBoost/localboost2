import { Document, Page, View, Text, StyleSheet, Image } from '@react-pdf/renderer'

const O = '#ea580c' // orange FactureBoost

const styles = StyleSheet.create({
  page:        { fontFamily: 'Helvetica', fontSize: 9, color: '#1a1a1a', padding: 40, backgroundColor: '#ffffff' },
  header:      { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 28, borderBottomWidth: 2, borderBottomColor: O, paddingBottom: 18 },
  logo:        { width: 80, height: 40, objectFit: 'contain' },
  companyName: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: '#1a1a1a' },
  companyInfo: { fontSize: 7.5, color: '#555', marginTop: 3, lineHeight: 1.5 },
  factureTitle:{ fontSize: 11, fontFamily: 'Helvetica-Bold', color: O, textAlign: 'right' },
  factureNum:  { fontSize: 8.5, color: '#555', textAlign: 'right', marginTop: 2 },
  meta:        { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 22 },
  block:       { backgroundColor: '#f9fafb', borderRadius: 4, padding: 11, width: '48%' },
  blockTitle:  { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: O, textTransform: 'uppercase', marginBottom: 5, letterSpacing: 0.5 },
  blockText:   { fontSize: 8.5, color: '#374151', lineHeight: 1.6 },
  table:       { marginBottom: 18 },
  tableHeader: { flexDirection: 'row', backgroundColor: O, padding: '6 8', borderRadius: 3 },
  tableRow:    { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e5e7eb', padding: '5 8' },
  tableRowAlt: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e5e7eb', padding: '5 8', backgroundColor: '#f9fafb' },
  colDesc:     { flex: 4, color: '#fff', fontSize: 7.5, fontFamily: 'Helvetica-Bold' },
  colQty:      { flex: 1, color: '#fff', fontSize: 7.5, fontFamily: 'Helvetica-Bold', textAlign: 'center' },
  colUnit:     { flex: 1, color: '#fff', fontSize: 7.5, fontFamily: 'Helvetica-Bold', textAlign: 'center' },
  colPU:       { flex: 2, color: '#fff', fontSize: 7.5, fontFamily: 'Helvetica-Bold', textAlign: 'right' },
  colTVA:      { flex: 1, color: '#fff', fontSize: 7.5, fontFamily: 'Helvetica-Bold', textAlign: 'center' },
  colTotal:    { flex: 2, color: '#fff', fontSize: 7.5, fontFamily: 'Helvetica-Bold', textAlign: 'right' },
  cellDesc:    { flex: 4, fontSize: 8, color: '#1a1a1a' },
  cellQty:     { flex: 1, fontSize: 8, color: '#374151', textAlign: 'center' },
  cellUnit:    { flex: 1, fontSize: 8, color: '#374151', textAlign: 'center' },
  cellPU:      { flex: 2, fontSize: 8, color: '#374151', textAlign: 'right' },
  cellTVA:     { flex: 1, fontSize: 8, color: '#374151', textAlign: 'center' },
  cellTotal:   { flex: 2, fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#1a1a1a', textAlign: 'right' },
  totals:      { alignSelf: 'flex-end', width: 230, marginBottom: 20 },
  totalRow:    { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3.5, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  totalLabel:  { fontSize: 8.5, color: '#555' },
  totalValue:  { fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: '#1a1a1a' },
  totalTTCRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: O, padding: '8 10', borderRadius: 4, marginTop: 4 },
  totalTTCLbl: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#fff' },
  totalTTCVal: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: '#fff' },
  infoRow:     { flexDirection: 'row', gap: 20, marginBottom: 18 },
  infoBox:     { flex: 1, backgroundColor: '#fff7ed', borderWidth: 1, borderColor: '#fed7aa', borderRadius: 4, padding: 9 },
  infoLabel:   { fontSize: 7, color: O, fontFamily: 'Helvetica-Bold', marginBottom: 2.5 },
  infoValue:   { fontSize: 8.5, color: '#1a1a1a' },
  ribBox:      { backgroundColor: '#f9fafb', borderRadius: 4, padding: 10, marginBottom: 14 },
  ribTitle:    { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: O, marginBottom: 4 },
  ribText:     { fontSize: 8, color: '#374151', lineHeight: 1.6 },
  mentions:    { backgroundColor: '#f9fafb', borderRadius: 4, padding: 10, marginBottom: 12 },
  mentionsTtl: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: '#555', marginBottom: 4 },
  mentionsText:{ fontSize: 7.5, color: '#666', lineHeight: 1.6 },
  badge2026:   { backgroundColor: '#fff7ed', borderWidth: 1, borderColor: '#fed7aa', borderRadius: 4, padding: 8, marginBottom: 14 },
  badge2026Ttl:{ fontSize: 7, fontFamily: 'Helvetica-Bold', color: O, marginBottom: 3 },
  badge2026Txt:{ fontSize: 7.5, color: '#374151', lineHeight: 1.6 },
  footer:      { borderTopWidth: 1, borderTopColor: '#e5e7eb', paddingTop: 8, marginTop: 'auto' },
  footerText:  { fontSize: 6.5, color: '#9ca3af', textAlign: 'center', lineHeight: 1.5 },
  duplicate:   { position: 'absolute', top: 200, left: 80, fontSize: 80, color: '#e5e7eb', opacity: 0.4, fontFamily: 'Helvetica-Bold', transform: 'rotate(-30deg)' },
})

function fmt(n: number) {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
}

export interface LigneFacture {
  description: string
  quantite: number
  unite: string
  prix_unitaire_ht: number
  taux_tva: number
  total_ht: number
}

export interface TvaDetail {
  taux: number
  base: number
  montant: number
}

export interface FactureData {
  numero: string
  type: 'facture' | 'avoir'
  titre: string
  date_emission: string
  date_echeance: string
  lignes: LigneFacture[]
  total_ht: number
  tva_details: TvaDetail[]
  total_tva: number
  total_ttc: number
  montant_regle?: number
  conditions_paiement?: string
  client_nom?: string
  client_email?: string
  client_b2b?: boolean
  client_siren?: string
  client_adresse?: string
  bon_commande?: string
  adresse_livraison?: string
  nature_transaction?: string
  rib?: { iban: string; bic: string; banque: string } | null
  penalites_retard?: string
  escompte?: string
  isDuplicate?: boolean
  avoir_de_numero?: string
}

export interface ProfileData {
  company_name?: string
  siret?: string
  siren?: string
  metier?: string
  address?: string
  phone?: string
  email?: string
  logo_url?: string
  tva_number?: string
  micro_entrepreneur?: boolean
  iban?: string
  bic?: string
  banque?: string
}

export function FacturePDF({ facture, profile }: { facture: FactureData; profile: ProfileData }) {
  const isAvoir = facture.type === 'avoir'
  const dateEmission = new Date(facture.date_emission).toLocaleDateString('fr-FR')
  const dateEcheance = new Date(facture.date_echeance).toLocaleDateString('fr-FR')

  return (
    <Document
      title={`${isAvoir ? 'Avoir' : 'Facture'} ${facture.numero}`}
      author={profile.company_name}
    >
      <Page size="A4" style={styles.page}>

        {/* Tampon DUPLICATE si réimpression */}
        {facture.isDuplicate && <Text style={styles.duplicate}>DUPLICATE</Text>}

        {/* En-tête */}
        <View style={styles.header}>
          <View>
            {profile.logo_url && <Image src={profile.logo_url} style={styles.logo} />}
            <Text style={styles.companyName}>{profile.company_name}</Text>
            <Text style={styles.companyInfo}>
              {profile.metier ? profile.metier + '\n' : ''}
              {profile.address ? profile.address + '\n' : ''}
              {[profile.phone, profile.email].filter(Boolean).join(' · ')}
              {'\n'}
              {profile.siret ? 'SIRET : ' + profile.siret : ''}
              {profile.tva_number ? '  ·  TVA : ' + profile.tva_number : ''}
              {profile.micro_entrepreneur ? '\nTVA non applicable, art. 293 B du CGI' : ''}
            </Text>
          </View>
          <View>
            <Text style={styles.factureTitle}>{isAvoir ? 'AVOIR / NOTE DE CRÉDIT' : 'FACTURE'}</Text>
            <Text style={styles.factureNum}>{facture.numero}</Text>
            {isAvoir && facture.avoir_de_numero && (
              <Text style={[styles.factureNum, { color: O }]}>Avoir sur : {facture.avoir_de_numero}</Text>
            )}
            <Text style={[styles.factureNum, { marginTop: 6 }]}>Date d'émission : {dateEmission}</Text>
            {!isAvoir && <Text style={styles.factureNum}>Échéance : {dateEcheance}</Text>}
            {facture.bon_commande && <Text style={styles.factureNum}>Bon de commande : {facture.bon_commande}</Text>}
          </View>
        </View>

        {/* Bloc client + infos */}
        <View style={styles.meta}>
          <View style={styles.block}>
            <Text style={styles.blockTitle}>Client</Text>
            <Text style={styles.blockText}>
              {facture.client_nom ?? 'Client non renseigné'}
              {facture.client_adresse ? '\n' + facture.client_adresse : ''}
              {facture.client_email ? '\n' + facture.client_email : ''}
              {facture.client_b2b && facture.client_siren ? '\nSIREN : ' + facture.client_siren : ''}
            </Text>
          </View>
          <View style={styles.block}>
            <Text style={styles.blockTitle}>Objet</Text>
            <Text style={styles.blockText}>{facture.titre}</Text>
            {facture.nature_transaction && (
              <Text style={[styles.blockText, { marginTop: 4, fontSize: 7.5, color: '#888' }]}>
                Nature : {facture.nature_transaction === 'prestation' ? 'Prestation de service' : 'Livraison de biens'}
              </Text>
            )}
            {facture.adresse_livraison && (
              <Text style={[styles.blockText, { marginTop: 2, fontSize: 7.5, color: '#888' }]}>
                Livraison : {facture.adresse_livraison}
              </Text>
            )}
          </View>
        </View>

        {/* Tableau des prestations */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colDesc}>Description</Text>
            <Text style={styles.colQty}>Qté</Text>
            <Text style={styles.colUnit}>Unité</Text>
            <Text style={styles.colPU}>P.U. HT</Text>
            <Text style={styles.colTVA}>TVA</Text>
            <Text style={styles.colTotal}>Total HT</Text>
          </View>
          {facture.lignes.map((l, i) => (
            <View key={i} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
              <Text style={styles.cellDesc}>{l.description}</Text>
              <Text style={styles.cellQty}>{l.quantite}</Text>
              <Text style={styles.cellUnit}>{l.unite}</Text>
              <Text style={styles.cellPU}>{fmt(l.prix_unitaire_ht)}</Text>
              <Text style={styles.cellTVA}>{l.taux_tva}%</Text>
              <Text style={styles.cellTotal}>{isAvoir ? '- ' : ''}{fmt(l.total_ht)}</Text>
            </View>
          ))}
        </View>

        {/* Totaux multi-taux */}
        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total HT</Text>
            <Text style={styles.totalValue}>{isAvoir ? '- ' : ''}{fmt(facture.total_ht)}</Text>
          </View>
          {(facture.tva_details ?? []).map((td, i) => (
            <View key={i} style={styles.totalRow}>
              <Text style={styles.totalLabel}>TVA {td.taux}% (base {fmt(td.base)})</Text>
              <Text style={styles.totalValue}>{isAvoir ? '- ' : ''}{fmt(td.montant)}</Text>
            </View>
          ))}
          {profile.micro_entrepreneur && (
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { fontSize: 7 }]}>TVA non applicable (art. 293 B CGI)</Text>
              <Text style={styles.totalValue}>0,00 €</Text>
            </View>
          )}
          <View style={styles.totalTTCRow}>
            <Text style={styles.totalTTCLbl}>{isAvoir ? 'Total avoir TTC' : 'Total TTC'}</Text>
            <Text style={styles.totalTTCVal}>{isAvoir ? '- ' : ''}{fmt(facture.total_ttc)}</Text>
          </View>
          {(facture.montant_regle ?? 0) > 0 && (
            <View style={[styles.totalRow, { marginTop: 4 }]}>
              <Text style={styles.totalLabel}>Déjà réglé</Text>
              <Text style={[styles.totalValue, { color: '#16a34a' }]}>- {fmt(facture.montant_regle!)}</Text>
            </View>
          )}
        </View>

        {/* Infos paiement */}
        {!isAvoir && (
          <View style={styles.infoRow}>
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>ÉCHÉANCE DE PAIEMENT</Text>
              <Text style={styles.infoValue}>{dateEcheance}</Text>
            </View>
            {facture.conditions_paiement && (
              <View style={styles.infoBox}>
                <Text style={styles.infoLabel}>CONDITIONS DE PAIEMENT</Text>
                <Text style={styles.infoValue}>{facture.conditions_paiement}</Text>
              </View>
            )}
          </View>
        )}

        {/* RIB */}
        {facture.rib?.iban && (
          <View style={styles.ribBox}>
            <Text style={styles.ribTitle}>COORDONNÉES BANCAIRES — Règlement par virement</Text>
            <Text style={styles.ribText}>
              IBAN : {facture.rib.iban}
              {facture.rib.bic ? '   ·   BIC : ' + facture.rib.bic : ''}
              {facture.rib.banque ? '\nBanque : ' + facture.rib.banque : ''}
            </Text>
          </View>
        )}

        {/* Mentions légales obligatoires */}
        <View style={styles.mentions}>
          <Text style={styles.mentionsTtl}>MENTIONS LÉGALES OBLIGATOIRES</Text>
          <Text style={styles.mentionsText}>
            {facture.penalites_retard ?? 'Pénalités de retard : taux légal × 3 en cas de retard de paiement.'}
            {'\n'}
            {facture.escompte ?? 'Pas d\'escompte pour règlement anticipé.'}
          </Text>
        </View>

        {/* Mentions 2026 si B2B */}
        {facture.client_b2b && (
          <View style={styles.badge2026}>
            <Text style={styles.badge2026Ttl}>MENTIONS OBLIGATOIRES RÉFORME 2026</Text>
            <Text style={styles.badge2026Txt}>
              {facture.client_siren ? 'SIREN client : ' + facture.client_siren + '\n' : ''}
              {facture.bon_commande ? 'N° bon de commande : ' + facture.bon_commande + '\n' : ''}
              {facture.adresse_livraison ? 'Adresse de livraison : ' + facture.adresse_livraison + '\n' : ''}
              {facture.nature_transaction ? 'Nature de la transaction : ' + (facture.nature_transaction === 'prestation' ? 'Prestation de service' : 'Livraison de biens') : ''}
            </Text>
          </View>
        )}

        {/* Pied de page */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {profile.company_name}
            {profile.siret ? ' · SIRET ' + profile.siret : ''}
            {profile.tva_number ? ' · TVA ' + profile.tva_number : ''}
            {profile.micro_entrepreneur ? ' · TVA non applicable, art. 293 B du CGI' : ''}
            {'\n'}
            Facture générée avec FactureBoost — Format Factur-X conforme à la réglementation française
          </Text>
        </View>

      </Page>
    </Document>
  )
}

// ─── Génération XML Factur-X (profil MINIMUM) ──────────────────────────────────
export function genererXmlFacturX(facture: FactureData, profile: ProfileData): string {
  const dateStr = new Date(facture.date_emission).toISOString().slice(0, 10).replace(/-/g, '')
  const typeCode = facture.type === 'avoir' ? '381' : '380'

  const esc = (s: string | undefined) => (s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

  const siren = (profile.siret ?? '').slice(0, 9) || (profile.siren ?? '')

  return `<?xml version="1.0" encoding="UTF-8"?>
<rsm:CrossIndustryInvoice
  xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100"
  xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100"
  xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100">
  <rsm:ExchangedDocumentContext>
    <ram:GuidelineSpecifiedDocumentContextParameter>
      <ram:ID>urn:factur-x.eu:1p0:minimum</ram:ID>
    </ram:GuidelineSpecifiedDocumentContextParameter>
  </rsm:ExchangedDocumentContext>
  <rsm:ExchangedDocument>
    <ram:ID>${esc(facture.numero)}</ram:ID>
    <ram:TypeCode>${typeCode}</ram:TypeCode>
    <ram:IssueDateTime>
      <udt:DateTimeString format="102">${dateStr}</udt:DateTimeString>
    </ram:IssueDateTime>
  </rsm:ExchangedDocument>
  <rsm:SupplyChainTradeTransaction>
    <ram:ApplicableHeaderTradeAgreement>
      <ram:SellerTradeParty>
        <ram:Name>${esc(profile.company_name)}</ram:Name>
        <ram:SpecifiedLegalOrganization>
          <ram:ID schemeID="0002">${esc(siren)}</ram:ID>
        </ram:SpecifiedLegalOrganization>
        <ram:PostalTradeAddress>
          <ram:CountryID>FR</ram:CountryID>
        </ram:PostalTradeAddress>
        ${profile.tva_number ? `<ram:SpecifiedTaxRegistration>
          <ram:ID schemeID="VA">${esc(profile.tva_number)}</ram:ID>
        </ram:SpecifiedTaxRegistration>` : ''}
      </ram:SellerTradeParty>
      <ram:BuyerTradeParty>
        <ram:Name>${esc(facture.client_nom)}</ram:Name>
        ${facture.client_b2b && facture.client_siren ? `<ram:SpecifiedLegalOrganization>
          <ram:ID schemeID="0002">${esc(facture.client_siren)}</ram:ID>
        </ram:SpecifiedLegalOrganization>` : ''}
      </ram:BuyerTradeParty>
      ${facture.bon_commande ? `<ram:BuyerOrderReferencedDocument>
        <ram:IssuerAssignedID>${esc(facture.bon_commande)}</ram:IssuerAssignedID>
      </ram:BuyerOrderReferencedDocument>` : ''}
    </ram:ApplicableHeaderTradeAgreement>
    <ram:ApplicableHeaderTradeDelivery>
      ${facture.adresse_livraison ? `<ram:ShipToTradeParty>
        <ram:PostalTradeAddress>
          <ram:LineOne>${esc(facture.adresse_livraison)}</ram:LineOne>
          <ram:CountryID>FR</ram:CountryID>
        </ram:PostalTradeAddress>
      </ram:ShipToTradeParty>` : ''}
    </ram:ApplicableHeaderTradeDelivery>
    <ram:ApplicableHeaderTradeSettlement>
      <ram:InvoiceCurrencyCode>EUR</ram:InvoiceCurrencyCode>
      ${facture.rib?.iban ? `<ram:SpecifiedTradeSettlementPaymentMeans>
        <ram:TypeCode>30</ram:TypeCode>
        <ram:PayeePartyCreditorFinancialAccount>
          <ram:IBANID>${esc(facture.rib.iban)}</ram:IBANID>
        </ram:PayeePartyCreditorFinancialAccount>
      </ram:SpecifiedTradeSettlementPaymentMeans>` : ''}
      ${(facture.tva_details ?? []).map(td => `<ram:ApplicableTradeTax>
        <ram:CalculatedAmount>${td.montant.toFixed(2)}</ram:CalculatedAmount>
        <ram:TypeCode>VAT</ram:TypeCode>
        <ram:BasisAmount>${td.base.toFixed(2)}</ram:BasisAmount>
        <ram:CategoryCode>${td.taux === 0 ? 'Z' : 'S'}</ram:CategoryCode>
        <ram:RateApplicablePercent>${td.taux.toFixed(2)}</ram:RateApplicablePercent>
      </ram:ApplicableTradeTax>`).join('\n      ')}
      <ram:SpecifiedTradePaymentTerms>
        <ram:DueDateDateTime>
          <udt:DateTimeString format="102">${new Date(facture.date_echeance).toISOString().slice(0, 10).replace(/-/g, '')}</udt:DateTimeString>
        </ram:DueDateDateTime>
      </ram:SpecifiedTradePaymentTerms>
      <ram:SpecifiedTradeSettlementHeaderMonetarySummation>
        <ram:TaxBasisTotalAmount>${facture.total_ht.toFixed(2)}</ram:TaxBasisTotalAmount>
        <ram:TaxTotalAmount currencyID="EUR">${facture.total_tva.toFixed(2)}</ram:TaxTotalAmount>
        <ram:GrandTotalAmount>${facture.total_ttc.toFixed(2)}</ram:GrandTotalAmount>
        <ram:DuePayableAmount>${(facture.total_ttc - (facture.montant_regle ?? 0)).toFixed(2)}</ram:DuePayableAmount>
      </ram:SpecifiedTradeSettlementHeaderMonetarySummation>
    </ram:ApplicableHeaderTradeSettlement>
  </rsm:SupplyChainTradeTransaction>
</rsm:CrossIndustryInvoice>`.trim()
}
