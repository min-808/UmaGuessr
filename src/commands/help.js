const { SlashCommandBuilder, AttachmentBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Shows all available commands'),
    
    run: ({ interaction }) => {

        const file = new AttachmentBuilder('src/assets/thinking.png');

        const testEmbed = new EmbedBuilder()
            .setColor(0x9a7ee7)
            .setTitle("Commands")
            .setTimestamp()
            .setThumbnail("attachment://thinking.png")
            .addFields( // Be wary that this is very close to the character limit and could error
                {
                    name: "\n",
                    value: 
                    "**__Game__**" + "\n" +
                    "`/profile`" + " - " + "Returns information about the player" + "\n" + 
                    "`/register`" + " - " + "Allows you to register your UID to the bot" + "\n" +
                    "`/info`" + " - " + "Returns information about a character" + "\n" + 
                    "\n" + 
                    "**__Fun__**" + "\n" +
                    "`/wish`" + " - " + "Wish for characters with HSR rates" + "\n" + 
                    "`/pity`" + " - " + "See your 4/5 star pities" + "\n" + 
                    "`/balance`" + " - " + "Check your jades, exp, credits, and power" + "\n" + 
                    "`/daily`" + " - " + "Get 1000 stellar jade every 24 hours" + "\n" +
                    "`/missions`" + " - " + "Check your daily missions" + "\n" +
                    "`/bonus`" + " - " + "Get a one-time bonus of 5000 jade" + "\n" +
                    "`/characters`" + " - " + "Shows your owned characters" + "\n" + 
                    "`/inventory`" + " - " + "Shows your owned light cones" + "\n" + 
                    "`/equip`" + " - " + "Put light cones on your characters" + "\n" + 
                    "`/unequip`" + " - " + "Remove light cones from your characters" + "\n" + 
                    "`/assignment`" + " - " + "Go on assignments with your characters" + "\n" + 
                    "`/unlock`" + " - " + "Spend credits to unlock new planets" + "\n" + 
                    "`/fuel`" + " - " + "Spend fuel to get trailblaze power" + "\n" + 
                    "`/calyx`" + " - " + "Enter every 2 hours to obtain free exp and credits" + "\n" + 
                    "\n" + 
                    "**__Misc.__**" + "\n" +
                    "`/help`" + " - " + "Brings up the help menu" + "\n" +
                    "`/chat`" + " - " + "Talk with character.ai characters" + "\n" +
                    "`/math`" + " - " + "Does simple math" + "\n" + 
                    "`/ping`" + " - " + "Pong!" + "\n"
                },
            )
            .setFooter({ text: "Uses the MiHoMo API | Data from StarRailRes & Dimbreath" })

        interaction.reply({ embeds: [testEmbed], files: [file] });
    }
}