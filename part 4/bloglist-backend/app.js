const config = require('./utils/config')
const express = require('express')
const mongoose = require('mongoose')

const blogsRouter = require('./controllers/blogs')
const usersRouter = require('./controllers/users')
const loginRouter = require('./controllers/login')
const middleware = require('./utils/middleware')



const app = express()

// Body parser middleware must come first
app.use(express.json())

// Token extractor middleware
app.use(middleware.tokenExtractor)

mongoose.connect(config.MONGODB_URI, {
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 30000,
  family: 4,
})
  .then(() => {
    console.log('connected to MongoDB')
  })
  .catch((error) => {
    console.log('error connecting to MongoDB:', error.message)
  })

app.use('/api/blogs', blogsRouter)
app.use('/api/users', usersRouter)
app.use('/api/login', loginRouter)

if (process.env.NODE_ENV === 'test') {
  const testingRouter = require('./controllers/testing')
  app.use('/api/testing', testingRouter)
}


module.exports = app
