import express from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { requireAuth } from '../middleware/auth.js'

const router = express.Router()

// Ensure uploads folder exists
const uploadDir = 'uploads'
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir)

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    const name = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`
    cb(null, name)
  }
})

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/
    if (allowed.test(path.extname(file.originalname).toLowerCase())) cb(null, true)
    else cb(new Error('Chỉ chấp nhận file ảnh!'))
  }
})

router.post('/', requireAuth, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Không có file' })
  res.json({ url: `/uploads/${req.file.filename}` })
})

export default router
