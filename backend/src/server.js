require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const cookieParser = require('cookie-parser')

const app = express()

// Middlewares
app.use(cors())
app.use(helmet())
app.use(express.json())
app.use(cookieParser())
app.use(morgan('dev'))

// Test route
app.get('/', (req, res) => {
  res.send('Rentora API Running 🚀')
})

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB Connected')
    app.listen(process.env.PORT || 5000, () => {
      console.log(`Server running on port ${process.env.PORT || 5000}`)
    })
  })
  .catch(err => console.error(err))