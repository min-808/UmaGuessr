const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { MongoClient } = require("mongodb");

const uri = "mongodb+srv://min:" + process.env.MONGODB_PASS + "@discord-seele.u4g75ks.mongodb.net/";

const img = "stats"

module.exports = {
    name: 'stats',
    description: 'Show the bot stats',
    run: async ({ message, client }) => {
        const file = new AttachmentBuilder(`src/assets/command_images/${img}.png`);
        const user = message.author;
        var globalList = require('../../src/assets/global-list.json')
        var JPList = require('../../src/assets/jp-list.json')
        var allList = globalList.concat(JPList)

        const embed = new EmbedBuilder()
            .setColor('LightGrey')
            .setThumbnail(`attachment://${img}.png`)

        try {
            const client_db = new MongoClient(uri);
            const database = client_db.db("uma");
            const otherDatabase = client_db.db("economy");

            const ids = database.collection("stats");
            const umaStats = database.collection("count");
            const grabUptime = otherDatabase.collection('uptime')

            const data = await ids.find({}, {
                projection: {
                    wins: 1,
                    points: 1,
                    streak: 1,
                    points_today: 1,
                    wins_today: 1,
                }
            }).toArray()

            const sortedUmas = await umaStats.find({}, {
                projection: {
                    name: 1,
                    proper: 1,
                    count: 1,
                }
            }).sort({ count: -1 }).toArray()

            const globalPicsCount = globalList.reduce((sum, item) => sum + item.images.length, 0)
            const JPPicsCount = JPList.reduce((sum, item) => sum + item.images.length, 0)
            const allPicsCount = allList.reduce((sum, item) => sum + item.images.length, 0)

            const totalPoints = data.reduce((sum, item) => sum + item.points, 0)
            const totalWins = data.reduce((sum, item) => sum + item.wins, 0)

            const dailyPoints = data.reduce((sum, item) => sum + item.points_today, 0)
            const dailyWins = data.reduce((sum, item) => sum + item.wins_today, 0)

            // Check how many documents are in the query (discord_id)

            var options = {
                projection: {
                    time: 1
                }
            }

            // Then get the first thing that matches the discord id, and options is the query from before
            var toParseUserUID = await grabUptime.findOne({}, options);
            var getOldTime = toParseUserUID['time']

            var getNewTime = Date.now()

            var writeTime;

            let sec = Math.floor((getNewTime - getOldTime) / (1000))
            let mins = Math.floor((getNewTime - getOldTime) / (1000 * 60))
            let hours = Math.floor((getNewTime - getOldTime) / (1000 * 60 * 60))
            let days = Math.floor((getNewTime - getOldTime) / (1000 * 60 * 60 * 24))

            if ((getNewTime - getOldTime) < 60_000) { // Seconds -> Minutes -> Hours -> Days
                writeTime = `${sec.toFixed(0)} seconds`
            } else if ((getNewTime - getOldTime) < 3_600_000) {
                writeTime = `${mins.toFixed(0)} minutes and ${(sec - (mins * 60)).toFixed(0)} seconds`
            } else if ((getNewTime - getOldTime) < 86_400_000) {
                writeTime = `${hours.toFixed(0)} hours, ${(mins - (hours * 60)).toFixed(0)} minutes, and ${(sec - (mins * 60)).toFixed(0)} seconds`
            } else {
                writeTime = `${days.toFixed(0)} days and ${(hours - (days * 24)).toFixed(0)} hours`
            }

            embed.setTitle(`**Bot Stats**`)

            embed.addFields(
                {
                    name: `__Uma Count__`,
                    value: `**${allList.length}** (All)\n**${JPList.length}** (Japan)\n**${globalList.length}** (Global)`,
                    inline: true
                },
                {
                    name: `__Uma Pictures Count__`,
                    value: `**${allPicsCount}** (All)\n**${JPPicsCount}** (Japan)\n**${globalPicsCount}** (Global)`,
                    inline: true
                },
                {
                    name: `\n`,
                    value: `\n`,
                },
                {
                    name: "__Combined Player Totals__",
                    value: `Total Points: **${totalPoints}** *(+${dailyPoints} today)*\nTotal Wins: **${totalWins}** *(+${dailyWins} today)*`,
                },
                {
                    name: "\n",
                    value: "\n",
                },
                {
                    name: "__Total Players__",
                    value: `${data.length}`,
                    inline: true
                },
                {
                    name: "__Total Servers__",
                    value: `${client.guilds.cache.size ?? 'N/A'}`,
                    inline: true
                },
                {
                    name: "\n",
                    value: "\n",
                },
                {
                    name: "__Top 5 Umas__",
                    value: `1. **${sortedUmas[0]["proper"]}** (${sortedUmas[0]["count"]})\n2. **${sortedUmas[1]["proper"]}** (${sortedUmas[1]["count"]})\n3. **${sortedUmas[2]["proper"]}** (${sortedUmas[2]["count"]})\n4. **${sortedUmas[3]["proper"]}** (${sortedUmas[3]["count"]})\n5. **${sortedUmas[4]["proper"]}** (${sortedUmas[4]["count"]})`,
                    inline: true,
                },
                {
                    name: "__Bottom 5 Umas__",
                    value: `1. **${sortedUmas[sortedUmas.length - 1]["proper"]}** (${sortedUmas[sortedUmas.length - 1]["count"]})\n2. **${sortedUmas[sortedUmas.length - 2]["proper"]}** (${sortedUmas[sortedUmas.length - 2]["count"]})\n3. **${sortedUmas[sortedUmas.length - 3]["proper"]}** (${sortedUmas[sortedUmas.length - 3]["count"]})\n4. **${sortedUmas[sortedUmas.length - 4]["proper"]}** (${sortedUmas[sortedUmas.length - 4]["count"]})\n5. **${sortedUmas[sortedUmas.length - 5]["proper"]}** (${sortedUmas[sortedUmas.length - 5]["count"]})`,
                    inline: true,
                },
                {
                    name: "\n",
                    value: "\n",
                },
                {
                    name: "__Uptime__",
                    value: `${writeTime}`,
                },
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
