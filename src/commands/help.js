const { AttachmentBuilder, EmbedBuilder } = require('discord.js');

const img = "oguri"

module.exports = {
    name: 'help',
    description: 'Shows all available commands',
    
    run: async ({ message }) => {

        const file = new AttachmentBuilder(`src/assets/${img}.png`);

        let embed;

        if (message.content.toLowerCase().includes("uma")) {
            embed = new EmbedBuilder()
                .setColor('LightGrey')
                .setTitle("Uma Guessing Game Help")
                .setTimestamp()
                .setThumbnail(`attachment://${img}.png`)
                .addFields(
                    {
                        name: "\n",
                        value: 
                        "**__How to Play__**" + "\n" +
                        "- Start the game by using either `!uma` for guessing characters from the JP server, or `!uma g` for characters from the Global server" + "\n" +
                        "- You will have **60** seconds to guess the character, and pressing the `Unblur` button will slightly unblur the image" + "\n" +
                        "- If you manage to guess the character without using any unblur hints, you'll get the maximum number of points (25 points for JP, 13 for Global)" + "\n" +
                        "- However, every time the unblur button is pressed, you lose points. If all the unblur hints are used, you'll only gain 1 point for guessing the uma correctly" + "\n" +
                        "- Also, capitalization and spacing doesn't matter. `Seiun Sky`, `seiun sky`, and `seiunsky` are all valid answers" + "\n\n" +
                        "**__Nicknames__**" + "\n" +
                        "- Note that some umas have nicknames that can be accepted as valid answers: Mambo, Fuku, CB, and TM are a few examples" + "\n" +
                        "- Additionally, umas that share a family name can be guessed with just their first names (McQueen, Ryan)" + "\n"
                    },
                )
        } else {
            embed = new EmbedBuilder()
                .setColor('LightGrey')
                .setTitle("Commands")
                .setTimestamp()
                .setThumbnail(`attachment://${img}.png`)
                .addFields(
                    {
                        name: "\n",
                        value: 
                        "**__Game__**" + "\n" +
                        "`!uma (g/j)`" + " - " + "Play the game (default is **JP** server)" + "\n" +
                        "`!set (g/j)`" + " - " + "Set your default region" + "\n" +
                        "- (**g** - Global, **j** - Japan)" + "\n" +
                        "`!skip`" + " - " + "Skip the current character" + "\n" +
                        "`!daily`" + " - " + "Claim your daily 75 points" + "\n\n" +
                        "**__Profile__**" + "\n" +
                        "`!profile`" + " - " + "Check your profile" + "\n" +
                        "`!lb (points/wins/daily)`" + " - " + "Global leaderboards" + "\n" +
                        "\n" + 
                        "**__Misc.__**" + "\n" +
                        "`!help`" + " - " + "Pulls up the help menu\n- Use `!help uma` for more information about the game" + "\n" +
                        "`!stats`" + " - " + "Bot stats" + "\n" +
                        "`!uptime`" + " - " + "Bot uptime" + "\n" +
                        "`!help`" + " - " + "Brings up the help menu" + "\n" +
                        "`!ping`" + " - " + "Pong!"
                    },
                )
        }

        

        await message.channel.send({ embeds: [embed], files: [file] });
    }
}