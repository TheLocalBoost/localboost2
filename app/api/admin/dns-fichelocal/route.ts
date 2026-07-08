import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

const AK   = process.env.OVH_AK!
const AS   = process.env.OVH_AS!
const CK   = process.env.OVH_CK!
const BASE = 'https://eu.api.ovh.com/1.0'
const DOMAIN = 'fichelocal.com'

let delta = 0

async function initTime() {
  const r = await fetch(`${BASE}/auth/time`)
  const t = await r.json() as number
  delta = t - Math.floor(Date.now() / 1000)
}

function sign(method: string, url: string, body: string, ts: number) {
  const pre = `${AS}+${CK}+${method}+${url}+${body}+${ts}`
  return '$1$' + crypto.createHash('sha1').update(pre).digest('hex')
}

async function ovh(method: string, path: string, data?: unknown) {
  const ts   = Math.floor(Date.now() / 1000) + delta
  const url  = `${BASE}${path}`
  const body = data !== undefined ? JSON.stringify(data) : ''
  const sig  = sign(method, url, body, ts)

  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type':      'application/json',
      'X-Ovh-Application': AK,
      'X-Ovh-Consumer':    CK,
      'X-Ovh-Timestamp':   String(ts),
      'X-Ovh-Signature':   sig,
    },
    body: data !== undefined ? body : undefined,
  })

  const text = await res.text()
  try { return { ok: res.ok, status: res.status, data: JSON.parse(text) } }
  catch { return { ok: res.ok, status: res.status, data: text } }
}

export async function POST(req: NextRequest) {
  const k = req.nextUrl.searchParams.get('k')
  if (k !== process.env.ADMIN_SECRET_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!AK || !AS || !CK) {
    return NextResponse.json({ error: 'OVH_AK / OVH_AS / OVH_CK manquants dans les variables Vercel' }, { status: 500 })
  }

  await initTime()
  const log: string[] = []

  // 1. Lister les enregistrements TXT existants
  const txtRes = await ovh('GET', `/domain/zone/${DOMAIN}/record?fieldType=TXT`)
  const ids: number[] = Array.isArray(txtRes.data) ? txtRes.data : []
  log.push(`TXT records trouvés : ${ids.length} (ids: ${ids.join(', ')})`)

  // 2. Chercher l'enregistrement SPF parmi les TXT
  let spfId: number | null = null
  for (const id of ids) {
    const r = await ovh('GET', `/domain/zone/${DOMAIN}/record/${id}`)
    const target: string = r.data?.target ?? ''
    if (target.includes('v=spf1')) {
      spfId = id
      log.push(`SPF existant (id ${id}) : ${target}`)
      break
    }
  }

  // 3. Mettre à jour ou créer le SPF
  const newSpf = 'v=spf1 include:mx.ovh.com include:spf.brevo.com -all'
  if (spfId !== null) {
    const upd = await ovh('PUT', `/domain/zone/${DOMAIN}/record/${spfId}`, {
      target: newSpf,
      ttl:    3600,
    })
    log.push(upd.ok ? `✅ SPF mis à jour (id ${spfId})` : `❌ Erreur SPF update : ${JSON.stringify(upd.data)}`)
  } else {
    const cr = await ovh('POST', `/domain/zone/${DOMAIN}/record`, {
      fieldType: 'TXT',
      subDomain: '',
      target:    newSpf,
      ttl:       3600,
    })
    log.push(cr.ok ? `✅ SPF créé` : `❌ Erreur SPF create : ${JSON.stringify(cr.data)}`)
  }

  // 4. DMARC (créer s'il n'existe pas)
  const dmarcRes = await ovh('GET', `/domain/zone/${DOMAIN}/record?fieldType=TXT&subDomain=_dmarc`)
  const dmarcIds: number[] = Array.isArray(dmarcRes.data) ? dmarcRes.data : []
  if (dmarcIds.length === 0) {
    const dm = await ovh('POST', `/domain/zone/${DOMAIN}/record`, {
      fieldType: 'TXT',
      subDomain: '_dmarc',
      target:    `v=DMARC1; p=none; rua=mailto:contact@fichelocal.com; pct=100`,
      ttl:       3600,
    })
    log.push(dm.ok ? `✅ DMARC créé` : `❌ Erreur DMARC : ${JSON.stringify(dm.data)}`)
  } else {
    log.push(`ℹ️  DMARC déjà présent (id ${dmarcIds[0]})`)
  }

  // 5. Rafraîchir la zone
  const ref = await ovh('POST', `/domain/zone/${DOMAIN}/refresh`)
  log.push(ref.ok ? `✅ Zone DNS rafraîchie` : `❌ Erreur refresh : ${JSON.stringify(ref.data)}`)

  return NextResponse.json({ ok: true, log })
}
