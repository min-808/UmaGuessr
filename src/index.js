require('dotenv').config(); // accesses .env file anywhere

const { Client, IntentsBitField, Collection } = require('discord.js');
const mongoose = require('mongoose');
const { CommandHandler } = require('djs-commander');
const path = require('path');
const fs = require('node:fs');
var { MongoClient } = require('mongodb');
const cron = require('node-cron')

const CharacterAI = require('node_characterai');
const characterAI = new CharacterAI();

const missionSheet = require('../src/assets/missions.json')

var uri = "mongodb+srv://min:" + process.env.MONGODB_PASS + "@discord-seele.u4g75ks.mongodb.net/"

const client = new Client({
    intents: [ // a set of permissions that the bot can use to access a set of events
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent
    ]
});

client.commands = new Collection();


new CommandHandler({
    client,
    commandsPath: path.join(__dirname, 'commands'),
    eventsPath: path.join(__dirname, 'events'),
    testServer: process.env.GUILD_ID
});

const commandPath = path.join(__dirname, 'commands')

const commandFiles = fs.readdirSync(commandPath).filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const filePath = path.join(commandPath, file)
    const command = require(filePath)

    client.commands.set(command.data.name, command)
};

async function replenishPower() {
    var client = new MongoClient(uri)

    var database = client.db("economy");
    var ids = database.collection("inventories")
    
    var howMany = await ids.countDocuments()

    var currentDate = new Date()
    var currentTime = currentDate.toLocaleTimeString('en-US')

    console.log(`[${currentTime}] - There are ${howMany} documents. Updating uncapped trailblaze power...`)

    await ids.updateMany(
        { $expr: { $lt: ["$trailblaze_power", "$max_trailblaze_power"] } }, 
        { $inc: { trailblaze_power: 1 } }
    )

    await client.close()
}

async function resetDailies() {
    var client = new MongoClient(uri)

    var database = client.db("economy");
    var ids = database.collection("inventories")
    
    var howMany = await ids.countDocuments()

    var currentDate = new Date()
    var currentTime = currentDate.toLocaleTimeString('en-US')

    console.log(`[${currentTime}] - Randomizing daily missions...`)

    // Randomize missions

    var missions = []

    while (missions.length < 5) {
        var randomNum = Math.floor(Math.random() * Object.keys(missionSheet).length) // Grabs a random id
        if (missions.indexOf(randomNum) === -1) { // Ensures uniqueness
            missions.push(randomNum)
        }
    }

    const update = {
        $set: {
            'missions': [
                { 
                    "id": missionSheet[missions[0]]['id'],
                    "description": missionSheet[missions[0]]['description'],
                    "reward": 75,
                    "completed": false,
                    "completed_symbol": "❌"
                },
                { 
                    "id": missionSheet[missions[1]]['id'],
                    "description": missionSheet[missions[1]]['description'],
                    "reward": 75,
                    "completed": false,
                    "completed_symbol": "❌"
                },
                { 
                    "id": missionSheet[missions[2]]['id'],
                    "description": missionSheet[missions[2]]['description'],
                    "reward": 75,
                    "completed": false,
                    "completed_symbol": "❌"
                },
                { 
                    "id": missionSheet[missions[3]]['id'],
                    "description": missionSheet[missions[3]]['description'],
                    "reward": 75,
                    "completed": false,
                    "completed_symbol": "❌"
                },
                { 
                    "id": missionSheet[missions[4]]['id'],
                    "description": missionSheet[missions[4]]['description'],
                    "reward": 75,
                    "completed": false,
                    "completed_symbol": "❌"
                },
            ],
            missions_completed: false,
            trailblaze_power_used_today: 0,
            missions_claimed: false,
        }

    }

    await ids.updateMany({}, update)

    await client.close()
}

client.on('ready', async () => { // Replenish trailblaze power every 6 minutes
    cron.schedule('*/6 * * * *', () => { // 240 power every 24 hours
        replenishPower()
    })

    cron.schedule('0 23 * * *', () => { // Daily reset at 11pm HST (UTC-10)
        resetDailies()
    })
})

client.on('interactionCreate', async interaction => { // interactions within slash commands

    if (interaction.isChatInputCommand()) { // boolean
        console.log(`@${interaction.user.username}: /${interaction.commandName}`)
    }

    if (interaction.isAutocomplete()) {
        const command = interaction.client.commands.get(interaction.commandName)

        if (!command) {
            return;
        }

        try {
            await command.autocomplete(interaction)
        } catch (err) {
            return;
        }
    }
});

(async () => {
    try {
        mongoose.set('strictQuery', false);
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to Database.")

        client.login(process.env.TOKEN)
    } catch (error) {
        console.log(`Error: ${error}`);
    }
})();