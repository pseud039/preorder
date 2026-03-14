import { emailTemplates } from '../email/emailTemplates.js'
import { transporter } from '../email/emailConfig.js'

export async function sendEmail({ to, template, templateData }) {
  
  if (!template || !emailTemplates[template]) {
    throw new Error(`Unknown template: ${template}`)
  }

  const rendered = emailTemplates[template](
    templateData?.email || to,
    templateData?.link || templateData?.password
  )

  await transporter.sendMail({
    to,
    from: rendered.from,
    subject: rendered.subject,
    html: rendered.html,
  })
}

export async function verifyConnection() {
  try {
    await transporter.verify()
    console.log('SMTP connection verified ')
    return true
  } catch (error) {
    console.error('SMTP connection failed:', error.message)
    return false
  }
}