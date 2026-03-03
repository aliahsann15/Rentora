import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { app } from './app'

dotenv.config()

mongoose.connect(process.env.MONGO_URI as string)
  .then(() => {
    console.log('MongoDB Connected')
    app.listen(process.env.PORT || 5000, () => {
      console.log(`Server running on port ${process.env.PORT || 5000}`)
    })
  })
  .catch((err: Error) => console.error(err))