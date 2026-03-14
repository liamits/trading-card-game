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

// Public GET articles
app.get('/api/articles', async (req, res) => {
  const { default: Article } = await import('./models/Article.js')
  try {
    const filter = {}
    if (req.query.category) filter.category = req.query.category
    // Public chỉ thấy bài đã published
    filter.published = true
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

// Protected POST/PUT/DELETE articles (admin only)
app.post('/api/articles', requireAuth, async (req, res) => {
  const { default: Article } = await import('./models/Article.js')
  try {
    const article = new Article(req.body)
    await article.save()
    res.status(201).json(article)
  } catch (err) { res.status(400).json({ error: err.message }) }
})
app.put('/api/articles/:id', requireAuth, async (req, res) => {
  const { default: Article } = await import('./models/Article.js')
  try {
    const article = await Article.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    if (!article) return res.status(404).json({ error: 'Không tìm thấy' })
    res.json(article)
  } catch (err) { res.status(400).json({ error: err.message }) }
})
app.delete('/api/articles/:id', requireAuth, async (req, res) => {
  const { default: Article } = await import('./models/Article.js')
  try {
    const article = await Article.findByIdAndDelete(req.params.id)
    if (!article) return res.status(404).json({ error: 'Không tìm thấy' })
    res.json({ message: 'Đã xóa' })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// Admin GET all articles (including hidden)
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
