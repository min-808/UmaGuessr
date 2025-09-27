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
            const msg = error?.rawError?.message || error?.message || String(error);
            console.error("Main uma error:", msg);

            try {
                await message.channel.send(
                    `**Unable to send embed**\n\nPlease check the bot's permissions and try again`
                );
            } catch (sendErr) {
                console.error("Unable to send error message:", sendErr?.message || sendErr);
            }
        }
    }
}