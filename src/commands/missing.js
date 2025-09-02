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
                        "Shinko Windy\n" +
                        "Katsuragi Ace\n" +
                        "Tap Dance City\n" +
                        "Transcend\n" +
                        "Rhein Kraft\n" +
                        "North Flight\n" +
                        "Calstone Light O\n" +
                        "Bubble Gum Fellow\n" +
                        "Air Messiah\n" +
                        "Furioso\n" +
                        "Gran Algeria\n" +
                        "Loves Only You\n" +
                        "Fusaichi Pandora\n"
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