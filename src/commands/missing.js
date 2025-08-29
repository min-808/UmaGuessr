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
            console.log(error.rawError.message) // log error

            try {
                await message.channel.send(`Unable to send embed: **${error.rawError.message}**\n\nPlease check the bot's permissions and try again`)
            } catch (error) {
                console.log(`Unable to send message: ${error.rawError.message}`)
            }
        }
    }
}