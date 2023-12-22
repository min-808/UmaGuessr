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
                    "`/wish`" + " - " + "Wish for characters with HSR rates" + "\n" + 
                    "`/balance`" + " - " + "Check your stellar jade balance" + "\n" + 
                    "`/power`" + " - " + "Check your how much trailblaze power you have" + "\n" + 
                    "`/daily`" + " - " + "Get 1000 stellar jade every 24 hours" + "\n" +
                    "`/pity`" + " - " + "See your 4 and 5 star pities" + "\n" + 
                    "`/collection`" + " - " + "Shows your owned characters" + "\n" + 
                    "`/inventory`" + " - " + "Shows your light cones and items" + "\n" + 
                    "\n" + 
                    "`/help`" + " - " + "Brings up the help menu" + "\n" +
                    "`/math`" + " - " + "Does simple math" + "\n" + 
                    "`/ping`" + " - " + "Pong!" + "\n"
                },
            )
            .setFooter({ text: "Uses the MiHoMo API | Data from StarRailRes & Dimbreath" })

        interaction.reply({ embeds: [testEmbed], files: [file], ephemeral: true });
    }
}