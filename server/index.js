import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import dotenv from 'dotenv'
import { createServer } from 'http'
import { Server } from 'socket.io'
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
const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
})

app.use(cors())
app.use(express.json())

// Serve uploaded images statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// Public routes
app.use('/api/auth', authRoutes)
app.use('/api/characters', characterRoutes)
app.use('/api/upload', uploadRoutes)

// Article routes
app.use('/api/articles', articleRoutes)

// Admin GET all articles
app.get('/api/admin/articles', requireAuth, async (req, res) => {
  const { default: Article } = await import('./models/Article.js')
  try {
    const articles = await Article.find({}).sort({ createdAt: -1 })
    res.json(articles)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// Socket.io Room Management
const rooms = new Map()

io.on('connection', (socket) => {
  console.log('👤 User connected:', socket.id)

  socket.on('create-room', (userData) => {
    const roomId = Math.floor(100000 + Math.random() * 900000).toString()
    const roomData = {
      id: roomId,
      host: socket.id,
      players: [{ id: socket.id, name: userData.name, avatar: userData.avatar }],
      status: 'waiting'
    }
    rooms.set(roomId, roomData)
    socket.join(roomId)
    socket.emit('room-created', roomData)
    console.log(`🏠 Room created: ${roomId} by ${userData.name}`)
  })

  socket.on('join-room', ({ roomId, userData }) => {
    const room = rooms.get(roomId)
    if (room) {
      if (room.players.length < 2) {
        room.players.push({ id: socket.id, name: userData.name, avatar: userData.avatar })
        socket.join(roomId)
        socket.emit('room-joined', room)
        io.to(roomId).emit('player-joined', room)
        console.log(`👤 ${userData.name} joined room: ${roomId}`)
      } else {
        socket.emit('error', 'Phòng đã đầy!')
      }
    } else {
      socket.emit('error', 'Không tìm thấy phòng!')
    }
  })

  socket.on('start-game', ({ roomId, characterData }) => {
    const room = rooms.get(roomId)
    if (room && room.host === socket.id) {
      room.status = 'playing'
      // Store character/deck data for each player in room
      const playerIndex = room.players.findIndex(p => p.id === socket.id)
      if (playerIndex !== -1) {
        room.players[playerIndex].character = characterData
      }
      io.to(roomId).emit('duel-loading', room)
      console.log(`⚔️ Duel starting in room: ${roomId}`)
    }
  })

  socket.on('player-ready', ({ roomId, characterData }) => {
    const room = rooms.get(roomId)
    if (room) {
      const playerIndex = room.players.findIndex(p => p.id === socket.id)
      if (playerIndex !== -1) {
        room.players[playerIndex].character = characterData
      }
      
      // If both players have characters, start the duel
      const allReady = room.players.every(p => p.character)
      if (allReady && room.players.length === 2) {
        io.to(roomId).emit('duel-start', room)
        console.log(`🎮 All players ready in room ${roomId}. Duel started!`)
      }
    }
  })

  socket.on('disconnect', () => {
    console.log('👤 User disconnected:', socket.id)
    // Clean up rooms if host leaves
    for (const [roomId, room] of rooms.entries()) {
      if (room.host === socket.id) {
        io.to(roomId).emit('room-closed')
        rooms.delete(roomId)
        console.log(`🏠 Room closed: ${roomId}`)
      } else {
        const playerIndex = room.players.findIndex(p => p.id === socket.id)
        if (playerIndex !== -1) {
          room.players.splice(playerIndex, 1)
          io.to(roomId).emit('player-left', room)
        }
      }
    }
  })
})

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB')
    httpServer.listen(process.env.PORT, () => {
      console.log(`🚀 Server running on port ${process.env.PORT}`)
    })
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error)
  })
