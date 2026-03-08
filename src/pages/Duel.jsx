import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import './Duel.css'

function Duel() {
  const location = useLocation()
  const navigate = useNavigate()
  const { player, ai } = location.state || {}

  const [playerLP, setPlayerLP] = useState(8000)
  const [aiLP, setAiLP] = useState(8000)
  const [playerHand, setPlayerHand] = useState([])
  const [aiHand, setAiHand] = useState([])
  const [playerDeck, setPlayerDeck] = useState([])
  const [aiDeck, setAiDeck] = useState([])
  const [currentTurn, setCurrentTurn] = useState('player') // 'player' or 'ai'
  const [hoveredCard, setHoveredCard] = useState(null)
  const [showCoinToss, setShowCoinToss] = useState(true)
  const [coinFlipping, setCoinFlipping] = useState(false)
  const [coinResult, setCoinResult] = useState(null)
  const [playerChoice, setPlayerChoice] = useState(null)

  useEffect(() => {
    if (!player || !ai) {
      navigate('/character-select')
      return
    }
  }, [])

  const handleCoinChoice = (choice) => {
    setPlayerChoice(choice)
    setCoinFlipping(true)

    // Simulate coin flip animation
    setTimeout(() => {
      const result = Math.random() < 0.5 ? 'heads' : 'tails'
      setCoinResult(result)
      setCoinFlipping(false)

      // Determine who goes first
      setTimeout(() => {
        const playerWon = (choice === 'heads' && result === 'heads') || 
                         (choice === 'tails' && result === 'tails')
        setCurrentTurn(playerWon ? 'player' : 'ai')
        
        // Close coin toss and start game
        setTimeout(() => {
          setShowCoinToss(false)
          drawInitialHands()
        }, 2000)
      }, 1000)
    }, 2000)
  }

  const shuffleDeck = (deck) => {
    const shuffled = [...deck]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  const drawInitialHands = () => {
    if (player && ai) {
      // Shuffle decks
      const shuffledPlayerDeck = shuffleDeck(player.deck.main)
      const shuffledAiDeck = shuffleDeck(ai.deck.main)

      // Draw 5 cards
      const playerInitial = shuffledPlayerDeck.slice(0, 5)
      const aiInitial = shuffledAiDeck.slice(0, 5)

      // Set hands and remaining decks
      setPlayerHand(playerInitial)
      setAiHand(aiInitial)
      setPlayerDeck(shuffledPlayerDeck.slice(5))
      setAiDeck(shuffledAiDeck.slice(5))
    }
  }

  const handleEndTurn = () => {
    setCurrentTurn(currentTurn === 'player' ? 'ai' : 'player')
  }

  if (!player || !ai) {
    return null
  }

  return (
    <div className="duel-field">
      {/* Coin Toss Modal */}
      {showCoinToss && (
        <div className="coin-toss-modal">
          <div className="coin-toss-content">
            <h2>🪙 Tung Đồng Xu</h2>
            <p>Chọn mặt để quyết định ai đi trước!</p>

            {!playerChoice && (
              <div className="coin-choices">
                <button 
                  className="coin-choice-btn heads"
                  onClick={() => handleCoinChoice('heads')}
                >
                  <div className="coin-face">👑</div>
                  <span>Ngửa</span>
                </button>
                <button 
                  className="coin-choice-btn tails"
                  onClick={() => handleCoinChoice('tails')}
                >
                  <div className="coin-face">⚔️</div>
                  <span>Sấp</span>
                </button>
              </div>
            )}

            {coinFlipping && (
              <div className="coin-flipping">
                <div className="coin-animation">🪙</div>
                <p>Đang tung...</p>
              </div>
            )}

            {coinResult && !coinFlipping && (
              <div className="coin-result">
                <div className={`coin-result-face ${coinResult}`}>
                  {coinResult === 'heads' ? '👑' : '⚔️'}
                </div>
                <p className="result-text">
                  Kết quả: <strong>{coinResult === 'heads' ? 'Ngửa' : 'Sấp'}</strong>
                </p>
                {((playerChoice === 'heads' && coinResult === 'heads') || 
                  (playerChoice === 'tails' && coinResult === 'tails')) ? (
                  <p className="winner-text">🎉 Bạn đi trước!</p>
                ) : (
                  <p className="winner-text">😤 Đối thủ đi trước!</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* AI Info - Top Right */}
      <div className="player-info ai-info">
        <div className="player-details">
          <h3>{ai.name}</h3>
          <div className="life-points">LP {aiLP}</div>
        </div>
        <img src={ai.avatar} alt={ai.name} className="player-avatar" />
      </div>

      {/* AI Hand (face down) - Top */}
      <div className="hand ai-hand">
        {aiHand.map((card, i) => (
          <div key={i} className="hand-card">
            <div className="card-back-small"></div>
          </div>
        ))}
      </div>

      {/* Main Field Container */}
      <div className="main-field-container">
        {/* Left Side - AI Deck/Extra/GY */}
        <div className="side-zones left-side">
          <div className="zone extra-deck-zone">
            <div className="card-back"></div>
            <div className="zone-label">Extra</div>
          </div>
          <div className="zone deck-zone">
            <div className="card-back"></div>
            <div className="zone-label">Deck</div>
          </div>
          <div className="zone graveyard-zone">
            <div className="card-placeholder">GY</div>
          </div>
        </div>

        {/* Center Field */}
        <div className="center-field">
          {/* AI Monster Zones */}
          <div className="monster-zones ai-monsters">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="zone monster-zone">
                <div className="card-placeholder"></div>
              </div>
            ))}
          </div>

          {/* AI Spell/Trap Zones */}
          <div className="spell-trap-zones ai-spells">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="zone spell-trap-zone">
                <div className="card-placeholder"></div>
              </div>
            ))}
          </div>

          {/* Player Spell/Trap Zones */}
          <div className="spell-trap-zones player-spells">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="zone spell-trap-zone">
                <div className="card-placeholder"></div>
              </div>
            ))}
          </div>

          {/* Player Monster Zones */}
          <div className="monster-zones player-monsters">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="zone monster-zone">
                <div className="card-placeholder"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side - Player Deck/Extra/GY + Battle Button */}
        <div className="side-zones right-side">
          <div className="zone extra-deck-zone">
            <div className="card-back"></div>
            <div className="zone-label">Extra</div>
          </div>
          <div className="zone deck-zone">
            <div className="card-back"></div>
            <div className="zone-label">Deck</div>
          </div>
          <div className="zone graveyard-zone">
            <div className="card-placeholder">GY</div>
          </div>
          <button className="battle-btn" onClick={handleEndTurn}>
            <span className="battle-text">Battle</span>
          </button>
        </div>
      </div>

      {/* Player Hand - Bottom */}
      <div className="hand player-hand">
        {playerHand.map((card, i) => (
          <div 
            key={i} 
            className="hand-card"
            onMouseEnter={() => setHoveredCard(card)}
            onMouseLeave={() => setHoveredCard(null)}
          >
            <img src={card.image_url} alt={card.name} />
          </div>
        ))}
      </div>

      {/* Player Info - Bottom Left */}
      <div className="player-info player-info-bottom">
        <img src={player.avatar} alt={player.name} className="player-avatar" />
        <div className="player-details">
          <h3>{player.name}</h3>
          <div className="life-points">LP {playerLP}</div>
        </div>
      </div>

      {/* Turn Indicator - Floating */}
      <div className="turn-indicator-floating">
        <div className={`turn-text ${currentTurn === 'player' ? 'active' : ''}`}>
          {currentTurn === 'player' ? 'Your Turn' : 'Opponent Turn'}
        </div>
      </div>

      {/* Menu Button */}
      <button className="menu-btn" onClick={() => navigate('/character-select')}>
        ⚙️ Menu
      </button>

      {/* Card Detail Tooltip */}
      {hoveredCard && (
        <div className="card-detail-tooltip">
          <div className="card-detail-content">
            <img src={hoveredCard.image_url} alt={hoveredCard.name} className="card-detail-image" />
            <div className="card-detail-info">
              <h3>{hoveredCard.name}</h3>
              <div className="card-stats">
                {hoveredCard.type && <span className="card-type">{hoveredCard.type}</span>}
                {hoveredCard.attribute && <span className="card-attribute">{hoveredCard.attribute}</span>}
                {hoveredCard.level && <span className="card-level">⭐ Level {hoveredCard.level}</span>}
              </div>
              {hoveredCard.atk !== undefined && (
                <div className="card-atk-def">
                  <span>ATK: {hoveredCard.atk}</span>
                  <span>DEF: {hoveredCard.def}</span>
                </div>
              )}
              <div className="card-description">
                <p className="description-label">Hiệu ứng:</p>
                <p>{hoveredCard.desc}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Duel
