import mongoose from 'mongoose'
import dotenv from 'dotenv'
import path from 'path'
import { Server, createServer } from 'http'
import { app } from './app'
import { startBackgroundJobs } from './jobs/scheduler'
import { initNotificationsGateway } from './services/notificationsGateway'

dotenv.config({ path: path.resolve(__dirname, '../.env') })

const mongoUri = process.env.MONGO_URI

if (!mongoUri) {
  throw new Error('MONGO_URI is required')
}

const port = Number(process.env.PORT || 5000)
let httpServer: Server | null = null

const shutdown = async (signal: string): Promise<void> => {
  console.log(`Received ${signal}. Shutting down gracefully...`)

  if (httpServer) {
    await new Promise<void>((resolve) => {
      httpServer?.close(() => resolve())
    })
  }

  await mongoose.connection.close()
  process.exit(0)
}

process.on('SIGINT', () => {
  void shutdown('SIGINT')
})

process.on('SIGTERM', () => {
  void shutdown('SIGTERM')
})

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason)
})

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error)
})

mongoose.connect(mongoUri, {
  maxPoolSize: Number(process.env.MONGO_MAX_POOL_SIZE || 20),
  minPoolSize: Number(process.env.MONGO_MIN_POOL_SIZE || 5),
  serverSelectionTimeoutMS: Number(process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS || 5000),
  socketTimeoutMS: Number(process.env.MONGO_SOCKET_TIMEOUT_MS || 45000),
  autoIndex: process.env.NODE_ENV !== 'production'
})
  .then(() => {
    console.log('MongoDB Connected')
    startBackgroundJobs()
    httpServer = createServer(app)
    initNotificationsGateway(httpServer)
    httpServer.listen(port, () => {
      console.log(`Server running on port ${port}`)
    })
  })
  .catch((err: Error) => {
    console.error('MongoDB connection failed:', err)
    process.exit(1)
  })