import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateAccessibilityReportPDF, AccessibilityReportData } from '@/lib/pdf/generateAccessibilityReport'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Génère le PDF d'un scan déjà enregistré (voir scripts/accessibility/scan.mjs).
// GET /api/admin/accessibility-report?k=ADMIN_SECRET&id=<uuid>
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  if (searchParams.get('k') !== process.env.ADMIN_SECRET_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 })

  const { data: scan, error } = await supabase
    .from('accessibility_scans')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !scan) {
    return NextResponse.json({ error: 'Scan introuvable' }, { status: 404 })
  }

  const reportData: AccessibilityReportData = {
    companyName:          scan.company_name ?? scan.domain,
    domain:                scan.domain,
    score:                 scan.score,
    hasAccessibilityStatement: scan.has_accessibility_statement,
    declarationRiskFlag:   scan.declaration_risk_flag,
    totalViolations:       scan.total_violations,
    totalNodes:            scan.total_nodes,
    pages:                 scan.pages ?? [],
    scannedAt:             scan.scanned_at,
  }

  const pdfBuffer = await generateAccessibilityReportPDF(reportData)
  const filename  = `audit-accessibilite-${(scan.company_name ?? scan.domain).toLowerCase().replace(/[^a-z0-9]+/g, '-')}.pdf`

  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type':        'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
