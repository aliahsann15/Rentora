import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { app } from './app'
import { startBackgroundJobs } from './jobs/scheduler'

dotenv.config()

mongoose.connect(process.env.MONGO_URI as string)
  .then(() => {
    console.log('MongoDB Connected')
    startBackgroundJobs()
    app.listen(process.env.PORT || 5000, () => {
      console.log(`Server running on port ${process.env.PORT || 5000}`)
    })
  })
  .catch((err: Error) => console.error(err))