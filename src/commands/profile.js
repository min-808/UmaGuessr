const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { MongoClient } = require("mongodb");

const setup = require('../../firstinit');

const uri = "mongodb+srv://min:" + process.env.MONGODB_PASS + "@discord-seele.u4g75ks.mongodb.net/";

const img = "profile"

module.exports = {
    name: 'profile',
    aliases: ['p'],
    description: 'Show your bot game stats',
    run: async ({ message, args, client }) => {
        const file = new AttachmentBuilder(`src/assets/command_images/${img}.png`);
        const user = message.author;
        var data

        const embed = new EmbedBuilder()
            .setColor('LightGrey')
            .setThumbnail(`attachment://${img}.png`)

        try {
            var client_db = new MongoClient(uri);
            const database = client_db.db("uma");
            const ids = database.collection("stats");
            var discordID = BigInt(user.id);

            var userProvided

            const count = await ids.countDocuments({ discord_id: discordID });
            if (count < 1) await setup.init(discordID, "uma", "stats", client);

            if (args.length > 0) {
                if (message.mentions.users.size > 0) { // if it's a mention
                    discordID = BigInt(message.mentions.users.first().id)
                    console.log(discordID)
                } else if (/^\d{17,19}$/.test(args[0])) { // possibly just an id?, regex fuckery (number between 17 and 19 digits incl)
                    discordID = BigInt(args[0])
                } else if (typeof args[0] == 'string') { // not a number with 17-19 digits, so possibly a username string
                    userProvided = args[0]
                } else { // nothing
                    message.channel.send(`Invalid Discord ID provided`)
                    return
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
                    }
                });

                if (!data) { // Checker for random string
                    message.channel.send(`Invalid Discord username provided, or the user has not played yet`)
                    return
                }

                userProvided = data["username"]
                discordID = data['discord_id']
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
                    }
                });

                if (!data) { // Checker for random id
                    message.channel.send(`Invalid Discord ID provided, or the user has not played yet`)
                    return
                }

                userProvided = data["username"]
            }

            const allUsers = await ids.find({}, { projection: { discord_id: 1, points: 1 } })
                .sort({ points: -1 })
                .toArray();

            const rank = allUsers.findIndex(entry => entry.discord_id.toString() === discordID.toString()) + 1;

            const { wins, points, streak, points_today, wins_today, top_streak, quickest_answer, times } = data;

            let quickest;
            let avg;
            
            if (quickest_answer == 0 && times.length < 5) { // Nothing
                quickest = 'n/a'
                avg = '**n/a**'
            } else if (quickest_answer != 0 && times.length < 5) { // A few guesses
                quickest = `${(quickest_answer / 1000).toFixed(2)} sec`
                avg = `**n/a**\n\\- *(Correctly guess ${5 - times.length} more times to get an average)*`
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

            await message.channel.send({ embeds: [embed], files: [file] });

            await client_db.close();
        } catch (error) {
            const msg = error?.rawError?.message || error?.message || String(error);
            console.error("Main uma error:", msg);

            try {
                await message.channel.send(
                    `Unable to send embed: **${msg}**\n\nPlease check the bot's permissions and try again`
                );
            } catch (sendErr) {
                console.error("Unable to send error message:", sendErr?.message || sendErr);
            }
        }
    }
};
