require('dotenv').config();

const { Client, IntentsBitField, Collection, ActivityType, REST, Routes } = require('discord.js');
const mongoose = require('mongoose');
const fs = require('fs');
const util = require('util')
const path = require('path');
const cron = require('node-cron');
const { getMongoClient } = require('./connect-db.js');
const { buildCache } = require("./cache-images.js");
const { CommandHandler } = require('djs-commander');
const { connectMongo } = require('./connect-db.js');
const exemptUsers = require('./exemptUsers');

const prefixCache = new Map()
const strictCache = new Map()
const filterCache = new Map()
const restrictedUsers = new Map()

const cooldowns = new Map()
const COOLDOWN = 2000

const args = process.argv.slice(2)
var testMode = false

var globalList = require('./assets/global-list.json')
var JPList = require('./assets/jp-list.json');
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

const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,             // required for guild-related events
        IntentsBitField.Flags.GuildMessages,      // required for messageCreate in guilds
        IntentsBitField.Flags.MessageContent,
    ],
});

client.prefixCache = prefixCache
client.strictCache = strictCache
client.filterCache = filterCache
client.restrictedUsers = restrictedUsers

client.prefixCommands = new Collection();
client.slashCommands = new Collection();

client.APIData = []

var logChannel;

new CommandHandler({
    client,
    commandsPath: path.join(__dirname, 'slash-commands'),
    testServer: args.includes('test') ? process.env.GUILD_ID : null
    // testServer: process.env.GUILD_ID
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

// console.table(client.prefixCommands)
// console.table(client.slashCommands)

// importing commands to top.gg
// const commandsArray = [...client.slashCommands.values()].map(cmd => cmd.data.toJSON());
// console.log(JSON.stringify(commandsArray, null, 2));

async function resetDaily() {
    var client_db = new getMongoClient()

    var database = client_db.db("uma");
    var ids = database.collection("profiles")
    var registerStats = database.collection("stats")

    var currentDate = new Date()
    var currentTime = currentDate.toLocaleTimeString( 'en-US', {timeZone: 'Pacific/Honolulu'} )

    console.log(`[${currentTime}] - Resetting dailies...`)

    const count = await ids.countDocuments({}, {})

    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
    const routesResult = await rest.get(Routes.oauth2CurrentApplication());

    const update = {
        $set: {
            points_today: 0,
            wins_today: 0,
        }
    }

    const registerUpdate = {
        $set: {
            players: count,
            servers: routesResult.approximate_guild_count,
        }
    }

    await ids.updateMany({}, update)
    await registerStats.updateOne({}, registerUpdate)
}

async function pushServerCount() {
    try {
        const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
        const routesResult = await rest.get(Routes.oauth2CurrentApplication());

        const count = {
            server_count: routesResult.approximate_guild_count
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
            console.log("Updated top.gg server count: " + routesResult.approximate_guild_count)
        } else {
            console.log("Unable to update top.gg server count. Status: " + response.status)
        }
    } catch (error) {
        console.error("Updating top.gg server count error:", error);
    }
    
}

async function refreshUsernames() {
    try {
        const client = new getMongoClient()
        const database = client.db("uma");
        const ids = database.collection("profiles");

        const options = {
            projection: {
                _id: 0,
                discord_id: 1,
                username: 1,
            }
        }

        let listOfDocuments = await ids.find({}, options).toArray();
        
        for (let doc of listOfDocuments) {
            await new Promise(resolve => setTimeout(resolve, 2000)) // add delay to respect rate limits
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
                if (retUsername == "Unknown") {
                    console.log(`API Error: ${doc.discord_id} - ${doc.username}`)
                } else {
                    updateValues = {
                    $set: {
                        username: retUsername + retDiscriminator,
                        }
                    }

                    await ids.updateOne({discord_id: doc.discord_id}, updateValues)

                    console.log(`Updated usernames: ${doc.discord_id} - ${doc.username} to ${retUsername}`)
                }
            }
        }

        console.log("Usernames updated")
    } catch (error) {
        console.error("Refreshing usernames error:", error);
    }
}

async function loadPrefixes() {
    const client = new getMongoClient()
    const database = client.db("uma");
    const prefixes = database.collection("prefixes");

    const all = await prefixes.find({}).toArray();
    for (const entry of all) {
        prefixCache.set(entry.server_id, entry.prefix);
    }

    console.log("Prefixes cached:", prefixCache.size);
}

async function loadFilters() {
    const client = new getMongoClient()
    const database = client.db("uma");
    const filters = database.collection("filters");

    const all = await filters.find({}).toArray();
    for (const entry of all) {
        filterCache.set(entry.server_id, entry.filter);
    }

    console.log("Filters cached:", filterCache.size);
}

async function cacheStrict() {
    const client = new getMongoClient()
    const database = client.db("uma");
    const stats = database.collection("profiles");

    const all = await stats.find({}).toArray();
    for (const entry of all) {
        strictCache.set(BigInt(entry.discord_id), entry.strict) // reminder, discord_id's are being casted as bigints here
        restrictedUsers.set(BigInt(entry.discord_id), entry.restrict)
    }

    console.log(`Strict settings (total: ${strictCache.size}) and Restricted users (total: ${restrictedUsers.size}) cached`);
}

async function sendReminderMsg() {
    const client_db = new getMongoClient()
    const database = client_db.db("uma");
    const stats = database.collection("profiles");

    let currentTime = Date.now()
    let counter = 0

    const all = await stats.find({
        reminder_msg_opt: true,
        reminder_msg_sent: false,
        daily_timer: { $lte: currentTime - 84_600_000 }
    }, {
        projection: {
            discord_id: 1,
            daily_timer: 1,
        }
    }).toArray();

    for (const entry of all) {
        try {
            const user = await client.users.fetch((entry.discord_id).toString())
            await user.send("Your **daily** is ready to be claimed!")
            console.log(`Sent daily reminder message to ${user.tag}`)
            counter++

            await stats.updateOne(
                { discord_id: entry.discord_id },
                { $set: { reminder_msg_sent: true } }
            )
        } catch (err) {
            console.log(`Could not send DM to ${entry.discord_id}. Error: ${err}`)
        }
    }
}

async function getPrefix(guildId) { // This will be called everytime a potential message is sent
    if (prefixCache.has(guildId)) { // This will first check the cache to see if the server has a prefix set
        return prefixCache.get(guildId) // If so, return the prefix
    }

    // If not, find the prefix
    const client = new getMongoClient()
    const database = client.db("uma")
    const prefixes = database.collection("prefixes")

    const result = await prefixes.findOne({ server_id: guildId })

    const prefix = result?.prefix || "!" // Default to '!'
    prefixCache.set(guildId, prefix) // Put it in the cache for fast access next time
    return prefix
}

async function fetchAPIData() {
    try {
        const res = await fetch(`https://umapyoi.net/api/v1/character/info`)

        if (!res.ok) {
            console.error(`API returned ${res.status}: ${res.statusText}`);
        } else {
            client.APIData = await res.json()
            console.log("Successfully fetched API data for characters")
        }
        
    } catch (error) {
        console.error("\x1b[1m\x1b[31mError fetching API data!!!\x1b[0m", error);
    }
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

        let client_db = new getMongoClient()
        let database = client_db.db("uma");
        let ids = database.collection("profiles")
        let discordID = BigInt(message.author.id)

        let addGuild = {
            $addToSet: {
                guilds: BigInt(message.guild.id)
            }
        }

        await ids.updateOne({ discord_id: discordID }, addGuild )

        if (logChannel) {
            await logChannel.send(`\`${message.author.username}\`: !${cmdName + " " + args}`)
        }
    } catch (err) {
        console.error(err);
    }
});

client.on('interactionCreate', async (interaction) => {
    if (interaction.isChatInputCommand()) { // boolean
        const options = interaction.options.data

        if (interaction.guild) {
            try {
                let client_db = new getMongoClient()
                let database = client_db.db("uma");
                let ids = database.collection("profiles")
                let discordID = BigInt(interaction.user.id)

                let addGuild = {
                    $addToSet: {
                        guilds: BigInt(interaction.guild.id)
                    }
                }

                await ids.updateOne({ discord_id: discordID }, addGuild )

                await logChannel.send(`\`${interaction.user.username}\`: /${interaction.commandName + " " + options.map(opt => `${opt.value}`).join(' ')}`)
            } catch (err) {
                console.error(err);
            }
        }
    }

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

    logChannel = await client.channels.fetch(process.env.CMD_LOG_CHANNEL)

    await setUptime();

    if (!testMode) {
        cron.schedule('0 0 * * *', async () => {
            try {
                await resetDaily();
                await refreshUsernames();
                await pushServerCount();
            } catch (error) {
                console.error('Error in daily scheduled job:', error);
            }
        }, {
            timezone: 'Pacific/Honolulu'
        })

        cron.schedule('*/10 * * * *', async () => {
            try {
                await sendReminderMsg();
            } catch (error) {
                console.error('Error in sending daily reminder scheduled job:', error);
            }
        }, {
            timezone: 'Pacific/Honolulu'
        })
    }
});

async function setUptime() {
    const client = new getMongoClient()
    const database = client.db("uma");
    const ids = database.collection("stats");
    await ids.updateOne({}, { $set: { time: Date.now() } });
}

(async () => {
    try {
        mongoose.set('strictQuery', false);
        await mongoose.connect(process.env.MONGODB_URI);
        await connectMongo()
        console.log("Connected to Database.")

        await fetchAPIData()

        await buildCache()
        await loadPrefixes()
        await loadFilters()
        await cacheStrict()

        checkImages(combinedList, path.join(__dirname, "./assets/guessing"))

        if (args.includes('test') || args.includes('--test')) {
            client.login(process.env.TEST_BOT)
            testMode = true
        } else {
            client.login(process.env.MAIN_BOT)
        }
    } catch (error) {
        console.log(`Error: ${error}`);
    }
})();