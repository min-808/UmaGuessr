const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'missing',
    aliases: ['m'],
    description: 'Shows all missing umas',
    
    run: async ({ message }) => {

        let embed;

        embed = new EmbedBuilder()
            .setColor('LightGrey')
            .setTitle("Missing Umas")
            .addFields(
                {
                    name: "\n",
                    value: 
                    "Yamanin Zephyr\n" +
                    "Wonder Acute\n" +
                    "Hokko Tarumae\n" +
                    "Shinko Windy\n" +
                    "Daiichi Ruby\n" +
                    "Hishi Miracle\n" +
                    "Katsuragi Ace\n" +
                    "K.S. Miracle\n" +
                    "Mejiro Ramonu\n" +
                    "Tap Dance City\n" +
                    "Transcend\n" +
                    "Rhein Kraft\n" +
                    "Sounds of Earth\n" +
                    "North Flight\n" +
                    "Calstone Light O\n" +
                    "Cesario\n" +
                    "Durandal\n" +
                    "Bubble Gum Fellow\n" +
                    "Air Messiah\n" +
                    "Win Variation\n" +
                    "Furioso\n" +
                    "Gran Algeria\n" +
                    "Fenomeno\n" +
                    "Loves Only You\n" +
                    "Chrono Genesis\n" +
                    "Fusaichi Pandora\n" +
                    "Still in Love\n"
                }
            )

        await message.channel.send({ embeds: [embed] });
    }
}