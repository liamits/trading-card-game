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
  const [showExtraDeck, setShowExtraDeck] = useState(false)
  const [draggedCard, setDraggedCard] = useState(null)
  const [playerField, setPlayerField] = useState({
    monsters: [null, null, null, null, null],
    spells: [null, null, null, null, null]
  })
  const [aiField, setAiField] = useState({
    monsters: [null, null, null, null, null],
    spells: [null, null, null, null, null]
  })
  const [showCardOptions, setShowCardOptions] = useState(false)
  const [selectedZone, setSelectedZone] = useState(null)
  const [selectedAttacker, setSelectedAttacker] = useState(null)
  const [playerGraveyard, setPlayerGraveyard] = useState([])
  const [aiGraveyard, setAiGraveyard] = useState([])
  const [battlePhase, setBattlePhase] = useState(false)
  const [showGraveyard, setShowGraveyard] = useState(false)
  const [graveyardOwner, setGraveyardOwner] = useState(null)
  const [damageAnimation, setDamageAnimation] = useState({ player: null, ai: null })

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
    const nextTurn = currentTurn === 'player' ? 'ai' : 'player'
    setCurrentTurn(nextTurn)
    
    // Draw a card for the next player
    if (nextTurn === 'player' && playerDeck.length > 0) {
      const newCard = playerDeck[0]
      setPlayerHand([...playerHand, newCard])
      setPlayerDeck(playerDeck.slice(1))
    } else if (nextTurn === 'ai' && aiDeck.length > 0) {
      const newCard = aiDeck[0]
      setAiHand([...aiHand, newCard])
      setAiDeck(aiDeck.slice(1))
    }
  }

  const handleExtraDeckClick = () => {
    setShowExtraDeck(true)
  }

  const closeExtraDeck = () => {
    setShowExtraDeck(false)
  }

  const handleDragStart = (card, index) => {
    setDraggedCard({ card, handIndex: index })
  }

  const handleDragOver = (e) => {
    e.preventDefault()
  }

  const handleDropOnMonsterZone = (zoneIndex, isCurrentPlayer) => {
    if (!draggedCard) return
    
    const card = draggedCard.card
    
    // Check if it's a monster card
    if (!card.type.includes('Monster')) {
      alert('Chỉ có thể đặt Monster vào Monster Zone!')
      setDraggedCard(null)
      return
    }

    // Get the correct field
    const field = isCurrentPlayer ? 
      (currentTurn === 'player' ? playerField : aiField) : 
      (currentTurn === 'player' ? aiField : playerField)

    // Check if zone is empty
    if (field.monsters[zoneIndex]) {
      alert('Zone này đã có bài!')
      setDraggedCard(null)
      return
    }

    // Show options: Set (face-down) or Summon (face-up)
    setSelectedZone({ type: 'monster', index: zoneIndex, isCurrentPlayer })
    setShowCardOptions(true)
  }

  const handleDropOnSpellZone = (zoneIndex, isCurrentPlayer) => {
    if (!draggedCard) return
    
    const card = draggedCard.card
    
    // Check if it's a spell/trap card
    if (!card.type.includes('Spell') && !card.type.includes('Trap')) {
      alert('Chỉ có thể đặt Spell/Trap vào Spell/Trap Zone!')
      setDraggedCard(null)
      return
    }

    // Get the correct field
    const field = isCurrentPlayer ? 
      (currentTurn === 'player' ? playerField : aiField) : 
      (currentTurn === 'player' ? aiField : playerField)

    // Check if zone is empty
    if (field.spells[zoneIndex]) {
      alert('Zone này đã có bài!')
      setDraggedCard(null)
      return
    }

    // Show options: Set (face-down) or Activate (face-up)
    setSelectedZone({ type: 'spell', index: zoneIndex, isCurrentPlayer })
    setShowCardOptions(true)
  }

  const handleCardPlacement = (faceUp) => {
    if (!draggedCard || !selectedZone) return

    const card = draggedCard.card
    const handIndex = draggedCard.handIndex

    // Determine which field and hand to update
    const isPlayerTurn = currentTurn === 'player'
    const field = isPlayerTurn ? playerField : aiField
    const setField = isPlayerTurn ? setPlayerField : setAiField
    const hand = isPlayerTurn ? playerHand : aiHand
    const setHand = isPlayerTurn ? setPlayerHand : setAiHand

    // Place card on field
    if (selectedZone.type === 'monster') {
      const newMonsters = [...field.monsters]
      newMonsters[selectedZone.index] = {
        ...card,
        faceUp,
        position: faceUp ? 'attack' : 'defense'
      }
      setField({ ...field, monsters: newMonsters })
    } else {
      const newSpells = [...field.spells]
      newSpells[selectedZone.index] = {
        ...card,
        faceUp
      }
      setField({ ...field, spells: newSpells })
    }

    // Remove card from hand
    const newHand = hand.filter((_, i) => i !== handIndex)
    setHand(newHand)

    // Reset states
    setDraggedCard(null)
    setSelectedZone(null)
    setShowCardOptions(false)
  }

  const handleCardClick = (card, type, index, isCurrentPlayer) => {
    // If in battle phase and clicking own monster
    if (battlePhase && isCurrentPlayer && type === 'monster' && card.faceUp && card.position === 'attack') {
      setSelectedAttacker({ card, index })
      return
    }

    // If in battle phase and clicking opponent monster with attacker selected
    if (battlePhase && !isCurrentPlayer && type === 'monster' && selectedAttacker) {
      handleBattle(selectedAttacker, { card, index })
      return
    }

    // Normal click - toggle position
    if (type === 'monster' && card.faceUp && isCurrentPlayer && !battlePhase) {
      const field = currentTurn === 'player' ? playerField : aiField
      const setField = currentTurn === 'player' ? setPlayerField : setAiField

      const newMonsters = [...field.monsters]
      newMonsters[index] = {
        ...card,
        position: card.position === 'attack' ? 'defense' : 'attack'
      }
      setField({ ...field, monsters: newMonsters })
    }
  }

  const handleBattle = (attacker, defender) => {
    const attackerCard = attacker.card
    const defenderCard = defender.card

    const isPlayerAttacking = currentTurn === 'player'
    const attackerField = isPlayerAttacking ? playerField : aiField
    const defenderField = isPlayerAttacking ? aiField : playerField
    const setAttackerField = isPlayerAttacking ? setPlayerField : setAiField
    const setDefenderField = isPlayerAttacking ? setAiField : setPlayerField
    const attackerGY = isPlayerAttacking ? playerGraveyard : aiGraveyard
    const defenderGY = isPlayerAttacking ? aiGraveyard : playerGraveyard
    const setAttackerGY = isPlayerAttacking ? setPlayerGraveyard : setAiGraveyard
    const setDefenderGY = isPlayerAttacking ? setAiGraveyard : setPlayerGraveyard

    let battleLog = ''
    let damage = 0

    // Battle calculation
    if (defenderCard.faceUp) {
      if (defenderCard.position === 'attack') {
        // Attack vs Attack
        const atkDiff = attackerCard.atk - defenderCard.atk
        
        if (atkDiff > 0) {
          // Attacker wins
          battleLog = `${attackerCard.name} (${attackerCard.atk}) phá hủy ${defenderCard.name} (${defenderCard.atk})!`
          damage = atkDiff
          
          // Destroy defender
          const newDefenderMonsters = [...defenderField.monsters]
          setDefenderGY([...defenderGY, defenderCard])
          newDefenderMonsters[defender.index] = null
          setDefenderField({ ...defenderField, monsters: newDefenderMonsters })
          
          // Damage to defender
          if (isPlayerAttacking) {
            animateLP('ai', damage)
          } else {
            animateLP('player', damage)
          }
        } else if (atkDiff < 0) {
          // Defender wins
          battleLog = `${defenderCard.name} (${defenderCard.atk}) phá hủy ${attackerCard.name} (${attackerCard.atk})!`
          damage = Math.abs(atkDiff)
          
          // Destroy attacker
          const newAttackerMonsters = [...attackerField.monsters]
          setAttackerGY([...attackerGY, attackerCard])
          newAttackerMonsters[attacker.index] = null
          setAttackerField({ ...attackerField, monsters: newAttackerMonsters })
          
          // Damage to attacker
          if (isPlayerAttacking) {
            animateLP('player', damage)
          } else {
            animateLP('ai', damage)
          }
        } else {
          // Draw - both destroyed
          battleLog = `Cả hai quái thú bị phá hủy!`
          
          const newAttackerMonsters = [...attackerField.monsters]
          const newDefenderMonsters = [...defenderField.monsters]
          
          setAttackerGY([...attackerGY, attackerCard])
          setDefenderGY([...defenderGY, defenderCard])
          
          newAttackerMonsters[attacker.index] = null
          newDefenderMonsters[defender.index] = null
          
          setAttackerField({ ...attackerField, monsters: newAttackerMonsters })
          setDefenderField({ ...defenderField, monsters: newDefenderMonsters })
        }
      } else {
        // Attack vs Defense
        const atkVsDef = attackerCard.atk - defenderCard.def
        
        if (atkVsDef > 0) {
          // Attacker wins
          battleLog = `${attackerCard.name} (${attackerCard.atk}) phá hủy ${defenderCard.name} (DEF ${defenderCard.def})!`
          
          // Destroy defender
          const newDefenderMonsters = [...defenderField.monsters]
          setDefenderGY([...defenderGY, defenderCard])
          newDefenderMonsters[defender.index] = null
          setDefenderField({ ...defenderField, monsters: newDefenderMonsters })
        } else if (atkVsDef < 0) {
          // Defender survives
          battleLog = `${defenderCard.name} (DEF ${defenderCard.def}) chặn được tấn công!`
          damage = Math.abs(atkVsDef)
          
          // Damage to attacker
          if (isPlayerAttacking) {
            animateLP('player', damage)
          } else {
            animateLP('ai', damage)
          }
        } else {
          // No damage
          battleLog = `Không có damage!`
        }
      }
    } else {
      // Attack face-down monster - flip it
      const newDefenderMonsters = [...defenderField.monsters]
      newDefenderMonsters[defender.index] = { ...defenderCard, faceUp: true }
      setDefenderField({ ...defenderField, monsters: newDefenderMonsters })
      
      // Then calculate damage
      const atkVsDef = attackerCard.atk - defenderCard.def
      
      if (atkVsDef > 0) {
        battleLog = `Lật bài: ${defenderCard.name} (DEF ${defenderCard.def}) bị phá hủy!`
        setDefenderGY([...defenderGY, defenderCard])
        newDefenderMonsters[defender.index] = null
        setDefenderField({ ...defenderField, monsters: newDefenderMonsters })
      } else if (atkVsDef < 0) {
        battleLog = `Lật bài: ${defenderCard.name} (DEF ${defenderCard.def}) chặn được!`
        damage = Math.abs(atkVsDef)
        
        if (isPlayerAttacking) {
          animateLP('player', damage)
        } else {
          animateLP('ai', damage)
        }
      } else {
        battleLog = `Lật bài: ${defenderCard.name} - Không có damage!`
      }
    }

    alert(battleLog + (damage > 0 ? ` Damage: ${damage}` : ''))
    setSelectedAttacker(null)
  }

  const handleDirectAttack = () => {
    if (!selectedAttacker) return

    const attackerCard = selectedAttacker.card
    const isPlayerAttacking = currentTurn === 'player'
    
    // Check if opponent has no monsters
    const opponentField = isPlayerAttacking ? aiField : playerField
    const hasMonsters = opponentField.monsters.some(m => m !== null)
    
    if (hasMonsters) {
      alert('Đối thủ còn quái thú trên sân!')
      return
    }

    // Direct attack
    const damage = attackerCard.atk
    
    if (isPlayerAttacking) {
      animateLP('ai', damage)
    } else {
      animateLP('player', damage)
    }

    alert(`${attackerCard.name} tấn công trực tiếp! Damage: ${damage}`)
    setSelectedAttacker(null)
  }

  const handleGraveyardClick = (owner) => {
    const graveyard = owner === 'player' ? playerGraveyard : aiGraveyard
    if (graveyard.length === 0) {
      alert('Graveyard trống!')
      return
    }
    setGraveyardOwner(owner)
    setShowGraveyard(true)
  }

  const closeGraveyard = () => {
    setShowGraveyard(false)
    setGraveyardOwner(null)
  }

  const animateLP = (target, damage) => {
    // Show damage animation
    if (target === 'player') {
      setDamageAnimation({ ...damageAnimation, player: damage })
      setTimeout(() => setDamageAnimation({ ...damageAnimation, player: null }), 3000)
    } else {
      setDamageAnimation({ ...damageAnimation, ai: damage })
      setTimeout(() => setDamageAnimation({ ...damageAnimation, ai: null }), 3000)
    }

    // Animate LP countdown
    const currentLP = target === 'player' ? playerLP : aiLP
    const targetLP = currentLP - damage
    const setLP = target === 'player' ? setPlayerLP : setAiLP
    const duration = 1800 // 1.8 seconds
    const steps = 40
    const decrement = damage / steps
    const interval = duration / steps

    let step = 0
    const timer = setInterval(() => {
      step++
      const newLP = Math.max(0, Math.round(currentLP - (decrement * step)))
      setLP(newLP)
      
      if (step >= steps || newLP <= targetLP) {
        clearInterval(timer)
        setLP(targetLP)
      }
    }, interval)
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

      {/* Player Info - Bottom Left (Always Player) */}
      <div className="player-info player-info-bottom">
        <img 
          src={player.avatar} 
          alt={player.name} 
          className="player-avatar" 
        />
        <div className="player-details">
          <h3>{player.name}</h3>
          <div className="life-points-container">
            <div className="life-points">LP {playerLP}</div>
            {damageAnimation.player && (
              <div className="damage-number">-{damageAnimation.player}</div>
            )}
          </div>
        </div>
      </div>

      {/* AI Info - Top Right (Always AI) */}
      <div className="player-info ai-info">
        <div className="player-details">
          <h3>{ai.name}</h3>
          <div className="life-points-container">
            <div className="life-points">LP {aiLP}</div>
            {damageAnimation.ai && (
              <div className="damage-number">-{damageAnimation.ai}</div>
            )}
          </div>
        </div>
        <img 
          src={ai.avatar} 
          alt={ai.name} 
          className="player-avatar" 
        />
      </div>

      {/* Opponent Hand (face down) - Top */}
      <div className="hand ai-hand">
        {(currentTurn === 'player' ? aiHand : playerHand).map((card, i) => (
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
          <div className="zone graveyard-zone" onClick={() => handleGraveyardClick('ai')}>
            <div className="card-placeholder">GY</div>
            {aiGraveyard.length > 0 && (
              <div className="gy-count">{aiGraveyard.length}</div>
            )}
          </div>
        </div>

        {/* Center Field */}
        <div className="center-field">
          {/* Opponent Spell/Trap Zones */}
          <div className="spell-trap-zones ai-spells">
            {(currentTurn === 'player' ? aiField : playerField).spells.map((card, i) => (
              <div 
                key={i} 
                className="zone spell-trap-zone"
              >
                {card ? (
                  card.faceUp ? (
                    <img 
                      src={card.image_url} 
                      alt={card.name}
                      className="field-card"
                    />
                  ) : (
                    <div className="card-back"></div>
                  )
                ) : (
                  <div className="card-placeholder"></div>
                )}
              </div>
            ))}
          </div>

          {/* Opponent Monster Zones */}
          <div className="monster-zones ai-monsters">
            {(currentTurn === 'player' ? aiField : playerField).monsters.map((card, i) => (
              <div 
                key={i} 
                className={`zone monster-zone ${battlePhase && card ? 'battle-target' : ''}`}
                onClick={() => card && battlePhase && selectedAttacker && handleCardClick(card, 'monster', i, false)}
              >
                {card ? (
                  card.faceUp ? (
                    <img 
                      src={card.image_url} 
                      alt={card.name}
                      className={`field-card ${card.position}`}
                    />
                  ) : (
                    <div className="card-back"></div>
                  )
                ) : (
                  <div className="card-placeholder"></div>
                )}
              </div>
            ))}
          </div>

          {/* Current Player Monster Zones */}
          <div className="monster-zones player-monsters">
            {(currentTurn === 'player' ? playerField : aiField).monsters.map((card, i) => (
              <div 
                key={i} 
                className={`zone monster-zone ${selectedAttacker?.index === i ? 'selected-attacker' : ''}`}
                onDragOver={handleDragOver}
                onDrop={() => handleDropOnMonsterZone(i, true)}
                onClick={() => card && handleCardClick(card, 'monster', i, true)}
              >
                {card ? (
                  card.faceUp ? (
                    <img 
                      src={card.image_url} 
                      alt={card.name}
                      className={`field-card ${card.position}`}
                    />
                  ) : (
                    <div className="card-back"></div>
                  )
                ) : (
                  <div className="card-placeholder"></div>
                )}
              </div>
            ))}
          </div>

          {/* Current Player Spell/Trap Zones */}
          <div className="spell-trap-zones player-spells">
            {(currentTurn === 'player' ? playerField : aiField).spells.map((card, i) => (
              <div 
                key={i} 
                className="zone spell-trap-zone"
                onDragOver={handleDragOver}
                onDrop={() => handleDropOnSpellZone(i, true)}
              >
                {card ? (
                  card.faceUp ? (
                    <img 
                      src={card.image_url} 
                      alt={card.name}
                      className="field-card"
                    />
                  ) : (
                    <div className="card-back"></div>
                  )
                ) : (
                  <div className="card-placeholder"></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right Side - Player Deck/Extra/GY + Battle Button */}
        <div className="side-zones right-side">
          <div className="zone extra-deck-zone" onClick={handleExtraDeckClick}>
            <div className="card-back"></div>
            <div className="zone-label">Extra</div>
          </div>
          <div className="zone deck-zone">
            <div className="card-back"></div>
            <div className="zone-label">Deck</div>
          </div>
          <div className="zone graveyard-zone" onClick={() => handleGraveyardClick('player')}>
            <div className="card-placeholder">GY</div>
            {playerGraveyard.length > 0 && (
              <div className="gy-count">{playerGraveyard.length}</div>
            )}
          </div>
          <button className="battle-btn" onClick={handleEndTurn}>
            <span className="battle-text">End Turn</span>
          </button>
          <button 
            className={`battle-btn ${battlePhase ? 'battle-active' : ''}`}
            onClick={() => {
              setBattlePhase(!battlePhase)
              setSelectedAttacker(null)
            }}
          >
            <span className="battle-text">{battlePhase ? 'End Battle' : 'Battle'}</span>
          </button>
          {battlePhase && selectedAttacker && (
            <button 
              className="battle-btn direct-attack"
              onClick={handleDirectAttack}
            >
              <span className="battle-text">Direct</span>
            </button>
          )}
        </div>
      </div>

      {/* Current Player Hand - Bottom */}
      <div className="hand player-hand">
        {(currentTurn === 'player' ? playerHand : aiHand).map((card, i) => (
          <div 
            key={i} 
            className="hand-card"
            draggable
            onDragStart={() => handleDragStart(card, i)}
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

      {/* Card Placement Options Modal */}
      {showCardOptions && (
        <div className="card-options-modal">
          <div className="card-options-content">
            <h3>Chọn cách đặt bài</h3>
            <div className="options-buttons">
              <button 
                className="option-btn face-up"
                onClick={() => handleCardPlacement(true)}
              >
                {selectedZone?.type === 'monster' ? '⚔️ Triệu hồi (Ngửa)' : '✨ Kích hoạt (Ngửa)'}
              </button>
              <button 
                className="option-btn face-down"
                onClick={() => handleCardPlacement(false)}
              >
                🎴 Đặt úp (Sấp)
              </button>
              <button 
                className="option-btn cancel"
                onClick={() => {
                  setShowCardOptions(false)
                  setDraggedCard(null)
                  setSelectedZone(null)
                }}
              >
                ❌ Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Graveyard Modal */}
      {showGraveyard && (
        <div className="extra-deck-modal" onClick={closeGraveyard}>
          <div className="extra-deck-content" onClick={(e) => e.stopPropagation()}>
            <div className="extra-deck-header">
              <h2>
                {graveyardOwner === 'player' ? player.name : ai.name} - Graveyard
              </h2>
              <button className="close-btn" onClick={closeGraveyard}>✕</button>
            </div>
            <div className="extra-deck-grid">
              {(graveyardOwner === 'player' ? playerGraveyard : aiGraveyard).map((card, i) => (
                <div 
                  key={i} 
                  className="extra-deck-card"
                  onMouseEnter={() => setHoveredCard(card)}
                  onMouseLeave={() => setHoveredCard(null)}
                >
                  <img src={card.image_url} alt={card.name} />
                  <div className="card-name">{card.name}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Extra Deck Modal */}
      {showExtraDeck && (
        <div className="extra-deck-modal" onClick={closeExtraDeck}>
          <div className="extra-deck-content" onClick={(e) => e.stopPropagation()}>
            <div className="extra-deck-header">
              <h2>
                {player.name} - Extra Deck
              </h2>
              <button className="close-btn" onClick={closeExtraDeck}>✕</button>
            </div>
            <div className="extra-deck-grid">
              {player.deck.extra.map((card, i) => (
                <div 
                  key={i} 
                  className="extra-deck-card"
                  onMouseEnter={() => setHoveredCard(card)}
                  onMouseLeave={() => setHoveredCard(null)}
                >
                  <img src={card.image_url} alt={card.name} />
                  <div className="card-name">{card.name}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

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
