require('dotenv').config();

const { REST, Routes, ApplicationCommandOptionType } = require('discord.js')

const commands = [
//
]

const rest = new REST({ version : '10'}).setToken(process.env.TOKEN);

(async () => { // run, and if an error occurs, you can catch it
    try {
        console.log(`Deleting ${process.env.GUILD_ID}'s slash commands`)

        await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
            { body: commands }
        )

        console.log(`${process.env.GUILD_ID}'s slash commands deleted successfully!`)
    } catch (error) {
        console.log(`There was an error: ${error}`)
    }
})();