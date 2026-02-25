const { AttachmentBuilder, EmbedBuilder } = require('discord.js');

const img = "help"

module.exports = {
    name: 'help',
    aliases: ['h'],
    description: 'Shows all available commands',
    
    run: async ({ message, args }) => {

        const file = new AttachmentBuilder(`src/assets/command_images/${img}.png`);

        let embed;

        try {

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
                            "- Start the game with the command `!uma` or `!u`, and guess the uma by sending their name in the chat" + "\n" +
                            "- There are some extra parameters to specify the type you'd like to play on (no parameters will default to Global):" + "\n" +
                            "**-** `!uma g` for characters only from the Global server" + "\n" +
                            "**-** `!uma j` for characters only from the JP server" + "\n" +
                            "**-** `!uma a` for guessing characters from both JP and Global servers" + "\n" +
                            "**-** `!uma h` for guessing the uma's IRL horse counterpart" + "\n" +
                            "**-** `!uma m` for multi-uma guessing" + "\n" +
                            "**-** `!uma p` for guessing umas that are only in your practice list (`!practice`)" + "\n" + 
                            "\n\n\n"
                        },
                        {
                            name: "\n",
                            value:
                            "\n- Use `!set (g/j/a/h/m/p)` to set the region you want the `!uma` command to default to" + "\n" +
                            "- You will have **60** seconds to guess the character, and pressing the `Hint` button will slightly reveal the image" + "\n" +
                            "- If you manage to guess the character without using any hints, you'll get the maximum number of points (**36** points for All, **31** points for IRL, **26** points for JP, **16** for Global)" + "\n" +
                            "- However, every time the Hint button is pressed, you lose points. If all the hints are used or the Unblur button is pressed, you'll only gain **1** point for guessing the uma correctly" + "\n" +
                            "- Capitalization and spacing doesn't matter, but spelling does. `Seiun Sky`, `seiun sky`, and `seiunsky` are all valid answers"
                        },
                        {
                            name: "\n",
                            value:
                            "**__Nicknames__**" + "\n" +
                            "- Note that some umas have nicknames that can be accepted as valid answers: Machitan, Fuku, CB, and TM are a few examples" + "\n" +
                            "- Additionally, umas that share a family name can be guessed with just their first names (McQueen, Ryan, etc.)" + "\n" +
                            "- You can also guess their names in Japanese"
                        },
                        {
                            name: "\n",
                            value:
                            "**__Streaks and Multipliers__**" + "\n" +
                            "- If you use the `!uma` command and guess the uma correctly, you'll increase your streak" + "\n" +
                            "- However, if you skip, the timer runs out, or another person correctly guesses the uma before you, your streak will reset to 0" + "\n" +
                            "- By voting on the bot with `!vote` and using the `!redeem` command, you'll start a **5-minute 1.5x point multiplier**" + "\n" +
                            "- Note that you can vote up to two times a day (once every 12 hours)"
                        },
                        {
                            name: "\n",
                            value:
                            "**__Extra Info__**" + "\n" +
                            "- Only the user who issued the `!uma` command can skip the current character" + "\n" +
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
                            "`!uma`" + " - " + "Play the game (default region is global)" + "\n" +
                            "You can also choose the game type you want to play by doing !uma and adding one of the following: **g**lobal, **j**p, **a**ll, **h**orse, **m**ulti, **p**ractice" + "\n" +
                            "`!set`" + " - " + "Set your default region" + "\n" +
                            "`!skip`" + " - " + "Skip the current character" + "\n" +
                            "`!filter`" + " - " + "Toggle the content filter" + "\n" +
                            "`!practice (add/remove) (uma name)`" + " - " + "Add umas to your practice list, add multiple by separating the names with commas" + "\n" +
                            "`!daily`" + " - " + "Claim your daily points, build up a streak to earn more" + "\n" +
                            "`!daily reminder`" + " - " + "Receive reminder messages when your daily is claimable" + "\n" +
                            "`!vote`" + " - " + "Pull up the bot's vote link" + "\n" +
                            "`!redeem`" + " - " + "Redeem your vote to activate the point multiplier" + "\n"
                        },
                        {
                            name: "\n",
                            value:
                            "**__Profile__**" + "\n" +
                            "`!profile (username/user id)`" + " - " + "Check a player's profile" + "\n" +
                            "`!fav (uma name)`" + " - " + "Add umas to your list of favorites" + "\n" +
                            "`!unfav (uma name)`" + " - " + "Remove an uma from your list of favorites" + "\n" +
                            "`!setquote (quote)`" + " - " + "Set a quote for your profile" + "\n" +
                            "`!lb (type) global`" + " - " + "Global leaderboards" + "\n" +
                            "`!lb (type) server`" + " - " + "Server-wide leaderboards" + "\n" +
                            "Pick a leaderboard sorting option by replacing 'type' with one of these options: **points, wins, daily, streak, time, fast**" + "\n" +
                            "`!char (uma name)`" + " - " + "View an uma's profile" + "\n" +
                            "`!charlist (pics/winrate)`" + " - " + "View the current list of umas" + "\n" +
                            "`!ranks`" + " - " + "View the point rank ranges" + "\n"
                        },
                        {
                            name: "\n",
                            value:
                            "**__Misc.__**" + "\n" +
                            "`!help`" + " - " + "Command information" + "\n" +
                            "`!help uma`" + " - " + "Game information" + "\n" +
                            "`!discord`" + " - " + "Join the Discord server" + "\n" +
                            "`!prefix/!pref`" + " - " + "Set a server-wide prefix for the bot" + "\n" +
                            "`!sources`" + " - " + "Gives a link to find all image sources" + "\n" +
                            "`!stats`" + " - " + "Bot stats" + "\n" +
                            "`!uptime`" + " - " + "Bot uptime" + "\n" +
                            "`!ping`" + " - " + "Pong!" + "\n"
                        },
                    )
            }

            await message.channel.send({ embeds: [embed], files: [file] });

        } catch (error) {
            const msg = error?.rawError?.message || error?.message || String(error);
            console.error("Main uma error:", msg);

            try {
                await message.channel.send(
                    `**Unable to send embed**\n\nPlease check the bot's permissions and try again`
                );
            } catch (sendErr) {
                console.error("Unable to send error message:", sendErr?.message || sendErr);
            }
        }
    }
}