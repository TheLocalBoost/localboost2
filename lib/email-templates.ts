const APP_URL = process.env.NEXT_PUBLIC_URL ?? 'https://www.thelocalboost.fr'
const FOUNDER_SPOTS = process.env.FOUNDER_SPOTS ?? '47'

type ScoreLevel = 'critique' | 'insuffisant' | 'ameliorer'

function scoreLevel(score: number): ScoreLevel {
  if (score < 40) return 'critique'
  if (score <= 55) return 'insuffisant'
  return 'ameliorer'
}

function scoreColor(score: number): string {
  if (score < 40) return '#dc2626'
  if (score <= 55) return '#d97706'
  return '#ca8a04'
}

function scoreLabel(score: number): string {
  if (score < 40) return 'Critique'
  if (score <= 55) return 'Insuffisant'
  return 'À améliorer'
}

// Table-based progress bar compatible with all email clients
function progressBarHtml(score: number): string {
  const color  = scoreColor(score)
  const filled = score
  const empty  = 100 - score
  return `
<p style="font-size:13px;color:#374151;margin:0 0 4px;">Votre score : <strong style="color:${color};">${score}/100 — ${scoreLabel(score)}</strong></p>
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-radius:4px;overflow:hidden;margin-bottom:4px;">
  <tr>
    <td width="${filled}%" bgcolor="${color}" height="20"></td>
    <td width="${empty}%" bgcolor="#f3f4f6" height="20"></td>
  </tr>
</table>
<p style="font-size:12px;color:#9ca3af;margin:0 0 16px;">Moyenne du secteur : 71/100</p>`
}

interface AuditEmailParams {
  establishmentName: string
  score: number
  city: string
  category: string
  planUrl?: string
}

export function generateAuditEmail(p: AuditEmailParams): string {
  const url = p.planUrl ?? `${APP_URL}/pricing`
  return `
<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px 20px;color:#1a1a1a;">
  <h2 style="font-size:20px;font-weight:700;margin:0 0 8px;">Bonjour,</h2>
  <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 20px;">
    Voici votre score de visibilité Google pour <strong>${p.establishmentName}</strong>.
  </p>
  ${progressBarHtml(p.score)}
  <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 16px;">
    <strong>3 actions que vous pouvez faire seul cette semaine :</strong>
  </p>
  <table width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr><td style="padding:12px 0;border-bottom:1px solid #e5e7eb;">
      <p style="font-size:14px;font-weight:700;color:#111827;margin:0 0 4px;">1. Complétez votre description Google</p>
      <p style="font-size:13px;color:#6b7280;margin:0;">Allez sur business.google.com → Infos → Description. Rédigez 2-3 phrases sur vos services, votre ville, ce qui vous différencie. Objectif : 200 mots minimum.</p>
    </td></tr>
    <tr><td style="padding:12px 0;border-bottom:1px solid #e5e7eb;">
      <p style="font-size:14px;font-weight:700;color:#111827;margin:0 0 4px;">2. Répondez à vos 3 derniers avis</p>
      <p style="font-size:13px;color:#6b7280;margin:0;">Google favorise les fiches dont le propriétaire répond aux avis. Répondez à chacun en moins de 5 lignes, même aux anciens.</p>
    </td></tr>
    <tr><td style="padding:12px 0;">
      <p style="font-size:14px;font-weight:700;color:#111827;margin:0 0 4px;">3. Ajoutez 5 photos cette semaine</p>
      <p style="font-size:13px;color:#6b7280;margin:0;">Photos de vos chantiers, votre véhicule, votre équipe. Les fiches avec 10+ photos reçoivent 35% de clics en plus.</p>
    </td></tr>
  </table>
  <p style="color:#6b7280;font-size:13px;margin:20px 0;">Ces 3 actions peuvent faire progresser votre score de 8 à 15 points.</p>
  <div style="text-align:center;margin:28px 0;">
    <a href="${url}" style="display:inline-block;background:#2563eb;color:white;font-weight:700;padding:14px 32px;border-radius:10px;text-decoration:none;font-size:15px;">
      Débloquer LocalBoost Pro — 29€/mois →
    </a>
  </div>
  <p style="color:#374151;font-size:14px;margin:0;">À bientôt,<br>L'équipe LocalBoost</p>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0 16px;">
  <p style="color:#9ca3af;font-size:12px;margin:0;">LocalBoost · contact@thelocalboost.fr</p>
</div>`
}

interface SequenceEmail1Params {
  establishmentName: string
  score: number
  planUrl?: string
}

export function generateSequenceEmail1(p: SequenceEmail1Params): string {
  const url = p.planUrl ?? `${APP_URL}/pricing`
  return `
<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px 20px;color:#1a1a1a;">
  <h2 style="font-size:20px;font-weight:700;margin:0 0 16px;">Bonjour,</h2>
  <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 16px;">
    Il y a 3 semaines, Ahmed B., plombier à Toulouse, avait un score de <strong>31/100</strong>.
  </p>
  <p style="color:#374151;font-size:15px;font-weight:700;margin:0 0 8px;">Ce qu'il a changé :</p>
  <ul style="color:#374151;font-size:15px;line-height:2;margin:0 0 20px;padding-left:20px;">
    <li>Il a rédigé sa description Google en 10 minutes avec notre IA</li>
    <li>Il a envoyé des demandes d'avis à ses 8 derniers clients</li>
    <li>Il a répondu à ses 4 avis négatifs avec nos modèles</li>
  </ul>
  <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 20px;">
    Résultat aujourd'hui : score <strong>67/100</strong>, +5 appels entrants par semaine.
  </p>
  ${progressBarHtml(p.score)}
  <p style="color:#374151;font-size:15px;margin:0 0 8px;">
    Votre fiche <strong>${p.establishmentName}</strong> est à <strong style="color:${scoreColor(p.score)};">${p.score}/100</strong>.
    Le potentiel de progression est réel.
  </p>
  <div style="text-align:center;margin:28px 0;">
    <a href="${url}" style="display:inline-block;background:#2563eb;color:white;font-weight:700;padding:14px 32px;border-radius:10px;text-decoration:none;font-size:15px;">
      Commencer comme Ahmed — 29€/mois →
    </a>
  </div>
  <p style="color:#374151;font-size:14px;margin:0;">À bientôt,<br>L'équipe LocalBoost</p>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0 16px;">
  <p style="color:#9ca3af;font-size:12px;margin:0;">LocalBoost · contact@thelocalboost.fr</p>
</div>`
}

interface SequenceEmail2Params {
  establishmentName: string
  score: number
  spotsRemaining?: number
  planUrl?: string
}

export function generateSequenceEmail2(p: SequenceEmail2Params): string {
  const url    = p.planUrl ?? `${APP_URL}/pricing`
  const spots  = p.spotsRemaining ?? parseInt(FOUNDER_SPOTS, 10)
  const lost5d = Math.round((100 - p.score) / 8 / 30 * 5)
  return `
<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px 20px;color:#1a1a1a;">
  <h2 style="font-size:20px;font-weight:700;margin:0 0 16px;">Bonjour,</h2>
  <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 16px;">
    Il y a 5 jours, votre score était de <strong style="color:${scoreColor(p.score)};">${p.score}/100</strong>.
  </p>
  <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 16px;">
    Depuis, vos concurrents ont continué à capter les clients qui auraient pu vous appeler.
  </p>
  <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:14px 16px;margin-bottom:20px;">
    <p style="font-size:14px;color:#991b1b;margin:0;">
      Estimation sur 5 jours : <strong>${lost5d} client${lost5d > 1 ? 's' : ''} supplémentaire${lost5d > 1 ? 's' : ''} perdu${lost5d > 1 ? 's' : ''}</strong>
    </p>
  </div>
  <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 20px;">
    Il reste <strong>${spots} places</strong> à tarif fondateur (29€/mois).<br>
    Après, le prix passe à <strong>49€/mois</strong>.
  </p>
  <div style="text-align:center;margin:28px 0;">
    <a href="${url}" style="display:inline-block;background:#dc2626;color:white;font-weight:700;padding:14px 32px;border-radius:10px;text-decoration:none;font-size:15px;">
      Activer mon accès avant que le prix augmente →
    </a>
  </div>
  <p style="color:#374151;font-size:14px;margin:0;">À bientôt,<br>L'équipe LocalBoost</p>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0 16px;">
  <p style="color:#9ca3af;font-size:12px;margin:0;">LocalBoost · contact@thelocalboost.fr</p>
</div>`
}

interface WeeklyReportParams {
  establishmentName: string
  city: string
  currentScore: number
  previousScore: number
  clientsLost: number
  topAction: string
  topActionUrl: string
  dashboardUrl: string
  unsubscribeUrl: string
}

export function weeklyReportSubject(currentScore: number, previousScore: number): string {
  const diff = currentScore - previousScore
  if (diff > 0) return `Votre score a progressé cette semaine ↗`
  if (diff < 0) return `Attention : votre score a baissé cette semaine ↘`
  return `Votre score cette semaine — 1 action prioritaire`
}

export function generateWeeklyReport(p: WeeklyReportParams): string {
  const diff  = p.currentScore - p.previousScore
  const color = scoreColor(p.currentScore)
  let diffLine = ''
  if (diff > 0) diffLine = `<p style="color:#16a34a;font-size:14px;margin:4px 0 16px;">↗ +${diff} points par rapport à la semaine dernière</p>`
  else if (diff < 0) diffLine = `<p style="color:#dc2626;font-size:14px;margin:4px 0 16px;">↘ ${Math.abs(diff)} points perdus cette semaine</p>`

  return `
<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:36px 24px;color:#1a1a1a;">
  <p style="font-size:13px;color:#888;margin:0 0 24px;">LocalBoost · Rapport hebdomadaire · ${p.establishmentName}, ${p.city}</p>

  <h2 style="font-size:18px;font-weight:700;margin:0 0 12px;">Votre score cette semaine</h2>
  ${progressBarHtml(p.currentScore)}
  ${diffLine}

  <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:16px;margin-bottom:24px;">
    <p style="font-size:13px;color:#1e40af;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 8px;">Votre action prioritaire de la semaine</p>
    <p style="font-size:15px;color:#1e3a8a;margin:0;">
      → <a href="${p.topActionUrl}" style="color:#1d4ed8;font-weight:700;">${p.topAction}</a>
    </p>
  </div>

  <div style="background:#f9fafb;border-radius:8px;padding:14px 16px;margin-bottom:24px;">
    <p style="font-size:13px;color:#374151;margin:0;">
      Cette semaine, votre fiche a potentiellement manqué
      <strong>${p.clientsLost} contact${p.clientsLost > 1 ? 's' : ''} client${p.clientsLost > 1 ? 's' : ''}</strong>.
    </p>
  </div>

  <div style="text-align:center;margin:24px 0;">
    <a href="${p.dashboardUrl}" style="display:inline-block;background:#2563eb;color:white;font-weight:700;padding:12px 28px;border-radius:10px;text-decoration:none;font-size:14px;">
      Voir mon tableau de bord complet →
    </a>
  </div>

  <p style="color:#374151;font-size:14px;margin:0 0 24px;">À lundi prochain,<br>L'équipe LocalBoost</p>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0;">
  <p style="color:#9ca3af;font-size:12px;margin:0;">
    LocalBoost · contact@thelocalboost.fr ·
    <a href="${p.unsubscribeUrl}" style="color:#9ca3af;">Se désabonner de ces rapports</a>
  </p>
</div>`
}
