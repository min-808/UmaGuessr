require('dotenv').config(); // accesses .env file anywhere

const { Client, IntentsBitField, Collection } = require('discord.js');
const mongoose = require('mongoose');
const { CommandHandler } = require('djs-commander');
const path = require('path');
const fs = require('node:fs');

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