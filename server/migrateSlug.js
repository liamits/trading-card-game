// Chạy 1 lần để thêm slug cho các bài viết cũ chưa có slug
// node migrateSlug.js
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import Article from './models/Article.js'

dotenv.config()

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

await mongoose.connect(process.env.MONGODB_URI)
const articles = await Article.find({ slug: { $exists: false } })
console.log(`Found ${articles.length} articles without slug`)

for (const a of articles) {
  let base = makeSlug(a.title)
  let slug = base, i = 1
  while (await Article.findOne({ slug, _id: { $ne: a._id } })) slug = `${base}-${i++}`
  await Article.findByIdAndUpdate(a._id, { slug })
  console.log(`✅ ${a.title} → ${slug}`)
}

console.log('Done!')
await mongoose.disconnect()
