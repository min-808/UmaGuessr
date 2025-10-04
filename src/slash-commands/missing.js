const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');

module.exports = {
    name: 'missing',
    aliases: ['m'],
    description: 'Shows all missing umas',

    data: new SlashCommandBuilder()
        .setName('missing')
        .setDescription('Shows all missing umas'),
    
    run: async ({ interaction }) => {

        await interaction.deferReply()

        try {
            let embed;

            embed = new EmbedBuilder()
                .setColor('LightGrey')
                .setTitle("Missing Umas")
                .addFields(
                    {
                        name: "\n",
                        value: 
                        "Admire Groove\n" +
                        "Believe\n" +
                        "Blast Onepiece\n" +
                        "Curren Bouquetd'or\n" +
                        "Daring Heart\n" +
                        "Daring Tact\n" +
                        "Lucky Lilac\n" +
                        "Royce and Royce\n" +
                        "Sakura Chitose O\n" +
                        "Samson Big\n"
                    }
                )

            await interaction.editReply({ embeds: [embed] });
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
