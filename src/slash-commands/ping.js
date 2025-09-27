const { SlashCommandBuilder } = require("discord.js");

module.exports = {
    name: 'ping',
    description: 'Replies with the bot ping',

    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Replies with the bot ping'),

    run: async ({ interaction }) => {
        try {
            await interaction.deferReply()

        const reply = await interaction.fetchReply();
        const ping = reply.createdTimestamp - interaction.createdTimestamp

        interaction.editReply(`:ping_pong: ${ping}ms`)
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
};
