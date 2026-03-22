import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import io from 'socket.io-client'
import { executeEffect } from '../logic/CardEffectProcessor'
import './Duel.css'

const socket = io('http://localhost:5000')

function Duel() {
  const location = useLocation()
  const navigate = useNavigate()
  const { player, ai, opponent, isMultiplayer, roomId, myId } = location.state || {}

  // In multiplayer, 'ai' refers to the other human player
  const duelOpponent = isMultiplayer ? opponent : ai

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
  const [currentPhase, setCurrentPhase] = useState('MAIN1') // 'DRAW', 'STANDBY', 'MAIN1', 'BATTLE', 'MAIN2', 'END'
  const [showGraveyard, setShowGraveyard] = useState(false)
  const [graveyardOwner, setGraveyardOwner] = useState(null)
  const [damageAnimation, setDamageAnimation] = useState({ player: null, ai: null })
  const [gameOver, setGameOver] = useState(false)
  const [winner, setWinner] = useState(null)
  const [progressData, setProgressData] = useState(null)
  const [contextMenu, setContextMenu] = useState(null)
  const [tributeMode, setTributeMode] = useState(false)
  const [selectedTributes, setSelectedTributes] = useState([])
  const [tributeCard, setTributeCard] = useState(null)
  const [selectedHandCard, setSelectedHandCard] = useState(null)
  const [summonMode, setSummonMode] = useState(null) // 'normal', 'tribute', 'set'
  const [selectingZone, setSelectingZone] = useState(false)
  const [activatingSpell, setActivatingSpell] = useState(null)
  const [spellTargetMode, setSpellTargetMode] = useState(false)
  const [spellTargetType, setSpellTargetType] = useState(null) // 'monster', 'spell', 'player'
  const [discardingCards, setDiscardingCards] = useState(false)
  const [selectedDiscards, setSelectedDiscards] = useState([])
  const [handLimit, setHandLimit] = useState(6)
  const [forcedDiscard, setForcedDiscard] = useState(null) // { amount, reason }
  const [fusionMode, setFusionMode] = useState(false)
  const [selectedFusionMaterials, setSelectedFusionMaterials] = useState([])
  const [availableFusions, setAvailableFusions] = useState([])
  const [selectedFusionMonster, setSelectedFusionMonster] = useState(null)
  const [monsterRebornMode, setMonsterRebornMode] = useState(false)
  const [availableRebornMonsters, setAvailableRebornMonsters] = useState([])
  const [dragonSummonMode, setDragonSummonMode] = useState(false)
  const [availableDragons, setAvailableDragons] = useState([])
  const [normalSummonUsed, setNormalSummonUsed] = useState(false)
  const [targetSelection, setTargetSelection] = useState({
    active: false,
    type: null, // 'monster', 'spell', 'any'
    source: null, // 'player', 'ai', 'any'
    onSelect: null,
    onCancel: null,
    message: ''
  })
  const [graveyardSelection, setGraveyardSelection] = useState({
    active: false,
    list: [],
    onSelect: null,
    onCancel: null,
    message: ''
  })
  const [deckSelection, setDeckSelection] = useState({
    active: false,
    list: [],
    onSelect: null,
    onCancel: null,
    message: ''
  })
  
  const [duelTurnCount, setDuelTurnCount] = useState(1)
  
  // Refs for AI to avoid stale closures
  const playerFieldRef = useRef(playerField)
  const aiFieldRef = useRef(aiField)
  const playerHandRef = useRef(playerHand)
  const aiHandRef = useRef(aiHand)
  const playerDeckRef = useRef(playerDeck)
  const aiDeckRef = useRef(aiDeck)
  const playerGraveyardRef = useRef(playerGraveyard)
  const aiGraveyardRef = useRef(aiGraveyard)

  useEffect(() => { playerFieldRef.current = playerField }, [playerField])
  useEffect(() => { aiFieldRef.current = aiField }, [aiField])
  useEffect(() => { playerHandRef.current = playerHand }, [playerHand])
  useEffect(() => { aiHandRef.current = aiHand }, [aiHand])
  useEffect(() => { playerDeckRef.current = playerDeck }, [playerDeck])
  useEffect(() => { aiDeckRef.current = aiDeck }, [aiDeck])
  useEffect(() => { playerGraveyardRef.current = playerGraveyard }, [playerGraveyard])
  useEffect(() => { aiGraveyardRef.current = aiGraveyard }, [aiGraveyard])
  
  // Chain System States
  const [chainStack, setChainStack] = useState([])
  const [chainPrompt, setChainPrompt] = useState({
    active: false,
    player: null, // 'player' or 'ai'
    sourceAction: '', // desc of what is being chained to
    onResolve: null, // what happens when the prompt is answered
    onCancel: null // if they choose not to chain
  })

  const [firstTurnDrawSkipped, setFirstTurnDrawSkipped] = useState(false)
  const [skipNextDraw, setSkipNextDraw] = useState({ player: false, ai: false })
  
  // Phase 4 States

  useEffect(() => {
    if (!player || !ai) {
      navigate('/character-select')
      return
    }
  }, [])

  useEffect(() => {
    if (isMultiplayer && roomId) {
      socket.on('opponent-lp-update', (lp) => {
        setAiLP(lp)
      })

      socket.on('opponent-phase-update', ({ phase, turn }) => {
        setCurrentPhase(phase)
        setCurrentTurn(turn)
      })

      socket.on('opponent-gy-update', (gy) => {
        setAiGraveyard(gy)
      })

      socket.on('opponent-hand-update', (handLength) => {
        // Create dummy cards for opponent hand visibility
        setAiHand(new Array(handLength).fill({ id: 'dummy', isUnknown: true }))
      })

      socket.on('opponent-deck-update', (deckLength) => {
        setAiDeck(new Array(deckLength).fill({ id: 'dummy', isUnknown: true }))
      })

      socket.on('turn-swapped', (newTurnId) => {
        setCurrentTurn(newTurnId === socket.id ? 'player' : 'ai')
      })

      socket.on('opponent-chain-request', (prompt) => {
        // Map 'player' to 'ai' for the receiver
        const mappedPrompt = {
          ...prompt,
          player: 'player' // In the receiver's perspective, they are the 'player' responding
        }
        setChainPrompt(mappedPrompt)
      })

      socket.on('opponent-chain-response', (response) => {
        // Handle the opponent's Yes/No response
        handleOpponentChainResponse(response)
      })
    }

    return () => {
      socket.off('opponent-lp-update')
      socket.off('opponent-phase-update')
      socket.off('opponent-field-update')
      socket.off('opponent-gy-update')
      socket.off('opponent-hand-update')
      socket.off('opponent-deck-update')
      socket.off('turn-swapped')
      socket.off('opponent-chain-request')
      socket.off('opponent-chain-response')
    }
  }, [isMultiplayer, roomId])

  useEffect(() => {
    if (isMultiplayer && roomId && chainPrompt.active && chainPrompt.player === 'ai') {
      // If we are prompting the opponent ('ai' in our perspective)
      socket.emit('chain-request', { roomId, prompt: chainPrompt })
    }
  }, [chainPrompt.active, isMultiplayer, roomId])

  const handleOpponentChainResponse = (response) => {
    setChainPrompt(prev => {
      if (!prev.active) return prev
      
      if (response === 'yes') {
        if (prev.onResolve) prev.onResolve()
      } else {
        if (prev.onCancel) prev.onCancel()
      }
      
      return { ...prev, active: false }
    })
  }

  const handleChainResponse = (response) => {
    if (isMultiplayer && roomId && chainPrompt.player === 'player') {
      socket.emit('chain-response', { roomId, response })
    }
    
    if (response === 'yes') {
      if (chainPrompt.onResolve) chainPrompt.onResolve()
    } else {
      if (chainPrompt.onCancel) chainPrompt.onCancel()
    }

    setChainPrompt(prev => ({ ...prev, active: false }))
  }

  // Initial turn sync from room data
  useEffect(() => {
    if (isMultiplayer && location.state?.roomData) {
      const { currentTurnId } = location.state.roomData
      setCurrentTurn(currentTurnId === socket.id ? 'player' : 'ai')
    }
  }, [isMultiplayer])

  useEffect(() => {
    if (isMultiplayer && roomId) {
      socket.emit('update-lp', { roomId, lp: playerLP })
    }
  }, [playerLP, isMultiplayer, roomId])

  useEffect(() => {
    if (isMultiplayer && roomId) {
      socket.emit('update-phase', { roomId, phase: currentPhase, turn: currentTurn })
    }
  }, [currentPhase, currentTurn, isMultiplayer, roomId])

  useEffect(() => {
    if (isMultiplayer && roomId) {
      socket.emit('update-field', { roomId, field: playerField })
    }
  }, [playerField, isMultiplayer, roomId])

  useEffect(() => {
    if (isMultiplayer && roomId) {
      socket.emit('update-gy', { roomId, gy: playerGraveyard })
    }
  }, [playerGraveyard, isMultiplayer, roomId])

  useEffect(() => {
    if (isMultiplayer && roomId) {
      socket.emit('update-hand', { roomId, hand: playerHand.length })
    }
  }, [playerHand.length, isMultiplayer, roomId])

  useEffect(() => {
    if (isMultiplayer && roomId) {
      socket.emit('update-deck', { roomId, deck: playerDeck.length })
    }
  }, [playerDeck.length, isMultiplayer, roomId])

  useEffect(() => {
    // Check win/lose condition
    if (playerLP <= 0) {
      setGameOver(true)
      setWinner('ai')
    } else if (aiLP <= 0) {
      setGameOver(true)
      setWinner('player')
    }
  }, [playerLP, aiLP])

  useEffect(() => {
    if (gameOver && !isMultiplayer) {
      const updateProgress = async () => {
        try {
          const token = localStorage.getItem('token')
          if (!token) return

          const expGained = winner === 'player' ? 100 : 20
          const goldGained = winner === 'player' ? 50 : 10

          const response = await fetch('http://localhost:5000/api/users/progress', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              expGained,
              goldGained,
              win: winner === 'player'
            })
          })
          
          if (response.ok) {
            const data = await response.json()
            console.log('Progress updated:', data)
            setProgressData({
              ...data,
              expGained,
              goldGained
            })
          }
        } catch (err) {
          console.error('Failed to update progress:', err)
        }
      }
      updateProgress()
    }
  }, [gameOver, winner, isMultiplayer])

  // AI Turn Logic
  useEffect(() => {
    if (!isMultiplayer && currentTurn === 'ai' && !gameOver) {
      const timer = setTimeout(() => {
        handleAiTurn()
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [currentTurn, isMultiplayer, gameOver])

  useEffect(() => {
    if (!isMultiplayer && chainPrompt.active && chainPrompt.player === 'ai') {
      handleAiChainResponse(chainPrompt)
    }
  }, [chainPrompt.active, isMultiplayer])

  const handleAiTurn = async () => {
    const aiLevel = ai?.difficulty || 3
    console.log(`AI is thinking (Level ${aiLevel})...`)
    
    // Level 1: Beginner - 30% chance to do nothing and end turn
    if (aiLevel === 1 && Math.random() < 0.3) {
      console.log("AI Level 1 decided to skip turn actions")
      setTimeout(() => proceedEndTurn(), 1000)
      return
    }

    // 1. Draw Phase (Already handled by proceedEndTurn/useEffect)
    
    // 2. Standby Phase (Automatic for now)
    
    // 3. Main Phase 1: Summoning
    await aiActionSummon(aiLevel)
    
    // 4. Main Phase 1: Activate/Set Spells/Traps
    await aiActionSpells(aiLevel)
    
    // 5. Battle Phase
    await aiActionBattle(aiLevel)
    
    // 6. End Turn
    setTimeout(() => {
      proceedEndTurn()
    }, 1000)
  }

  const aiActionSummon = (aiLevel) => {
    return new Promise((resolve) => {
      try {
        if (normalSummonUsed) {
          setTimeout(resolve, 500)
          return
        }

        // Level 1: Beginner - 50% chance to skip summoning even if possible
        if (aiLevel === 1 && Math.random() < 0.5) {
          setTimeout(resolve, 500)
          return
        }

        const monstersInHand = aiHandRef.current
          .map((c, i) => ({ card: c, index: i }))
          .filter(m => m.card.type.includes('Monster'))
          .sort((a, b) => b.card.atk - a.card.atk)

        const availableMonsters = aiFieldRef.current.monsters.filter(m => m !== null)
        const emptyZoneIndex = aiFieldRef.current.monsters.findIndex(m => m === null)

        const strongestPlayerMonster = playerFieldRef.current.monsters
          .filter(m => m !== null && m.faceUp)
          .sort((a, b) => (b.position === 'attack' ? b.atk : b.def) - (a.position === 'attack' ? a.atk : a.def))[0]

        for (const m of monstersInHand) {
          const level = m.card.level || 0
          let tributesNeeded = 0
          if (level >= 10) tributesNeeded = 3
          else if (level >= 7) tributesNeeded = 2
          else if (level >= 5) tributesNeeded = 1

          if (tributesNeeded === 0 && emptyZoneIndex !== -1) {
            const card = m.card
            let position = 'attack'
            let faceUp = true
            
            if (strongestPlayerMonster && card.atk < (strongestPlayerMonster.position === 'attack' ? strongestPlayerMonster.atk : strongestPlayerMonster.def)) {
              if (card.def > card.atk) {
                position = 'defense'
                faceUp = false
              }
            }

            const newHand = aiHandRef.current.filter((_, i) => i !== m.index)
            setAiHand(newHand)
            aiHandRef.current = newHand

            setAiField(prev => {
              const newMonsters = [...prev.monsters]
              newMonsters[emptyZoneIndex] = { ...card, faceUp, position, justSummoned: true }
              const next = { ...prev, monsters: newMonsters }
              aiFieldRef.current = next
              return next
            })
            setNormalSummonUsed(true)
            console.log(`AI ${faceUp ? 'Normal Summoned' : 'Set'} ${card.name}`)
            break
          } else if (tributesNeeded > 0 && availableMonsters.length >= tributesNeeded) {
            const card = m.card
            
            const tributes = aiFieldRef.current.monsters
              .map((mon, i) => mon ? { ...mon, index: i } : null)
              .filter(mon => mon !== null)
              .sort((a, b) => a.atk - b.atk)
              .slice(0, tributesNeeded)

            setAiField(prev => {
              const newMonsters = [...prev.monsters]
              for (const t of tributes) {
                newMonsters[t.index] = null
              }
              const newEmptyZone = newMonsters.findIndex(mz => mz === null)
              newMonsters[newEmptyZone] = { ...card, faceUp: true, position: 'attack', justSummoned: true }
              const next = { ...prev, monsters: newMonsters }
              aiFieldRef.current = next
              return next
            })

            setAiGraveyard(prev => {
              const next = [...prev, ...tributes]
              return next
            })
            
            const newHand = aiHandRef.current.filter((_, i) => i !== m.index)
            setAiHand(newHand)
            aiHandRef.current = newHand
            setNormalSummonUsed(true)
            console.log(`AI Tribute Summoned ${card.name}`)
            break
          }
        }
      } catch (err) {
        console.error("Error in aiActionSummon:", err)
      } finally {
        setTimeout(resolve, 1000)
      }
    })
  }

  const aiActionSpells = (aiLevel) => {
    return new Promise(async (resolve) => {
      try {
        // 1. Pot of Greed / Graceful Charity
        const potIndex = aiHandRef.current.findIndex(c => c.name === 'Pot of Greed')
        if (potIndex !== -1) {
          const card = aiHandRef.current[potIndex]
          console.log("AI activating Pot of Greed")
          const newHand = aiHandRef.current.filter((_, i) => i !== potIndex)
          setAiHand(newHand)
          aiHandRef.current = newHand
          
          setAiGraveyard(prev => [...prev, card])
          if (aiDeckRef.current.length >= 2) {
            const drawn = aiDeckRef.current.slice(0, 2)
            const handWithDrawn = [...aiHandRef.current, ...drawn]
            setAiHand(handWithDrawn)
            aiHandRef.current = handWithDrawn
            
            const newDeck = aiDeckRef.current.slice(2)
            setAiDeck(newDeck)
            aiDeckRef.current = newDeck
          }
          await new Promise(r => setTimeout(r, 1000))
        }

        // 2. Raigeki / Dark Hole
        const raigekiIndex = aiHandRef.current.findIndex(c => c.name === 'Raigeki')
        const darkHoleIndex = aiHandRef.current.findIndex(c => c.name === 'Dark Hole')
        
        if (raigekiIndex !== -1 && playerFieldRef.current.monsters.some(m => m !== null)) {
          const pMonsters = playerFieldRef.current.monsters.filter(m => m !== null)
          
          // Smart AI (Level 4-5) only uses Raigeki if opponent has > 1 monster or a monster > 2400 ATK
          if (aiLevel >= 4) {
            const hasStrongMonster = pMonsters.some(m => m.atk > 2400)
            if (pMonsters.length < 2 && !hasStrongMonster) {
              console.log("AI Legendary/Hard is saving Raigeki for better timing")
              // Don't return/resolve here, just go to next spell checks
            } else {
              const card = aiHandRef.current[raigekiIndex]
              console.log("AI activating Raigeki")
              const newHand = aiHandRef.current.filter((_, i) => i !== raigekiIndex)
              setAiHand(newHand)
              aiHandRef.current = newHand
              
              setAiGraveyard(prev => [...prev, card])
              executeEffect(card, { 
                isPlayerTurn: false,
                playerField: playerFieldRef.current, setPlayerField,
                aiField: aiFieldRef.current, setAiField,
                playerGraveyard: playerGraveyardRef.current, setPlayerGraveyard,
                aiGraveyard: aiGraveyardRef.current, setAiGraveyard
              })
              await new Promise(r => setTimeout(r, 1000))
            }
          } else {
            // Level 1-3 AI uses it immediately if player has monsters
            const card = aiHandRef.current[raigekiIndex]
            console.log("AI activating Raigeki")
            const newHand = aiHandRef.current.filter((_, i) => i !== raigekiIndex)
            setAiHand(newHand)
            aiHandRef.current = newHand
            setAiGraveyard(prev => [...prev, card])
            executeEffect(card, { 
              isPlayerTurn: false,
              playerField: playerFieldRef.current, setPlayerField,
              aiField: aiFieldRef.current, setAiField,
              playerGraveyard: playerGraveyardRef.current, setPlayerGraveyard,
              aiGraveyard: aiGraveyardRef.current, setAiGraveyard
            })
            await new Promise(r => setTimeout(r, 1000))
          }
        } else if (darkHoleIndex !== -1 && (playerFieldRef.current.monsters.some(m => m !== null) || aiFieldRef.current.monsters.some(m => m !== null))) {
          // AI uses Dark Hole if player has more monsters
          const pCount = playerFieldRef.current.monsters.filter(m => m !== null).length
          const aCount = aiFieldRef.current.monsters.filter(m => m !== null).length
          if (pCount >= aCount) {
            const card = aiHandRef.current[darkHoleIndex]
            console.log("AI activating Dark Hole")
            const newHand = aiHandRef.current.filter((_, i) => i !== darkHoleIndex)
            setAiHand(newHand)
            aiHandRef.current = newHand
            
            setAiGraveyard(prev => [...prev, card])
            // Destroy all monsters
            const pDestroyed = playerFieldRef.current.monsters.filter(m => m !== null)
            const aDestroyed = aiFieldRef.current.monsters.filter(m => m !== null)
            setPlayerGraveyard(prev => [...prev, ...pDestroyed])
            setAiGraveyard(prev => [...prev, ...aDestroyed])
            setPlayerField(prev => {
               const next = { ...prev, monsters: new Array(5).fill(null) }
               playerFieldRef.current = next
               return next
            })
            setAiField(prev => {
               const next = { ...prev, monsters: new Array(5).fill(null) }
               aiFieldRef.current = next
               return next
            })
            await new Promise(r => setTimeout(r, 1000))
          }
        }

        // 3. Change of Heart
        const cohIndex = aiHandRef.current.findIndex(c => c.name === 'Change of Heart')
        const emptyAiZone = aiFieldRef.current.monsters.findIndex(m => m === null)
        const pMonsters = playerFieldRef.current.monsters.map((m, i) => m ? { card: m, index: i } : null).filter(m => m !== null)
        
        if (cohIndex !== -1 && emptyAiZone !== -1 && pMonsters.length > 0) {
          const card = aiHandRef.current[cohIndex]
          const target = pMonsters.sort((a, b) => b.card.atk - a.card.atk)[0]
          console.log(`AI activating Change of Heart on ${target.card.name}`)
          
          const newHand = aiHandRef.current.filter((_, i) => i !== cohIndex)
          setAiHand(newHand)
          aiHandRef.current = newHand
          setAiGraveyard(prev => [...prev, card])
          
          // Take control
          setPlayerField(prev => {
            const newMonsters = [...prev.monsters]
            newMonsters[target.index] = null
            const next = { ...prev, monsters: newMonsters }
            playerFieldRef.current = next
            return next
          })
          setAiField(prev => {
            const newMonsters = [...prev.monsters]
            newMonsters[emptyAiZone] = { ...target.card, returnAtEndTurn: true, originalOwner: 'player' }
            const next = { ...prev, monsters: newMonsters }
            aiFieldRef.current = next
            return next
          })
          await new Promise(r => setTimeout(r, 1000))
        }

        // 4. Monster Reborn
        const rebornIndex = aiHandRef.current.findIndex(c => c.name === 'Monster Reborn')
        const aiEmptyZone = aiFieldRef.current.monsters.findIndex(m => m === null)

        if (rebornIndex !== -1 && aiEmptyZone !== -1) {
          const allGYMonsters = [
            ...aiGraveyardRef.current.map(c => ({ card: c, owner: 'ai' })),
            ...playerGraveyardRef.current.map(c => ({ card: c, owner: 'player' }))
          ].filter(item => item.card.type.includes('Monster'))

          if (allGYMonsters.length > 0) {
            const card = aiHandRef.current[rebornIndex]
            const bestTarget = allGYMonsters.sort((a, b) => b.card.atk - a.card.atk)[0]
            console.log(`AI activating Monster Reborn on ${bestTarget.card.name} from ${bestTarget.owner}'s GY`)
            
            const newHand = aiHandRef.current.filter((_, i) => i !== rebornIndex)
            setAiHand(newHand)
            aiHandRef.current = newHand
            
            // Remove from correct GY
            if (bestTarget.owner === 'ai') {
              setAiGraveyard(prev => {
                const newGY = [...prev]
                newGY.push(card)
                const idx = newGY.findIndex(c => c === bestTarget.card)
                if (idx !== -1) newGY.splice(idx, 1)
                return newGY
              })
            } else {
              setAiGraveyard(prev => [...prev, card])
              setPlayerGraveyard(prev => {
                const newGY = [...prev]
                const idx = newGY.findIndex(c => c === bestTarget.card)
                if (idx !== -1) newGY.splice(idx, 1)
                return newGY
              })
            }
            
            setAiField(prev => {
              const newMonsters = [...prev.monsters]
              newMonsters[aiEmptyZone] = { ...bestTarget.card, faceUp: true, position: 'attack', justSummoned: false }
              const next = { ...prev, monsters: newMonsters }
              aiFieldRef.current = next
              return next
            })
            await new Promise(r => setTimeout(r, 1000))
          }
        }

        // 4.5 Megamorph (Kaiba Special)
        const megaIndex = aiHandRef.current.findIndex(c => c.name === 'Megamorph')
        if (megaIndex !== -1) {
          const myLP = aiLP
          const oppLP = playerLP
          const aiMonsters = aiFieldRef.current.monsters.filter(m => m !== null)
          const pMonsters = playerFieldRef.current.monsters.filter(m => m !== null)

          if ((myLP < oppLP && aiMonsters.length > 0) || (myLP > oppLP && pMonsters.length > 0)) {
            const card = aiHandRef.current[megaIndex]
            setAiHand(prev => prev.filter((_, i) => i !== megaIndex))
            aiHandRef.current = aiHandRef.current.filter((_, i) => i !== megaIndex)
            setAiGraveyard(prev => [...prev, card])
            handleMegamorph(false) // Trigger AI logic for Megamorph
            await new Promise(r => setTimeout(r, 1000))
          }
        }

        // 5. Set remaining Traps
        const trapIndex = aiHandRef.current.findIndex(c => c.type.includes('Trap'))
        const emptySpellZone = aiFieldRef.current.spells.findIndex(s => s === null)
        if (trapIndex !== -1 && emptySpellZone !== -1) {
          const card = aiHandRef.current[trapIndex]
          const newHand = aiHandRef.current.filter((_, i) => i !== trapIndex)
          setAiHand(newHand)
          aiHandRef.current = newHand
          
          setAiField(prev => {
            const newSpells = [...prev.spells]
            newSpells[emptySpellZone] = { ...card, faceUp: false, canActivate: false }
            const next = { ...prev, spells: newSpells }
            aiFieldRef.current = next
            return next
          })
          await new Promise(r => setTimeout(r, 1000))
        }

        // 6. Time Wizard Effect
        const timeWizardIndex = aiFieldRef.current.monsters.findIndex(m => m && m.name.toLowerCase().includes('time wizard') && m.faceUp)
        const pMonstersCount = playerFieldRef.current.monsters.filter(m => m !== null).length
        
        if (timeWizardIndex !== -1 && pMonstersCount > 0) {
          console.log("AI deciding to use Time Wizard effect...")
          // AI uses it if player has monsters. Since Joey is a gambler, he always uses it!
          handleTimeWizard(timeWizardIndex)
          await new Promise(r => setTimeout(r, 3000))
        }
      } catch (err) {
        console.error("Error in aiActionSpells:", err)
      } finally {
        setTimeout(resolve, 500)
      }
    })
  }

  const aiActionBattle = (aiLevel) => {
    return new Promise(async (resolve) => {
      try {
        // Level 1: 50% chance to skip battle
        if (aiLevel === 1 && Math.random() < 0.5) {
          resolve()
          return
        }

        // Check Swords of Revealing Light
        if (swordsActive.active && swordsActive.owner === 'player') {
          console.log("AI cannot attack due to Swords of Revealing Light")
          setTimeout(resolve, 1000)
          return
        }

        setCurrentPhase('BATTLE')
        
        const aiMonsters = aiFieldRef.current.monsters
          .map((m, i) => m ? { card: m, index: i } : null)
          .filter(m => m !== null && m.card.position === 'attack')
        
        console.log(`AI Battle Phase: Found ${aiMonsters.length} monsters in attack position. Turn: ${duelTurnCount}`)

        if (aiMonsters.length === 0 || duelTurnCount === 1) {
          if (duelTurnCount === 1) console.log("AI cannot attack on Turn 1")
          else console.log("AI has no monsters in attack position to attack with")
          setTimeout(resolve, 1000)
          return
        }

        // Sort AI attackers by ATK to maximize damage
        const attackers = [...aiMonsters].sort((a, b) => b.card.atk - a.card.atk)

        for (const attacker of attackers) {
          // Re-check field (in case something happened during previous attack)
          if (!aiFieldRef.current.monsters[attacker.index]) continue

          const playerMonsters = playerFieldRef.current.monsters
            .map((m, i) => m ? { card: m, index: i } : null)
            .filter(m => m !== null)

          console.log(`AI evaluating attack for ${attacker.card.name}`)
          
          // Lethal check: If direct attack wins, do it
          if (playerMonsters.length === 0) {
            handleDirectAttack(attacker)
            await new Promise(r => setTimeout(r, 2000))
            continue
          }

          // Target selection
          // 1. Can we destroy a monster and deal damage?
          const beatableMonsters = playerMonsters.filter(p => {
            if (p.card.faceUp) {
              if (p.card.position === 'attack') return attacker.card.atk > p.card.atk
              return attacker.card.atk > p.card.def
            }
            return true // Risks of face-down, but AI plays aggressive in Hard Mode
          }).sort((a, b) => {
            // Prioritize attack position monsters to deal damage
            if (a.card.position === 'attack' && b.card.position !== 'attack') return -1
            if (a.card.position !== 'attack' && b.card.position === 'attack') return 1
            return b.card.atk - a.card.atk 
          })

          if (beatableMonsters.length > 0) {
            handleBattle(attacker, beatableMonsters[0])
            await new Promise(r => setTimeout(r, 2500))
          }
        }
        
        setTimeout(() => {
          setCurrentPhase('MAIN2')
          resolve()
        }, 2000)
      } catch (err) {
        console.error("Error in aiActionBattle:", err)
        resolve() // Resolve in catch as well to ensure fallback
      }
    })
  }

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
    if (isMultiplayer && roomId) {
      socket.emit('next-turn', { roomId })
      return
    }

    const currentHand = currentTurn === 'player' ? playerHand : aiHand
    
    // Check hand limit before ending turn
    if (currentHand.length > handLimit) {
      setDiscardingCards(true)
      setSelectedDiscards([])
      return
    }
    
    proceedEndTurn()
  }

  const proceedEndTurn = () => {
    const nextTurn = currentTurn === 'player' ? 'ai' : 'player'
    
    // 1. Enable trap cards and Return controlled monsters
    if (currentTurn === 'player') {
      // Player Ending turn: Update player field (traps) and return player-controlled AI monsters
      setPlayerField(prev => {
        const updatedSpells = prev.spells.map(card => {
          if (card && !card.faceUp && card.type.includes('Trap')) {
            return { ...card, canActivate: true }
          }
          return card
        })
        
        // Find monsters to return to AI
        const monstersToReturn = prev.monsters.filter(m => m && m.returnAtEndTurn)
        if (monstersToReturn.length > 0) {
          setAiField(aiPrev => {
            const nextAiMonsters = [...aiPrev.monsters]
            monstersToReturn.forEach(m => {
              const emptyZone = nextAiMonsters.findIndex(mz => mz === null)
              if (emptyZone !== -1) {
                nextAiMonsters[emptyZone] = { ...m, returnAtEndTurn: false, originalOwner: null }
              } else {
                setAiGraveyard(gy => [...gy, { ...m, returnAtEndTurn: false, originalOwner: null }])
              }
            })
            return { ...aiPrev, monsters: nextAiMonsters }
          })
          
          const newPlayerMonsters = prev.monsters.map(m => (m && m.returnAtEndTurn) ? null : m)
          return { ...prev, spells: updatedSpells, monsters: newPlayerMonsters }
        }
        
        return { ...prev, spells: updatedSpells }
      })
    } else {
      // AI Ending turn: Update AI field (traps) and return AI-controlled player monsters
      setAiField(prev => {
        const updatedSpells = prev.spells.map(card => {
          if (card && !card.faceUp && card.type.includes('Trap')) {
            return { ...card, canActivate: true }
          }
          return card
        })
        
        const monstersToReturn = prev.monsters.filter(m => m && m.returnAtEndTurn)
        if (monstersToReturn.length > 0) {
          setPlayerField(pPrev => {
            const nextPMonsters = [...pPrev.monsters]
            monstersToReturn.forEach(m => {
              const emptyZone = nextPMonsters.findIndex(mz => mz === null)
              if (emptyZone !== -1) {
                nextPMonsters[emptyZone] = { ...m, returnAtEndTurn: false, originalOwner: null }
              } else {
                setPlayerGraveyard(gy => [...gy, { ...m, returnAtEndTurn: false, originalOwner: null }])
              }
            })
            return { ...pPrev, monsters: nextPMonsters }
          })
          
          const newAiMonsters = prev.monsters.map(m => (m && m.returnAtEndTurn) ? null : m)
          return { ...prev, spells: updatedSpells, monsters: newAiMonsters }
        }
        
        return { ...prev, spells: updatedSpells }
      })
    }
    // 2. Clear summoning flags
    setNormalSummonUsed(false)
    
    // 3. Update turn and reset phase to DRAW
    setCurrentTurn(nextTurn)
    setCurrentPhase('DRAW')
    setDuelTurnCount(prev => prev + 1)
  }

  // New Draw Card Function
  const drawCard = (targetPlayer) => {
    const isPlayer = targetPlayer === 'player'
    const deck = isPlayer ? playerDeck : aiDeck
    const setDeck = isPlayer ? setPlayerDeck : setAiDeck
    const setHand = isPlayer ? setPlayerHand : setAiHand

    if (deck.length === 0) {
      setGameOver(true)
      setWinner(isPlayer ? 'ai' : 'player')
      alert(`${isPlayer ? player.name : ai.name} đã hết bài! Deck Out!`)
      return false
    }

    const newCard = deck[0]
    setDeck(prev => prev.slice(1))
    setHand(prev => [...prev, newCard])
    return true
  }

  // Handle Phase Transitions automatically
  useEffect(() => {
    if (gameOver) return

    if (currentPhase === 'DRAW') {
      console.log(`Phase: DRAW - Turn: ${currentTurn}`)
      
      // Rules: First player doesn't draw on turn 1
      if (duelTurnCount === 1 && !firstTurnDrawSkipped) {
        console.log("Turn 1: Skipping draw for starting player")
        setFirstTurnDrawSkipped(true)
        setTimeout(() => setCurrentPhase('STANDBY'), 1000)
        return
      }

      const isSkipped = currentTurn === 'player' ? skipNextDraw.player : skipNextDraw.ai
      if (isSkipped) {
        alert(`${currentTurn === 'player' ? 'Bạn' : 'Đối thủ'} bỏ qua Draw Phase!`)
        setSkipNextDraw(prev => ({ ...prev, [currentTurn]: false }))
        setTimeout(() => setCurrentPhase('STANDBY'), 1000)
      } else {
        // Draw card
        setTimeout(() => {
          drawCard(currentTurn)
          setTimeout(() => setCurrentPhase('STANDBY'), 1000)
        }, 500)
      }
    } else if (currentPhase === 'STANDBY') {
      console.log(`Phase: STANDBY - Turn: ${currentTurn}`)
      // Handle standby effects here (e.g. Swords of Revealing Light counter)
      setTimeout(() => setCurrentPhase('MAIN1'), 1000)
    }
  }, [currentPhase, currentTurn, gameOver, duelTurnCount, firstTurnDrawSkipped, skipNextDraw])

  const handleSwordsCounter = (nextTurn) => {
    if (swordsActive.active && nextTurn === swordsActive.owner) {
      setSwordsActive(prev => {
        const newTurns = prev.turnsLeft - 1
        if (newTurns <= 0) {
          const field = prev.owner === 'player' ? playerField : aiField
          const setField = prev.owner === 'player' ? setPlayerField : setAiField
          const gy = prev.owner === 'player' ? playerGraveyard : aiGraveyard
          const setGy = prev.owner === 'player' ? setPlayerGraveyard : setAiGraveyard
          
          const newSpells = [...field.spells]
          const card = newSpells[prev.zoneIndex]
          newSpells[prev.zoneIndex] = null
          setField({ ...field, spells: newSpells })
          setGy([...gy, card])
          
          alert(`${card.name} hết hiệu lực và đã bị gửi vào Nghĩa địa.`)
          return { active: false, owner: null, turnsLeft: 0, zoneIndex: null }
        }
        return { ...prev, turnsLeft: newTurns }
      })
    }
  }

  const handleDiscardSelect = (index) => {
    if (selectedDiscards.includes(index)) {
      setSelectedDiscards(selectedDiscards.filter(i => i !== index))
    } else {
      setSelectedDiscards([...selectedDiscards, index])
    }
  }

  const handleConfirmDiscard = () => {
    const currentHand = currentTurn === 'player' ? playerHand : aiHand
    const setCurrentHand = currentTurn === 'player' ? setPlayerHand : setAiHand
    const graveyard = currentTurn === 'player' ? playerGraveyard : aiGraveyard
    const setGraveyard = currentTurn === 'player' ? setPlayerGraveyard : setAiGraveyard
    
    let cardsToDiscard
    if (forcedDiscard) {
      cardsToDiscard = forcedDiscard.amount
    } else {
      cardsToDiscard = currentHand.length - handLimit
    }
    
    if (selectedDiscards.length !== cardsToDiscard) {
      alert(`Bạn phải loại bỏ ${cardsToDiscard} lá bài!`)
      return
    }
    
    // Use functional update to ensure we use latest hand state
    setCurrentHand(prevHand => {
      const discardedCards = selectedDiscards.map(i => prevHand[i])
      setGraveyard(prevGY => [...prevGY, ...discardedCards])
      
      // Remove from hand
      return prevHand.filter((_, i) => !selectedDiscards.includes(i))
    })
    
    // Reset states
    setDiscardingCards(false)
    setSelectedDiscards([])
    
    if (forcedDiscard) {
      setForcedDiscard(null)
      alert(`Đã loại bỏ ${cardsToDiscard} lá bài theo hiệu ứng spell!`)
    } else {
      proceedEndTurn()
    }
  }

  const handleExtraDeckClick = () => {
    setShowExtraDeck(true)
  }

  const closeExtraDeck = () => {
    setShowExtraDeck(false)
  }

  const handleHandCardClick = (card, index) => {
    if (currentTurn !== 'player') return

    // Close context menu
    setContextMenu(null)

    // If already selected, show summon options
    if (selectedHandCard?.index === index) {
      setSelectedHandCard(null)
      return
    }

    // Select card and show summon options
    setSelectedHandCard({ card, index })
  }

  const handleSummonOption = (option) => {
    if (!selectedHandCard) return

    const card = selectedHandCard.card
    const level = card.level || 0

    // Calculate tributes needed
    let tributesNeeded = 0
    if (level >= 10) {
      tributesNeeded = 3
    } else if (level >= 7) {
      tributesNeeded = 2
    } else if (level >= 5) {
      tributesNeeded = 1
    }

    if (option === 'normal') {
      // Normal Summon Attack Position (no tribute) - only for level 1-4
      if (level >= 5) {
        alert('Monster level 5+ cần tribute summon!')
        return
      }
      
      // Check if normal summon already used
      if (normalSummonUsed) {
        alert('Bạn đã Normal Summon trong turn này!')
        return
      }
      
      setSummonMode('normal')
      setSelectingZone(true)
    } else if (option === 'defense') {
      // Normal Summon Defense Position (face-up) - only for level 1-4
      if (level >= 5) {
        alert('Monster level 5+ cần tribute summon!')
        return
      }
      
      // Check if normal summon already used
      if (normalSummonUsed) {
        alert('Bạn đã Normal Summon trong turn này!')
        return
      }
      
      setSummonMode('defense')
      setSelectingZone(true)
    } else if (option === 'tribute') {
      // Tribute Summon - only face-up for level 5+
      if (tributesNeeded === 0) {
        alert('Monster này không cần tribute!')
        return
      }
      
      // Check if normal summon already used
      if (normalSummonUsed) {
        alert('Bạn đã Normal Summon trong turn này!')
        return
      }

      const field = currentTurn === 'player' ? playerField : aiField
      const availableMonsters = field.monsters.filter(m => m !== null)

      if (availableMonsters.length < tributesNeeded) {
        alert(`Cần ${tributesNeeded} monster để tribute summon! (Hiện có ${availableMonsters.length})`)
        return
      }

      // Enter tribute selection mode (always face-up for tribute summon)
      setTributeMode(true)
      setTributeCard({ card, tributesNeeded, faceUp: true, availableMonsters })
      setSelectedTributes([])
    } else if (option === 'set') {
      // Set (face-down defense) - only for level 1-4 monsters or spell/trap
      if (card.type.includes('Monster') && level >= 5) {
        alert('Monster level 5+ không thể úp! Chỉ có thể Tribute Summon.')
        return
      }
      
      // Check if normal summon already used (set also counts as normal summon for MONSTERS)
      if (card.type.includes('Monster') && normalSummonUsed) {
        alert('Bạn đã Normal Summon trong turn này!')
        return
      }
      
      setSummonMode('set')
      setSelectingZone(true)
    }
  }

  const handleZoneSelect = (zoneIndex, type) => {
    if (!selectingZone || !selectedHandCard) return

    const field = currentTurn === 'player' ? playerField : aiField
    const setField = currentTurn === 'player' ? setPlayerField : setAiField
    const hand = currentTurn === 'player' ? playerHand : aiHand
    const setHand = currentTurn === 'player' ? setPlayerHand : setAiHand

    // Check if zone is empty
    if (type === 'monster' && field.monsters[zoneIndex]) {
      alert('Zone này đã có bài!')
      return
    }
    if (type === 'spell' && field.spells[zoneIndex]) {
      alert('Zone này đã có bài!')
      return
    }

    const card = selectedHandCard.card

    // Place card
    if (type === 'monster') {
      const newMonsters = [...field.monsters]
      
      if (summonMode === 'normal') {
        // Attack position, face-up
        newMonsters[zoneIndex] = {
          ...card,
          faceUp: true,
          position: 'attack',
          originalAtk: card.atk,
          originalDef: card.def
        }
        // Mark normal summon as used
        setNormalSummonUsed(true)
      } else if (summonMode === 'defense') {
        // Defense position, face-up
        newMonsters[zoneIndex] = {
          ...card,
          faceUp: true,
          position: 'defense',
          originalAtk: card.atk,
          originalDef: card.def
        }
        // Mark normal summon as used
        setNormalSummonUsed(true)
      } else if (summonMode === 'set') {
        // Face-down defense
        newMonsters[zoneIndex] = {
          ...card,
          faceUp: false,
          position: 'defense',
          originalAtk: card.atk,
          originalDef: card.def
        }
        // Mark normal summon as used (set counts as normal summon)
        setNormalSummonUsed(true)
      }
      
      setField({ ...field, monsters: newMonsters })
    } else {
      const newSpells = [...field.spells]
      
      // If activating spell, process effect immediately
      if (summonMode === 'activate') {
        handleSpellActivation(card, zoneIndex)
        return
      }
      
      // If setting spell/trap
      newSpells[zoneIndex] = {
        ...card,
        faceUp: false,
        canActivate: false // Can't activate until next turn
      }
      setField({ ...field, spells: newSpells })
    }

    // Remove from hand
    const newHand = hand.filter((_, i) => i !== selectedHandCard.index)
    setHand(newHand)

    // Reset states
    setSelectedHandCard(null)
    setSummonMode(null)
    setSelectingZone(false)
  }

  const handleSpellActivation = (card, zoneIndex) => {
    const isPlayerTurn = currentTurn === 'player'
    const field = isPlayerTurn ? playerField : aiField
    const setField = isPlayerTurn ? setPlayerField : setAiField
    const hand = isPlayerTurn ? playerHand : aiHand
    const setHand = isPlayerTurn ? setPlayerHand : setAiHand
    const graveyard = isPlayerTurn ? playerGraveyard : aiGraveyard
    const setGraveyard = isPlayerTurn ? setPlayerGraveyard : setAiGraveyard

    // Check spell type and handle accordingly
    const spellType = card.race || '' // race field contains spell type
    const cardName = card.name.toLowerCase()
    
    // Check if it's a continuous/field/equip spell that should stay on field
    const shouldStayOnField = spellType.includes('Continuous') || 
                             spellType.includes('Field') || 
                             spellType.includes('Equip') ||
                             card.type.includes('Continuous') ||
                             cardName.includes('swords of revealing light') ||
                             cardName.includes('megamorph') ||
                             cardName.includes('book of secret arts') ||
                             cardName.includes('horn of the unicorn') ||
                             cardName.includes('shadow spell') ||
                             cardName.includes('spellbinding circle') ||
                             cardName.includes('premature burial')

    if (shouldStayOnField) {
      // Continuous/Field/Equip spells stay on field
      const newSpells = [...field.spells]
      newSpells[zoneIndex] = {
        ...card,
        faceUp: true,
        isActive: true
      }
      setField({ ...field, spells: newSpells })
      
      // Remove from hand
      setHand(prevHand => prevHand.filter((_, i) => i !== selectedHandCard.index))
      
      // Show activation
      setActivatingSpell(card)
      setTimeout(() => setActivatingSpell(null), 3000)
      
      const opponentField = isPlayerTurn ? aiField : playerField
      const hasFaceDownSpells = opponentField.spells.some(s => s && !s.faceUp)

      if (hasFaceDownSpells) {
        setChainPrompt({
          active: true,
          player: isPlayerTurn ? 'ai' : 'player',
          sourceAction: `${card.name} được kích hoạt!`,
          onResolve: () => applySpellEffect(card, isPlayerTurn, zoneIndex),
          onCancel: () => applySpellEffect(card, isPlayerTurn, zoneIndex),
          context: { type: 'spell_activation', card, isPlayerTurn }
        })
        if (isPlayerTurn) {
          setTimeout(() => {
            setChainPrompt(prev => ({ ...prev, active: false }))
            applySpellEffect(card, isPlayerTurn, zoneIndex)
          }, 1000)
        }
      } else {
        // Apply effect based on card
        applySpellEffect(card, isPlayerTurn, zoneIndex)
      }
    } else {
      // Remove from hand FIRST
      setHand(prevHand => prevHand.filter((_, i) => i !== selectedHandCard.index))
      
      // Send to GY immediately
      setGraveyard(prev => [...prev, card])
      
      // Show activation
      setActivatingSpell(card)
      setTimeout(() => {
        setActivatingSpell(null)
      }, 3000)
      
      const opponentField = isPlayerTurn ? aiField : playerField
      const hasFaceDownSpells = opponentField.spells.some(s => s && !s.faceUp)

      if (hasFaceDownSpells) {
        setChainPrompt({
          active: true,
          player: isPlayerTurn ? 'ai' : 'player',
          sourceAction: `${card.name} được kích hoạt!`,
          onResolve: () => applySpellEffect(card, isPlayerTurn, zoneIndex),
          onCancel: () => applySpellEffect(card, isPlayerTurn, zoneIndex),
          context: { type: 'spell_activation', card, isPlayerTurn }
        })
        if (isPlayerTurn) {
          setTimeout(() => {
            setChainPrompt(prev => ({ ...prev, active: false }))
            applySpellEffect(card, isPlayerTurn, zoneIndex)
          }, 1000)
        }
      } else {
        // Apply effect based on card
        applySpellEffect(card, isPlayerTurn, zoneIndex)
      }
    }

    // Reset states
    setSelectedHandCard(null)
    setSummonMode(null)
    setSelectingZone(false)
  }

  const applySpellEffect = (card, isPlayerTurn, zoneIndex = null) => {
    const cardName = card.name.toLowerCase()
    const effectText = card.desc.toLowerCase()
    
    // Parse and apply effects based on card description
    if (cardName.includes('pot of greed')) {
      // Draw 2 cards
      handleDrawEffect(2, isPlayerTurn)
    } else if (cardName.includes('graceful charity')) {
      // Draw 3, then discard 2
      handleDrawThenDiscard(3, 2, isPlayerTurn)
    } else if (cardName.includes('dark hole')) {
      // Destroy all monsters on the field
      handleDestroyAllMonsters()
    } else if (cardName.includes('raigeki')) {
      // Destroy all opponent's monsters
      handleDestroyOpponentMonsters(isPlayerTurn)
    } else if (cardName.includes('fissure')) {
      // Destroy 1 face-up monster with lowest ATK
      handleFissure(isPlayerTurn)
    } else if (cardName.includes('heavy storm')) {
      // Destroy all Spell/Trap cards on field
      handleHeavyStorm()
    } else if (cardName.includes('monster reborn')) {
      // Special Summon 1 monster from either GY
      handleMonsterReborn(isPlayerTurn)
    } else if (cardName.includes('polymerization')) {
      // Fusion Summon
      handlePolymerization(isPlayerTurn)
    } else if (cardName.includes('de-spell')) {
      // Destroy 1 Spell card on the field
      handleDeSpell(isPlayerTurn)
    } else if (cardName.includes('flute of summoning dragon')) {
      // Special Summon 1 Dragon from hand
      handleFluteOfSummoningDragon(isPlayerTurn)
    } else if (cardName.includes('megamorph')) {
      // Equip: Double ATK if LP < opponent, halve if LP > opponent
      handleMegamorph(isPlayerTurn)
    } else if (cardName.includes('dark magic curtain')) {
      // Pay half LP, Special Summon Dark Magician
      handleDarkMagicCurtain(isPlayerTurn)
    } else if (cardName.includes('dedication through light and darkness')) {
      // Tribute Dark Magician, Special Summon Dark Magician of Chaos
      handleDedicationThroughLightAndDarkness(isPlayerTurn)
    } else if (cardName.includes('book of secret arts')) {
      // Equip: Spellcaster gains 300 ATK/DEF
      handleBookOfSecretArts(isPlayerTurn)
    } else if (cardName.includes('brain control')) {
      // Take control of opponent monster for 1 turn
      handleBrainControl(isPlayerTurn)
    } else if (cardName.includes('premature burial')) {
      // Pay 800 LP, Special Summon from GY and equip
      handlePrematureBurial(isPlayerTurn, zoneIndex)
    } else if (cardName.includes('horn of the unicorn')) {
      // Equip: Monster gains 700 ATK/DEF
      handleHornOfTheUnicorn(isPlayerTurn)
    } else if (cardName.includes('mystic box')) {

      // Destroy 1 monster, give control of another
      handleMysticBox(isPlayerTurn)
    } else if (cardName.includes('swords of revealing light')) {
      // Opponent cannot attack for 3 turns
      handleSwordsOfRevealingLight(isPlayerTurn)
    } else if (cardName.includes('the eye of timaeus')) {
      // Fusion Summon Dark Magician fusion
      handleEyeOfTimaeus(isPlayerTurn)
    } else if (cardName.includes('multiply')) {
      // Special Summon Kuriboh tokens
      handleMultiply(isPlayerTurn)
    } else if (cardName.includes('crush card virus')) {
      // Destroy all monsters with 1500+ ATK in opponent's hand/deck/field
      handleCrushCardVirus(isPlayerTurn)
    } else if (cardName.includes('gift of the mystical elf')) {
      // Gain LP equal to number of monsters x 300
      handleGiftOfMysticalElf(isPlayerTurn)
    } else if (cardName.includes('shadow spell')) {
      // Equip: Target monster loses 700 ATK
      handleShadowSpell(isPlayerTurn)
    } else if (cardName.includes('negate attack')) {
      // Negate opponent's attack and end Battle Phase
      handleNegateAttack(isPlayerTurn)
    } else if (cardName.includes('lightforce sword')) {
      // Banish 1 random card from opponent's hand
      handleLightforceSword(isPlayerTurn)
    } else if (cardName.includes('magic cylinder')) {
      // Negate attack, inflict damage equal to ATK
      handleMagicCylinder(isPlayerTurn)
    } else if (cardName.includes('magical hats')) {
      // Set 2 tokens to protect monsters
      handleMagicalHats(isPlayerTurn)
    } else if (cardName.includes('mirror force')) {
      // Destroy all opponent's Attack Position monsters
      handleMirrorForce(isPlayerTurn)
    } else if (cardName.includes('seven tools of the bandit')) {
      // Negate Trap card activation
      handleSevenToolsOfTheBandit(isPlayerTurn)
    } else if (cardName.includes('spellbinding circle')) {
      // Equip: Monster loses 700 ATK, cannot attack
      handleSpellbindingCircle(isPlayerTurn)
    } else if (cardName.includes('time seal')) {
      // Skip opponent's next Draw Phase
      handleTimeSeal(isPlayerTurn)
    } else if (cardName.includes('chain destruction')) {
      // Destroy all copies of destroyed monster
      handleChainDestruction(isPlayerTurn)
    } else if (cardName.includes('mystical space typhoon') || cardName.includes('mst')) {
      // Destroy 1 Spell/Trap card
      handleDestroySpellTrap(isPlayerTurn)
    } else if (cardName.includes('change of heart')) {
      // Take control of 1 opponent monster for 1 turn
      handleChangeOfHeart(isPlayerTurn)
    } else {
      // Try to parse generic effects from description
      parseGenericEffect(card, isPlayerTurn)
    }
  }

  const activateSetCard = (card, zoneIndex, owner) => {
    // Only allow traps and quick-play spells
    if (!card.type.includes('Trap') && !card.desc.includes('Quick-Play')) {
      alert('Chỉ có thể kích hoạt Bài Bẫy hoặc Phép Nhanh để phản hồi!')
      return
    }

    if (chainPrompt.context?.type === 'attack' || chainPrompt.context?.type === 'direct_attack' || chainPrompt.context?.type === 'spell_activation') {
      const { attacker, defender } = chainPrompt.context || {}
      
      setChainPrompt(prev => ({ ...prev, active: false }))
      
      // Flip the card up
      const playingField = owner === 'player' ? playerField : aiField
      const setPlayingField = owner === 'player' ? setPlayerField : setAiField
      
      const newSpells = [...playingField.spells]
      newSpells[zoneIndex] = { ...card, faceUp: true }
      setPlayingField({ ...playingField, spells: newSpells })

      // Show activation
      setActivatingSpell(card)
      
      setTimeout(() => {
        setActivatingSpell(null)
        
        const isContinuous = card.race?.includes('Continuous') || card.type?.includes('Continuous') || 
                            card.race?.includes('Field') || card.race?.includes('Equip')
        
        if (!isContinuous) {
          // Send to GY after activation for normal cards
          const gy = owner === 'player' ? playerGraveyard : aiGraveyard
          const setGy = owner === 'player' ? setPlayerGraveyard : setAiGraveyard
          
          const finalSpells = [...playingField.spells]
          finalSpells[zoneIndex] = null
          setPlayingField({ ...playingField, spells: finalSpells })
          setGy([...gy, card])
        } else {
          // Keep on field and mark as active
          const finalSpells = [...playingField.spells]
          finalSpells[zoneIndex] = { ...card, faceUp: true, isActive: true }
          setPlayingField({ ...playingField, spells: finalSpells })
        }
        
        // Apply effect
        
        // Apply effect - if it's an attack, pass attacker/defender; else pass null
        applyTrapEffect(card, attacker || null, defender || null, owner === 'player', chainPrompt.context.type, () => {
          if (chainPrompt.onResolve) chainPrompt.onResolve()
        })
      }, 2000)
    }
  }

  const applyTrapEffect = (card, attacker, defender, isPlayerTrap, attackType, proceedAttackCallback) => {
    const cardName = card.name.toLowerCase()
    
    if (cardName.includes('mirror force')) {
      if (attackType === 'attack' || attackType === 'direct_attack') {
        executeMirrorForce(isPlayerTrap)
        return // Attack negated/destroyed
      } else {
        alert('Mirror Force chỉ có thể kích hoạt khi bị tấn công!')
        return proceedAttackCallback()
      }
    } else if (cardName.includes('magic cylinder')) {
      if (attackType === 'attack' || attackType === 'direct_attack') {
        executeMagicCylinder(attacker.card, isPlayerTrap)
        return // Attack negated
      } else {
        alert('Magic Cylinder chỉ có thể kích hoạt khi bị tấn công!')
        return proceedAttackCallback()
      }
    } else if (cardName.includes('negate attack')) {
      if (attackType === 'attack' || attackType === 'direct_attack') {
        alert('Negate Attack: Đòn tấn công bị vô hiệu hóa! Kết thúc Battle Phase.')
        setBattlePhase(false)
        setSelectedAttacker(null)
        return
      } else {
        alert('Negate Attack chỉ có thể kích hoạt khi bị tấn công!')
        return proceedAttackCallback()
      }
    } else if (cardName.includes('seven tools of the bandit')) {
      if (attackType === 'spell_activation') {
        alert('Seven Tools of the Bandit: Vô hiệu hóa bài Bẫy của đối thủ!')
        // Ideally we would set a flag to cancel the previous chain link
        // For simplicity, we just alert
        return // Assume we cancel it out? No, proceedAttackCallback continues chain resolution.
        // Wait, if it negated, we shouldn't continue. But we don't have full cancellation hook easily. Let's just alert.
      }
    }
    
    // Fallback if not specifically handled attack-response trap
    alert(`Kích hoạt ${card.name}!`)
    proceedAttackCallback()
  }

  const executeMirrorForce = (isPlayerTrap) => {
    // If it's the player's trap, it destroys AI's attack position monsters.
    const opponentField = isPlayerTrap ? aiField : playerField
    const setOpponentField = isPlayerTrap ? setAiField : setPlayerField
    const opponentGY = isPlayerTrap ? aiGraveyard : playerGraveyard
    const setOpponentGY = isPlayerTrap ? setAiGraveyard : setPlayerGraveyard
    
    const attackMonsters = opponentField.monsters.filter(m => m !== null && m.position === 'attack')
    
    if (attackMonsters.length === 0) {
      alert('Đối thủ không có monster ở Attack Position, Mirror Force không phá hủy được gì!')
      return
    }
    
    const newMonsters = opponentField.monsters.map(m => m && m.position === 'attack' ? null : m)
    setOpponentField({ ...opponentField, monsters: newMonsters })
    setOpponentGY([...opponentGY, ...attackMonsters])
    
    alert(`Mirror Force: Phá hủy ${attackMonsters.length} Attack Position monsters! Đòn tấn công bị hủy.`)
    setSelectedAttacker(null)
  }

  const executeMagicCylinder = (attackerCard, isPlayerTrap) => {
    const damage = attackerCard.atk || 0
    if (isPlayerTrap) {
      animateLP('ai', damage)
    } else {
      animateLP('player', damage)
    }
    alert(`Magic Cylinder: Vô hiệu hóa tấn công và phản lại ${damage} damage!`)
    setSelectedAttacker(null)
  }

  const handleFlipEffect = (card, index, owner) => {
    if (!card) return
    const cardName = card.name.toLowerCase()
    const isPlayer = owner === 'player'
    
    if (cardName.includes('magician of faith')) {
      const gy = isPlayer ? playerGraveyard : aiGraveyard
      const spellsInGy = gy.filter(c => c && c.type.includes('Spell'))
      
      if (spellsInGy.length === 0) {
        alert('Magician of Faith: Không có Spell nào trong nghĩa địa!')
        return
      }

      if (isPlayer) {
        setGraveyardSelection({
          active: true,
          list: spellsInGy,
          message: 'Magician of Faith: Chọn 1 Spell từ Nghĩa địa để đưa về tay',
          onSelect: (selectedSpell) => {
            setPlayerGraveyard(prev => prev.filter(c => c.id !== selectedSpell.id))
            setPlayerHand(prev => [...prev, selectedSpell])
            alert(`Magician of Faith: Đã đưa ${selectedSpell.name} về tay!`)
            setGraveyardSelection(prev => ({ ...prev, active: false }))
          },
          onCancel: () => setGraveyardSelection(prev => ({ ...prev, active: false }))
        })
      } else {
        const selectedSpell = spellsInGy[0]
        setAiGraveyard(prev => prev.filter(c => c.id !== selectedSpell.id))
        setAiHand(prev => [...prev, selectedSpell])
        alert(`AI kích hoạt hiệu ứng FLIP của Magician of Faith và lấy ${selectedSpell.name} về tay!`)
      }
    } else if (cardName.includes('man-eater bug')) {
      // Destroy 1 monster on the field
      if (isPlayer) {
        setTargetSelection({
          active: true,
          type: 'monster',
          source: 'any',
          message: 'Man-Eater Bug: Chọn 1 quái thú trên sân để phá hủy',
          onSelect: (targetCard, targetType, targetIndex, targetOwner) => {
            const targetField = targetOwner === 'player' ? playerField : aiField
            const setTargetField = targetOwner === 'player' ? setPlayerField : setAiField
            const targetGY = targetOwner === 'player' ? playerGraveyard : aiGraveyard
            const setTargetGY = targetOwner === 'player' ? setPlayerGraveyard : setAiGraveyard
            
            const newMonsters = [...targetField.monsters]
            newMonsters[targetIndex] = null
            setTargetField({ ...targetField, monsters: newMonsters })
            setTargetGY([...targetGY, targetCard])
            
            alert(`Man-Eater Bug: Đã phá hủy ${targetCard.name}!`)
            setTargetSelection(prev => ({ ...prev, active: false }))
          },
          onCancel: () => setTargetSelection(prev => ({ ...prev, active: false }))
        })
      } else {
        // AI chooses target: strongest player monster
        const pMonsters = playerField.monsters
          .map((m, i) => m ? { card: m, index: i, owner: 'player' } : null)
          .filter(m => m !== null)
        
        if (pMonsters.length > 0) {
          const target = pMonsters.sort((a, b) => (b.card.atk || 0) - (a.card.atk || 0))[0]
          const newMonsters = [...playerField.monsters]
          newMonsters[target.index] = null
          setPlayerField({ ...playerField, monsters: newMonsters })
          setPlayerGraveyard(prev => [...prev, target.card])
          alert(`AI kích hoạt hiệu ứng FLIP của Man-Eater Bug và phá hủy ${target.card.name}!`)
        } else {
          // AI must destroy its own monster if player has none? 
          // Rule: Man-Eater target is mandatory.
          const aMonsters = aiField.monsters
            .map((m, i) => m ? { card: m, index: i, owner: 'ai' } : null)
            .filter(m => m !== null && m.index !== index) // Don't destroy itself if possible? 
            // Wait, effects usually happen AFTER flipping. Man-Eater can destroy itself if it's the only monster.
          
          if (aMonsters.length > 0) {
             const target = aMonsters.sort((a, b) => (a.card.atk || 0) - (b.card.atk || 0))[0]
             const newMonsters = [...aiField.monsters]
             newMonsters[target.index] = null
             setAiField({ ...aiField, monsters: newMonsters })
             setAiGraveyard(prev => [...prev, target.card])
             alert(`AI kích hoạt hiệu ứng FLIP của Man-Eater Bug. Không có mục tiêu phe ta, AI phá hủy chính ${target.card.name} của mình!`)
          } else {
             // Destroy itself
             const newMonsters = [...aiField.monsters]
             newMonsters[index] = null
             setAiField({ ...aiField, monsters: newMonsters })
             setAiGraveyard(prev => [...prev, card])
             alert(`AI kích hoạt hiệu ứng FLIP của Man-Eater Bug và phá hủy chính nó!`)
          }
        }
      }
    }
  }


  const handleDrawEffect = (amount, isPlayerTurn) => {
    const deck = isPlayerTurn ? playerDeck : aiDeck
    const setDeck = isPlayerTurn ? setPlayerDeck : setAiDeck
    const setHand = isPlayerTurn ? setPlayerHand : setAiHand
    
    setDeck(prevDeck => {
      if (prevDeck.length >= amount) {
        const drawnCards = prevDeck.slice(0, amount)
        setHand(prevHand => [...prevHand, ...drawnCards])
        alert(`Rút ${amount} lá bài: ${drawnCards.map(c => c.name).join(', ')}`)
        return prevDeck.slice(amount)
      } else {
        alert(`Không đủ bài trong deck để rút ${amount} lá!`)
        return prevDeck
      }
    })
  }

  const checkForHandTraps = (targetPlayer, damage, onProceed) => {
    const isHuman = targetPlayer === 'player'
    const hand = isHuman ? playerHand : aiHand
    const kuribohIndex = hand.findIndex(c => c && c.name.toLowerCase().includes('kuriboh'))

    if (kuribohIndex !== -1 && damage > 0) {
      // Trigger Kuriboh prompt
      setChainPrompt({
        active: true,
        player: targetPlayer,
        sourceAction: isHuman ? `Bạn sắp nhận ${damage} sát thương từ trận đấu này! Sử dụng Kuriboh?` : `Đối thủ sắp nhận ${damage} sát thương.`,
        onResolve: () => {
          // Handled in handleHandCardClick for player
        },
        onCancel: () => onProceed(damage),
        context: { type: 'hand_trap', targetPlayer, damage, onProceed }
      })

      // If AI has Kuriboh, decide whether to use it
      if (targetPlayer === 'ai') {
        setTimeout(() => {
          // Use functional state to avoid closure issues
          setAiHand(currentHand => {
            const idx = currentHand.findIndex(c => c && c.name.toLowerCase().includes('kuriboh'))
            if (idx !== -1 && damage >= 500) { // AI uses Kuriboh if damage >= 500
              const card = currentHand[idx]
              setAiGraveyard(prev => [...prev, card])
              alert(`AI đã kích hoạt Kuriboh từ trên tay! Sát thương bị triệt tiêu.`)
              onProceed(0)
              setChainPrompt(prev => ({ ...prev, active: false }))
              return currentHand.filter((_, i) => i !== idx)
            } else {
              // Don't use it
              onProceed(damage)
              setChainPrompt(prev => ({ ...prev, active: false }))
              return currentHand
            }
          })
        }, 1500)
      }
      return true 
    }
    return false
  }

  const handleActivateKuriboh = (handIndex, owner = 'player') => {
    const hand = owner === 'player' ? playerHand : aiHand
    const setHand = owner === 'player' ? setPlayerHand : setAiHand
    const gy = owner === 'player' ? playerGraveyard : aiGraveyard
    const setGy = owner === 'player' ? setPlayerGraveyard : setAiGraveyard
    
    const card = hand[handIndex]
    if (!card) return

    // Discard
    setHand(prev => prev.filter((_, i) => i !== handIndex))
    setGy(prev => [...prev, card])

    // Resolve effects
    const { onProceed } = chainPrompt.context
    setChainPrompt({ ...chainPrompt, active: false })
    
    if (owner === 'player') {
      alert(`Kuriboh: Hiệu ứng kích hoạt! Bạn không nhận sát thương từ trận đấu này.`)
    } else {
      alert(`Kuriboh: Đối thủ kích hoạt Kuriboh! AI không nhận sát thương từ trận đấu này.`)
    }
    onProceed(0)
  }

  const handleAiChainResponse = (prompt) => {
    console.log("AI is evaluating chain response...")
    
    // 1. Check for Attack Responses (Mirror Force, Magic Cylinder, Kuriboh)
    if (prompt.context?.type === 'attack' || prompt.context?.type === 'direct_attack') {
      const setSpells = aiField.spells
        .map((s, i) => s ? { card: s, index: i } : null)
        .filter(s => s !== null && !s.card.faceUp)
      
      // Mirror Force (only for monster vs monster attacks usually, but can be direct too)
      const mirrorForce = setSpells.find(s => s.card.name === 'Mirror Force')
      if (mirrorForce) {
        console.log("AI chaining Mirror Force")
        setTimeout(() => activateSetCard(mirrorForce.card, mirrorForce.index, 'ai'), 1000)
        return
      }

      // Magic Cylinder
      const magicCylinder = setSpells.find(s => s.card.name === 'Magic Cylinder')
      if (magicCylinder) {
        console.log("AI chaining Magic Cylinder")
        setTimeout(() => activateSetCard(magicCylinder.card, magicCylinder.index, 'ai'), 1000)
        return
      }

      // Kuriboh from hand
      const kuribohIndex = aiHand.findIndex(c => c.name === 'Kuriboh')
      if (kuribohIndex !== -1) {
        console.log("AI chaining Kuriboh")
        setTimeout(() => handleActivateKuriboh(kuribohIndex, 'ai'), 1000)
        return
      }

      // Ring of Destruction
      const ringIndex = setSpells.findIndex(s => s.card.name === 'Ring of Destruction')
      if (ringIndex !== -1) {
        console.log("AI chaining Ring of Destruction")
        const ringObj = setSpells[ringIndex]
        setTimeout(() => {
          handleRingOfDestruction(false)
          // Mark as used
          setAiField(prev => {
            const next = { ...prev, spells: prev.spells.map((s, idx) => idx === ringObj.index ? null : s) }
            aiFieldRef.current = next
            return next
          })
          setAiGraveyard(prev => [...prev, ringObj.card])
        }, 1000)
        return
      }
    }

    // 2. Check for Spell Activation Responses (Seven Tools of the Bandit for Traps, but here we cover spells)
    // For now, AI just says No to things it doesn't have a specific response for
    
    setTimeout(() => {
      handleChainResponse('no')
    }, 1200)
  }

  const getActivatableCards = () => {
    const activatable = []
    
    // 1. Check traps/spells on field
    playerField.spells.forEach((card, index) => {
      if (card && !card.faceUp) {
        // Basic check: Trap or Quick-Play
        const isTrap = card.type.includes('Trap')
        const isQuickPlay = card.desc.includes('Quick-Play') || card.type.includes('Quick-Play')
        
        if (isTrap || isQuickPlay) {
          activatable.push({ card, index, source: 'field' })
        }
      }
    })
    
    // 2. Check hand (Kuriboh, etc.)
    playerHand.forEach((card, index) => {
      if (card.name.toLowerCase().includes('kuriboh')) {
        if (chainPrompt.context?.type === 'attack' || chainPrompt.context?.type === 'direct_attack') {
          activatable.push({ card, index, source: 'hand' })
        }
      }
    })
    
    return activatable
  }


  const handleDrawThenDiscard = (drawAmount, discardAmount, isPlayerTurn) => {
    const setDeck = isPlayerTurn ? setPlayerDeck : setAiDeck
    const setHand = isPlayerTurn ? setPlayerHand : setAiHand
    
    setDeck(prevDeck => {
      if (prevDeck.length >= drawAmount) {
        const drawnCards = prevDeck.slice(0, drawAmount)
        setHand(prevHand => [...prevHand, ...drawnCards])
        
        alert(`Rút ${drawAmount} lá bài, sau đó chọn ${discardAmount} lá để loại bỏ`)
        
        // Trigger discard selection
        setForcedDiscard({ amount: discardAmount, reason: 'spell_effect' })
        setDiscardingCards(true)
        setSelectedDiscards([])
        
        return prevDeck.slice(drawAmount)
      } else {
        alert(`Không đủ bài trong deck để rút ${drawAmount} lá!`)
        return prevDeck
      }
    })
  }

  const handleDestroyAllMonsters = () => {
    const playerMonsters = playerField.monsters.filter(m => m !== null)
    const aiMonsters = aiField.monsters.filter(m => m !== null)
    
    // Send all monsters to GY using functional updates
    setPlayerGraveyard(prev => [...prev, ...playerMonsters])
    setAiGraveyard(prev => [...prev, ...aiMonsters])
    
    // Clear fields
    setPlayerField({ ...playerField, monsters: [null, null, null, null, null] })
    setAiField({ ...aiField, monsters: [null, null, null, null, null] })
    
    alert(`Phá hủy tất cả monsters trên field! (${playerMonsters.length + aiMonsters.length} monsters)`)
  }

  const handleDestroyOpponentMonsters = (isPlayerTurn) => {
    const opponentField = isPlayerTurn ? aiField : playerField
    const setOpponentField = isPlayerTurn ? setAiField : setPlayerField
    const opponentGY = isPlayerTurn ? aiGraveyard : playerGraveyard
    const setOpponentGY = isPlayerTurn ? setAiGraveyard : setPlayerGraveyard
    
    const monsters = opponentField.monsters.filter(m => m !== null)
    
    if (monsters.length > 0) {
      setOpponentGY([...opponentGY, ...monsters])
      setOpponentField({ ...opponentField, monsters: [null, null, null, null, null] })
      alert(`Phá hủy tất cả monsters của đối thủ! (${monsters.length} monsters)`)
    } else {
      alert('Đối thủ không có monster nào trên field!')
    }
  }

  const handleMonsterReborn = (isPlayerTurn) => {
    const allMonsters = [...playerGraveyard, ...aiGraveyard].filter(m => m.type.includes('Monster'))
    if (allMonsters.length === 0) {
      alert('Không có quái thú trong nghĩa địa!')
      return
    }
    setGraveyardSelection({
      active: true,
      list: allMonsters,
      message: 'Monster Reborn: Chọn 1 quái thú để hồi sinh',
      onSelect: (monster) => {
        handleSelectRebornMonster(monster)
      },
      onCancel: handleCancelGraveyardSelection
    })
  }

  const handleSelectRebornMonster = (monster) => {
    const isPlayerTurn = currentTurn === 'player'
    const field = isPlayerTurn ? playerField : aiField
    const setField = isPlayerTurn ? setPlayerField : setAiField
    const playerGY = playerGraveyard
    const aiGY = aiGraveyard
    const setPlayerGY = setPlayerGraveyard
    const setAiGY = setAiGraveyard
    
    // Find empty monster zone
    const emptyZoneIndex = field.monsters.findIndex(m => m === null)
    if (emptyZoneIndex === -1) {
      alert('Không có zone trống!')
      return
    }
    
    // Remove from appropriate GY using functional updates
    setPlayerGY(prevGY => {
      if (prevGY.some(m => m.id === monster.id)) {
        return prevGY.filter(m => m.id !== monster.id)
      }
      return prevGY
    })
    setAiGY(prevGY => {
      if (prevGY.some(m => m.id === monster.id)) {
        return prevGY.filter(m => m.id !== monster.id)
      }
      return prevGY
    })
    
    // Summon to field
    const newMonsters = [...field.monsters]
    newMonsters[emptyZoneIndex] = {
      ...monster,
      faceUp: true,
      position: 'attack',
      justSummoned: true,
      originalAtk: monster.atk,
      originalDef: monster.def
    }
    setField({ ...field, monsters: newMonsters })
    
    alert(`Monster Reborn: Hồi sinh ${monster.name}!`)
    
    // Close modal
    setGraveyardSelection({ ...graveyardSelection, active: false })
  }

  const handleDeSpell = (isPlayerTurn) => {
    const opponentField = isPlayerTurn ? aiField : playerField
    const spells = opponentField.spells.filter((s, i) => s !== null && s.type.includes('Spell'))
    
    if (spells.length === 0) {
      alert('Đối thủ không có Spell card nào trên field!')
      return
    }
    
    // For now, destroy first spell found
    const setOpponentField = isPlayerTurn ? setAiField : setPlayerField
    const opponentGY = isPlayerTurn ? aiGraveyard : playerGraveyard
    const setOpponentGY = isPlayerTurn ? setAiGraveyard : setPlayerGraveyard
    
    const newSpells = [...opponentField.spells]
    const targetIndex = newSpells.findIndex(s => s !== null && s.type.includes('Spell'))
    const targetSpell = newSpells[targetIndex]
    
    newSpells[targetIndex] = null
    setOpponentField({ ...opponentField, spells: newSpells })
    setOpponentGY([...opponentGY, targetSpell])
    
    alert(`De-Spell: Phá hủy ${targetSpell.name}!`)
  }

  const handleFluteOfSummoningDragon = (isPlayerTurn) => {
    const hand = isPlayerTurn ? playerHand : aiHand
    const dragons = hand.filter(c => c.race === 'Dragon')
    
    if (dragons.length === 0) {
      alert('Không có Dragon nào trên tay!')
      return
    }
    
    // Enter dragon selection mode
    setDragonSummonMode(true)
    setAvailableDragons(dragons)
  }

  const handleSelectDragon = (dragon) => {
    const isPlayerTurn = currentTurn === 'player'
    const field = isPlayerTurn ? playerField : aiField
    const setField = isPlayerTurn ? setPlayerField : setAiField
    const hand = isPlayerTurn ? playerHand : aiHand
    const setHand = isPlayerTurn ? setPlayerHand : setAiHand
    
    // Find empty monster zone
    const emptyZoneIndex = field.monsters.findIndex(m => m === null)
    if (emptyZoneIndex === -1) {
      alert('Không có zone trống!')
      return
    }
    
    // Remove from hand
    const newHand = hand.filter(c => c.id !== dragon.id)
    setHand(newHand)
    
    // Summon to field
    const newMonsters = [...field.monsters]
    newMonsters[emptyZoneIndex] = {
      ...dragon,
      faceUp: true,
      position: 'attack',
      justSummoned: true,
      originalAtk: dragon.atk,
      originalDef: dragon.def
    }
    setField({ ...field, monsters: newMonsters })
    
    alert(`Flute of Summoning Dragon: Triệu hồi ${dragon.name}!`)
    setDragonSummonMode(false)
    setAvailableDragons([])
  }


  const handleCrushCardVirus = (isPlayerTurn) => {
    const opponentHand = isPlayerTurn ? aiHand : playerHand
    const setOpponentHand = isPlayerTurn ? setAiHand : setPlayerHand
    const opponentField = isPlayerTurn ? aiField : playerField
    const setOpponentField = isPlayerTurn ? setAiField : setPlayerField
    const opponentGY = isPlayerTurn ? aiGraveyard : playerGraveyard
    const setOpponentGY = isPlayerTurn ? setAiGraveyard : setPlayerGraveyard
    
    // Destroy monsters with 1500+ ATK
    const destroyedFromHand = opponentHand.filter(c => c.type.includes('Monster') && (c.atk || 0) >= 1500)
    const destroyedFromField = opponentField.monsters.filter(m => m !== null && (m.atk || 0) >= 1500)
    
    // Remove from hand
    const newHand = opponentHand.filter(c => !destroyedFromHand.includes(c))
    setOpponentHand(newHand)
    
    // Remove from field
    const newMonsters = opponentField.monsters.map(m => {
      if (m && (m.atk || 0) >= 1500) return null
      return m
    })
    setOpponentField({ ...opponentField, monsters: newMonsters })
    
    // Send to GY
    setOpponentGY([...opponentGY, ...destroyedFromHand, ...destroyedFromField])
    
    const totalDestroyed = destroyedFromHand.length + destroyedFromField.length
    alert(`Crush Card Virus: Phá hủy ${totalDestroyed} monsters có ATK ≥ 1500!`)
  }

  const handleGiftOfMysticalElf = (isPlayerTurn) => {
    const allMonsters = [...playerField.monsters, ...aiField.monsters].filter(m => m !== null)
    const lpGain = allMonsters.length * 300
    
    if (isPlayerTurn) {
      setPlayerLP(prev => prev + lpGain)
    } else {
      setAiLP(prev => prev + lpGain)
    }
    
    alert(`Gift of The Mystical Elf: Hồi phục ${lpGain} LP! (${allMonsters.length} monsters x 300)`)
  }

  const handleTimeSeal = (isPlayerTurn) => {
    // Skip opponent's next draw phase
    if (isPlayerTurn) {
      setSkipNextDraw(prev => ({ ...prev, ai: true }))
    } else {
      setSkipNextDraw(prev => ({ ...prev, player: true }))
    }
    alert(`Time Seal: Đối thủ sẽ bỏ qua Draw Phase tiếp theo!`)
  }

  const handleShadowSpell = (isPlayerTurn) => {
    setTargetSelection({
      active: true,
      type: 'monster',
      source: isPlayerTurn ? 'ai' : 'player',
      message: 'Chọn 1 quái thú của đối thủ cho Shadow Spell',
      onSelect: (targetCard, targetType, targetIndex, targetOwner) => {
        const field = targetOwner === 'player' ? playerField : aiField
        const setField = targetOwner === 'player' ? setPlayerField : setAiField
        
        const newMonsters = [...field.monsters]
        const monster = newMonsters[targetIndex]
        
        const newAtk = Math.max(0, (monster.atk || 0) - 700)
        
        newMonsters[targetIndex] = {
          ...monster,
          atk: newAtk,
          buffType: 'debuffed',
          cannotAttack: true
        }
        
        setField({ ...field, monsters: newMonsters })
        alert(`${monster.name} bị khóa bởi Shadow Spell! (ATK -700 và không thể tấn công)`)
      }
    })
  }

  const handleNegateAttack = (isPlayerTurn) => {
    if (currentPhase !== 'BATTLE') {
      alert('Negate Attack chỉ có thể kích hoạt trong Battle Phase!')
      return
    }
    
    // End battle phase and move to Main Phase 2
    setCurrentPhase('MAIN2')
    setSelectedAttacker(null)
    
    alert('Negate Attack: Vô hiệu hóa tấn công và kết thúc Battle Phase!')
  }

  const handleDarkMagicCurtain = (isPlayerTurn) => {
    const currentLP = isPlayerTurn ? playerLP : aiLP
    const setLP = isPlayerTurn ? setPlayerLP : setAiLP
    const deck = isPlayerTurn ? playerDeck : aiDeck
    
    // Search deck for "Dark Magician"
    const dmCards = deck.filter(c => c && c.name.includes('Dark Magician'))
    
    if (dmCards.length === 0) {
      alert('Không có Dark Magician trong bộ bài!')
      return
    }

    // Pay half LP
    const lpCost = Math.floor(currentLP / 2)
    setLP(currentLP - lpCost)

    if (isPlayerTurn) {
      setDeckSelection({
        active: true,
        list: dmCards,
        message: `Dark Magic Curtain: Trả ${lpCost} LP. Chọn 1 Dark Magician từ bộ bài để triệu hồi`,
        onSelect: (selectedDM) => {
          const emptyZoneIndex = playerField.monsters.findIndex(m => m === null)
          if (emptyZoneIndex === -1) {
            alert('Không còn chỗ trống trên sân!')
            setDeckSelection(prev => ({ ...prev, active: false }))
            return
          }

          // Remove from deck
          setPlayerDeck(prev => {
            const indexInDeck = prev.findIndex(c => c.id === selectedDM.id)
            const newDeck = [...prev]
            if (indexInDeck !== -1) newDeck.splice(indexInDeck, 1)
            return newDeck
          })

          // Summon
          const newMonsters = [...playerField.monsters]
          newMonsters[emptyZoneIndex] = {
            ...selectedDM,
            faceUp: true,
            position: 'attack',
            justSummoned: true,
            originalAtk: selectedDM.atk,
            originalDef: selectedDM.def
          }
          setPlayerField({ ...playerField, monsters: newMonsters })
          setDeckSelection(prev => ({ ...prev, active: false }))
          alert(`Dark Magic Curtain: Bạn đã triệu hồi ${selectedDM.name}!`)
        }
      })
    } else {
      // AI logic: pick first DM
      const selectedDM = dmCards[0]
      const emptyZoneIndex = aiField.monsters.findIndex(m => m === null)
      if (emptyZoneIndex !== -1) {
        setAiDeck(prev => {
          const indexInDeck = prev.findIndex(c => c.id === selectedDM.id)
          const newDeck = [...prev]
          if (indexInDeck !== -1) newDeck.splice(indexInDeck, 1)
          return newDeck
        })

        const newMonsters = [...aiField.monsters]
        newMonsters[emptyZoneIndex] = {
          ...selectedDM,
          faceUp: true,
          position: 'attack',
          justSummoned: true,
          originalAtk: selectedDM.atk,
          originalDef: selectedDM.def
        }
        setAiField({ ...aiField, monsters: newMonsters })
        alert(`AI kích hoạt Dark Magic Curtain (Trả ${lpCost} LP) và triệu hồi ${selectedDM.name}!`)
      }
    }
  }

  const handleDedicationThroughLightAndDarkness = (isPlayerTurn) => {
    const field = isPlayerTurn ? playerField : aiField
    const darkMagician = field.monsters.find(m => m && m.name.includes('Dark Magician'))
    
    if (!darkMagician) {
      alert('Cần có Dark Magician trên field để hiến tế!')
      return
    }
    
    // Check if player has Dark Magician of Chaos in deck
    const darkMagicianOfChaos = (isPlayerTurn ? player.deck.main : ai.deck.main).find(c => c.name.includes('Dark Magician of Chaos'))
    if (darkMagicianOfChaos) {
      // Tribute Dark Magician
      const setField = isPlayerTurn ? setPlayerField : setAiField
      const graveyard = isPlayerTurn ? playerGraveyard : aiGraveyard
      const setGraveyard = isPlayerTurn ? setPlayerGraveyard : setAiGraveyard
      
      const monsterIndex = field.monsters.findIndex(m => m === darkMagician)
      const newMonsters = [...field.monsters]
      newMonsters[monsterIndex] = null
      setField({ ...field, monsters: newMonsters })
      setGraveyard([...graveyard, darkMagician])
      
      // Special Summon Dark Magician of Chaos
      const emptyZoneIndex = newMonsters.findIndex(m => m === null)
      if (emptyZoneIndex !== -1) {
        newMonsters[emptyZoneIndex] = {
          ...darkMagicianOfChaos,
          faceUp: true,
          position: 'attack',
          justSummoned: true,
          originalAtk: darkMagicianOfChaos.atk,
          originalDef: darkMagicianOfChaos.def
        }
        setField({ ...field, monsters: newMonsters })
        alert(`Dedication through Light and Darkness: Hiến tế Dark Magician, triệu hồi ${darkMagicianOfChaos.name}!`)
      }
    } else {
      alert('Không có Dark Magician of Chaos trong deck!')
    }
  }

  const handleBookOfSecretArts = (isPlayerTurn) => {
    alert('Book of Secret Arts: Chọn 1 Spellcaster để trang bị! Monster đó tăng 300 ATK/DEF. (Cần implement target selection)')
  }

  const handleBrainControl = (isPlayerTurn) => {
    // Check LP
    const currentLP = isPlayerTurn ? playerLP : aiLP
    const setLP = isPlayerTurn ? setPlayerLP : setAiLP
    if (currentLP <= 800) {
      alert('Không đủ LP để kích hoạt Brain Control!')
      return
    }

    setTargetSelection({
      active: true,
      type: 'monster',
      source: isPlayerTurn ? 'ai' : 'player',
      message: 'Brain Control: Chọn 1 quái thú của đối thủ để điều khiển trong turn này (Trả 800 LP)',
      onSelect: (targetCard, targetType, targetIndex, targetOwner) => {
        // Pay LP
        setLP(currentLP - 800)
        
        const success = handleTakeControl(
          targetCard, 
          targetOwner, 
          isPlayerTurn ? 'player' : 'ai', 
          targetIndex, 
          true // return at end turn
        )
        if (success) {
          alert(`Brain Control: Đã trả 800 LP và chiếm quyền điều khiển ${targetCard.name}!`)
        }
      }
    })
  }

  const handleHornOfTheUnicorn = (isPlayerTurn) => {
    alert('Horn of the Unicorn: Chọn 1 monster để trang bị! Monster đó tăng 700 ATK/DEF. (Cần implement target selection)')
  }

  const handleMysticBox = (isPlayerTurn) => {
    alert('Mystic Box: Chọn 1 monster để phá hủy, sau đó chọn 1 monster khác để chuyển quyền điều khiển! (Cần implement target selection)')
  }

  const handleEyeOfTimaeus = (isPlayerTurn) => {
    const field = isPlayerTurn ? playerField : aiField
    const darkMagician = field.monsters.find(m => m && m.name.includes('Dark Magician'))
    
    if (!darkMagician) {
      alert('Cần có Dark Magician trên field để Fusion Summon!')
      return
    }
    
    // Check for Dark Magician fusions in Extra Deck
    const extraDeck = isPlayerTurn ? player.deck.extra : ai.deck.extra
    const darkMagicianFusions = extraDeck.filter(c => c.name.includes('Dark Magician') && c.type.includes('Fusion'))
    
    if (darkMagicianFusions.length === 0) {
      alert('Không có Dark Magician Fusion Monster trong Extra Deck!')
      return
    }
    
    // Enter fusion selection mode
    setFusionMode(true)
    setAvailableFusions(darkMagicianFusions.map(m => ({ monster: m, requirements: [] })))
    setSelectedFusionMaterials([{
      id: 'field-darkmagician',
      card: darkMagician,
      source: 'field',
      index: field.monsters.findIndex(m => m === darkMagician)
    }])
    setSelectedFusionMonster(null)
  }

  const handleMultiply = (isPlayerTurn) => {
    const field = isPlayerTurn ? playerField : aiField
    const kuriboh = field.monsters.find(m => m && m.name.includes('Kuriboh'))
    
    if (!kuriboh) {
      alert('Cần có Kuriboh trên field!')
      return
    }
    
    // Create 2 Kuriboh tokens
    const setField = isPlayerTurn ? setPlayerField : setAiField
    const newMonsters = [...field.monsters]
    let tokensCreated = 0
    
    for (let i = 0; i < newMonsters.length && tokensCreated < 2; i++) {
      if (newMonsters[i] === null) {
        newMonsters[i] = {
          name: 'Kuriboh Token',
          type: 'Token',
          atk: 300,
          def: 200,
          faceUp: true,
          position: 'defense',
          isToken: true,
          originalAtk: 300,
          originalDef: 200
        }
        tokensCreated++
      }
    }
    
    setField({ ...field, monsters: newMonsters })
    alert(`Multiply: Tạo ${tokensCreated} Kuriboh Token!`)
  }

  const handleLightforceSword = (isPlayerTurn) => {
    const opponentHand = isPlayerTurn ? aiHand : playerHand
    
    if (opponentHand.length === 0) {
      alert('Đối thủ không có bài trên tay!')
      return
    }
    
    // Randomly banish 1 card
    const randomIndex = Math.floor(Math.random() * opponentHand.length)
    const banishedCard = opponentHand[randomIndex]
    const setOpponentHand = isPlayerTurn ? setAiHand : setPlayerHand
    
    const newHand = opponentHand.filter((_, i) => i !== randomIndex)
    setOpponentHand(newHand)
    
    alert(`Lightforce Sword: Loại bỏ ngẫu nhiên ${banishedCard.name} từ tay đối thủ!`)
  }

  const handleMagicCylinder = (isPlayerTurn) => {
    if (!battlePhase || !selectedAttacker) {
      alert('Magic Cylinder chỉ có thể kích hoạt khi bị tấn công!')
      return
    }
    
    const attacker = selectedAttacker.card
    const damage = attacker.atk || 0
    
    // Inflict damage to attacker's owner
    if (currentTurn === 'player') {
      setPlayerLP(playerLP - damage)
    } else {
      setAiLP(aiLP - damage)
    }
    
    // End battle
    setBattlePhase(false)
    setSelectedAttacker(null)
    
    alert(`Magic Cylinder: Phản lại ${damage} damage!`)
  }

  const handleMagicalHats = (isPlayerTurn) => {
    const field = isPlayerTurn ? playerField : aiField
    const setField = isPlayerTurn ? setPlayerField : setAiField
    
    // Create 2 token hats
    const newSpells = [...field.spells]
    let hatsCreated = 0
    
    for (let i = 0; i < newSpells.length && hatsCreated < 2; i++) {
      if (newSpells[i] === null) {
        newSpells[i] = {
          name: 'Magical Hat Token',
          type: 'Token',
          faceUp: false,
          isToken: true,
          originalAtk: 0,
          originalDef: 0
        }
        hatsCreated++
      }
    }
    
    setField({ ...field, spells: newSpells })
    alert(`Magical Hats: Tạo ${hatsCreated} Magical Hat Token để bảo vệ monsters!`)
  }

  const handleMirrorForce = (isPlayerTurn) => {
    if (!battlePhase) {
      alert('Mirror Force chỉ có thể kích hoạt trong Battle Phase!')
      return
    }
    
    const opponentField = isPlayerTurn ? aiField : playerField
    const setOpponentField = isPlayerTurn ? setAiField : setPlayerField
    const opponentGY = isPlayerTurn ? aiGraveyard : playerGraveyard
    const setOpponentGY = isPlayerTurn ? setAiGraveyard : setPlayerGraveyard
    
    // Destroy all Attack Position monsters
    const attackMonsters = opponentField.monsters.filter((m, i) => m !== null && m.position === 'attack')
    
    if (attackMonsters.length === 0) {
      alert('Đối thủ không có monster ở Attack Position!')
      return
    }
    
    const newMonsters = opponentField.monsters.map(m => {
      if (m && m.position === 'attack') return null
      return m
    })
    
    setOpponentField({ ...opponentField, monsters: newMonsters })
    setOpponentGY([...opponentGY, ...attackMonsters])
    
    alert(`Mirror Force: Phá hủy ${attackMonsters.length} Attack Position monsters!`)
    setBattlePhase(false)
    setSelectedAttacker(null)
  }

  const handleSevenToolsOfTheBandit = (isPlayerTurn) => {
    alert('Seven Tools of the Bandit: Vô hiệu hóa Trap card! (Cần implement chain system)')
  }

  const handleSpellbindingCircle = (isPlayerTurn) => {
    setTargetSelection({
      active: true,
      type: 'monster',
      source: 'ai',
      message: 'Chọn 1 quái thú của đối thủ cho Spellbinding Circle',
      onSelect: (targetCard, targetType, targetIndex, targetOwner) => {
        const field = targetOwner === 'player' ? playerField : aiField
        const setField = targetOwner === 'player' ? setPlayerField : setAiField
        
        const newMonsters = [...field.monsters]
        const monster = newMonsters[targetIndex]
        
        const newAtk = Math.max(0, (monster.atk || 0) - 700)
        
        newMonsters[targetIndex] = {
          ...monster,
          atk: newAtk,
          buffType: 'debuffed',
          cannotAttack: true
        }
        
        setField({ ...field, monsters: newMonsters })
        alert(`${monster.name} bị khóa bởi Spellbinding Circle! (ATK -700 và không thể tấn công)`)
      }
    })
  }

  const handleMegamorph = (isPlayerTurn) => {
    if (!isPlayerTurn) {
      // AI Logic for Megamorph
      const myLP = aiLP
      const oppLP = playerLP
      // AI uses Refs for state in actions
      const aiMonsters = aiFieldRef.current.monsters.map((m, i) => m ? { card: m, index: i, owner: 'ai' } : null).filter(m => m !== null)
      const pMonsters = playerFieldRef.current.monsters.map((m, i) => m ? { card: m, index: i, owner: 'player' } : null).filter(m => m !== null)

      if (myLP < oppLP && aiMonsters.length > 0) {
        const target = aiMonsters.sort((a, b) => b.card.atk - a.card.atk)[0]
        executeMegamorph(false, 'ai', target.index, target.card, myLP, oppLP)
        alert(`AI đã trang bị Megamorph cho ${target.card.name}! ATK được nhân đôi!`)
      } else if (myLP > oppLP && pMonsters.length > 0) {
        const target = pMonsters.sort((a, b) => b.card.atk - a.card.atk)[0]
        executeMegamorph(false, 'player', target.index, target.card, myLP, oppLP)
        alert(`AI đã trang bị Megamorph cho ${target.card.name} của bạn! ATK bị chia đôi!`)
      }
      return
    }

    setTargetSelection({
      active: true,
      type: 'monster',
      source: 'any',
      message: 'Megamorph: Chọn 1 quái thú để trang bị',
      onSelect: (targetCard, targetType, targetIndex, targetOwner) => {
        executeMegamorph(true, targetOwner, targetIndex, targetCard, playerLP, aiLP)
        const buff = playerLP < aiLP ? 'tăng gấp đôi' : 'bị chia đôi'
        alert(`Megamorph: ${targetCard.name} đã ${buff} ATK!`)
        setTargetSelection(prev => ({ ...prev, active: false }))
      },
      onCancel: () => setTargetSelection(prev => ({ ...prev, active: false }))
    })
  }

  const executeMegamorph = (isPlayerActivator, targetOwner, targetIndex, monster, myLP, oppLP) => {
    const setField = targetOwner === 'player' ? setPlayerField : setAiField
    const originalAtk = monster.originalAtk || monster.atk || 0
    let newAtk = originalAtk
    let buffType = ''
    
    if (myLP < oppLP) {
      newAtk = originalAtk * 2
      buffType = 'buffed'
    } else if (myLP > oppLP) {
      newAtk = Math.floor(originalAtk / 2)
      buffType = 'debuffed'
    }
    
    setField(prev => {
      const newMonsters = [...prev.monsters]
      newMonsters[targetIndex] = {
        ...monster,
        atk: newAtk,
        originalAtk: originalAtk,
        buffType: buffType
      }
      const next = { ...prev, monsters: newMonsters }
      if (targetOwner === 'player') playerFieldRef.current = next
      else aiFieldRef.current = next
      return next
    })
  }

  const handleRingOfDestruction = (isPlayerTurn) => {
    if (!isPlayerTurn) {
      // AI Logic for Ring of Destruction
      const pMonsters = playerFieldRef.current.monsters.map((m, i) => m ? { card: m, index: i, owner: 'player' } : null).filter(m => m !== null && m.card.faceUp)
      if (pMonsters.length > 0) {
        const target = pMonsters.sort((a, b) => b.card.atk - a.card.atk)[0]
        executeRingOfDestruction(target.card, target.index, 'player')
        alert(`AI kích hoạt Ring of Destruction và phá hủy ${target.card.name}!`)
      }
      return
    }

    setTargetSelection({
      active: true,
      type: 'monster',
      source: 'any',
      message: 'Ring of Destruction: Chọn 1 quái thú ngửa mặt để phá hủy',
      onSelect: (targetCard, targetType, targetIndex, targetOwner) => {
        if (!targetCard.faceUp) {
          alert('Chỉ có thể phá hủy quái thú đang ngửa mặt!')
          return
        }
        executeRingOfDestruction(targetCard, targetIndex, targetOwner)
        setTargetSelection(prev => ({ ...prev, active: false }))
      },
      onCancel: () => setTargetSelection(prev => ({ ...prev, active: false }))
    })
  }

  const executeRingOfDestruction = (card, index, owner) => {
    const damage = card.atk || 0
    const field = owner === 'player' ? playerField : aiField
    const setField = owner === 'player' ? setPlayerField : setAiField
    const gy = owner === 'player' ? playerGraveyard : aiGraveyard
    const setGy = owner === 'player' ? setPlayerGraveyard : setAiGraveyard

    // Destroy monster
    setField(prev => {
      const newMonsters = [...prev.monsters]
      newMonsters[index] = null
      const next = { ...prev, monsters: newMonsters }
      if (owner === 'player') playerFieldRef.current = next
      else aiFieldRef.current = next
      return next
    })
    setGy(prev => [...prev, card])

    // Inflict damage to both
    animateLP('player', damage)
    animateLP('ai', damage)
    alert(`Ring of Destruction: Phá hủy ${card.name} và gây ${damage} sát thương cho cả hai!`)
  }



  const handleChainDestruction = (isPlayerTurn) => {
    alert('Chain Destruction: Khi monster bị phá hủy, phá hủy tất cả copies trong hand/deck! (Cần implement chain system)')
  }

  const handleDestroySpellTrap = (isPlayerTurn) => {
    const opponentField = isPlayerTurn ? aiField : playerField
    const spellTraps = opponentField.spells.filter(s => s !== null)
    
    if (spellTraps.length === 0) {
      alert('Đối thủ không có Spell/Trap nào trên field!')
      return
    }
    
    alert(`MST: Chọn 1 Spell/Trap để phá hủy!\nCó ${spellTraps.length} cards: ${spellTraps.map(s => s.name).join(', ')}`)
  }

  const handleFissure = (isPlayerTurn) => {
    const opponentField = isPlayerTurn ? aiField : playerField
    const setOpponentField = isPlayerTurn ? setAiField : setPlayerField
    const opponentGY = isPlayerTurn ? aiGraveyard : playerGraveyard
    const setOpponentGY = isPlayerTurn ? setAiGraveyard : setPlayerGraveyard
    
    const faceUpMonsters = opponentField.monsters.filter(m => m !== null && m.faceUp)
    
    if (faceUpMonsters.length === 0) {
      alert('Đối thủ không có monster ngửa nào!')
      return
    }
    
    // Find monster with lowest ATK
    const lowestATK = Math.min(...faceUpMonsters.map(m => m.atk || 0))
    const targetMonster = faceUpMonsters.find(m => (m.atk || 0) === lowestATK)
    const targetIndex = opponentField.monsters.findIndex(m => m === targetMonster)
    
    // Destroy the monster
    const newMonsters = [...opponentField.monsters]
    newMonsters[targetIndex] = null
    setOpponentField({ ...opponentField, monsters: newMonsters })
    setOpponentGY([...opponentGY, targetMonster])
    
    alert(`Fissure: Phá hủy ${targetMonster.name} (ATK: ${targetMonster.atk})`)
  }

  const handleSwordsOfRevealingLight = (isPlayerTurn, zoneIndex) => {
    const opponentField = isPlayerTurn ? aiField : playerField
    const setOpponentField = isPlayerTurn ? setAiField : setPlayerField
    const owner = isPlayerTurn ? 'player' : 'ai'

    // 1. Flip all opponent's monsters face-up
    const newMonsters = opponentField.monsters.map(m => {
      if (m && !m.faceUp) {
        // This should trigger flip effects if any!
        // handleFlipEffect(m, ...) is complex here. For now, just flip.
        return { ...m, faceUp: true }
      }
      return m
    })
    setOpponentField({ ...opponentField, monsters: newMonsters })

    // 2. Set swords state
    setSwordsActive({ active: true, owner, turnsLeft: 3, zoneIndex })
    alert(`${owner === 'player' ? 'Bạn' : 'AI'} kích hoạt Swords of Revealing Light: Quái thú đối thủ bị lật ngửa và không thể tấn công trong 3 lượt!`)
  }

  const handleActivateMonsterEffect = (card, index) => {
    const cardName = card.name.toLowerCase()
    
    if (cardName.includes('time wizard')) {
      handleTimeWizard(index)
    } else {
      alert(`${card.name} không có hiệu ứng chủ động!`)
    }
  }

  const handleTimeWizard = (index) => {
    const isPlayer = currentTurn === 'player'
    const ownerName = isPlayer ? 'Bạn' : 'AI'
    alert(`${ownerName}: Time Wizard - Bắt đầu quay kim đồng hồ!`)
    
    // Toss coin
    const win = Math.random() > 0.5
    
    setTimeout(() => {
      if (win) {
        alert(`${ownerName} THẮNG! Time Wizard phá hủy tất cả quái thú của đối thủ!`)
        const opponentField = isPlayer ? aiField : playerField
        const setOpponentField = isPlayer ? setAiField : setPlayerField
        const opponentGY = isPlayer ? aiGraveyard : playerGraveyard
        const setOpponentGY = isPlayer ? setAiGraveyard : setPlayerGraveyard
        
        const destroyedMonsters = opponentField.monsters.filter(m => m !== null)
        const newMonsters = opponentField.monsters.map(() => null)
        
        setOpponentField({ ...opponentField, monsters: newMonsters })
        setOpponentGY(prev => [...prev, ...destroyedMonsters])
      } else {
        alert(`${ownerName} THUA! Time Wizard phá hủy tất cả quái thú phe ta và gây sát thương!`)
        const myField = isPlayer ? playerField : aiField
        const setMyField = isPlayer ? setPlayerField : setAiField
        const myGY = isPlayer ? playerGraveyard : aiGraveyard
        const setMyGY = isPlayer ? setPlayerGraveyard : setAiGraveyard
        
        const myMonsters = myField.monsters.filter(m => m !== null)
        const totalAtk = myMonsters.reduce((sum, m) => sum + (m.atk || 0), 0)
        const damage = Math.floor(totalAtk / 2)
        
        const newMonsters = myField.monsters.map(() => null)
        setMyField({ ...myField, monsters: newMonsters })
        setMyGY(prev => [...prev, ...myMonsters])
        
        animateLP(isPlayer ? 'player' : 'ai', damage)
      }
    }, 2000)
  }


  const handleChangeOfHeart = (isPlayerTurn) => {
    setTargetSelection({
      active: true,
      type: 'monster',
      source: isPlayerTurn ? 'ai' : 'player',
      message: 'Change of Heart: Chọn 1 quái thú của đối thủ để điều khiển trong turn này',
      onSelect: (targetCard, targetType, targetIndex, targetOwner) => {
        const success = handleTakeControl(
          targetCard, 
          targetOwner, 
          isPlayerTurn ? 'player' : 'ai', 
          targetIndex, 
          true // return at end turn
        )
        if (success) {
          alert(`Change of Heart: Đã chiếm quyền điều khiển ${targetCard.name}!`)
        }
      }
    })
  }

  const handlePrematureBurial = (isPlayerTurn, spellZoneIndex) => {
    const currentLP = isPlayerTurn ? playerLP : aiLP
    const setLP = isPlayerTurn ? setPlayerLP : setAiLP
    
    if (currentLP <= 800) {
      alert('Không đủ LP để kích hoạt Premature Burial!')
      // Destroy the spell card since activation failed
      const field = isPlayerTurn ? playerField : aiField
      const setField = isPlayerTurn ? setPlayerField : setAiField
      const gy = isPlayerTurn ? playerGraveyard : aiGraveyard
      const setGy = isPlayerTurn ? setPlayerGraveyard : setAiGraveyard
      
      const spellCard = field.spells[spellZoneIndex]
      if (spellCard) {
        setGy([...gy, spellCard])
        const newSpells = [...field.spells]
        newSpells[spellZoneIndex] = null
        setField({ ...field, spells: newSpells })
      }
      return
    }

    const gy = isPlayerTurn ? playerGraveyard : aiGraveyard
    const monstersInGy = gy.filter(c => c.type.includes('Monster'))
    
    if (monstersInGy.length === 0) {
      alert('Không có quái thú trong nghĩa địa để hồi sinh!')
      // Destroy spell
      const field = isPlayerTurn ? playerField : aiField
      const setField = isPlayerTurn ? setPlayerField : setAiField
      const setGy = isPlayerTurn ? setPlayerGraveyard : setAiGraveyard
      const spellCard = field.spells[spellZoneIndex]
      if (spellCard) {
        setGy([...gy, spellCard])
        const newSpells = [...field.spells]
        newSpells[spellZoneIndex] = null
        setField({ ...field, spells: newSpells })
      }
      return
    }

    setGraveyardSelection({
      active: true,
      list: monstersInGy,
      message: 'Premature Burial: Chọn 1 quái thú từ Nghĩa địa để hồi sinh (Trả 800 LP)',
      onSelect: (monster) => {
        // Pay LP
        setLP(currentLP - 800)
        
        const field = isPlayerTurn ? playerField : aiField
        const setField = isPlayerTurn ? setPlayerField : setAiField
        const setGy = isPlayerTurn ? setPlayerGraveyard : setAiGraveyard
        
        // Find empty monster zone
        const emptyZoneIndex = field.monsters.findIndex(m => m === null)
        if (emptyZoneIndex === -1) {
          alert('Không còn chỗ trống trên sân!')
          return
        }
        
        // Remove from GY
        setGy(gy.filter(c => c.id !== monster.id)) // Object comparison
        
        // Summon to field
        const newMonsters = [...field.monsters]
        newMonsters[emptyZoneIndex] = {
          ...monster,
          faceUp: true,
          position: 'attack',
          justSummoned: true,
          originalAtk: monster.atk,
          originalDef: monster.def,
          equippedBy: `spell-${spellZoneIndex}` // Track equip relationship
        }
        setField({ ...field, monsters: newMonsters })
        
        alert(`Premature Burial: Đã trả 800 LP và hồi sinh ${monster.name}!`)
        setGraveyardSelection({ active: false, list: [], onSelect: null, onCancel: null, message: '' })
      },
      onCancel: () => {
        // Destroy spell if cancelled
        const field = isPlayerTurn ? playerField : aiField
        const setField = isPlayerTurn ? setPlayerField : setAiField
        const setGy = isPlayerTurn ? setPlayerGraveyard : setAiGraveyard
        const spellCard = field.spells[spellZoneIndex]
        if (spellCard) {
          setGy([...gy, spellCard])
          const newSpells = [...field.spells]
          newSpells[spellZoneIndex] = null
          setField({ ...field, spells: newSpells })
        }
        setGraveyardSelection({ active: false, list: [], onSelect: null, onCancel: null, message: '' })
      }
    })
  }


  const handleHeavyStorm = () => {
    const playerSpells = playerField.spells.filter(s => s !== null)
    const aiSpells = aiField.spells.filter(s => s !== null)
    
    // Send all spells/traps to GY
    setPlayerGraveyard([...playerGraveyard, ...playerSpells])
    setAiGraveyard([...aiGraveyard, ...aiSpells])
    
    // Clear spell/trap zones
    setPlayerField({ ...playerField, spells: [null, null, null, null, null] })
    setAiField({ ...aiField, spells: [null, null, null, null, null] })
    
    alert(`Heavy Storm: Phá hủy tất cả Spell/Trap trên field! (${playerSpells.length + aiSpells.length} cards)`)
  }

  const parseGenericEffect = (card, isPlayerTurn) => {
    const effectText = card.desc.toLowerCase()
    
    // Try to parse common effect patterns
    if (effectText.includes('draw') && effectText.includes('card')) {
      const drawMatch = effectText.match(/draw (\d+) card/i)
      if (drawMatch) {
        const amount = parseInt(drawMatch[1])
        handleDrawEffect(amount, isPlayerTurn)
        return
      }
    }
    
    if (effectText.includes('destroy all monsters')) {
      handleDestroyAllMonsters()
      return
    }
    
    if (effectText.includes('destroy') && effectText.includes('spell') && effectText.includes('trap')) {
      handleDestroySpellTrap(isPlayerTurn)
      return
    }
    
    if (effectText.includes('fusion summon') || effectText.includes('polymerization')) {
      handlePolymerization(isPlayerTurn)
      return
    }
    
    // Fallback: show effect description
    alert(`Kích hoạt: ${card.name}\n\n${card.desc.substring(0, 200)}${card.desc.length > 200 ? '...' : ''}`)
  }

  const handlePolymerization = (isPlayerTurn) => {
    const extraDeck = isPlayerTurn ? player.deck.extra : ai.deck.extra
    const field = isPlayerTurn ? playerField : aiField
    const hand = isPlayerTurn ? playerHand : aiHand
    
    // Get all monsters from hand and field
    const handMonsters = hand.filter(c => c.type.includes('Monster'))
    const fieldMonsters = field.monsters.filter(m => m !== null)
    const allMaterials = [...handMonsters, ...fieldMonsters]
    
    if (allMaterials.length < 2) {
      alert('Cần ít nhất 2 monsters để Fusion Summon!')
      return
    }
    
    // Find possible fusions
    const possibleFusions = findPossibleFusions(allMaterials, extraDeck)
    
    if (possibleFusions.length === 0) {
      alert('Không có Fusion Monster nào có thể triệu hồi với materials hiện tại!')
      return
    }
    
    // Enter fusion mode
    setFusionMode(true)
    setAvailableFusions(possibleFusions)
    setSelectedFusionMaterials([])
    setSelectedFusionMonster(null)
  }

  const findPossibleFusions = (materials, extraDeck) => {
    const possibleFusions = []
    
    extraDeck.forEach(fusionMonster => {
      if (fusionMonster.type.includes('Fusion')) {
        const requirements = parseFusionRequirements(fusionMonster.desc)
        if (canFusionSummon(materials, requirements)) {
          possibleFusions.push({
            monster: fusionMonster,
            requirements: requirements
          })
        }
      }
    })
    
    return possibleFusions
  }

  const parseFusionRequirements = (description) => {
    // Parse fusion requirements from card description
    // This is simplified - real implementation would need comprehensive parsing
    
    if (description.includes('Blue-Eyes White Dragon') && description.includes('Red-Eyes Black Dragon')) {
      return [
        { name: 'Blue-Eyes White Dragon', type: 'specific' },
        { name: 'Red-Eyes Black Dragon', type: 'specific' }
      ]
    }
    
    if (description.includes('Elemental HERO') && description.includes('2 "Elemental HERO"')) {
      return [
        { archetype: 'Elemental HERO', count: 2, type: 'archetype' }
      ]
    }
    
    if (description.includes('Warrior') && description.includes('Spellcaster')) {
      return [
        { race: 'Warrior', type: 'race' },
        { race: 'Spellcaster', type: 'race' }
      ]
    }
    
    // Generic 2 monsters
    return [
      { count: 2, type: 'generic' }
    ]
  }

  const canFusionSummon = (materials, requirements) => {
    // Check if materials can satisfy fusion requirements
    
    for (const req of requirements) {
      if (req.type === 'specific') {
        const hasRequired = materials.some(m => m.name === req.name)
        if (!hasRequired) return false
      } else if (req.type === 'archetype') {
        const archetypeCount = materials.filter(m => m.name.includes(req.archetype)).length
        if (archetypeCount < req.count) return false
      } else if (req.type === 'race') {
        const hasRace = materials.some(m => m.race === req.race)
        if (!hasRace) return false
      } else if (req.type === 'generic') {
        if (materials.length < req.count) return false
      }
    }
    
    return true
  }

  const handleFusionMaterialSelect = (material, source, index) => {
    const materialId = `${source}-${index}`
    const isSelected = selectedFusionMaterials.some(m => m.id === materialId)
    
    if (isSelected) {
      setSelectedFusionMaterials(selectedFusionMaterials.filter(m => m.id !== materialId))
    } else {
      setSelectedFusionMaterials([...selectedFusionMaterials, {
        id: materialId,
        card: material,
        source: source, // 'hand' or 'field'
        index: index
      }])
    }
  }

  const handleSelectFusionMonster = (fusion) => {
    setSelectedFusionMonster(fusion)
  }

  const handleConfirmFusion = () => {
    if (!selectedFusionMonster || selectedFusionMaterials.length < 2) {
      alert('Vui lòng chọn Fusion Monster và ít nhất 2 materials!')
      return
    }
    
    const isPlayerTurn = currentTurn === 'player'
    const field = isPlayerTurn ? playerField : aiField
    const setField = isPlayerTurn ? setPlayerField : setAiField
    const hand = isPlayerTurn ? playerHand : aiHand
    const setHand = isPlayerTurn ? setPlayerHand : setAiHand
    const graveyard = isPlayerTurn ? playerGraveyard : aiGraveyard
    const setGraveyard = isPlayerTurn ? setPlayerGraveyard : setAiGraveyard
    
    // Send materials to GY
    const materialsToGY = selectedFusionMaterials.map(m => m.card)
    setGraveyard([...graveyard, ...materialsToGY])
    
    // Remove materials from hand and field
    const newHand = [...hand]
    const newField = { ...field }
    
    selectedFusionMaterials.forEach(material => {
      if (material.source === 'hand') {
        const handIndex = newHand.findIndex(c => c.id === material.card.id)
        if (handIndex !== -1) {
          newHand.splice(handIndex, 1)
        }
      } else if (material.source === 'field') {
        newField.monsters[material.index] = null
      }
    })
    
    setHand(newHand)
    
    // Find empty monster zone for fusion
    const emptyZoneIndex = newField.monsters.findIndex(m => m === null)
    if (emptyZoneIndex === -1) {
      alert('Không có zone trống để triệu hồi Fusion Monster!')
      return
    }
    
    // Summon fusion monster
    newField.monsters[emptyZoneIndex] = {
      ...selectedFusionMonster.monster,
      faceUp: true,
      position: 'attack',
      justSummoned: true,
      originalAtk: selectedFusionMonster.monster.atk,
      originalDef: selectedFusionMonster.monster.def
    }
    
    setField(newField)
    
    // Show fusion animation
    alert(`🌟 FUSION SUMMON! 🌟\n${selectedFusionMonster.monster.name}\nATK: ${selectedFusionMonster.monster.atk} / DEF: ${selectedFusionMonster.monster.def}`)
    
    // Reset fusion mode
    setFusionMode(false)
    setSelectedFusionMaterials([])
    setAvailableFusions([])
    setSelectedFusionMonster(null)
  }

  const handleCancelFusion = () => {
    setFusionMode(false)
    setSelectedFusionMaterials([])
    setAvailableFusions([])
    setSelectedFusionMonster(null)
  }

  const handleDragStart = (card, index) => {
    // Disabled - using click system now
    return
  }

  const handleDragOver = (e) => {
    e.preventDefault()
  }

  const handleDropOnMonsterZone = (zoneIndex, isCurrentPlayer) => {
    // Disabled - using click system now
    return
  }

  const handleDropOnSpellZone = (zoneIndex, isCurrentPlayer) => {
    // Disabled - using click system now
    return
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

  const handleTakeControl = (monster, fromOwner, toOwner, index, returnAtEndTurn = false) => {
    const fromField = fromOwner === 'player' ? playerField : aiField
    const setFromField = fromOwner === 'player' ? setPlayerField : setAiField
    const toField = toOwner === 'player' ? playerField : aiField
    const setToField = toOwner === 'player' ? setPlayerField : setAiField
    
    // Find empty zone on target field
    const emptyZoneIndex = toField.monsters.findIndex(m => m === null)
    if (emptyZoneIndex === -1) {
      alert('Không còn chỗ trống trên sân để chiếm quái thú!')
      return false
    }
    
    // Remove from source field
    const newFromMonsters = [...fromField.monsters]
    newFromMonsters[index] = null
    setFromField({ ...fromField, monsters: newFromMonsters })
    
    // Add to target field
    const newToMonsters = [...toField.monsters]
    newToMonsters[emptyZoneIndex] = {
      ...monster,
      originalOwner: fromOwner,
      returnAtEndTurn: returnAtEndTurn,
      justSummoned: false // Can attack immediately if it wasn't just summoned this turn? 
      // Usually control effects allow attacking.
    }
    setToField({ ...toField, monsters: newToMonsters })
    return true
  }

  const handleCancelGraveyardSelection = () => {
    if (graveyardSelection.onCancel) {
      graveyardSelection.onCancel()
    }
    setGraveyardSelection({ ...graveyardSelection, active: false })
  }

  const handleCancelTargetSelection = () => {
    if (targetSelection.onCancel) {
      targetSelection.onCancel()
    }
    setTargetSelection({ ...targetSelection, active: false })
  }

  const handleCardClick = (card, type, index, isCurrentPlayer) => {
    // In single player, isCurrentPlayer refers to the bottom (human) side.
    // We only allow interactions if it's the player's turn, OR if selecting a target (which could be on either side).
    if (!isMultiplayer && !targetSelection.active && currentTurn !== 'player' && isCurrentPlayer) return
    if (!isMultiplayer && !targetSelection.active && currentTurn !== 'player' && !isCurrentPlayer && !battlePhase) return

    // If target selection is active
    if (targetSelection.active) {
      const { type: targetType, source: targetSource, onSelect } = targetSelection
      
      // Check if source matches
      const sourceOwner = isCurrentPlayer ? (currentTurn === 'player' ? 'player' : 'ai') : (currentTurn === 'player' ? 'ai' : 'player')
      const sourceMatches = targetSource === 'any' || targetSource === sourceOwner
      
      // Check if type matches
      const typeMatches = targetType === 'any' || targetType === type
      
      if (sourceMatches && typeMatches) {
        onSelect(card, type, index, sourceOwner)
        setTargetSelection({ ...targetSelection, active: false })
      } else {
        alert(`Mục tiêu không hợp lệ! Yêu cầu: ${targetType} từ ${targetSource}`)
      }
      return
    }

    // Close context menu if open
    setContextMenu(null)

    // If clicking on set spell/trap to activate it
    if (type === 'spell' && !card.faceUp && isCurrentPlayer && !battlePhase) {
      // Check if it's a trap (can't activate same turn it was set)
      if (card.type.includes('Trap') && card.canActivate === false) {
        alert('Trap card không thể kích hoạt trong turn được set!')
        return
      }
      
      // Activate the set spell/trap
      handleSetSpellActivation(card, index)
      return
    }

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
  }

  const handleSetSpellActivation = (card, zoneIndex) => {
    const isPlayerTurn = currentTurn === 'player'
    const field = isPlayerTurn ? playerField : aiField
    const setField = isPlayerTurn ? setPlayerField : setAiField
    const graveyard = isPlayerTurn ? playerGraveyard : aiGraveyard
    const setGraveyard = isPlayerTurn ? setPlayerGraveyard : setAiGraveyard

    const spellType = card.race || ''

    // Flip the card face-up
    const newSpells = [...field.spells]
    newSpells[zoneIndex] = {
      ...card,
      faceUp: true,
      isActive: true
    }
    setField({ ...field, spells: newSpells })

    // Show activation
    setActivatingSpell(card)

    // If it's not continuous/field/equip, send to GY after effect
    if (!spellType.includes('Continuous') && !spellType.includes('Field') && !spellType.includes('Equip')) {
      setTimeout(() => {
        setActivatingSpell(null)
        // Remove from field and send to GY
        setField(prevField => {
          const finalSpells = [...prevField.spells]
          finalSpells[zoneIndex] = null
          return { ...prevField, spells: finalSpells }
        })
        setGraveyard(prevGY => [...prevGY, card])
      }, 3000)
    } else {
      setTimeout(() => setActivatingSpell(null), 3000)
    }

    // Apply effect
    applySpellEffect(card, isPlayerTurn, zoneIndex)
  }

  const handleRightClick = (e, card, type, index, isCurrentPlayer) => {
    e.preventDefault()
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      card,
      type,
      index,
      isCurrentPlayer
    })
  }

  const handleSendToGY = () => {
    if (!contextMenu) return

    const { card, type, index, isCurrentPlayer } = contextMenu
    const field = isCurrentPlayer ? 
      (currentTurn === 'player' ? playerField : aiField) : 
      (currentTurn === 'player' ? aiField : playerField)
    const setField = isCurrentPlayer ? 
      (currentTurn === 'player' ? setPlayerField : setAiField) : 
      (currentTurn === 'player' ? setAiField : setPlayerField)
    const graveyard = isCurrentPlayer ?
      (currentTurn === 'player' ? playerGraveyard : aiGraveyard) :
      (currentTurn === 'player' ? aiGraveyard : playerGraveyard)
    const setGraveyard = isCurrentPlayer ?
      (currentTurn === 'player' ? setPlayerGraveyard : setAiGraveyard) :
      (currentTurn === 'player' ? setAiGraveyard : setPlayerGraveyard)

    // Add to graveyard
    setGraveyard([...graveyard, card])

    // Remove from field
    if (type === 'monster') {
      const newMonsters = [...field.monsters]
      newMonsters[index] = null
      setField({ ...field, monsters: newMonsters })
    } else {
      const newSpells = [...field.spells]
      newSpells[index] = null
      setField({ ...field, spells: newSpells })
    }

    setContextMenu(null)
  }

  const handleTributeSelect = (monster) => {
    if (!tributeCard) return

    const isAlreadySelected = selectedTributes.some(m => m.id === monster.id)
    
    if (isAlreadySelected) {
      // Deselect
      setSelectedTributes(selectedTributes.filter(m => m.id !== monster.id))
    } else {
      // Select
      if (selectedTributes.length < tributeCard.tributesNeeded) {
        setSelectedTributes([...selectedTributes, monster])
      }
    }
  }

  const handleConfirmTribute = (faceUp) => {
    if (!tributeCard || selectedTributes.length !== tributeCard.tributesNeeded) {
      alert(`Vui lòng chọn ${tributeCard.tributesNeeded} monster để tribute!`)
      return
    }

    if (!selectedHandCard) return

    const isPlayerTurn = currentTurn === 'player'
    const field = isPlayerTurn ? playerField : aiField
    const setField = isPlayerTurn ? setPlayerField : setAiField
    const graveyard = isPlayerTurn ? playerGraveyard : aiGraveyard
    const setGraveyard = isPlayerTurn ? setPlayerGraveyard : setAiGraveyard
    const hand = isPlayerTurn ? playerHand : aiHand
    const setHand = isPlayerTurn ? setPlayerHand : setAiHand

    // Close tribute modal first
    setTributeMode(false)

    // Show tribute animation with video
    const tributeAnimation = document.createElement('div')
    tributeAnimation.className = 'tribute-summon-animation'
    tributeAnimation.innerHTML = `
      <video class="tribute-video" autoplay muted playsinline>
        <source src="/sounds/tribute-summon.mp4" type="video/mp4">
      </video>
      <div class="tribute-overlay">
        <div class="tribute-flash"></div>
        <div class="tribute-particles">
          ${Array(20).fill(0).map((_, i) => `<div class="particle" style="--angle: ${i * 18}deg"></div>`).join('')}
        </div>
        <div class="tribute-text">
          <h2>🔥 TRIBUTE SUMMON! 🔥</h2>
          <p>${tributeCard.card.name}</p>
        </div>
      </div>
    `
    document.body.appendChild(tributeAnimation)

    // Add screen shake
    document.querySelector('.duel-field').classList.add('screen-shake')

    // Get video element and handle its end
    const video = tributeAnimation.querySelector('.tribute-video')
    const animationDuration = 2000 // 2 seconds for video + effects

    // Wait for animation
    setTimeout(() => {
      // Send tributed monsters to GY
      setGraveyard([...graveyard, ...selectedTributes.map(m => m.card)])

      // Remove tributed monsters from field
      const newMonsters = [...field.monsters]
      selectedTributes.forEach(monster => {
        const index = newMonsters.findIndex(m => m && m.id === monster.card.id)
        if (index !== -1) {
          newMonsters[index] = null
        }
      })

      // Find first empty zone to place new monster
      const emptyZoneIndex = newMonsters.findIndex(m => m === null)
      if (emptyZoneIndex === -1) {
        alert('Không có zone trống!')
        tributeAnimation.remove()
        document.querySelector('.duel-field').classList.remove('screen-shake')
        return
      }

      // Place new monster (use faceUp from tributeCard if set during tribute selection)
      const shouldBeFaceUp = tributeCard.faceUp !== undefined ? tributeCard.faceUp : faceUp
      newMonsters[emptyZoneIndex] = {
        ...tributeCard.card,
        faceUp: shouldBeFaceUp,
        position: shouldBeFaceUp ? 'attack' : 'defense',
        justSummoned: true,
        originalAtk: tributeCard.card.atk,
        originalDef: tributeCard.card.def
      }

      setField({ ...field, monsters: newMonsters })

      // Remove from hand
      const newHand = hand.filter((_, i) => i !== selectedHandCard.index)
      setHand(newHand)
      
      // Mark normal summon as used
      setNormalSummonUsed(true)

      // Remove animation and shake
      setTimeout(() => {
        tributeAnimation.remove()
        document.querySelector('.duel-field').classList.remove('screen-shake')
        
        // Remove justSummoned flag after animation
        setTimeout(() => {
          const finalMonsters = [...newMonsters]
          if (finalMonsters[emptyZoneIndex]) {
            delete finalMonsters[emptyZoneIndex].justSummoned
            setField({ ...field, monsters: finalMonsters })
          }
        }, 1000)
      }, 500)

      // Reset states
      setSelectedTributes([])
      setTributeCard(null)
      setSelectedHandCard(null)
    }, animationDuration)
  }

  const handleCancelTribute = () => {
    setTributeMode(false)
    setSelectedTributes([])
    setTributeCard(null)
  }

  const handleBattle = (attacker, defender) => {
    if (attacker.card.cannotAttack) {
      alert(`${attacker.card.name} không thể tấn công do ảnh hưởng của hiệu ứng!`)
      return
    }

    const isPlayerAttacking = currentTurn === 'player'
    const defenderField = isPlayerAttacking ? aiField : playerField
    const hasFaceDownSpells = defenderField.spells.some(s => s && !s.faceUp)

    if (hasFaceDownSpells) {
      setChainPrompt({
        active: true,
        player: isPlayerAttacking ? 'ai' : 'player',
        sourceAction: `${attacker.card.name} tuyên bố tấn công!`,
        onResolve: () => executeBattleCalculation(attacker, defender),
        onCancel: () => executeBattleCalculation(attacker, defender),
        context: { type: 'attack', attacker, defender }
      })
      return
    }

    executeBattleCalculation(attacker, defender)
  }

  const executeBattleCalculation = (attacker, defender) => {
    // Re-verify attacker still exists on field
    const isPlayerAttacking = currentTurn === 'player'
    const freshAttackerField = isPlayerAttacking ? playerFieldRef.current : aiFieldRef.current
    if (!freshAttackerField.monsters[attacker.index] || freshAttackerField.monsters[attacker.index].id !== attacker.card.id) {
      console.log("Attack cancelled: Attacker no longer on field or changed")
      return
    }

    // Re-verify defender still exists on field
    const freshDefenderField = isPlayerAttacking ? aiFieldRef.current : playerFieldRef.current
    if (!freshDefenderField.monsters[defender.index] || freshDefenderField.monsters[defender.index].id !== defender.card.id) {
       console.log("Attack cancelled: Defender no longer on field or changed")
       return
    }

    const attackerCard = attacker.card
    const defenderCard = defender.card
    
    const setAttackerField = isPlayerAttacking ? setPlayerField : setAiField
    const setDefenderField = isPlayerAttacking ? setAiField : setPlayerField
    const setAttackerGY = isPlayerAttacking ? setPlayerGraveyard : setAiGraveyard
    const setDefenderGY = isPlayerAttacking ? setAiGraveyard : setPlayerGraveyard

    let battleLog = ''
    let damage = 0

    // Battle calculation
    if (defenderCard.faceUp) {
      if (defenderCard.position === 'attack') {
        const atkDiff = attackerCard.atk - defenderCard.atk
        if (atkDiff > 0) {
          battleLog = `${attackerCard.name} (${attackerCard.atk}) phá hủy ${defenderCard.name} (${defenderCard.atk})!`
          damage = atkDiff
          setDefenderField(prev => {
            const next = { ...prev, monsters: [...prev.monsters] }
            next.monsters[defender.index] = null
            if (isPlayerAttacking) aiFieldRef.current = next
            else playerFieldRef.current = next
            return next
          })
          setDefenderGY(prev => [...prev, defenderCard])
          const target = isPlayerAttacking ? 'ai' : 'player'
          if (!checkForHandTraps(target, damage, (finalAmt) => animateLP(target, finalAmt))) {
            animateLP(target, damage)
          }
        } else if (atkDiff < 0) {
          battleLog = `${defenderCard.name} (${defenderCard.atk}) phá hủy ${attackerCard.name} (${attackerCard.atk})!`
          damage = Math.abs(atkDiff)
          setAttackerField(prev => {
            const next = { ...prev, monsters: [...prev.monsters] }
            next.monsters[attacker.index] = null
            if (isPlayerAttacking) playerFieldRef.current = next
            else aiFieldRef.current = next
            return next
          })
          setAttackerGY(prev => [...prev, attackerCard])
          const target = isPlayerAttacking ? 'player' : 'ai'
          if (!checkForHandTraps(target, damage, (finalAmt) => animateLP(target, finalAmt))) {
            animateLP(target, damage)
          }
        } else {
          battleLog = `Cả hai quái thú bị phá hủy!`
          setAttackerField(prev => {
            const next = { ...prev, monsters: [...prev.monsters] }
            next.monsters[attacker.index] = null
            if (isPlayerAttacking) playerFieldRef.current = next
            else aiFieldRef.current = next
            return next
          })
          setDefenderField(prev => {
            const next = { ...prev, monsters: [...prev.monsters] }
            next.monsters[defender.index] = null
            if (isPlayerAttacking) aiFieldRef.current = next
            else playerFieldRef.current = next
            return next
          })
          setAttackerGY(prev => [...prev, attackerCard])
          setDefenderGY(prev => [...prev, defenderCard])
        }
      } else {
        const atkVsDef = attackerCard.atk - defenderCard.def
        if (atkVsDef > 0) {
          battleLog = `${attackerCard.name} (${attackerCard.atk}) phá hủy ${defenderCard.name} (DEF ${defenderCard.def})!`
          setDefenderField(prev => {
            const next = { ...prev, monsters: [...prev.monsters] }
            next.monsters[defender.index] = null
            if (isPlayerAttacking) aiFieldRef.current = next
            else playerFieldRef.current = next
            return next
          })
          setDefenderGY(prev => [...prev, defenderCard])
        } else if (atkVsDef < 0) {
          battleLog = `${defenderCard.name} (DEF ${defenderCard.def}) chặn được tấn công!`
          damage = Math.abs(atkVsDef)
          const target = isPlayerAttacking ? 'player' : 'ai'
          if (!checkForHandTraps(target, damage, (finalAmt) => animateLP(target, finalAmt))) {
            animateLP(target, damage)
          }
        } else {
          battleLog = `Không có damage!`
        }
      }
    } else {
      const defenderOwner = isPlayerAttacking ? 'ai' : 'player'
      setDefenderField(prev => {
        const next = { ...prev, monsters: [...prev.monsters] }
        next.monsters[defender.index] = { ...defenderCard, faceUp: true }
        if (isPlayerAttacking) aiFieldRef.current = next
        else playerFieldRef.current = next
        return next
      })
      handleFlipEffect(defenderCard, defender.index, defenderOwner)
      const atkVsDef = attackerCard.atk - defenderCard.def
      if (atkVsDef > 0) {
        battleLog = `Lật bài: ${defenderCard.name} (DEF ${defenderCard.def}) bị phá hủy!`
        setDefenderGY(prev => [...prev, defenderCard])
        setDefenderField(prev => {
          const next = { ...prev, monsters: [...prev.monsters] }
          next.monsters[defender.index] = null
          if (isPlayerAttacking) aiFieldRef.current = next
          else playerFieldRef.current = next
          return next
        })
      } else if (atkVsDef < 0) {
        battleLog = `Lật bài: ${defenderCard.name} (DEF ${defenderCard.def}) chặn được!`
        damage = Math.abs(atkVsDef)
        const target = isPlayerAttacking ? 'player' : 'ai'
        if (!checkForHandTraps(target, damage, (finalAmt) => animateLP(target, finalAmt))) {
          animateLP(target, damage)
        }
      } else {
        battleLog = `Lật bài: ${defenderCard.name} - Không có damage!`
      }
    }

    alert(battleLog + (damage > 0 ? ` Damage: ${damage}` : ''))
    setSelectedAttacker(null)
  }

  const handleDirectAttack = (aiAttacker = null) => {
    const attacker = aiAttacker || selectedAttacker
    if (!attacker) return
    const attackerCard = attacker.card
    const isPlayerAttacking = currentTurn === 'player'
    
    // Check if opponent has no monsters
    const opponentField = isPlayerAttacking ? aiField : playerField
    const hasMonsters = opponentField.monsters.some(m => m !== null)
    
    if (hasMonsters) {
      alert('Đối thủ còn quái thú trên sân!')
      return
    }

    const hasFaceDownSpells = opponentField.spells.some(s => s && !s.faceUp)

    if (hasFaceDownSpells) {
      setChainPrompt({
        active: true,
        player: isPlayerAttacking ? 'ai' : 'player',
        sourceAction: `${attackerCard.name} tấn công trực tiếp!`,
        onResolve: () => executeDirectAttack(aiAttacker),
        onCancel: () => executeDirectAttack(aiAttacker),
        context: { type: 'direct_attack', attacker }
      })
      return
    }

    executeDirectAttack(aiAttacker)
  }

  const executeDirectAttack = (aiAttacker = null) => {
    const attacker = aiAttacker || selectedAttacker
    if (!attacker) return

    // Re-verify attacker still exists on field
    const isPlayerAttacking = currentTurn === 'player'
    const freshAttackerField = isPlayerAttacking ? playerFieldRef.current : aiFieldRef.current
    if (!freshAttackerField.monsters[attacker.index] || freshAttackerField.monsters[attacker.index].id !== attacker.card.id) {
      console.log("Direct Attack cancelled: Attacker no longer on field")
      if (!aiAttacker) setSelectedAttacker(null)
      return
    }

    const attackerCard = attacker.card
    
    // Re-check monsters
    const opponentField = isPlayerAttacking ? aiFieldRef.current : playerFieldRef.current
    const hasMonsters = opponentField.monsters.some(m => m !== null)
    if (hasMonsters) {
      alert('Tấn công trực tiếp bị hủy vì đối thủ có quái thú mởi trên sân!')
      if (!aiAttacker) setSelectedAttacker(null)
      return
    }

    // Direct attack
    const damage = attackerCard.atk
    
    // Direct attack with hand trap check
    const target = isPlayerAttacking ? 'ai' : 'player'
    if (!checkForHandTraps(target, damage, (finalAmt) => animateLP(target, finalAmt))) {
      animateLP(target, damage)
    }

    alert(`${attackerCard.name} tấn công trực tiếp! Damage: ${damage}`)
    if (!aiAttacker) setSelectedAttacker(null)
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
    <div className={`duel-field ${targetSelection.active ? 'target-selection-active' : ''}`}>
      {/* Game Over Modal */}
      {gameOver && (
        <div className="game-over-modal">
          <div className="game-over-content">
            <div className="game-over-header">
              {winner === 'player' ? (
                <>
                  <h1 className="victory-text">🎉 VICTORY! 🎉</h1>
                  <div className="winner-info">
                    <img src={player.avatar} alt={player.name} className="winner-avatar" />
                    <h2>{player.name} Wins!</h2>
                  </div>
                </>
              ) : (
                <>
                  <h1 className="defeat-text">💔 DEFEAT 💔</h1>
                  <div className="winner-info">
                    <img src={ai.avatar} alt={ai.name} className="winner-avatar" />
                    <h2>{ai.name} Wins!</h2>
                  </div>
                </>
              )}
            </div>
            
            <div className="final-scores">
              <div className="score-item">
                <img src={player.avatar} alt={player.name} className="score-avatar" />
                <div className="score-details">
                  <span className="score-name">{player.name}</span>
                  <span className="score-lp">LP: {playerLP}</span>
                </div>
              </div>
              <div className="vs-divider">VS</div>
              <div className="score-item">
                <img src={ai.avatar} alt={ai.name} className="score-avatar" />
                <div className="score-details">
                  <span className="score-name">{ai.name}</span>
                  <span className="score-lp">LP: {aiLP}</span>
                </div>
              </div>
            </div>

            {progressData && (
              <div className="progress-section">
                <div className="progress-stats">
                  <div className="stat-box exp">
                    <span className="stat-label">EXP</span>
                    <span className="stat-value">+{progressData.expGained}</span>
                  </div>
                  <div className="stat-box gold">
                    <span className="stat-label">GOLD</span>
                    <span className="stat-value">+{progressData.goldGained}</span>
                  </div>
                </div>
                
                <div className="level-info">
                  <div className="level-badge">LV {progressData.level}</div>
                  <div className="exp-bar-container">
                    <div 
                      className="exp-bar-fill" 
                      style={{ width: `${(progressData.exp / progressData.nextLevelExp) * 100}%` }}
                    />
                    <span className="exp-text">{progressData.exp} / {progressData.nextLevelExp}</span>
                  </div>
                </div>

                {progressData.leveledUp && (
                  <div className="level-up-msg">🎊 LEVEL UP! 🎊</div>
                )}
                
                {progressData.unlockedCharacters && progressData.unlockedCharacters.length > 0 && (
                  <div className="unlock-section">
                    <h4>New Characters Unlocked:</h4>
                    <div className="unlock-list">
                      {progressData.unlockedCharacters.map((charName, i) => (
                        <div key={i} className="unlock-item">🔓 {charName}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="game-over-buttons">
              <button 
                className="game-over-btn rematch"
                onClick={() => window.location.reload()}
              >
                🔄 Rematch
              </button>
              <button 
                className="game-over-btn menu"
                onClick={() => navigate('/character-select')}
              >
                🏠 Character Select
              </button>
              <button 
                className="game-over-btn home"
                onClick={() => navigate('/')}
              >
                🏡 Home
              </button>
            </div>
          </div>
        </div>
      )}

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

      {/* Graveyard Selection Modal */}

      {graveyardSelection.active && (
        <div className="discard-modal" onClick={handleCancelGraveyardSelection}>
          <div className="discard-content" onClick={(e) => e.stopPropagation()}>
            <div className="discard-header">
              <h2>Nghĩa Địa</h2>
              <p className="discard-instruction">{graveyardSelection.message}</p>
            </div>
            <div className="discard-cards-grid">
              {graveyardSelection.list.map((card, i) => (
                <div 
                  key={i} 
                  className="discard-card"
                  onClick={() => graveyardSelection.onSelect(card)}
                >
                  <img src={card.image_url} alt={card.name} />
                  <div className="discard-card-name">{card.name}</div>
                </div>
              ))}
            </div>
            <div className="discard-buttons">
              <button 
                className="discard-btn"
                onClick={handleCancelGraveyardSelection}
              >
                Hủy bỏ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deck Selection Modal */}
      {deckSelection.active && (
        <div className="discard-modal" onClick={() => setDeckSelection({ ...deckSelection, active: false })}>
          <div className="discard-content" onClick={(e) => e.stopPropagation()}>
            <div className="discard-header">
              <h2>Bộ Bài (Deck)</h2>
              <p className="discard-instruction">{deckSelection.message}</p>
            </div>
            <div className="discard-cards-grid">
              {deckSelection.list.map((card, i) => (
                <div 
                  key={i} 
                  className="discard-card"
                  onClick={() => deckSelection.onSelect(card)}
                >
                  <img src={card.image_url} alt={card.name} />
                  <div className="discard-card-name">{card.name}</div>
                </div>
              ))}
            </div>
            <div className="discard-buttons">
              <button 
                className="discard-btn"
                onClick={() => setDeckSelection({ ...deckSelection, active: false })}
              >
                Hủy bỏ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Target Selection Overlay */}
      {targetSelection.active && (
        <div className="target-selection-overlay">
          <div className="target-selection-content">
            <div className="target-selection-pulse"></div>
            <h3>🎯 Chọn mục tiêu</h3>
            <p>{targetSelection.message}</p>
            <button 
              className="target-cancel-btn"
              onClick={handleCancelTargetSelection}
            >
              Hủy chọn
            </button>
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
        {(isMultiplayer ? aiHand : aiHand).map((card, i) => (
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
            {aiDeck.length > 0 && (
              <div className="deck-count">{aiDeck.length}</div>
            )}
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
          {/* AI Spell/Trap Zones */}
          <div className="spell-trap-zones ai-spells">
            {aiField.spells.map((card, i) => (
              <div 
                key={i} 
                className={`zone spell-trap-zone ${chainPrompt.active && chainPrompt.player === 'ai' && card && !card.faceUp ? 'chain-target' : ''}`}
                onClick={() => {
                  if (chainPrompt.active && chainPrompt.player === 'ai' && card && !card.faceUp) {
                    if (isMultiplayer && roomId) {
                      socket.emit('chain-response', { roomId, response: 'yes' })
                    }
                    activateSetCard(card, i, 'ai')
                  }
                }}
              >
                {card ? (
                  card.faceUp ? (
                    <img 
                      src={card.image_url} 
                      alt={card.name}
                      className="field-card"
                      onMouseEnter={() => setHoveredCard(card)}
                      onMouseLeave={() => setHoveredCard(null)}
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

          {/* Phase Indicator - Center Overlay */}
          <div className="phase-indicator-overlay">
            <div className={`phase-item ${currentPhase === 'DRAW' ? 'active' : ''}`}>DP</div>
            <div className={`phase-item ${currentPhase === 'STANDBY' ? 'active' : ''}`}>SP</div>
            <div className={`phase-item ${currentPhase === 'MAIN1' ? 'active' : ''}`}>M1</div>
            <div className={`phase-item ${currentPhase === 'BATTLE' ? 'active' : ''}`}>BP</div>
            <div className={`phase-item ${currentPhase === 'MAIN2' ? 'active' : ''}`}>M2</div>
            <div className={`phase-item ${currentPhase === 'END' ? 'active' : ''}`}>EP</div>
          </div>

          {/* AI Monster Zones */}
          <div className="monster-zones ai-monsters">
            {aiField.monsters.map((card, i) => (
              <div 
                key={i} 
                className={`zone monster-zone ${currentPhase === 'BATTLE' && card ? 'battle-target' : ''}`}
                onClick={() => card && currentPhase === 'BATTLE' && selectedAttacker && handleCardClick(card, 'monster', i, false)}
                onMouseEnter={() => card && card.faceUp && setHoveredCard(card)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                {card ? (
                  card.faceUp ? (
                    <div className={`monster-card-container ${card.buffType || ''}`}>
                      <img 
                        src={card.image_url} 
                        alt={card.name}
                        className={`field-card ${card.position}`}
                      />
                      <div className="atk-def-overlay">
                        <div className="atk-value">{card.atk}</div>
                        <div className="def-value">{card.def}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="card-back"></div>
                  )
                ) : (
                  <div className="card-placeholder"></div>
                )}
              </div>
            ))}
          </div>

          {/* Player Monster Zones */}
          <div className="monster-zones player-monsters">
            {playerField.monsters.map((card, i) => (
              <div 
                key={i} 
                className={`zone monster-zone ${selectedAttacker?.index === i ? 'selected-attacker' : ''} ${selectingZone && selectedHandCard?.card.type.includes('Monster') ? 'zone-selectable' : ''} ${fusionMode && card ? 'fusion-material-selectable' : ''} ${fusionMode && selectedFusionMaterials.some(m => m.id === `field-${i}`) ? 'selected-fusion-material' : ''}`}
                onClick={() => {
                  if (fusionMode && card) {
                    handleFusionMaterialSelect(card, 'field', i)
                  } else if (selectingZone && !card && selectedHandCard?.card.type.includes('Monster')) {
                    handleZoneSelect(i, 'monster')
                  } else if (card) {
                    handleCardClick(card, 'monster', i, true)
                  }
                }}
                onMouseEnter={() => card && setHoveredCard(card)}
                onMouseLeave={() => setHoveredCard(null)}
                onContextMenu={(e) => !selectingZone && !fusionMode && card && handleRightClick(e, card, 'monster', i, true)}
              >
                {card ? (
                  card.faceUp ? (
                    <div className={`monster-card-container ${card.buffType || ''}`}>
                      <img 
                        src={card.image_url} 
                        alt={card.name}
                        className={`field-card ${card.position} ${card.justSummoned ? 'just-summoned' : ''}`}
                      />
                      <div className="atk-def-overlay">
                        <div className="atk-value">{card.atk}</div>
                        <div className="def-value">{card.def}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="card-back"></div>
                  )
                ) : (
                  <div className="card-placeholder"></div>
                )}
              </div>
            ))}
          </div>

          {/* Player Spell/Trap Zones */}
          <div className="spell-trap-zones player-spells">
            {playerField.spells.map((card, i) => (
              <div 
                key={i} 
                className={`zone spell-trap-zone ${selectingZone && (selectedHandCard?.card.type.includes('Spell') || selectedHandCard?.card.type.includes('Trap')) ? 'zone-selectable' : ''} ${card && !card.faceUp ? 'has-set-card' : ''} ${chainPrompt.active && chainPrompt.player === 'player' && card && !card.faceUp ? 'chain-target' : ''}`}
                onClick={() => {
                  if (chainPrompt.active && chainPrompt.player === 'player' && card && !card.faceUp) {
                    if (isMultiplayer && roomId) {
                      socket.emit('chain-response', { roomId, response: 'yes' })
                    }
                    activateSetCard(card, i, 'player')
                  } else if (selectingZone && !card && (selectedHandCard?.card.type.includes('Spell') || selectedHandCard?.card.type.includes('Trap'))) {
                    handleZoneSelect(i, 'spell')
                  }
                }}
                onMouseEnter={() => card && setHoveredCard(card)}
                onMouseLeave={() => setHoveredCard(null)}
                onContextMenu={(e) => !selectingZone && card && handleRightClick(e, card, 'spell', i, true)}
              >
                {card ? (
                  card.faceUp ? (
                    <img 
                      src={card.image_url} 
                      alt={card.name}
                      className="field-card"
                    />
                  ) : (
                    <div className="card-back set-card-glow"></div>
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
            {playerDeck.length > 0 && (
              <div className="deck-count">{playerDeck.length}</div>
            )}
          </div>
          <div className="zone graveyard-zone" onClick={() => handleGraveyardClick('player')}>
            <div className="card-placeholder">GY</div>
            {playerGraveyard.length > 0 && (
              <div className="gy-count">{playerGraveyard.length}</div>
            )}
          </div>
          <button 
            className={`battle-btn ${currentTurn === 'ai' ? 'disabled' : ''}`} 
            onClick={handleEndTurn}
            disabled={currentTurn === 'ai'}
          >
            <span className="battle-text">End Turn</span>
          </button>
          <button 
            className={`battle-btn ${currentPhase === 'BATTLE' ? 'battle-active' : ''} ${currentTurn === 'ai' ? 'disabled' : ''}`}
            onClick={() => {
              if (currentTurn === 'player') {
                if (currentPhase === 'MAIN1') {
                  setCurrentPhase('BATTLE')
                } else if (currentPhase === 'BATTLE') {
                  setCurrentPhase('MAIN2')
                }
                setSelectedAttacker(null)
              }
            }}
            disabled={currentTurn === 'ai' || (currentPhase !== 'MAIN1' && currentPhase !== 'BATTLE')}
          >
            <span className="battle-text">
              {currentPhase === 'MAIN1' ? 'Enter Battle' : (currentPhase === 'BATTLE' ? 'End Battle' : 'Battle')}
            </span>
          </button>
          {currentPhase === 'BATTLE' && selectedAttacker && (
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
        {playerHand.map((card, i) => (
          <div 
            key={i} 
            className={`hand-card ${selectedHandCard?.index === i ? 'selected-hand-card' : ''} ${fusionMode && card.type.includes('Monster') ? 'fusion-material-selectable' : ''} ${fusionMode && selectedFusionMaterials.some(m => m.id === `hand-${i}`) ? 'selected-fusion-material' : ''}`}
            onMouseEnter={() => setHoveredCard(card)}
            onMouseLeave={() => setHoveredCard(null)}
            onClick={() => {
              if (fusionMode && card.type.includes('Monster')) {
                handleFusionMaterialSelect(card, 'hand', i)
              } else if (chainPrompt.active && chainPrompt.player === 'player' && card.name.toLowerCase().includes('kuriboh')) {
                // Activate Kuriboh
                if (isMultiplayer && roomId) {
                  socket.emit('chain-response', { roomId, response: 'yes' })
                }
                handleActivateKuriboh(i)
              } else if (currentTurn === 'player') {
                handleHandCardClick(card, i)
              }
            }}
            onContextMenu={(e) => {
              if (!fusionMode) {
                e.preventDefault()
                setContextMenu({
                  x: e.clientX,
                  y: e.clientY,
                  card,
                  type: 'hand',
                  index: i,
                  isCurrentPlayer: true
                })
              }
            }}
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
        {currentTurn === 'ai' && ai?.difficulty && (
          <div className="ai-difficulty-badge">
            {'⭐'.repeat(ai.difficulty)} AI
          </div>
        )}
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

      {/* Hand Card Summon Options */}
      {selectedHandCard && !tributeMode && !selectingZone && (
        <div className="summon-options-modal">
          <div className="summon-options-content">
            <div className="summon-options-header">
              <img src={selectedHandCard.card.image_url} alt={selectedHandCard.card.name} className="summon-card-preview" />
              <h3>{selectedHandCard.card.name}</h3>
              {selectedHandCard.card.level && <p>⭐ Level {selectedHandCard.card.level}</p>}
            </div>

            <div className="summon-options-buttons">
              {selectedHandCard.card.type.includes('Monster') && (
                <>
                  {(selectedHandCard.card.level || 0) < 5 && (
                    <>
                      <button 
                        className="summon-option-btn normal"
                        onClick={() => handleSummonOption('normal')}
                      >
                        ⚔️ Triệu hồi thường (Tấn công)
                      </button>
                      <button 
                        className="summon-option-btn defense"
                        onClick={() => handleSummonOption('defense')}
                      >
                        🛡️ Triệu hồi thường (Phòng thủ)
                      </button>
                      <button 
                        className="summon-option-btn set"
                        onClick={() => handleSummonOption('set')}
                      >
                        🎴 Úp bài (Thế thủ)
                      </button>
                    </>
                  )}
                  {(selectedHandCard.card.level || 0) >= 5 && (
                    <button 
                      className="summon-option-btn tribute"
                      onClick={() => handleSummonOption('tribute')}
                    >
                      🔥 Triệu hồi hiến tế
                    </button>
                  )}
                </>
              )}
              {(selectedHandCard.card.type.includes('Spell') || selectedHandCard.card.type.includes('Trap')) && (
                <>
                  {selectedHandCard.card.type.includes('Spell') && (
                    <button 
                      className="summon-option-btn activate"
                      onClick={() => {
                        setSummonMode('activate')
                        setSelectingZone(true)
                      }}
                    >
                      ✨ Kích hoạt
                    </button>
                  )}
                  <button 
                    className="summon-option-btn set"
                    onClick={() => handleSummonOption('set')}
                  >
                    🎴 Úp bài
                  </button>
                </>
              )}
              <button 
                className="summon-option-btn cancel"
                onClick={() => setSelectedHandCard(null)}
              >
                ❌ Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tribute Mode Modal */}
      {tributeMode && tributeCard && (
        <div className="tribute-modal" onClick={handleCancelTribute}>
          <div className="tribute-content" onClick={(e) => e.stopPropagation()}>
            <div className="tribute-header">
              <h2>🔥 Tribute Summon</h2>
              <p>Chọn {tributeCard.tributesNeeded} monster để hiến tế</p>
            </div>

            <div className="tribute-target-card">
              <img src={tributeCard.card.image_url} alt={tributeCard.card.name} />
              <div className="tribute-target-info">
                <h3>{tributeCard.card.name}</h3>
                <p>⭐ Level {tributeCard.card.level}</p>
                <p>ATK: {tributeCard.card.atk} / DEF: {tributeCard.card.def}</p>
              </div>
            </div>
            
            <div className="tribute-selection-status">
              <p>Đã chọn: {selectedTributes.length} / {tributeCard.tributesNeeded}</p>
            </div>

            <div className="tribute-monsters-grid">
              {tributeCard.availableMonsters.map((monster, index) => {
                const isSelected = selectedTributes.some(m => m.id === monster.id)
                return (
                  <div 
                    key={index}
                    className={`tribute-monster-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleTributeSelect({ id: monster.id, card: monster, index })}
                  >
                    <img src={monster.image_url} alt={monster.name} />
                    <div className="tribute-monster-name">{monster.name}</div>
                    {isSelected && <div className="selected-badge">✓</div>}
                  </div>
                )
              })}
            </div>

            <div className="tribute-buttons">
              {selectedTributes.length === tributeCard.tributesNeeded && (
                <button 
                  className="tribute-btn summon"
                  onClick={() => handleConfirmTribute(true)}
                >
                  ⚔️ Tribute Summon
                </button>
              )}
              <button 
                className="tribute-btn cancel"
                onClick={handleCancelTribute}
              >
                ❌ Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Context Menu */}
      {contextMenu && (
        <>
          <div className="context-menu-overlay" onClick={() => setContextMenu(null)} />
          <div 
            className="context-menu"
            style={{ top: contextMenu.y, left: contextMenu.x }}
          >
            <div className="context-menu-header">
              {contextMenu.card.name}
            </div>

            {/* Activate Effect option for Effect Monsters */}
            {contextMenu.type === 'monster' && contextMenu.card.type.includes('Effect') && contextMenu.isCurrentPlayer && contextMenu.card.faceUp && (currentPhase === 'MAIN1' || currentPhase === 'MAIN2') && (
              <button 
                className="context-menu-item activate"
                onClick={() => {
                  handleActivateMonsterEffect(contextMenu.card, contextMenu.index)
                  setContextMenu(null)
                }}
              >
                🪄 Kích hoạt Hiệu ứng
              </button>
            )}
            
            {/* Change position option for monsters */}
            {contextMenu.type === 'monster' && contextMenu.isCurrentPlayer && (currentPhase === 'MAIN1' || currentPhase === 'MAIN2') && (
              <>
                {contextMenu.card.faceUp ? (
                  <button 
                    className="context-menu-item position"
                    onClick={() => {
                      const field = currentTurn === 'player' ? playerField : aiField
                      const setField = currentTurn === 'player' ? setPlayerField : setAiField
                      const newMonsters = [...field.monsters]
                      newMonsters[contextMenu.index] = {
                        ...contextMenu.card,
                        position: contextMenu.card.position === 'attack' ? 'defense' : 'attack'
                      }
                      setField({ ...field, monsters: newMonsters })
                      setContextMenu(null)
                    }}
                  >
                    {contextMenu.card.position === 'attack' ? '🛡️ Chuyển sang Thế Thủ' : '⚔️ Chuyển sang Tấn Công'}
                  </button>
                ) : (
                  // Flip Summon option for Face-down monsters
                  <button 
                    className="context-menu-item position"
                    onClick={() => {
                      const field = currentTurn === 'player' ? playerField : aiField
                      const setField = currentTurn === 'player' ? setPlayerField : setAiField
                      const newMonsters = [...field.monsters]
                      const flippedCard = { ...contextMenu.card, faceUp: true, position: 'attack' }
                      newMonsters[contextMenu.index] = flippedCard
                      setField({ ...field, monsters: newMonsters })
                      
                      // Trigger Flip Effect
                      handleFlipEffect(flippedCard, contextMenu.index, currentTurn)
                      
                      setContextMenu(null)
                      alert(`Flip Summon: ${flippedCard.name}!`)
                    }}
                  >
                    ⚔️ Lật Bài (Flip Summon)
                  </button>
                )}
              </>
            )}
            
            {/* Activate option for set spell/trap */}
            {contextMenu.type === 'spell' && !contextMenu.card.faceUp && contextMenu.isCurrentPlayer && (
              <>
                {contextMenu.card.type.includes('Trap') && contextMenu.card.canActivate === false ? (
                  <button 
                    className="context-menu-item disabled"
                    disabled
                  >
                    ⚠️ Trap chưa thể kích hoạt (phải đợi turn sau)
                  </button>
                ) : (
                  <button 
                    className="context-menu-item activate"
                    onClick={() => {
                      handleSetSpellActivation(contextMenu.card, contextMenu.index)
                      setContextMenu(null)
                    }}
                  >
                    ✨ Kích hoạt
                  </button>
                )}
              </>
            )}
            
            <button 
              className="context-menu-item"
              onClick={() => {
                if (contextMenu.type === 'hand') {
                  handleSendHandToGY(contextMenu.index)
                } else {
                  handleSendToGY()
                }
              }}
            >
              🗑️ Send to Graveyard
            </button>
            <button 
              className="context-menu-item cancel"
              onClick={() => setContextMenu(null)}
            >
              ❌ Cancel
            </button>
          </div>
        </>
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
                  <div className="stat-group">
                    <span className="stat-label">ATK:</span>
                    <span className={`stat-value ${hoveredCard.buffType || ''}`}>{hoveredCard.atk}</span>
                    {hoveredCard.originalAtk !== undefined && hoveredCard.atk !== hoveredCard.originalAtk && (
                      <span className="original-stat"> (Gốc: {hoveredCard.originalAtk})</span>
                    )}
                  </div>
                  <div className="stat-group">
                    <span className="stat-label">DEF:</span>
                    <span className="stat-value">{hoveredCard.def}</span>
                    {hoveredCard.originalDef !== undefined && hoveredCard.def !== hoveredCard.originalDef && (
                      <span className="original-stat"> (Gốc: {hoveredCard.originalDef})</span>
                    )}
                  </div>
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

      {/* Spell Activation Animation */}
      {activatingSpell && (
        <div className="spell-activation-overlay">
          <div className="spell-activation-content">
            <div className="spell-activation-flash"></div>
            <div className="spell-card-display">
              <img src={activatingSpell.image_url} alt={activatingSpell.name} />
            </div>
            <div className="spell-activation-text">
              <h2>✨ SPELL CARD ACTIVATED! ✨</h2>
              <p>{activatingSpell.name}</p>
            </div>
          </div>
        </div>
      )}

      {/* Discard Cards Modal */}
      {(discardingCards || forcedDiscard) && (
        <div className="discard-modal">
          <div className="discard-content">
            <div className="discard-header">
              <h2>⚠️ {forcedDiscard ? 'Hiệu ứng Spell' : 'Giới hạn bài trên tay'}</h2>
              {forcedDiscard ? (
                <>
                  <p>Hiệu ứng spell yêu cầu loại bỏ {forcedDiscard.amount} lá bài</p>
                  <p className="discard-instruction">Chọn {forcedDiscard.amount} lá để loại bỏ vào Graveyard</p>
                </>
              ) : (
                <>
                  <p>Bạn có {(currentTurn === 'player' ? playerHand : aiHand).length} lá bài. Giới hạn là {handLimit} lá.</p>
                  <p className="discard-instruction">Chọn {(currentTurn === 'player' ? playerHand : aiHand).length - handLimit} lá để loại bỏ vào Graveyard</p>
                </>
              )}
            </div>

            <div className="discard-cards-grid">
              {(currentTurn === 'player' ? playerHand : aiHand).map((card, i) => (
                <div 
                  key={i}
                  className={`discard-card ${selectedDiscards.includes(i) ? 'selected' : ''}`}
                  onClick={() => handleDiscardSelect(i)}
                >
                  <img src={card.image_url} alt={card.name} />
                  <div className="discard-card-name">{card.name}</div>
                  {selectedDiscards.includes(i) && <div className="discard-badge">✓</div>}
                </div>
              ))}
            </div>

            <div className="discard-status">
              <p>Đã chọn: {selectedDiscards.length} / {forcedDiscard ? forcedDiscard.amount : ((currentTurn === 'player' ? playerHand : aiHand).length - handLimit)}</p>
            </div>

            <div className="discard-buttons">
              <button 
                className="discard-btn confirm"
                onClick={handleConfirmDiscard}
                disabled={selectedDiscards.length !== (forcedDiscard ? forcedDiscard.amount : ((currentTurn === 'player' ? playerHand : aiHand).length - handLimit))}
              >
                ✓ Xác nhận loại bỏ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fusion Summon Modal */}
      {fusionMode && (
        <div className="fusion-modal">
          {/* ... fusion content ... */}
        </div>
      )}

      {/* Chain Prompt Overlay */}
      {chainPrompt.active && chainPrompt.player === 'player' && (
        <div className="target-selection-overlay" style={{ zIndex: 60 }}>
          <div className="target-selection-content chain-modal-content">
            <div className="target-selection-pulse"></div>
            <div className="chain-modal-header">
              <h3>⚡ CHUỖI KÍCH HOẠT (CHAIN)</h3>
              <p className="chain-source-desc">{chainPrompt.sourceAction}</p>
            </div>
            
            <div className="activatable-cards-section">
              <h4>Chọn lá bài để kích hoạt (phản hồi):</h4>
              <div className="activatable-cards-grid">
                {getActivatableCards().map((item, i) => (
                  <div 
                    key={i} 
                    className="activatable-card-item"
                    onClick={() => {
                      if (item.source === 'field') {
                        if (isMultiplayer && roomId) socket.emit('chain-response', { roomId, response: 'yes' })
                        activateSetCard(item.card, item.index, 'player')
                      } else if (item.source === 'hand') {
                        if (isMultiplayer && roomId) socket.emit('chain-response', { roomId, response: 'yes' })
                        handleActivateKuriboh(item.index)
                      }
                    }}
                    onMouseEnter={() => setHoveredCard(item.card)}
                    onMouseLeave={() => setHoveredCard(null)}
                  >
                    <img src={item.card.image_url} alt={item.card.name} />
                    <div className="card-source-tag">{item.source === 'field' ? 'Sân' : 'Tay'}</div>
                    <div className="activatable-card-name">{item.card.name}</div>
                  </div>
                ))}
                {getActivatableCards().length === 0 && (
                  <p className="no-cards-msg">Không có lá bài nào khả dụng để kích hoạt.</p>
                )}
              </div>
            </div>

            <div className="chain-modal-footer">
              <button 
                className="btn-cancel-chain"
                onClick={() => {
                   if (isMultiplayer && roomId && chainPrompt.player === 'player') {
                     socket.emit('chain-response', { roomId, response: 'no' })
                   }
                   setChainPrompt(prev => ({ ...prev, active: false }))
                   if (chainPrompt.onCancel) chainPrompt.onCancel()
                }}
              >
                KHÔNG KÍCH HOẠT (CANCEL)
              </button>
            </div>
            
            <p className="chain-hint">
              💡 Bạn cũng có thể click trực tiếp vào các lá bài đang nhấp nháy trên sân.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default Duel
