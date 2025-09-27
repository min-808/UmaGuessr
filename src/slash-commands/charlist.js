const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');

module.exports = {
    name: 'charlist',
    aliases: ['characterlist', 'clist', 'cl'],
    description: 'Shows all umas that have been added to the bot and their picture counts',

    data: new SlashCommandBuilder()
        .setName('charlist')
        .setDescription('Shows all umas that have been added to the bot and their picture counts'),
    
    run: async ({ interaction }) => {

        try {

            await interaction.deferReply()

            let embed;

            var globalList = require('../../src/assets/global-list.json')
            var JPList = require('../../src/assets/jp-list.json')

            var firstHalfJP = JPList.slice(0, Math.ceil(JPList.length / 2))
            var secondHalfJP = JPList.slice(Math.ceil(JPList.length / 2))

            embed = new EmbedBuilder()
                .setColor('LightGrey')
                .setTitle("List of Umas (# of pics)")
                .addFields(
                    {
                        name: "__Global__",
                        value: globalList.map(c => `${c.proper} **(${c.images.length})**`).join("\n") || "N/A",
                        inline: true
                    },
                    {
                        name: "__Japan__",
                        value: firstHalfJP.map(c => `${c.proper} **(${c.images.length})**`).join("\n") || "N/A",
                        inline: true
                    },
                    {
                        name: "​",
                        value: secondHalfJP.map(c => `${c.proper} **(${c.images.length})**`).join("\n") || "N/A",
                        inline: true
                    },
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