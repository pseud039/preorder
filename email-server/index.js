// import dotenv from 'dotenv'
// import app from './app.js'
// dotenv.config();
import { startQueueProcessor } from './queue/emailQueue.js'
import { verifyConnection } from './services/emailService.js'
import pool from './dbConnect.js'
import app from './app.js'
const PORT = process.env.EMAIL_SERVER_PORT || 3001

async function start() {
  await verifyConnection()
  
  startQueueProcessor()
  
  app.listen(PORT, () => {
    console.log(` Email server running on port ${PORT}`)
  })
}

start().catch(console.error);
