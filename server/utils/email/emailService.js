const EMAIL_SERVER_URL = process.env.EMAIL_SERVER_URL || 'http://localhost:3001'

export async function sendEmail({ to, template, userId, orderId, templateData }) {
  const response = await fetch(`${EMAIL_SERVER_URL}/queue`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to, template, userId, orderId, templateData }),
  })
  if (!response.ok) {
    const err = await response.text()
    const error = new Error(`Email server error (${response.status}): ${err}`)
    console.error('[sendEmail] Failed to queue email:', error)
    throw error
  }

  return response.json();
}
