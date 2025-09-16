require('dotenv').config();

const { Client, IntentsBitField, Collection, ActivityType } = require('discord.js');
const mongoose = require('mongoose');
const fs = require('fs');
const util = require('util')
const path = require('path');
const cron = require('node-cron');
const { MongoClient } = require('mongodb');
const { buildCache } = require("./cache-images.js");
const { CommandHandler } = require('djs-commander');

var uri = "mongodb+srv://min:" + process.env.MONGODB_PASS + "@discord-seele.u4g75ks.mongodb.net/"

const prefixCache = new Map()
const cooldowns = new Map()
const COOLDOWN = 3000

var globalList = require('./assets/global-list.json')
var JPList = require('./assets/jp-list.json')
var combinedList = globalList.concat(JPList)

// save error logs
const logFile = fs.createWriteStream(path.join(__dirname, 'bot.log'), { flags: 'a' });

function writeLog(type, msg) {
  const time = new Date().toISOString();
  const out = `[${time}] [${type}] ${msg}\n`;
  logFile.write(out);
  process.stdout.write(out);
}

// Override console.log and console.error
console.log = (...args) => writeLog('INFO', args.map(a => a instanceof Error ? a.stack : a).join(' '));
console.error = (...args) => writeLog('ERROR', args.map(a => a instanceof Error ? a.stack : a).join(' '));

// Catch truly uncaught crashes
process.on('uncaughtException', (err) => {
  writeLog('UNCAUGHT_EXCEPTION', err.stack || err);
});

process.on('unhandledRejection', (reason, p) => {
  writeLog('UNHANDLED_REJECTION', reason?.stack || reason);
});

const exemptUsers = new Set([
  "236186510326628353", // min
  "343908475245559820", // someone
  "329497108157562880" // kekai
])

const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,             // required for guild-related events
        IntentsBitField.Flags.GuildMessages,      // required for messageCreate in guilds
        IntentsBitField.Flags.MessageContent,
    ],
});

client.prefixCache = prefixCache

client.prefixCommands = new Collection();
client.slashCommands = new Collection();

new CommandHandler({
    client,
    commandsPath: path.join(__dirname, 'slash-commands'),
    testServer: process.env.GUILD_ID
});

const prefixCommandPath = path.join(__dirname, 'commands')
const slashCommandPath = path.join(__dirname, 'slash-commands')
const prefixCommandFiles = fs.readdirSync(prefixCommandPath).filter(file => file.endsWith('.js'));
const slashCommandFiles = fs.readdirSync(slashCommandPath).filter(file => file.endsWith('.js'));

for (const file of prefixCommandFiles) {
    const command = require(path.join(prefixCommandPath, file));

    client.prefixCommands.set(command.name, command);
}

for (const file of slashCommandFiles) {
    const command = require(path.join(slashCommandPath, file))

    client.slashCommands.set(command.name, command)
}

console.table(client.prefixCommands)
console.table(client.slashCommands)

// importing commands to top.gg
// const commandsArray = [...client.slashCommands.values()].map(cmd => cmd.data.toJSON());
// console.log(JSON.stringify(commandsArray, null, 2));

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

async function pushServerCount() {
    try {
        const count = {
            server_count: client.guilds.cache.size
        }

        const response = await fetch(`https://top.gg/api/bots/${process.env.CLIENT_ID}/stats`, {
            method: 'POST',
            headers: {
                'Authorization': process.env.TOPGG_WEBHOOK_TOKEN,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(count)
        });

        if (response.ok) {
            console.log("Updated top.gg server count: " + client.guilds.cache.size)
        } else {
            console.log("Unable to update top.gg server count. Status: " + response.status)
        }
    } catch (error) {
        console.error("Updating top.gg server count error:", error);
    }
    
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
            await new Promise(resolve => setTimeout(resolve, 800)) // add delay to respect rate limits
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

                console.log(`Updated usernames: ${doc.discord_id} - ${retUsername}`)
            }
        }

        console.log("Usernames updated")
    } catch (error) {
        console.error("Refreshing usernames error:", error);
    }
}

async function loadPrefixes() {
    const client = new MongoClient(uri);
    const database = client.db("uma");
    const prefixes = database.collection("prefixes");

    const all = await prefixes.find({}).toArray();
    for (const entry of all) {
        prefixCache.set(entry.server_id, entry.prefix);
    }

    await client.close();
    console.log("Prefixes cached:", prefixCache.size);
}

async function getPrefix(guildId) { // This will be called everytime a potential message is sent
    if (prefixCache.has(guildId)) { // This will first check the cache to see if the server has a prefix set
        return prefixCache.get(guildId) // If so, return the prefix
    }

    // If not, find the prefix
    const client = new MongoClient(uri)
    const database = client.db("uma")
    const prefixes = database.collection("prefixes")

    const result = await prefixes.findOne({ server_id: guildId })
    await client.close()

    const prefix = result?.prefix || "!" // Default to '!'
    prefixCache.set(guildId, prefix) // Put it in the cache for fast access next time
    return prefix
}

function checkImages(data, folderPath) {
    const expectedImages = new Set();
    data.forEach(obj => {
        obj.images.forEach(img => expectedImages.add(img));
    });

    const actualImages = new Set(fs.readdirSync(folderPath));

    const missing = [...expectedImages].filter(img => !actualImages.has(img));

    const extras = [...actualImages].filter(img => !expectedImages.has(img));

    if (missing.length === 0 && extras.length === 0) {
        console.log("Image check: All images are accounted for");
    } else {
        if (missing.length > 0) {
            console.log("Image check: Missing images (listed in JSON but not found in folder):");
            console.log(missing.join('\n'));
        }
        if (extras.length > 0) {
            console.log("Image check: Extra images (in folder but not listed in JSON):");
            console.log(extras.join('\n'));
        }
    }
}

client.on('messageCreate', async message => {
    if (message.author.bot) {
      return;
    }

    const prefix = message.guild ? await getPrefix(message.guild.id) : "!"

    if (!message.content.startsWith(prefix)) {
      return;
    }

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const cmdName = args.shift().toLowerCase();

    const command = client.prefixCommands.get(cmdName) ||
    client.prefixCommands.find(cmd => cmd.aliases && cmd.aliases.includes(cmdName)) // incl aliases

    if (!command) return;

    const now = Date.now()
    const userId = message.author.id
    const cooldownUntil = cooldowns.get(userId)

    if ((cooldownUntil && now < cooldownUntil) && (!exemptUsers.has(userId))) { // wait the cooldown
        const remaining = ((cooldownUntil - now) / 1000).toFixed(2)
        return message.channel.send(`Wait **${remaining}** seconds before sending another command`)
    }

    cooldowns.set(userId, now + COOLDOWN)

    try {
        await command.run({ message, args, client });
    } catch (err) {
        console.error(err);
    }
});

client.on('interactionCreate', async (interaction) => {
    if (interaction.isAutocomplete()) {
        const command = interaction.client.slashCommands.get(interaction.commandName)

        if (!command || !command.autocomplete) {
            return;
        }

        try {
            await command.autocomplete(interaction)
        } catch (err) {
            return;
        }
    }
});

client.on('ready', async () => {
    console.log(`${client.user.tag} is online.`);
    client.user.setActivity('!help | !uma', { type: ActivityType.Playing }); 

    await setUptime();

    cron.schedule('0 0 * * *', async () => {
        try {
            await refreshUsernames();
            await resetDaily();
            await pushServerCount();
        } catch (error) {
            console.error('Error in daily scheduled job:', error);
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
        await loadPrefixes();

        checkImages(combinedList, path.join(__dirname, "./assets/guessing"))

        client.login(process.env.TOKEN);
    } catch (error) {
        console.log(`Error: ${error}`);
    }
})();
