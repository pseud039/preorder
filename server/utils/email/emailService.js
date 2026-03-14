const EMAIL_SERVER_URL = process.env.EMAIL_SERVER_URL || 'http://localhost:3001'

export async function sendEmail({ to, template, userId, orderId, templateData }) {
  // console.log('Sending to email server:', EMAIL_SERVER_URL) 
// console.log("HI");
  const response = await fetch(`${EMAIL_SERVER_URL}/queue`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to, template, userId, orderId, templateData }),
  })
// console.log("BYE");
  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Email server error (${response.status}): ${err}`)
  }

  return response.json();
}
