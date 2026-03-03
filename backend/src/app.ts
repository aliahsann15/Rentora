import express, { Application, Request, Response } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'
import { apiRouter } from './routes'

const app: Application = express()

app.use(cors())
app.use(helmet())
app.use(express.json())
app.use(cookieParser())
app.use(morgan('dev'))
app.use('/api', apiRouter)

app.get('/', (req: Request, res: Response) => {
  res.send('Rentora API Running 🚀')
})

export { app }
