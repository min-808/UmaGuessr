const { SlashCommandBuilder } = require('discord.js')

module.exports = {
    name: 'ping',
    aliases: [],
    description: `Replies with the bot's ping`,

    data: new SlashCommandBuilder()
      .setName('ping')
      .setDescription(`Replies with the bot's ping`),

    handler: async ({ message, interaction }) => {

        try {
            if (interaction) {
            // For slash commands
            const sent = await interaction.reply({ content: "Pinging...", fetchReply: true });
            const ping = sent.createdTimestamp - interaction.createdTimestamp;
            await interaction.editReply(`:ping_pong: ${ping}ms`);
        } else if (message) {
            // For prefix commands
            const sent = await message.channel.send("Pinging...");
            const ping = sent.createdTimestamp - message.createdTimestamp;
            await sent.edit(`:ping_pong: ${ping}ms`);
        }
        } catch (error) {
            const msg = error?.rawError?.message || error?.message || String(error);
            console.error("Main uma error:", msg);

            try {
                await message.channel.send(
                    `Unable to send embed: **${msg}**\n\nPlease check the bot's permissions and try again`
                );
            } catch (sendErr) {
                console.error("Unable to send error message:", sendErr?.message || sendErr);
            }
        }
    },

    run: async (context) => {
      return module.exports.handler(context)
    },

    execute: async (context) => {
      return module.exports.handler(context)
    }
}