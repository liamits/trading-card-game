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
      alert('Chủ phòng đã thoát, phòng đã đóng!')
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
      setError('Vui lòng nhập ID phòng!')
      return
    }
    setIsJoining(true)
    socket.emit('join-room', { roomId, userData: user })
  }

  const handleStartGame = () => {
    if (currentRoom.players.length < 2) {
      alert('Cần ít nhất 2 người để bắt đầu!')
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
        <h1 className="lobby-title">SẢNH CHỜ QUYẾT ĐẤU</h1>
        
        {!currentRoom ? (
          <div className="lobby-actions">
            <div className="user-preview">
              <img src={user.avatar} alt="avatar" />
              <input 
                type="text" 
                value={user.name} 
                onChange={(e) => setUser({...user, name: e.target.value})}
                placeholder="Nhập tên của bạn..."
              />
            </div>

            <div className="action-group">
              <button className="lobby-btn create" onClick={handleCreateRoom}>
                ➕ TẠO PHÒNG MỚI
              </button>
              
              <div className="join-group">
                <input 
                  type="text" 
                  placeholder="Nhập ID phòng (6 số)..." 
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                />
                <button className="lobby-btn join" onClick={handleJoinRoom} disabled={isJoining}>
                  {isJoining ? 'ĐANG VÀO...' : 'VÀO PHÒNG'}
                </button>
              </div>
            </div>
            {error && <p className="lobby-error">{error}</p>}
          </div>
        ) : (
          <div className="room-details">
            <div className="room-info">
              <h2>PHÒNG: <span className="room-id">{currentRoom.id}</span></h2>
              <p className="room-status">Chờ đối thủ... ({currentRoom.players.length}/2)</p>
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
                  <span>Đang đợi người chơi khác...</span>
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
                  ⚔️ BẮT ĐẦU QUYẾT ĐẤU
                </button>
              ) : (
                <p className="waiting-msg">Đang chờ chủ phòng bắt đầu...</p>
              )}
              <button className="lobby-btn leave" onClick={handleLeaveRoom}>
                🚪 THOÁT PHÒNG
              </button>
            </div>
          </div>
        )}

        <div className="lobby-footer">
          <p>Chia sẻ ID phòng cho bạn bè để cùng quyết đấu!</p>
        </div>
      </div>
    </div>
  )
}

export default Lobby
