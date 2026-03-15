import mongoose from 'mongoose'

const articleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, unique: true, sparse: true },
  category: {
    type: String,
    required: true,
    enum: ['TIER LIST', 'TOP DECKS', 'FARMING & EVENTS', 'LEAKS & UPDATES', 'GUIDES']
  },
  desc: { type: String, required: true },
  content: { type: String, default: '' },
  image: { type: String, default: '' },
  author: { type: String, default: 'Admin' },
  published: { type: Boolean, default: true },
  color: { type: String, default: '#8ab4f8' }
}, { timestamps: true })

export default mongoose.model('Article', articleSchema)
