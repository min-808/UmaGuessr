const { EmbedBuilder } = require('discord.js');
const { getMongoClient } = require('../connect-db.js');
const buttonPagination = require('../../button-pagination');

module.exports = {
    name: 'leaderboard',
    aliases: ['lb'],
    description: 'The global leaderboard sorted by point count',

    run: async ({ message, args }) => {
        try {
            const sent = await message.channel.send({ content: 'Fetching leaderboard, please wait...' });
            
        let type;
        let range;
        let proper;
        let countType;

        let serverId = BigInt(message.guild.id)
        let title;

        if ((args.length > 0) && ((args[0].length == 1 && args[0].toLowerCase().includes("w")) || (args[0].toLowerCase().includes("wins")))) {
            type = "wins"
            proper = "Total Wins"
            countType = type
        } else if ((args.length > 0) && ((args[0].length == 1 && args[0].toLowerCase().includes("d")) || (args[0].toLowerCase().includes("daily")))) {
            type = "points_today"
            proper = "Points Today"
            countType = "points"
        } else if ((args.length > 0) && ((args[0].length == 1 && args[0].toLowerCase().includes("s")) || (args[0].toLowerCase().includes("streak")) || (args[0].toLowerCase().includes("streaks")))) {
            type = "top_streak"
            proper = "Top Streak"
            countType = "streak"
        } else if ((args.length > 0) && ((args[0].length == 1 && args[0].toLowerCase().includes("t")) || (args[0].toLowerCase().includes("time")) || (args[0].toLowerCase().includes("average")) || (args[0].toLowerCase().includes("avg")))) {
            type = "times"
            proper = "Average Answer Time"
            countType = "sec"
        } else if ((args.length > 0) && ((args[0].length == 1 && args[0].toLowerCase().includes("q")) || (args[0].toLowerCase().includes("quick")) || (args[0].length == 1 && args[0].toLowerCase().includes("f")) || (args[0].toLowerCase().includes("fast")))) {
            type = "quickest_answer"
            proper = "Fastest Answer Time"
            countType = "sec"
        } else {
            type = "points"
            proper = "Total Points"
            countType = type
        }

        if ((args.length > 1) && ((args[1].length == 1 && args[1].toLowerCase().includes("g")) || (args[1].toLowerCase().includes("global")) || (args[1].toLowerCase().includes("all")))) {
            range = "global"
            title = "Global"
        } else if ((args.length > 1) && ((args[1].length == 1 && args[1].toLowerCase().includes("s")) || (args[1].toLowerCase().includes("server")) || (args[1].toLowerCase().includes("local")))) {
            range = "server"
            title = "Server"
        } else {
            range = "global"
            title = "Global"
        }

        const client = new getMongoClient();
        const database = client.db("uma");
        const ids = database.collection("profiles");

        const options = {
            projection: {
                _id: 0,
                discord_id: 1,
                username: 1,
                points: 1,
                wins: 1,
                streak: 1,
                points_today: 1,
                wins_today: 1,
                top_streak: 1,
                times: 1,
                quickest_answer: 1,
                restrict: 1,
            }
        };

        const selectedOption = type
        var userRank
        let listOfDocuments

        if (range == "global") {
            listOfDocuments = await ids.find({}, options).toArray();
            listOfDocuments = listOfDocuments.filter(item => item.restrict != true)
        } else {
            listOfDocuments = await ids.find({ guilds: serverId }, options).toArray();
            listOfDocuments = listOfDocuments.filter(item => item.restrict != true)
        }

        if (selectedOption == "times") { // smallest avg first
            listOfDocuments.sort((a, b) => {
                // If not an array, empty, or too short (< 5), replace with [Infinity]
                let aTimes = Array.isArray(a.times) && a.times.length >= 5 ? a.times : [Infinity]
                let bTimes = Array.isArray(b.times) && b.times.length >= 5 ? b.times : [Infinity]

                let aAvg = aTimes.reduce((sum, t) => sum + t, 0) / aTimes.length
                let bAvg = bTimes.reduce((sum, t) => sum + t, 0) / bTimes.length

                return aAvg - bAvg
            })

            userRank = listOfDocuments.findIndex(c => c.discord_id.toString() === message.author.id.toString()) + 1
        } else if (selectedOption == "quickest_answer") {
            listOfDocuments.sort((a, b) => {
                let aTime = a[selectedOption] === 0 ? Infinity : a[selectedOption]
                let bTime = b[selectedOption] === 0 ? Infinity : b[selectedOption]

                return aTime - bTime
            })

            userRank = listOfDocuments.findIndex(c => c.discord_id.toString() === message.author.id.toString()) + 1
        } else {
            listOfDocuments.sort((a, b) => b[selectedOption] - a[selectedOption])
            userRank = listOfDocuments.findIndex(c => c.discord_id.toString() === message.author.id.toString()) + 1
        }

        /*

        // This process takes forever, scrapped to cache usernames in daily cron job instead
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
        */

        const permaSize = listOfDocuments.length;
        const showPerPage = 5;
        let totalCount = 1;
        let pages = Math.ceil(listOfDocuments.length / showPerPage);
        const embeds = [];
        let displayValue;

        for (let i = 0; i < pages; i++) {
            const embed = new EmbedBuilder()
                .setTitle(`**${title} Leaderboard (${proper})  |  Page (${i + 1}/${pages})**`)
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

                if (selectedOption == "points") {
                    let rankSymbol

                    switch (true) {
                        case (displayValue < 100):
                            rankSymbol = "<:g_rank:1437691349015986228>";
                            break;
                        case (displayValue < 500):
                            rankSymbol = "<:f_rank:1437691358596042812>";
                            break;
                        case (displayValue < 1000):
                            rankSymbol = "<:e_rank:1437691365902516244>";
                            break;
                        case (displayValue < 5000):
                            rankSymbol = "<:d_rank:1437691373200478238>";
                            break;
                        case (displayValue < 10000):
                            rankSymbol = "<:c_rank:1437691381618311168>";
                            break;
                        case (displayValue < 20000):
                            rankSymbol = "<:b_rank:1437691389524574368>";
                            break;
                        case (displayValue < 50000):
                            rankSymbol = "<:a_rank:1437691397128851559>";
                            break;
                        case (displayValue < 100000):
                            rankSymbol = "<:s_rank:1437691404745707671>";
                            break;
                        case (displayValue < 250000):
                            rankSymbol = "<:ss_rank:1437691411939201054>";
                            break;
                        case (displayValue < 300000):
                            rankSymbol = "<:ug_rank:1437732889755389993>";
                            break;
                        case (displayValue < 375000):
                            rankSymbol = "<:uf_rank:1437732891319861258>";
                            break;
                        case (displayValue < 475000):
                            rankSymbol = "<:ue_rank:1437732958176936002>";
                            break;
                        case (displayValue < 600000):
                            rankSymbol = "<:ud_rank:1437732960362303549>";
                            break;
                        case (displayValue < 750000):
                            rankSymbol = "<:uc_rank:1437732961750618152>";
                            break;
                        case (displayValue < 950000):
                            rankSymbol = "<:ub_rank:1437732963147190334>";
                            break;
                        case (displayValue < 1200000):
                            rankSymbol = "<:ua_rank:1437732965021913098>";
                            break;
                        default:
                            rankSymbol = "<:us_rank:1437732966741839872>";
                            break;
                        }

                    embed.addFields({
                        name: "",
                        value: `${totalCount}. ${rankSymbol} **${entry.username}** - ${displayValue} ${countType}`
                    });
                } else {
                    embed.addFields({
                        name: "",
                        value: `${totalCount}. **${entry.username}** - ${displayValue} ${countType}`
                    });
                }

                totalCount++;
            }

            embed.setFooter({ text: `You are rank #${userRank} // There are ${permaSize} players` });
            embeds.push({
                embed: embed,

            })
        }

        await buttonPagination(sent, embeds);

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
