const { EmbedBuilder, AttachmentBuilder, SlashCommandBuilder } = require('discord.js');
const { MongoClient } = require("mongodb");

const setup = require('../../firstinit');

const uri = "mongodb+srv://min:" + process.env.MONGODB_PASS + "@discord-seele.u4g75ks.mongodb.net/";

const img = "profile"

module.exports = {
    name: 'profile',
    aliases: ['p'],
    description: 'Show your bot game stats',

    data: new SlashCommandBuilder()
        .setName('profile')
        .setDescription('Show your bot game stats')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('The profile you want to search. Leave empty for your own profile')
                .setRequired(false)
        ),

    run: async ({ interaction, client }) => {
        const file = new AttachmentBuilder(`src/assets/command_images/${img}.png`);
        const user = interaction.user;
        var data

        const embed = new EmbedBuilder()
            .setColor('LightGrey')
            .setThumbnail(`attachment://${img}.png`)

        try {
            await interaction.deferReply()

            var client_db = new MongoClient(uri);
            const database = client_db.db("uma");
            const ids = database.collection("stats");
            var discordID = BigInt(user.id);

            var userProvided
            var d

            const count = await ids.countDocuments({ discord_id: discordID });
            if (count < 1) await setup.init(discordID, "uma", "stats", client);

            if (interaction.options.getString('name') != null) {
                var mentionMatch = interaction.options.getString('name').match(/^<@!?(\d+)>$/)
                if (mentionMatch) { // if it's a mention
                    discordID = BigInt(mentionMatch[1])
                    console.log(discordID)
                } else if (interaction.options.getString('name').match(/^\d{17,19}$/)) { // possibly just an id?, regex fuckery (number between 17 and 19 digits incl)
                    discordID = BigInt(interaction.options.getString('name'))
                } else { // not a number with 17-19 digits, so possibly a username string
                    userProvided = interaction.options.getString('name')
                }
            }

            if (userProvided) { // username case
                data = await ids.findOne({ username: userProvided }, {
                    projection: {
                        discord_id: 1,
                        wins: 1,
                        points: 1,
                        streak: 1,
                        points_today: 1,
                        wins_today: 1,
                        top_streak: 1,
                        quickest_answer: 1,
                        times: 1,
                        inventory: 1,
                        username: 1,
                        signup: 1,
                    }
                });

                if (!data) { // Checker for random string
                    interaction.editReply(`Invalid Discord username provided, or the user has not played yet`)
                    return
                }

                userProvided = data["username"]
                discordID = data['discord_id']
                d = new Date(data['signup'])
            } else { // ID case
                data = await ids.findOne({ discord_id: discordID }, {
                    projection: {
                        wins: 1,
                        points: 1,
                        streak: 1,
                        points_today: 1,
                        wins_today: 1,
                        top_streak: 1,
                        quickest_answer: 1,
                        times: 1,
                        inventory: 1,
                        username: 1,
                        signup: 1,
                    }
                });

                if (!data) { // Checker for random id
                    interaction.editReply(`Invalid Discord ID provided, or the user has not played yet`)
                    return
                }

                userProvided = data["username"]
                d = new Date(data['signup'])
            }

            const utcDate = `${(d.getUTCMonth() + 1).toString().padStart(2, '0')}/${d.getUTCDate().toString().padStart(2,'0')}/${d.getUTCFullYear()}`;
            const utcTime = `${d.getUTCHours().toString().padStart(2,'0')}:${d.getUTCMinutes().toString().padStart(2,'0')}:${d.getUTCSeconds().toString().padStart(2,'0')}`;

            const allUsers = await ids.find({}, { projection: { discord_id: 1, points: 1 } })
                .sort({ points: -1 })
                .toArray();

            const rank = allUsers.findIndex(entry => entry.discord_id.toString() === discordID.toString()) + 1;

            const { wins, points, streak, points_today, wins_today, top_streak, quickest_answer, times, signup } = data;

            let quickest;
            let avg;
            
            if (quickest_answer == 0 && times.length < 5) { // Nothing
                quickest = 'n/a'
                avg = '**n/a**'
            } else if (quickest_answer != 0 && times.length < 5) { // A few guesses
                quickest = `${(quickest_answer / 1000).toFixed(2)} sec`
                avg = `**n/a**\n\\- *(Correctly guess ${5 - times.length} more times to get an average time)*`
            } else {
                quickest = `${(quickest_answer / 1000).toFixed(2)} sec`
                const sum = times.reduce((a, b) => a + b, 0)
                avg = `**${(((sum / times.length) || 0) / 1000).toFixed(2)} sec**`
            }

            embed.setTitle(`**${userProvided}'s Profile**`)

            embed.addFields(
                {
                    name: `__Rank__`,
                    value: `#${rank}`,
                    inline: true
                },
                {
                    name: `\n`,
                    value: `\n`,
                },
                {
                    name: "__All Time__",
                    value: `Total correct guesses: **${wins}**\nTotal points: **${points}**\nFastest answer: **${quickest}**\nAverage answer time: ${avg}`,
                },
                {
                    name: "\n",
                    value: "\n",
                },
                {
                    name: "__Today__",
                    value: `Correct guesses today: **${wins_today}**\nPoints earned today: **${points_today}**`,
                },
                {
                    name: `\n`,
                    value: `\n`,
                },
                {
                    name: "__Streak__",
                    value: `Top streak: **${top_streak}**\nCurrent streak: **${streak}**`,
                }
            );

            embed.setFooter({ text: `Joined on ${utcDate} at ${utcTime} UTC` })

            await interaction.editReply({ embeds: [embed], files: [file] })

            await client_db.close();
        } catch (error) {
            const msg = error?.message || String(error);
            console.error("Main uma error:", msg);

            // Send ephemeral fallback safely
            try {
                if (interaction.deferred || interaction.replied) {
                    await interaction.editReply(`Unable to send message: **${msg}**`);
                } else {
                    await interaction.reply({ content: `Unable to send message: **${msg}**`, flags: 64 });
                }
            } catch (sendErr) {
                console.error("Unable to send error message:", sendErr?.message || sendErr);
            }
        }
    }
};
