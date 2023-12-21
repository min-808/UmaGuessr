const { SlashCommandBuilder, AttachmentBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Shows all available commands'),
    //.setDescription('TEST COMMAND'),
    
    run: ({ interaction }) => {

        const file = new AttachmentBuilder('src/assets/thinking.png');

        const testEmbed = new EmbedBuilder()
            .setColor(0x9a7ee7)
            .setTitle("Commands")
            .setTimestamp()
            .setThumbnail("attachment://thinking.png")
            .addFields(
                {
                    name: "\n",
                    value: 
                    "`/profile`" + " - " + "Returns information about the player" + "\n" + 
                    "`/character`" + " - " + "Returns information about a character" + "\n" + 
                    "`/register`" + " - " + "Allows you to register your UID to the bot" + "\n" +
                    "`/showcase`" + " - " + "(WIP) Extra information about your showcase" + "\n" + 
                    "\n" + 
                    "`/help`" + " - " + "Brings up the help menu" + "\n" +
                    "`/math`" + " - " + "Does simple math" + "\n" + 
                    "`/ping`" + " - " + "Pong!" + "\n"
                },
            )
            .setFooter({ text: "Powered by MiHoMo API | Data from StarRailRes & Dimbreath" })

        interaction.reply({ embeds: [testEmbed], files: [file], ephemeral: true });
    }
}