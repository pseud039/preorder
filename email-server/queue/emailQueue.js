import pool from '../dbConnect.js'
import { sendEmail } from '../services/emailService.js'

const MAX_ATTEMPTS = 3 
const POLL_INTERVAL_MS = 2000

let isProcessing = false

export async function queueEmail({ to, subject, body, template, templateData, userId, orderId }) {
  
  const result = await pool.query(
    `INSERT INTO "EmailQueue" 
     ("to", subject, body, template, "templateData", "userId", "orderId", status, attempts, "maxAttempts", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', 0, $8, NOW(), NOW())
     RETURNING id`,
    [to, subject, body, template, JSON.stringify(templateData), userId, orderId, MAX_ATTEMPTS]
  )
  console.log(`[Queue] Added email ${result.rows[0].id} -> ${to}`)
  return result.rows[0].id
}

async function getNextEmail() {
  const result = await pool.query(
    `UPDATE "EmailQueue"
     SET status = 'processing', "updatedAt" = NOW()
     WHERE id = (
       SELECT id FROM "EmailQueue"
       WHERE status = 'pending'
       ORDER BY "createdAt" ASC
       LIMIT 1
       FOR UPDATE SKIP LOCKED
     )
     RETURNING *`
  )
  return result.rows[0] || null
}


async function processEmail(email) {
  try {
    console.log(`[Sending] Email ${email.id} to ${email.to} (attempt ${email.attempts + 1}/${email.maxAttempts})`)

    await sendEmail({
      to: email.to, 
      template: email.template,
      templateData: email.templateData
    })

    await pool.query(
      `UPDATE "EmailQueue" 
       SET status = 'sent', "sentAt" = NOW(), "updatedAt" = NOW()
       WHERE id = $1`,
      [email.id]
    )
    console.log(`[Success] Email ${email.id} sent`)

  } catch (error) {
    console.error(`[Failed] Email ${email.id}:`, error.message)
    
    const attempts = email.attempts + 1
    
    if (attempts >= email.maxAttempts) {
      await pool.query(
        `UPDATE "EmailQueue" 
         SET status = 'failed', attempts = $1, "errorMessage" = $2, "lastAttemptAt" = NOW(), "updatedAt" = NOW()
         WHERE id = $3`,
        [attempts, error.message, email.id]
      )
      console.log(`[Stopped] Email ${email.id} failed permanently after ${attempts} attempts`)
    } else {
      await pool.query(
        `UPDATE "EmailQueue" 
         SET status = 'pending', attempts = $1, "errorMessage" = $2, "lastAttemptAt" = NOW(), "updatedAt" = NOW()
         WHERE id = $3`,
        [attempts, error.message, email.id]
      )
      console.log(`[Retry] Email ${email.id} will retry (${attempts}/${email.maxAttempts})`)
    }
  }
}


async function processQueue() {
//   console.log('DB URL:', process.env.DATABASE_URL)
// console.log('EMAIL HOST:', process.env.EMAIL_HOST)
  if (isProcessing) return
  isProcessing = true

  try {
    const email = await getNextEmail()
    
    if (email) {
      await processEmail(email)
    }
  } catch (error) {
    console.error('[Queue Error]', error)
  } finally {
    isProcessing = false
  }
}

export function startQueueProcessor() {
  console.log('[Queue] Email processor started')
  console.log(`[Queue] Max attempts per email: ${MAX_ATTEMPTS}`)
  
  processQueue()
  setInterval(processQueue, POLL_INTERVAL_MS)
}


export async function getQueueStats() {
  const result = await pool.query(`
    SELECT 
      status,
      COUNT(*) as count
    FROM "EmailQueue"
    GROUP BY status
  `)
  
  const stats = {
    pending: 0,
    processing: 0,
    sent: 0,
    failed: 0
  }
  
  result.rows.forEach(row => {
    stats[row.status] = parseInt(row.count)
  })
  
  return stats;
}
