import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import dotenv from 'dotenv'
import characterRoutes from './routes/characters.js'
import articleRoutes from './routes/articles.js'
import authRoutes from './routes/auth.js'
import uploadRoutes from './routes/upload.js'
import { requireAuth } from './middleware/auth.js'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

dotenv.config()

const app = express()

app.use(cors())
app.use(express.json())

// Serve uploaded images statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// Public routes
app.use('/api/auth', authRoutes)
app.use('/api/characters', characterRoutes)
app.use('/api/upload', uploadRoutes)

// Article routes
app.use('/api/articles', articleRoutes)

// Admin GET all articles (reusing the router but could be integrated)
app.get('/api/admin/articles', requireAuth, async (req, res) => {
  const { default: Article } = await import('./models/Article.js')
  try {
    const articles = await Article.find({}).sort({ createdAt: -1 })
    res.json(articles)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB')
    app.listen(process.env.PORT, () => {
      console.log(`🚀 Server running on port ${process.env.PORT}`)
    })
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error)
  })
