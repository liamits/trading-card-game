const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const cardSchema = new mongoose.Schema({
  id: String,
  name: String,
  image_url: String
});

const characterSchema = new mongoose.Schema({
  name: String,
  deck: {
    main: [cardSchema],
    extra: [cardSchema]
  }
});

// Avoid re-compiling model if it exists
let Character;
if (mongoose.models.CharacterCheck) {
  Character = mongoose.models.CharacterCheck;
} else {
  Character = mongoose.model('CharacterCheck', characterSchema, 'characters');
}

async function run() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/yugioh_game';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    const yugi = await Character.findOne({ name: 'Yami Yugi' });
    if (yugi) {
      console.log(`\n--- Yami Yugi's Main Deck ---`);
      yugi.deck.main.forEach((card, i) => {
        if (card.name.includes('Dragon') || card.name.includes('Slifer')) {
          console.log(`[${i}] Name: ${card.name}, ID: ${card.id}, Image: ${card.image_url}`);
        }
      });
    } else {
      console.log('Yami Yugi not found');
    }

    mongoose.connection.close();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
