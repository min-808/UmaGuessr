require('dotenv').config();

const { Client, IntentsBitField, Collection, ActivityType } = require('discord.js');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const cron = require('node-cron');
const { MongoClient } = require('mongodb');
const { buildCache } = require("./cache-images.js");
const express = require('express')
const { Webhook } = require('@top-gg/sdk')

var uri = "mongodb+srv://min:" + process.env.MONGODB_PASS + "@discord-seele.u4g75ks.mongodb.net/"

const prefix = '!';

const cooldowns = new Map()
const votes = new Set()
const COOLDOWN = 3000

const app = express()
app.use(express.json())
const PORT = 3000
const webhook = new Webhook(process.env.TOPGG_WEBHOOK_TOKEN)

const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
        IntentsBitField.Flags.GuildMembers,
    ],
});

client.commands = new Collection();

const commandFiles = fs.readdirSync(path.join(__dirname, 'commands')).filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.name, command);
}

async function resetDaily() {
    var client = new MongoClient(uri)

    var database = client.db("uma");
    var ids = database.collection("stats")

    var currentDate = new Date()
    var currentTime = currentDate.toLocaleTimeString( 'en-US', {timeZone: 'Pacific/Honolulu'} )

    console.log(`[${currentTime}] - Resetting dailies...`)

    const update = {
        $set: {
            points_today: 0,
            wins_today: 0,
        }

    }

    await ids.updateMany({}, update)

    await client.close()
}

async function refreshUsernames() {

    try {

        const client = new MongoClient(uri);
        const database = client.db("uma");
        const ids = database.collection("stats");

        const options = {
            projection: {
                _id: 0,
                discord_id: 1,
                username: 1,
            }
        }

        let listOfDocuments = await ids.find({}, options).toArray();
        
        for (let doc of listOfDocuments) {
            const foundID = doc.discord_id;

            const response = await fetch(`https://discord.com/api/v10/users/${foundID}`, {
                headers: {
                    'Authorization': 'Bot ' + process.env.TOKEN
                }
            });

            const parse = await response.json();
            let retUsername = String(parse?.username ?? 'Unknown')
            let retDiscriminator = String(parse?.discriminator ?? 'Unknown')
            // allowing discriminators due to bots/apps still having them

            if (retDiscriminator == '0') {
              retDiscriminator = "";
            } else {
              retDiscriminator = "#" + retDiscriminator
            }

            if ((doc.username) != (retUsername + retDiscriminator)) { // only update if the username/discriminator changes

                updateValues = {
                    $set: {
                        username: retUsername + retDiscriminator,
                    }
                }

                await ids.updateOne({discord_id: doc.discord_id}, updateValues)

                console.log(`updated usernames: ${doc.discord_id} - ${retUsername}`)
            }
        }

        console.log("Usernames updated")
    } catch (error) {
        console.log(error.rawError.message) // log error

        try {
            await message.channel.send(`Unable to send embed: **${error.rawError.message}**\n\nPlease check the bot's permissions and try again`)
        } catch (error) {
            console.log(`Unable to send message: ${error.rawError.message}`)
        }
    }
}

client.on('messageCreate', async message => {
    if (!message.content.startsWith(prefix) || message.author.bot) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const cmdName = args.shift().toLowerCase();

    const command = client.commands.get(cmdName) ||
    client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(cmdName)) // incl aliases

    if (!command) return;

    const now = Date.now()
    const userId = message.author.id
    const cooldownUntil = cooldowns.get(userId)

    if ((cooldownUntil && now < cooldownUntil) && (userId != "236186510326628353")) { // wait the cooldown
        const remaining = ((cooldownUntil - now) / 1000).toFixed(1)
        return message.channel.send(`Wait **${remaining}** seconds before sending another command`)
    }

    cooldowns.set(userId, now + COOLDOWN)

    try {
        await command.run({ message, args, client });
    } catch (err) {
        console.error(err);
    }
});

client.on('ready', async () => {
    console.log(`${client.user.tag} is online.`);
    client.user.setActivity('!help | !uma', { type: ActivityType.Playing }); 

    await setUptime();

    cron.schedule('0 0 * * *', async () => {
        try {
            await refreshUsernames()
            await resetDaily()
        } catch (error) {
            console.error('Error in daily scheduled job:', err);
        }
    }, {
        timezone: 'Pacific/Honolulu'
    })

    // const channel = await client.channels.fetch('895794176682242088');
    // await channel.send('a');
});

async function setUptime() {
    const client = new MongoClient(uri);
    const database = client.db("economy");
    const ids = database.collection("uptime");
    await ids.updateOne({}, { $set: { time: Date.now() } });
    await client.close();
}

(async () => {
    try {
        mongoose.set('strictQuery', false);
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to Database.");

        await buildCache();

        app.post("/dblwebhook", webhook.listener(vote => {
            console.log(`test: so ${vote.type}`)
            votes.add(vote.user)
        }))
        
        app.listen(PORT, () => {
            console.log(`Express server running on port ${PORT}`)
        })

        client.login(process.env.TOKEN);
    } catch (error) {
        console.log(`Error: ${error}`);
    }
})();
