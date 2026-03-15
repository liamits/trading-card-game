import express from 'express'
import Article from '../models/Article.js'

const router = express.Router()

// Tạo slug từ tiêu đề tiếng Việt
function makeSlug(title) {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80)
}

// Đảm bảo slug unique bằng cách thêm suffix nếu trùng
async function uniqueSlug(base, excludeId = null) {
  let slug = base
  let i = 1
  while (true) {
    const query = { slug }
    if (excludeId) query._id = { $ne: excludeId }
    const exists = await Article.findOne(query)
    if (!exists) return slug
    slug = `${base}-${i++}`
  }
}

// GET all articles
router.get('/', async (req, res) => {
  try {
    const { category, published } = req.query
    const filter = {}
    if (category) filter.category = category
    if (published !== undefined) filter.published = published === 'true'
    const articles = await Article.find(filter).sort({ createdAt: -1 })
    res.json(articles)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// GET single article by slug or id
router.get('/:slugOrId', async (req, res) => {
  try {
    const { slugOrId } = req.params
    const isId = /^[a-f\d]{24}$/i.test(slugOrId)
    const article = isId
      ? await Article.findById(slugOrId)
      : await Article.findOne({ slug: slugOrId })
    if (!article) return res.status(404).json({ error: 'Không tìm thấy bài viết' })
    res.json(article)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// POST create article
router.post('/', async (req, res) => {
  try {
    const base = makeSlug(req.body.title || '')
    const slug = await uniqueSlug(base)
    const article = new Article({ ...req.body, slug })
    await article.save()
    res.status(201).json(article)
  } catch (err) { res.status(400).json({ error: err.message }) }
})

// PUT update article
router.put('/:id', async (req, res) => {
  try {
    const update = { ...req.body }
    if (update.title) {
      const base = makeSlug(update.title)
      update.slug = await uniqueSlug(base, req.params.id)
    }
    const article = await Article.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true })
    if (!article) return res.status(404).json({ error: 'Không tìm thấy bài viết' })
    res.json(article)
  } catch (err) { res.status(400).json({ error: err.message }) }
})

// DELETE article
router.delete('/:id', async (req, res) => {
  try {
    const article = await Article.findByIdAndDelete(req.params.id)
    if (!article) return res.status(404).json({ error: 'Không tìm thấy bài viết' })
    res.json({ message: 'Đã xóa bài viết' })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

export default router
