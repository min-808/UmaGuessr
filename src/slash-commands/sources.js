const { AttachmentBuilder, EmbedBuilder, SlashCommandBuilder } = require('discord.js')

const img = "sources"

module.exports = {
    name: 'sources',
    aliases: ['source'],
    description: 'Get the full list of image sources',
    
    data: new SlashCommandBuilder()
        .setName('sources')
        .setDescription('Get the full list of image sources'),
    
    run: async ({ interaction }) => {

        try {
            await interaction.deferReply()

            const file = new AttachmentBuilder(`src/assets/command_images/${img}.png`);

            let embed;

            embed = new EmbedBuilder()
                .setColor('LightGrey')
                .setTitle("Sources")
                .setThumbnail(`attachment://${img}.png`)
                .addFields(
                    {
                        name: "\n",
                        value: `Find a list of all the images and their sources here:\nhttps://umaguessr.vercel.app/image_sources\n\nPlease note that some images may be listed as 'n/a' since they are either support card illustrations from the game, or we couldn't find a reliable source`
                    },
                )

            await interaction.editReply({ embeds: [embed], files: [file] });
        } catch (error) {
            const msg = error?.rawError?.message || error?.message || String(error);
            console.error("Main uma error:", msg);

            // Send ephemeral fallback safely
            try {
                if (interaction.deferred || interaction.replied) {
                    await interaction.editReply(`**Unable to send embed**\n\nPlease check the bot's permissions and try again`);
                } else {
                    await interaction.reply({ content: `**Unable to send embed**\n\nPlease check the bot's permissions and try again`, flags: 64 });
                }
            } catch (sendErr) {
                console.error("Unable to send error message:", sendErr?.message || sendErr);
            }
        }
    }
}