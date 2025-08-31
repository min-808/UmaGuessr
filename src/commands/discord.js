const { AttachmentBuilder, EmbedBuilder } = require('discord.js')
var { MongoClient } = require("mongodb");

const img = "discord"

module.exports = {
    name: 'discord',
    aliases: ['dc'],
    description: 'Get the link for the bot\'s discord server',
    
    run: async ({ message }) => {

        try {
            const file = new AttachmentBuilder(`src/assets/command_images/${img}.png`);

            let embed;

            embed = new EmbedBuilder()
                .setColor('LightGrey')
                .setTitle("Join the Discord Server!")
                .setThumbnail(`attachment://${img}.png`)
                .addFields(
                    {
                        name: "\n",
                        value: `Stay updated on changes, ask questions, and share suggestions :)\n\nhttps://discord.gg/d4rH6ycdbc`
                    },
                )

            await message.channel.send({ embeds: [embed], files: [file] });
        } catch (error) {
            console.log(error.rawError.message) // log error

            try {
                await message.channel.send(`Unable to send embed: **${error.rawError.message}**\n\nPlease check the bot's permissions and try again`)
            } catch (error) {
                console.log(`Unable to send message: ${error.rawError.message}`)
            }
        }
    }
}