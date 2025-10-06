const { AttachmentBuilder, EmbedBuilder, SlashCommandBuilder } = require('discord.js');

const img = "help"

module.exports = {
    name: 'help',
    aliases: ['h'],
    description: 'Shows all available commands',

    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Shows all available commands')
        .addStringOption(option =>
            option.setName('options')
                .setDescription('Choose another help command to use')
                .addChoices(
                    { name: 'Uma', value: 'uma' },
                )),
    
    run: async ({ interaction, args }) => {

        const file = new AttachmentBuilder(`src/assets/command_images/${img}.png`);

        let embed;

        try {

            await interaction.deferReply()

            if (interaction.options.getString('options') == "uma") {
                embed = new EmbedBuilder()
                    .setColor('LightGrey')
                    .setTitle("Uma Guessing Game Help")
                    .setThumbnail(`attachment://${img}.png`)
                    .addFields(
                        {
                            name: "\n",
                            value:
                            "**__How to Play__**" + "\n" +
                            "- Start the game with the command `/uma` or `/u`, and guess the uma by sending their name in the chat" + "\n" +
                            "- There are some extra parameters to specify which region you'd like to play on (no parameters will default to Global):" + "\n" +
                            "**-** `/uma a` for guessing characters from both JP and Global servers" + "\n" +
                            "**-** `/uma j` for characters only from the JP server" + "\n" +
                            "**-** `!uma g` for characters only from the Global server" + "\n" +
                            "**-** `!uma h` for the IRL horse counterpart" + "\n\n\n"
                        },
                        {
                            name: "\n",
                            value:
                            "\n- Use `/set (a/j/g/h)` to set the region you want the `/uma` command to default to" + "\n" +
                            "- You will have **60** seconds to guess the character, and pressing the `Hint` button will slightly unblur the image" + "\n" +
                            "- If you manage to guess the character without using any unblur hints, you'll get the maximum number of points (**36** points for All, **26** points for JP, **16** for Global)" + "\n" +
                            "- However, every time the unblur button is pressed, you lose points. If all the unblur hints are used, you'll only gain 1 point for guessing the uma correctly" + "\n" +
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
                            "- If you use the `/uma` command and guess the uma correctly, you'll increase your streak" + "\n" +
                            "- However, if you use `/skip`, the timer runs out, or another person correctly guesses the uma before you, your streak will reset to 0" + "\n" +
                            "- By voting on the bot with `/vote` and using the `/redeem` command, you'll start a **5-minute 1.5x point multiplier**" + "\n" +
                            "- Note that you can vote up to two times a day (once every 12 hours)"
                        },
                        {
                            name: "\n",
                            value:
                            "**__Extra Info__**" + "\n" +
                            "- Only the user who issued the `/uma` command can skip the current character with `/skip`" + "\n" +
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
                            "`/uma (region)`" + " - " + "Play the game (default region is global)" + "\n" +
                            "`/set (region)`" + " - " + "Set your default region (**a**ll, **j**p, **g**lobal)" + "\n" +
                            "`/skip`" + " - " + "Skip the current character" + "\n" +
                            "`/daily`" + " - " + "Claim your daily points, earn more with a higher streak" + "\n" +
                            "`/vote`" + " - " + "Pull up the bot's vote link" + "\n" +
                            "`/redeem`" + " - " + "Redeem your vote to activate the point multiplier" + "\n" +
                            "\n" +
                            "**__Profile__**" + "\n" +
                            "`/profile (username/id)`" + " - " + "Check a player's profile" + "\n" +
                            "`/lb (option)`" + " - " + "Global leaderboards" + "\n" +
                            "`/char (name)`" + " - " + "View an uma's profile" + "\n" +
                            "`/charlist (pics/winrate)`" + " - " + "View the current list of umas in the bot" + "\n" +
                            "\n" + 
                            "**__Misc.__**" + "\n" +
                            "`/help`" + " - " + "Command information" + "\n" +
                            "`/help uma`" + " - " + "Information about the game" + "\n" +
                            "`/discord`" + " - " + "Join the Discord server" + "\n" +
                            "`/prefix or /pref`" + " - " + "Set a server-wide prefix for the bot" + "\n" +
                            "`/stats`" + " - " + "Bot stats" + "\n" +
                            "`/uptime`" + " - " + "Bot uptime" + "\n" +
                            "`/ping`" + " - " + "Pong!" + "\n"
                        },
                    )
            }

            await interaction.editReply({ embeds: [embed], files: [file] });

        } catch (error) {
            const msg = error?.rawError?.message || error?.message || String(error);
            console.error("Main uma error:", msg);

            // Send ephemeral fallback safely
            try {
                if (interaction.deferred || interaction.replied) {
                    await interaction.editReply(`**Unable to send embed**\n\nPlease check the bot's permissions and try again`);
                } else {
                    await interaction.reply({ content: `**Unable to send embed**\n\nPlease check the bot's permissions and try again`, flags: 64 });
                }
            } catch (sendErr) {
                console.error("Unable to send error message:", sendErr?.message || sendErr);
            }
        }
    }
}