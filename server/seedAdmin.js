import mongoose from 'mongoose'
import dotenv from 'dotenv'
import User from './models/User.js'

dotenv.config()

await mongoose.connect(process.env.MONGODB_URI)

const existing = await User.findOne({ username: 'admin' })
if (existing) {
  console.log('⚠️  Admin đã tồn tại, bỏ qua.')
} else {
  await User.create({ username: 'admin', password: '123456', role: 'admin' })
  console.log('✅ Đã tạo tài khoản admin / 123456')
}

await mongoose.disconnect()
