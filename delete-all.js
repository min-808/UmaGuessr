require('dotenv').config();

const { REST, Routes, ApplicationCommandOptionType } = require('discord.js')

const commands = [
//
]

const rest = new REST({ version : '10'}).setToken(process.env.TOKEN);

(async () => { // run, and if an error occurs, you can catch it
    try {
        console.log("Deleting slash commands")
        
        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands }
        )

        console.log("Slash commands were deleted successfully!")
    } catch (error) {
        console.log(`There was an error: ${error}`)
    }
})();