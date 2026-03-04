import express, { Application, Request, Response } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'
import rateLimit from 'express-rate-limit'
import { apiRouter } from './routes'
import { errorHandler } from './middlewares/errorHandler'
import { webhooksRoutes } from './routes/webhooksRoutes'

const app: Application = express()

const allowedOrigins = (process.env.CORS_WHITELIST || 'http://localhost:8081,http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      callback(null, true)
      return
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true)
      return
    }

    callback(new Error('Not allowed by CORS'))
  },
  credentials: true
}

const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX || 150),
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' }
})

const sanitizeMongoPayload = (value: unknown): void => {
  if (!value || typeof value !== 'object') {
    return
  }

  if (Array.isArray(value)) {
    value.forEach((item) => sanitizeMongoPayload(item))
    return
  }

  const objectValue = value as Record<string, unknown>
  Object.keys(objectValue).forEach((key) => {
    if (key.startsWith('$') || key.includes('.')) {
      delete objectValue[key]
      return
    }

    sanitizeMongoPayload(objectValue[key])
  })
}

const mongoSanitizeMiddleware = (req: Request, _res: Response, next: () => void) => {
  sanitizeMongoPayload(req.body)
  sanitizeMongoPayload(req.params)
  sanitizeMongoPayload(req.query as Record<string, unknown>)
  next()
}

app.use('/api/webhooks', webhooksRoutes)
app.use(cors(corsOptions))
app.use(helmet())
app.use(globalRateLimiter)
app.use(express.json())
app.use(mongoSanitizeMiddleware)
app.use(cookieParser())
app.use(morgan('dev'))
app.use('/api', apiRouter)

app.get('/', (req: Request, res: Response) => {
  res.send('Rentora API Running 🚀')
})

app.use(errorHandler)

export { app }
