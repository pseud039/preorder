import express from 'express'
import { queueEmail, getQueueStats } from './queue/emailQueue.js'

const app = express()
app.use(express.json())

app.get('/health', async (req, res) => {
  const stats = await getQueueStats()
  res.json({ status: 'ok', queue: stats })
})

app.post('/queue', async (req, res) => {
  try {
    console.log('Queue request body:', req.body);
    const { to, subject, body, template, templateData, userId, orderId } = req.body
    
    if (!to) {
      return res.status(400).json({ error: 'Recipient email (to) is required' })
    }
    
    if (!template && (!subject || !body)) {
      return res.status(400).json({ error: 'Either template or subject+body is required' })
    }

    const id = await queueEmail({ to, subject, body, template, templateData, userId, orderId })
    res.json({ success: true, id })
  } catch (error) {
    console.error('Queue error:', error)
    res.status(500).json({ error: 'Failed to queue email' })
  }
})

app.post('/queue/batch', async (req, res) => {
  try {
    const { emails } = req.body
    
    if (!Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({ error: 'emails array is required' })
    }

    const ids = await Promise.all(
      emails.map(email => queueEmail(email))
    )
    
    res.json({ success: true, queued: ids.length, ids })
  } catch (error) {
    console.error('Batch queue error:', error)
    res.status(500).json({ error: 'Failed to queue emails' })
  }
})

app.get('/stats', async (req, res) => {
  try {
    const stats = await getQueueStats()
    res.json(stats)
  } catch (error) {
    res.status(500).json({ error: 'Failed to get stats' })
  }
})

export default app
