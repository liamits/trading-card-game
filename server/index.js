import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import dotenv from 'dotenv'
import characterRoutes from './routes/characters.js'
import articleRoutes from './routes/articles.js'
import authRoutes from './routes/auth.js'
import { requireAuth } from './middleware/auth.js'

dotenv.config()

const app = express()

app.use(cors())
app.use(express.json())

// Public routes
app.use('/api/auth', authRoutes)
app.use('/api/characters', characterRoutes)

// Public GET articles, protected POST/PUT/DELETE
app.get('/api/articles', async (req, res, next) => {
  const { default: Article } = await import('./models/Article.js')
  try {
    const filter = {}
    if (req.query.category) filter.category = req.query.category
    if (req.query.published !== undefined) filter.published = req.query.published === 'true'
    const articles = await Article.find(filter).sort({ createdAt: -1 })
    res.json(articles)
  } catch (err) { res.status(500).json({ error: err.message }) }
})
app.get('/api/articles/:id', async (req, res) => {
  const { default: Article } = await import('./models/Article.js')
  try {
    const article = await Article.findById(req.params.id)
    if (!article) return res.status(404).json({ error: 'Không tìm thấy' })
    res.json(article)
  } catch (err) { res.status(500).json({ error: err.message }) }
})
app.use('/api/articles', requireAuth, articleRoutes)

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
