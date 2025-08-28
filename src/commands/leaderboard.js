const { EmbedBuilder } = require('discord.js');
const { MongoClient } = require("mongodb");
const buttonPagination = require('../../button-pagination');

const uri = "mongodb+srv://min:" + process.env.MONGODB_PASS + "@discord-seele.u4g75ks.mongodb.net/";

module.exports = {
    name: 'leaderboard',
    aliases: ['lb'],
    description: 'The global leaderboard sorted by point count',

    run: async ({ message }) => {
        try {
        let type;
        let proper;
        let countType;

        if (message.content.toLowerCase().includes("wins") || message.content.toLowerCase().includes("w")) {
            type = "wins"
            proper = "Total Wins"
            countType = type
        } else if (message.content.toLowerCase().includes("daily") || message.content.toLowerCase().includes("d")) {
            type = "points_today"
            proper = "Points Today"
            countType = "points"
        } else if (message.content.toLowerCase().includes("streak") || message.content.toLowerCase().includes("s") || message.content.toLowerCase().includes("streaks")) {
            type = "top_streak"
            proper = "Top Streak"
            countType = "streak"
        } else if (message.content.toLowerCase().includes("time") || message.content.toLowerCase().includes("t")) {
            type = "times"
            proper = "Average Answer Time"
            countType = "sec"
        } else if (message.content.toLowerCase().includes("quick") || message.content.toLowerCase().includes("q") || message.content.toLowerCase().includes("quick") || message.content.toLowerCase().includes("q") || message.content.toLowerCase().includes("fast") || message.content.toLowerCase().includes("f")) {
            type = "quickest_answer"
            proper = "Fastest Answer Time"
            countType = "sec"
        } else {
            type = "points"
            proper = "Total Points"
            countType = type
        }

        const client = new MongoClient(uri);
            const database = client.db("uma");
            const ids = database.collection("stats");

            const options = {
                projection: {
                    _id: 0,
                    discord_id: 1,
                    points: 1,
                    wins: 1,
                    streak: 1,
                    points_today: 1,
                    wins_today: 1,
                    top_streak: 1,
                    times: 1,
                    quickest_answer: 1,
                }
            };

            const selectedOption = type

            let listOfDocuments = await ids.find({}, options).toArray();

            if (selectedOption == "times") { // smallest avg first
                listOfDocuments.sort((a, b) => {
                // If not an array, empty, or too short (< 5), replace with [Infinity]
                let aTimes = Array.isArray(a.times) && a.times.length >= 5 ? a.times : [Infinity]
                let bTimes = Array.isArray(b.times) && b.times.length >= 5 ? b.times : [Infinity]

                let aAvg = aTimes.reduce((sum, t) => sum + t, 0) / aTimes.length
                let bAvg = bTimes.reduce((sum, t) => sum + t, 0) / bTimes.length

                return aAvg - bAvg
            })
            } else if (selectedOption == "quickest_answer") {
                listOfDocuments.sort((a, b) => {
                    let aTime = a[selectedOption] === 0 ? Infinity : a[selectedOption]
                    let bTime = b[selectedOption] === 0 ? Infinity : b[selectedOption]

                    return aTime - bTime
                })
            } else {
                listOfDocuments.sort((a, b) => b[selectedOption] - a[selectedOption])
            }

            for (let doc of listOfDocuments) {
                const foundID = doc.discord_id;

                const response = await fetch(`https://discord.com/api/v10/users/${foundID}`, {
                    headers: {
                        'Authorization': 'Bot ' + process.env.TOKEN
                    }
                });

                const parse = await response.json();
                let returnedUsername = String(parse?.username ?? 'Unknown');
                // removed discriminators check since they were phased out

                doc.discord_id = returnedUsername;
            }

            const permaSize = listOfDocuments.length;
            const showPerPage = 5;
            let totalCount = 1;
            let pages = Math.ceil(listOfDocuments.length / showPerPage);
            const embeds = [];
            let displayValue;

            for (let i = 0; i < pages; i++) {
                const embed = new EmbedBuilder()
                    .setTitle(`**Leaderboard (${proper})  |  Page (${i + 1}/${pages})**`)
                    .setColor('LightGrey')

                for (let j = 0; j < showPerPage && listOfDocuments.length > 0; j++) {
                    const entry = listOfDocuments.shift();

                    if (selectedOption == "times") {
                        if (!Array.isArray(entry.times) || entry.times.length === 0 || entry.times.length < 5) {
                            displayValue = 'n/a'
                            countType = ''
                        } else {
                          const avg = entry.times.reduce((sum, t) => sum + t, 0) / entry.times.length;
                          displayValue = (avg / 1000).toFixed(2)
                          countType = "sec"
                        }
                    } else if (selectedOption == "quickest_answer") {
                        if (entry.quickest_answer === 0) {
                                displayValue = 'n/a'
                                countType = ''
                        } else {
                            displayValue = (entry.quickest_answer / 1000).toFixed(2)
                            countType = "sec"
                        }
                    } else {
                        displayValue = entry[selectedOption]
                    }

                    embed.addFields({
                        name: "",
                        value: `${totalCount}. **${entry.discord_id}** - ${displayValue} ${countType}`
                    });
                    totalCount++;
                }

                embed.setFooter({ text: `There are ${permaSize} players` });
                embeds.push({
                    embed: embed,

                })
            }
            const sent = await message.channel.send({ content: 'Fetching leaderboard, please wait...' });

            await buttonPagination(sent, embeds);
            

        } catch (error) {
            console.log(error.rawError.message) // log error

            try {
                await message.channel.send(`Unable to send embed: **${error.rawError.message}**\n\nPlease check the bot's permissions and try again`)
            } catch (error) {
                console.log(`Unable to send message: ${error.rawError.message}`)
            }
        } finally {
            try {
                await client_db.close()
            } catch {
                console.log("Couldn't close the connection")
            }
        }
    }
}
