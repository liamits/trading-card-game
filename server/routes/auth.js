import express from 'express'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'

const router = express.Router()

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body
    if (!username || !password)
      return res.status(400).json({ error: 'Vui lòng nhập username và password' })

    const user = await User.findOne({ username: username.toLowerCase() })
    if (!user)
      return res.status(401).json({ error: 'Sai username hoặc password' })

    const match = await user.comparePassword(password)
    if (!match)
      return res.status(401).json({ error: 'Sai username hoặc password' })

    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.json({ token, username: user.username, role: user.role })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/auth/me  (verify token)
router.get('/me', async (req, res) => {
  try {
    const auth = req.headers.authorization
    if (!auth?.startsWith('Bearer '))
      return res.status(401).json({ error: 'Không có token' })

    const decoded = jwt.verify(auth.slice(7), process.env.JWT_SECRET)
    res.json({ username: decoded.username, role: decoded.role })
  } catch {
    res.status(401).json({ error: 'Token không hợp lệ' })
  }
})

export default router
