const { AttachmentBuilder, EmbedBuilder } = require('discord.js');

const img = "vote"

module.exports = {
    name: 'vote',
    aliases: ['v'],
    description: 'Vote for the bot',
    
    run: async ({ message }) => {

        const file = new AttachmentBuilder(`src/assets/command_images/${img}.png`);

        let embed;

        embed = new EmbedBuilder()
            .setColor('LightGrey')
            .setTitle("Vote")
            .setThumbnail(`attachment://${img}.png`)
            .addFields(
                {
                    name: "\n",
                    value: "coming soon :)"
                },
            )

        await message.channel.send({ embeds: [embed], files: [file] });
    }
}