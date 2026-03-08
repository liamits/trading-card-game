import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import Character from './models/Character.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: join(__dirname, '.env') })

// Yami Yugi Deck
const yamiYugiMainDeck = [
  "Dark Magician",
  "Dark Magician Girl",
  "Skilled Dark Magician",
  "Berfomet",
  "Gazelle the King of Mythical Beasts",
  "King's Knight",
  "Jack's Knight",
  "Queen's Knight",
  "Big Shield Gardna",
  "Black Luster Soldier - Envoy of the Beginning",
  "Swift Gaia the Fierce Knight",
  "Breaker the Magical Warrior",
  "Dark Magician of Chaos",
  "Electromagnetic Turtle",
  "Kuriboh",
  "Magician's Valkyria",
  "Obnoxious Celtic Guard",
  "Slifer the Sky Dragon",
  "The Tricky",
  "Dark Magic Curtain",
  "Dedication through Light and Darkness",
  "Pot of Greed",
  "Graceful Charity",
  "Book of Secret Arts",
  "Brain Control",
  "Horn of the Unicorn",
  "Monster Reborn",
  "Mystic Box",
  "Polymerization",
  "Swords of Revealing Light",
  "The Eye of Timaeus",
  "Multiply",
  "Lightforce Sword",
  "Magic Cylinder",
  "Magical Hats",
  "Mirror Force",
  "Seven Tools of the Bandit",
  "Spellbinding Circle",
  "Time Seal",
  "Chain Destruction"
]

const yamiYugiExtraDeck = [
  "Amulet Dragon",
  "Dark Magician Girl the Dragon Knight",
  "Dark Paladin",
  "Chimera the Flying Mythical Beast",
  "Arcana Knight Joker",
  "Gaia the Dragon Champion"
]

const yamiYugiSideDeck = [
  "Alpha The Magnet Warrior",
  "Beta The Magnet Warrior",
  "Gamma The Magnet Warrior",
  "Valkyrion the Magna Warrior",
  "Dark Magic Attack",
  "Magic Formula",
  "Thousand Knives",
  "Curse of Dragonfire",
  "Red-Eyes Black Dragon",
  "The Winged Dragon of Ra",
  "Obelisk the Tormentor",
  "Berserker Soul",
  "Black Illusion",
  "Card of Sanctity"
]

// Kaiba Deck
const kaibaMainDeck = [
  "Blue-Eyes White Dragon",
  "Blue-Eyes White Dragon",
  "Blue-Eyes White Dragon",
  "Obelisk the Tormentor",
  "Garnecia Elefantis",
  "Kaiser Sea Horse",
  "XYZ-Dragon Cannon",
  "X-Head Cannon",
  "Y-Dragon Head",
  "Z-Metal Tank",
  "Swordstalker",
  "Judge Man",
  "Rude Kaiser",
  "Battle Ox",
  "Mystic Horseman",
  "Ryu-Kishin Powered",
  "Grappler",
  "Hitotsu-Me Giant",
  "Saggi the Dark Clown",
  "La Jinn the Mystical Genie of the Lamp",
  "Ancient Lamp",
  "Trap Master",
  "Crawling Dragon",
  "Garoozis",
  "Illusionist Faceless Mage",
  "Armored Lizard",
  "Magician of Faith",
  "Lord of D.",
  "Wall of Illusion",
  "Cyber Jar",
  "The Wicked Worm Beast",
  "Monster Reborn",
  "Polymerization",
  "De-Spell",
  "The Flute of Summoning Dragon",
  "Megamorph",
  "Crush Card Virus",
  "Gift of The Mystical Elf",
  "Shadow Spell",
  "Negate Attack"
]

const kaibaExtraDeck = [
  "Rabid Horseman",
  "Blue-Eyes Ultimate Dragon"
]

async function searchCard(cardName) {
  try {
    const response = await fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?name=${encodeURIComponent(cardName)}`)
    const data = await response.json()
    
    if (data.data && data.data.length > 0) {
      const card = data.data[0]
      return {
        id: card.id,
        name: card.name,
        type: card.type,
        desc: card.desc,
        atk: card.atk,
        def: card.def,
        level: card.level,
        race: card.race,
        attribute: card.attribute,
        image_url: card.card_images[0].image_url
      }
    }
    return null
  } catch (error) {
    console.error(`Error searching for ${cardName}:`, error.message)
    return null
  }
}

async function updateDecks() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/yugioh_game'
    await mongoose.connect(mongoUri)
    console.log('✅ Connected to MongoDB')

    // Update Yami Yugi
    console.log('\n🔍 Searching cards for Yami Yugi...')
    const yamiYugiMainCards = []
    for (const cardName of yamiYugiMainDeck) {
      const card = await searchCard(cardName)
      if (card) {
        yamiYugiMainCards.push(card)
        console.log(`✓ Found: ${card.name}`)
      } else {
        console.log(`✗ Not found: ${cardName}`)
      }
      await new Promise(resolve => setTimeout(resolve, 100)) // Rate limit
    }

    const yamiYugiExtraCards = []
    for (const cardName of yamiYugiExtraDeck) {
      const card = await searchCard(cardName)
      if (card) {
        yamiYugiExtraCards.push(card)
        console.log(`✓ Found: ${card.name}`)
      } else {
        console.log(`✗ Not found: ${cardName}`)
      }
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    // Add side deck to main deck for now
    for (const cardName of yamiYugiSideDeck) {
      const card = await searchCard(cardName)
      if (card) {
        yamiYugiMainCards.push(card)
        console.log(`✓ Found: ${card.name}`)
      } else {
        console.log(`✗ Not found: ${cardName}`)
      }
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    await Character.findOneAndUpdate(
      { name: 'Yami Yugi' },
      {
        deck: {
          main: yamiYugiMainCards,
          extra: yamiYugiExtraCards
        }
      }
    )
    console.log(`\n✅ Updated Yami Yugi deck: ${yamiYugiMainCards.length} main + ${yamiYugiExtraCards.length} extra`)

    // Update Kaiba
    console.log('\n🔍 Searching cards for Kaiba...')
    const kaibaMainCards = []
    for (const cardName of kaibaMainDeck) {
      const card = await searchCard(cardName)
      if (card) {
        kaibaMainCards.push(card)
        console.log(`✓ Found: ${card.name}`)
      } else {
        console.log(`✗ Not found: ${cardName}`)
      }
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    const kaibaExtraCards = []
    for (const cardName of kaibaExtraDeck) {
      const card = await searchCard(cardName)
      if (card) {
        kaibaExtraCards.push(card)
        console.log(`✓ Found: ${card.name}`)
      } else {
        console.log(`✗ Not found: ${cardName}`)
      }
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    await Character.findOneAndUpdate(
      { name: 'Kaiba' },
      {
        deck: {
          main: kaibaMainCards,
          extra: kaibaExtraCards
        }
      }
    )
    console.log(`\n✅ Updated Kaiba deck: ${kaibaMainCards.length} main + ${kaibaExtraCards.length} extra`)

    mongoose.connection.close()
    console.log('\n👋 Database connection closed')
  } catch (error) {
    console.error('❌ Error updating decks:', error)
    process.exit(1)
  }
}

updateDecks()
