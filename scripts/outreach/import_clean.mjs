// Import leads_clean.csv → Supabase
// Usage: node import_clean.mjs

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

const supabase = createClient(
  'https://gezgemgrfehsxbbkjwuz.supabase.co',
  'sb_secret_mSRMkqfgV1teHAy6MAwn3Q_1VOXFbRG'
)

function parseCSV(file) {
  const raw = readFileSync(join(__dirname, file), 'utf-8').replace(/^﻿/, '').trim()
  const lines = raw.split('\n')
  const headers = lines[0].match(/"([^"]*)"/g).map(v => v.slice(1, -1))
  return lines.slice(1).map(line => {
    const cols = line.match(/"([^"]*)"/g)?.map(v => v.slice(1, -1)) || []
    return Object.fromEntries(headers.map((h, i) => [h, cols[i] || '']))
  }).filter(r => r.Email && r.Email.includes('@'))
}

async function run() {
  const rows = parseCSV('leads_clean.csv')
  console.log(`📋 ${rows.length} leads dans leads_clean.csv`)

  const BATCH = 500
  let inserted = 0
  let errors = 0

  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH).map(r => ({
      nom:     r['Nom'],
      email:   r['Email'].toLowerCase().trim(),
      secteur: r['Secteur'].toLowerCase().trim(),
      ville:   r['Ville'],
    }))

    const { error } = await supabase
      .from('leads')
      .upsert(batch, { onConflict: 'email', ignoreDuplicates: true })

    if (error) {
      console.error(`\n❌ Batch ${i}:`, error.message)
      errors++
    } else {
      inserted += batch.length
      process.stdout.write(`\r✅ ${inserted}/${rows.length} traités...`)
    }
  }

  console.log(`\n\n✅ Import terminé — ${inserted} leads envoyés (${errors} erreurs batch)`)
}

run().catch(console.error)
