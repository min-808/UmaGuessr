const { AttachmentBuilder, EmbedBuilder } = require('discord.js');

const img = "help"

module.exports = {
    name: 'help',
    aliases: ['h'],
    description: 'Shows all available commands',
    
    run: async ({ message, args }) => {

        const file = new AttachmentBuilder(`src/assets/command_images/${img}.png`);

        let embed;

        if ((args.length > 0) && (args[0].toLowerCase().includes("uma"))) {
            embed = new EmbedBuilder()
                .setColor('LightGrey')
                .setTitle("Uma Guessing Game Help")
                .setThumbnail(`attachment://${img}.png`)
                .addFields(
                    {
                        name: "\n",
                        value:
                        "**__How to Play__**" + "\n" +
                        "- Start the game by using either `!uma a` for guessing characters from both JP and Global servers, `!uma j` for characters only from the JP server, or `!uma g` for characters only from the Global server" + "\n" +
                        "- Use `!set (a/j/g)` to set the region you want the `!uma` command to default to" + "\n" +
                        "- You will have **60** seconds to guess the character, and pressing the `Hint` button will slightly unblur the image" + "\n" +
                        "- If you manage to guess the character without using any unblur hints, you'll get the maximum number of points (31 points for All, 25 points for JP, 13 for Global)" + "\n" +
                        "- However, every time the unblur button is pressed, you lose points. If all the unblur hints are used, you'll only gain 1 point for guessing the uma correctly" + "\n" +
                        "- Capitalization and spacing doesn't matter, but spelling does. `Seiun Sky`, `seiun sky`, and `seiunsky` are all valid answers"
                    },
                    {
                        name: "\n",
                        value:
                        "**__Nicknames__**" + "\n" +
                        "- Note that some umas have nicknames that can be accepted as valid answers: Machitan, Fuku, CB, and TM are a few examples" + "\n" +
                        "- Additionally, umas that share a family name can be guessed with just their first names (McQueen, Ryan, etc.)"
                    },
                    {
                        name: "\n",
                        value:
                        "**__Streaks__**" + "\n" +
                        "- If you use the `!uma` command and guess the uma correctly, you'll increase your streak" + "\n" +
                        "- However, if you use `!skip`, the timer runs out, or another person correctly guesses the uma before you, your streak will reset to 0"
                    },
                    {
                        name: "\n",
                        value:
                        "**__Extra Info__**" + "\n" +
                        "- Only the user who issued the `!uma` command can skip the current character with `!skip`" + "\n" +
                        "- You do not lose points for taking longer to guess"
                    }
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
                        "`!uma (a/j/g)`" + " - " + "Play the game (default region is Global)" + "\n" +
                        "`!set (a/j/g)`" + " - " + "Set your default region (all, jp, global)" + "\n" +
                        "`!skip`" + " - " + "Skip the current character" + "\n" +
                        "`!daily`" + " - " + "Claim your daily points, earn more with a higher streak" + "\n" +
                        "`!vote`" + " - " + "Coming soon" + "\n\n" +
                        "**__Profile__**" + "\n" +
                        "`!profile`" + " - " + "Check your profile" + "\n" +
                        "`!lb (points/wins/daily/streak/time)`" + " - " + "Global leaderboards" + "\n" +
                        "`!char (uma name)`" + " - " + "View an uma's profile" + "\n" +
                        "\n" + 
                        "**__Misc.__**" + "\n" +
                        "`!help`" + " - " + "Command information" + "\n" +
                        "`!help uma`" + " - " + "Information about the game" + "\n" +
                        "`!stats`" + " - " + "Bot stats" + "\n" +
                        "`!uptime`" + " - " + "Bot uptime" + "\n" +
                        "`!ping`" + " - " + "Pong!" + "\n" + "\n" +
                        "Note that not all the JP umas have been added to the bot. Use !missing to see the umas that have yet to be added"
                    },
                )
        }

        await message.channel.send({ embeds: [embed], files: [file] });
    }
}