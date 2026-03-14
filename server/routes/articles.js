import express from 'express'
import Article from '../models/Article.js'

const router = express.Router()

// GET all articles
router.get('/', async (req, res) => {
  try {
    const { category, published } = req.query
    const filter = {}
    if (category) filter.category = category
    if (published !== undefined) filter.published = published === 'true'
    const articles = await Article.find(filter).sort({ createdAt: -1 })
    res.json(articles)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET single article
router.get('/:id', async (req, res) => {
  try {
    const article = await Article.findById(req.params.id)
    if (!article) return res.status(404).json({ error: 'Không tìm thấy bài viết' })
    res.json(article)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST create article
router.post('/', async (req, res) => {
  try {
    const article = new Article(req.body)
    await article.save()
    res.status(201).json(article)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// PUT update article
router.put('/:id', async (req, res) => {
  try {
    const article = await Article.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    if (!article) return res.status(404).json({ error: 'Không tìm thấy bài viết' })
    res.json(article)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// DELETE article
router.delete('/:id', async (req, res) => {
  try {
    const article = await Article.findByIdAndDelete(req.params.id)
    if (!article) return res.status(404).json({ error: 'Không tìm thấy bài viết' })
    res.json({ message: 'Đã xóa bài viết' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
