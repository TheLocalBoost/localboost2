import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM = 'LocalBoost <contact@thelocalboost.fr>'

export async function sendTransactional({
  to,
  toName,
  subject,
  html,
  attachments,
}: {
  to: string
  toName?: string
  subject: string
  html: string
  attachments?: { filename: string; content: Buffer }[]
}) {
  const { error } = await resend.emails.send({
    from: FROM,
    to: toName ? `${toName} <${to}>` : to,
    subject,
    html,
    attachments: attachments?.map(a => ({
      filename: a.filename,
      content:  a.content,
    })),
  })

  if (error) throw new Error(error.message)
}
