import mongoose from 'mongoose'

const cardSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  type: { type: String, required: true },
  desc: String,
  atk: Number,
  def: Number,
  level: Number,
  race: String,
  attribute: String,
  image_url: String
})

const characterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
    default: ''
  },
  avatar: {
    type: String,
    default: ''
  },
  deck: {
    main: [cardSchema],
    extra: [cardSchema]
  },
  stats: {
    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    totalDuels: { type: Number, default: 0 }
  },
  difficulty: {
    type: Number,
    min: 1,
    max: 5,
    default: 1
  },
  unlockLevel: {
    type: Number,
    default: 1
  }

}, {
  timestamps: true
})

export default mongoose.model('Character', characterSchema)
