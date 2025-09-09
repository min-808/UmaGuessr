const { AttachmentBuilder, EmbedBuilder, SlashCommandBuilder } = require('discord.js')

const img = "discord"

module.exports = {
    name: 'discord',
    aliases: ['dc'],
    description: 'Get the link for the bot\'s discord server',
    
    data: new SlashCommandBuilder()
        .setName('discord')
        .setDescription('Get the link for the bot\'s discord server'),
    
    run: async ({ interaction }) => {

        try {
            await interaction.deferReply()

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

            await interaction.editReply({ embeds: [embed], files: [file] });
        } catch (error) {
            const msg = error?.message || String(error);
            console.error("Main uma error:", msg);

            // Send ephemeral fallback safely
            try {
                if (interaction.deferred || interaction.replied) {
                    await interaction.editReply(`Unable to send message: **${msg}**`);
                } else {
                    await interaction.reply({ content: `Unable to send message: **${msg}**`, flags: 64 });
                }
            } catch (sendErr) {
                console.error("Unable to send error message:", sendErr?.message || sendErr);
            }
        }
    }
}