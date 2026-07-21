export type SendEmailOptions = {
  to: string
  subject: string
  html: string
  text?: string
  from?: string
}

export type SendEmailResult = {
  sent: boolean
  id?: string
  reason?: 'provider_not_configured'
}

function htmlToText(html: string) {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<li>/gi, '• ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .trim()
}

export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  const { to, subject, html, text, from } = options
  const fromAddress = from || process.env.RESEND_FROM || 'no-reply@lacasadelpez.com'
  const apiKey = process.env.RESEND_API_KEY

  if (!apiKey) {
    console.warn('No email provider configured. Set RESEND_API_KEY to send email notifications.')
    return { sent: false, reason: 'provider_not_configured' }
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromAddress,
      to,
      subject,
      html,
      text: text ?? htmlToText(html),
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Email provider error: ${response.status} ${response.statusText} - ${errorText}`)
  }

  const data = await response.json() as { id?: string }
  return { sent: true, id: data.id }
}
