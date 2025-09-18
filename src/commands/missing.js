const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'missing',
    aliases: ['m'],
    description: 'Shows all missing umas',
    
    run: async ({ message }) => {

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

            await message.channel.send({ embeds: [embed] });
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
    }
}