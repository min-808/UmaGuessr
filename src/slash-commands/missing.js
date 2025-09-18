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
                        "Espoir City\n" +
                        "Believe\n"
                    }
                )

            await interaction.editReply({ embeds: [embed] });
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