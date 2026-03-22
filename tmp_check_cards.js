async function checkCard(name) {
  try {
    const response = await fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?name=${encodeURIComponent(name)}`)
    const data = await response.json()
    if (data.data && data.data.length > 0) {
      console.log(`Results for "${name}":`)
      data.data.forEach(card => {
        console.log(`- Name: ${card.name}, ID: ${card.id}, Image: ${card.card_images[0].image_url}`)
      })
    } else {
      console.log(`No results for "${name}"`)
    }
  } catch (err) {
    console.error(err)
  }
}

async function run() {
  await checkCard("Slifer the Sky Dragon")
  await checkCard("The Winged Dragon of Ra")
  await checkCard("Obelisk the Tormentor")
}

run()
