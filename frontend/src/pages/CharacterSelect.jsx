import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import io from 'socket.io-client'
import './CharacterSelect.css'

const socket = io('http://localhost:5000')

function CharacterSelect() {
  const navigate = useNavigate()
  const location = useLocation()
  const { roomId, isMultiplayer } = location.state || {}
  
  const [characters, setCharacters] = useState([])
  const [playerCharacter, setPlayerCharacter] = useState(null)
  const [aiCharacter, setAiCharacter] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [opponentCharacter, setOpponentCharacter] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectingFor, setSelectingFor] = useState('player') // 'player' or 'ai'
  const [isReady, setIsReady] = useState(false)
  const [showVsIntro, setShowVsIntro] = useState(false)

  useEffect(() => {
    fetchCharacters()
    fetchProfile()

    if (isMultiplayer && roomId) {
      socket.on('duel-start', (room) => {
        const me = room.players.find(p => p.id === socket.id)
        const opponent = room.players.find(p => p.id !== socket.id)
        
        navigate('/duel', { 
          state: { 
            player: me.character, 
            opponent: opponent.character,
            isMultiplayer: true,
            roomId: roomId,
            myId: socket.id,
            roomData: room
          } 
        })
      })
    }

    return () => {
      socket.off('duel-start')
    }
  }, [isMultiplayer, roomId])

  const fetchCharacters = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/characters')
      const data = await response.json()
      setCharacters(data)
    } catch (error) {
      console.error('Error fetching characters:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchProfile = async () => {
    const token = localStorage.getItem('token')
    if (token) {
      try {
        const response = await fetch('http://localhost:5000/api/users/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        const data = await response.json()
        setUserProfile(data)
      } catch (err) {
        console.error('Failed to fetch profile:', err)
      }
    }
  }

  const handleCharacterSelect = (character) => {
    const userLevel = userProfile?.level || 1
    const isLocked = character.unlockLevel > userLevel
    
    if (isLocked && selectingFor === 'player') {
      alert(`This character requires Level ${character.unlockLevel} to unlock!`)
      return
    }

    if (isMultiplayer) {
      setPlayerCharacter(character)
      setIsReady(true)
      socket.emit('player-ready', { roomId, characterData: character })
    } else {
      if (selectingFor === 'player') {
        setPlayerCharacter(character)
        setSelectingFor('ai')
      } else {
        setAiCharacter(character)
      }
    }
  }

  const startDuel = () => {
    if (playerCharacter && aiCharacter) {
      setShowVsIntro(true)
      setTimeout(() => {
        navigate('/duel', {
          state: {
            player: playerCharacter,
            ai: aiCharacter
          }
        })
      }, 3500)
    }
  }

  const resetSelection = () => {
    setPlayerCharacter(null)
    setAiCharacter(null)
    setSelectingFor('player')
    setIsReady(false)
  }

  if (showVsIntro) {
    return (
      <div className="vs-intro-screen">
        <div className="vs-intro-background" />
        <div className="vs-intro-content">
          <div className="vs-intro-player">
            <img src={playerCharacter.avatar} alt={playerCharacter.name} />
            <h2>{playerCharacter.name}</h2>
          </div>
          <div className="vs-intro-center">
            <div className="vs-logo">VS</div>
          </div>
          <div className="vs-intro-ai">
            <img src={aiCharacter.avatar} alt={aiCharacter.name} />
            <h2>{aiCharacter.name}</h2>
            <div className="vs-ai-stars">{'⭐'.repeat(aiCharacter.difficulty || 1)}</div>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="duel-loading-screen">
        <div className="duel-loading-background" />
        <div className="duel-loading-content">
          <div className="duel-loading-title">
            <h1>⚔️ DUEL MODE ⚔️</h1>
          </div>
          <div className="duel-loading-text">Loading duelists...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="character-select">
      <button className="back-btn" onClick={() => navigate(isMultiplayer ? '/lobby' : '/game')}>
        ← Back
      </button>

      {/* Top Section - Large Avatars */}
      <div className="battle-preview">
        <div className="fighter-display player-display">
          {playerCharacter ? (
            <>
              <img src={playerCharacter.avatar} alt={playerCharacter.name} className="fighter-avatar" />
              <div className="fighter-info">
                <h2>{playerCharacter.name}</h2>
                <div className="difficulty-stars">
                  {'⭐'.repeat(playerCharacter.difficulty || 1)}
                </div>
                <p>{playerCharacter.description}</p>
              </div>
            </>
          ) : (
            <div className="empty-fighter">
              <div className="question-mark">?</div>
              <p>Select Your Character</p>
            </div>
          )}
        </div>

        <div className="vs-section">
          <div className="vs-text">VS</div>
          {!isMultiplayer && playerCharacter && aiCharacter && (
            <>
              <button className="start-duel-btn" onClick={startDuel}>
                ⚔️ START DUEL
              </button>
              <button className="reset-btn" onClick={resetSelection}>
                🔄 Reset
              </button>
            </>
          )}
          {isMultiplayer && isReady && (
            <div className="waiting-opponent">
              <div className="pulse-dot"></div>
              <p>WAITING FOR OPPONENT...</p>
            </div>
          )}
        </div>

        <div className="fighter-display ai-display">
          {isMultiplayer ? (
            <div className="empty-fighter">
              <div className="question-mark">?</div>
              <p>Opponent</p>
            </div>
          ) : aiCharacter ? (
            <>
              <img src={aiCharacter.avatar} alt={aiCharacter.name} className="fighter-avatar" />
              <div className="fighter-info">
                <h2>{aiCharacter.name}</h2>
                <div className="difficulty-stars">
                  {'⭐'.repeat(aiCharacter.difficulty || 1)}
                  {aiCharacter.difficulty === 5 && <span className="legendary-tag">LEGENDARY</span>}
                </div>
                <p>{aiCharacter.description}</p>
              </div>
            </>
          ) : (
            <div className="empty-fighter">
              <div className="question-mark">?</div>
              <p>Select AI Opponent</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Section - Character Grid */}
      <div className="selection-area">
        <div className="selection-header">
          <h3>
            {isMultiplayer 
              ? (isReady ? 'READY TO DUEL!' : '👤 SELECT YOUR CHARACTER')
              : (selectingFor === 'player' ? '👤 SELECT YOUR CHARACTER' : '🤖 SELECT AI OPPONENT')}
          </h3>
        </div>
        
        <div className="character-grid">
          {characters.map((char) => {
            const isSelected = 
              (selectingFor === 'player' && playerCharacter?._id === char._id) ||
              (selectingFor === 'ai' && aiCharacter?._id === char._id)
            
            const isDisabled = 
              (selectingFor === 'ai' && playerCharacter?._id === char._id)

            const userLevel = userProfile?.level || 1
            const isLocked = char.unlockLevel > userLevel && selectingFor === 'player'

            return (
              <div
                key={char._id}
                className={`character-card ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''} ${isLocked ? 'locked' : ''}`}
                onClick={() => !isDisabled && !isLocked && handleCharacterSelect(char)}
              >
                {isLocked && (
                  <div className="locked-overlay">
                    <span className="lock-icon">🔒</span>
                    <span className="unlock-req">LV.{char.unlockLevel}</span>
                  </div>
                )}
                <img src={char.avatar} alt={char.name} />
                <div className="character-name">
                  {char.name}
                  <div className="card-difficulty">
                    {'⭐'.repeat(char.difficulty || 1)}
                  </div>
                </div>
                {isSelected && <div className="selected-badge">✓</div>}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default CharacterSelect
