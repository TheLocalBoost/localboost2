import { NextResponse } from 'next/server'

// Désactivé — le modèle trial 7j a été supprimé (paiement direct)
export async function GET() {
  return NextResponse.json({ message: 'disabled' })
}
