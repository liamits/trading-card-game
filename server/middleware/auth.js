import jwt from 'jsonwebtoken'

export const requireAuth = (req, res, next) => {
  try {
    const auth = req.headers.authorization
    if (!auth?.startsWith('Bearer '))
      return res.status(401).json({ error: 'Chưa đăng nhập' })

    req.user = jwt.verify(auth.slice(7), process.env.JWT_SECRET)
    next()
  } catch {
    res.status(401).json({ error: 'Token không hợp lệ hoặc đã hết hạn' })
  }
}
