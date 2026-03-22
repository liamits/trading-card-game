import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import io from 'socket.io-client'
import './Lobby.css'

const socket = io('http://localhost:5000')

function Lobby() {
  const navigate = useNavigate()
  const [user, setUser] = useState({ name: 'Player', avatar: '/image/yugimuto_pfp.webp' })
  const [roomId, setRoomId] = useState('')
  const [currentRoom, setCurrentRoom] = useState(null)
  const [error, setError] = useState('')
  const [isJoining, setIsJoining] = useState(false)

  useEffect(() => {
    // Generate a random name if not set
    const names = ['Yugi', 'Kaiba', 'Joey', 'Mai', 'Bakura', 'Marik']
    const randomName = `${names[Math.floor(Math.random() * names.length)]}_${Math.floor(Math.random() * 1000)}`
    setUser(prev => ({ ...prev, name: randomName }))

    socket.on('room-created', (room) => {
      setCurrentRoom(room)
      setError('')
    })

    socket.on('room-joined', (room) => {
      setCurrentRoom(room)
      setError('')
    })

    socket.on('player-joined', (room) => {
      setCurrentRoom(room)
    })

    socket.on('player-left', (room) => {
      setCurrentRoom(room)
    })

    socket.on('room-closed', () => {
      setCurrentRoom(null)
      alert('Host has left, room closed!')
    })

    socket.on('duel-loading', (room) => {
      navigate('/character-select', { state: { roomId: room.id, isMultiplayer: true } })
    })

    socket.on('error', (msg) => {
      setError(msg)
      setIsJoining(false)
    })

    return () => {
      socket.off('room-created')
      socket.off('room-joined')
      socket.off('player-joined')
      socket.off('player-left')
      socket.off('room-closed')
      socket.off('error')
    }
  }, [])

  const handleCreateRoom = () => {
    socket.emit('create-room', user)
  }

  const handleJoinRoom = () => {
    if (!roomId.trim()) {
      setError('Please enter room ID!')
      return
    }
    setIsJoining(true)
    socket.emit('join-room', { roomId, userData: user })
  }

  const handleStartGame = () => {
    if (currentRoom.players.length < 2) {
      alert('At least 2 players are required to start!')
      return
    }
    socket.emit('start-game', { roomId: currentRoom.id, userData: user })
  }

  const handleLeaveRoom = () => {
    window.location.reload() // Simple way to reset socket and state
  }

  return (
    <div className="lobby-container">
      <div className="lobby-box">
        <h1 className="lobby-title">DUEL LOBBY</h1>
        
        {!currentRoom ? (
          <div className="lobby-actions">
            <div className="user-preview">
              <img src={user.avatar} alt="avatar" />
              <input 
                type="text" 
                value={user.name} 
                onChange={(e) => setUser({...user, name: e.target.value})}
                placeholder="Enter your name..."
              />
            </div>

            <div className="action-group">
              <button className="lobby-btn create" onClick={handleCreateRoom}>
                ➕ CREATE NEW ROOM
              </button>
              
              <div className="join-group">
                <input 
                  type="text" 
                  placeholder="Enter Room ID (6 digits)..." 
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                />
                <button className="lobby-btn join" onClick={handleJoinRoom} disabled={isJoining}>
                  {isJoining ? 'JOINING...' : 'JOIN ROOM'}
                </button>
              </div>
            </div>
            {error && <p className="lobby-error">{error}</p>}
          </div>
        ) : (
          <div className="room-details">
            <div className="room-info">
              <h2>ROOM: <span className="room-id">{currentRoom.id}</span></h2>
              <p className="room-status">Waiting for opponent... ({currentRoom.players.length}/2)</p>
            </div>

            <div className="players-list">
              {currentRoom.players.map((p, i) => (
                <div key={i} className="player-slot">
                  <img src={p.avatar} alt="avatar" />
                  <div className="player-name">
                    {p.name} {p.id === currentRoom.host && <span className="host-badge">HOST</span>}
                  </div>
                </div>
              ))}
              {currentRoom.players.length < 2 && (
                <div className="player-slot empty">
                  <div className="pulse-dot"></div>
                  <span>Waiting for another player...</span>
                </div>
              )}
            </div>

            <div className="room-actions">
              {currentRoom.host === socket.id ? (
                <button 
                  className={`lobby-btn start ${currentRoom.players.length < 2 ? 'disabled' : ''}`}
                  onClick={handleStartGame}
                  disabled={currentRoom.players.length < 2}
                >
                  ⚔️ START DUEL
                </button>
              ) : (
                <p className="waiting-msg">Waiting for host to start...</p>
              )}
              <button className="lobby-btn leave" onClick={handleLeaveRoom}>
                🚪 LEAVE ROOM
              </button>
            </div>
          </div>
        )}

        <div className="lobby-footer">
          <p>Share the room ID with your friends to duel together!</p>
        </div>
      </div>
    </div>
  )
}

export default Lobby
