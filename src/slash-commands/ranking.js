const { EmbedBuilder, AttachmentBuilder, SlashCommandBuilder, escapeMarkdown } = require('discord.js');
const { getMongoClient } = require('../connect-db.js');

const img = "ranking";

module.exports = {
    name: 'ranking',
    aliases: ['rankings'],
    description: 'View all your leaderboard rankings',

    data: new SlashCommandBuilder()
        .setName('ranking')
        .setDescription('Show all your rankings on one page')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('The profile you want to search. Leave empty for your own profile')
                .setRequired(false)
        ),

    run: async ({ interaction, client }) => {
        var file = new AttachmentBuilder(`src/assets/command_images/${img}.png`);
        const user = interaction.user;

        try {
            await interaction.deferReply()

            const client = new getMongoClient();
            const database = client.db("uma");
            const ids = database.collection("profiles");

            var discordID = BigInt(user.id);
            var userProvided

            if (interaction.options.getString('name') != null) {
                var mentionMatch = interaction.options.getString('name').match(/^<@!?(\d+)>$/)
                if (mentionMatch) { // if it's a mention
                    discordID = BigInt(mentionMatch[1])
                    console.log(discordID)
                } else if (interaction.options.getString('name').match(/^\d{17,19}$/)) { // possibly just an id?, regex fuckery (number between 17 and 19 digits incl)
                    discordID = BigInt(interaction.options.getString('name'))
                } else { // not a number with 17-19 digits, so possibly a username string
                    userProvided = interaction.options.getString('name').toLowerCase()
                }
            }

            if (userProvided) { // username case
                data = await ids.findOne({ username: userProvided }, {
                    projection: {
                        username: 1,
                        discord_id: 1,
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
                        username: 1,
                        discord_id: 1,
                    }
                });

                if (!data) { // Checker for random id
                    message.channel.send(`Invalid Discord ID provided, or the user has not played yet`)
                    return
                }

                userProvided = data["username"]
                discordID = data['discord_id']
            }

            const embed = new EmbedBuilder()
                .setColor('LightGrey')
                .setThumbnail(`attachment://${img}.png`);
            
            let types = {
                "points": { proper: "__Total Points__", countType: "points" },
                "wins": { proper: "__Total Wins__", countType: "wins" },
                "top_streak": { proper: "__Top Streak__", countType: "streak" },

                "points_today": { proper: "Points Today", countType: "points" },
                "wins_today": { proper: "Wins Today", countType: "wins" },
                "top_daily_streak": { proper: "Top Daily Streak", countType: "daily streak" },

                "points_weekly": { proper: "Weekly Points", countType: "points" },
                "wins_weekly": { proper: "Weekly Wins", countType: "wins" },
                "times": { proper: "Average Answer Time", countType: "sec" },

                "points_monthly": { proper: "Monthly Points", countType: "points" },
                "wins_monthly": { proper: "Monthly Wins", countType: "wins" },
                "quickest_answer": { proper: "Fastest Answer Time", countType: "sec" },
            };

            const options = {
                projection: {
                    _id: 0,
                    discord_id: 1,
                    username: 1,
                    points: 1,
                    points_weekly: 1,
                    points_monthly: 1,
                    wins: 1,
                    wins_weekly: 1,
                    wins_monthly: 1,
                    streak: 1,
                    points_today: 1,
                    wins_today: 1,
                    top_streak: 1,
                    top_daily_streak: 1,
                    times: 1,
                    quickest_answer: 1,
                    restrict: 1,
                }
            };

            let listOfDocuments = await ids.find({}, options).toArray();

            listOfDocuments = listOfDocuments.filter(item => item.restrict != true);

            listOfDocuments = listOfDocuments.map(doc => {
                let avg = Infinity;
                if (Array.isArray(doc.times) && doc.times.length >= 5) {
                    avg = doc.times.reduce((sum, t) => sum + t, 0) / doc.times.length;
                }
                
                let quickest = !doc.quickest_answer ? Infinity : doc.quickest_answer;

                return { ...doc, _computedAvg: avg, _computedQuickest: quickest };
            });

            const authorId = discordID.toString();

            // iterate thru object
            for (const [key, { proper, countType }] of Object.entries(types)) {
                let sorted;

                if (key === "times") {
                    sorted = listOfDocuments.toSorted((a, b) => {
                        if (a._computedAvg === Infinity && b._computedAvg === Infinity) return 0;
                        return a._computedAvg - b._computedAvg
                    });
                } else if (key === "quickest_answer") {
                    sorted = listOfDocuments.toSorted((a, b) => {
                        if (a._computedQuickest === Infinity && b._computedQuickest === Infinity) return 0;
                        return a._computedQuickest - b._computedQuickest
                    });
                } else {
                    sorted = listOfDocuments.toSorted((a, b) => {
                        let valA = a[key] || 0;
                        let valB = b[key] || 0;
                        return valB - valA
                    });
                }

                let index = sorted.findIndex(c => c.discord_id.toString() === authorId);
                
                let displayValue;
                
                if (index !== -1) {
                    let userDoc = sorted[index];
                    let userValue = (key === "times") ? userDoc._computedAvg 
                                  : (key === "quickest_answer") ? userDoc._computedQuickest 
                                  : (userDoc[key] || 0);

                    if (userValue === 0 || userValue === Infinity) {
                        displayValue = "N/A";
                    } else if (index <= 20) {
                        displayValue = `**#${index + 1}**`;
                    } else {
                        displayValue = `#${index + 1}`;
                    }
                } else {
                    displayValue = "Unranked";
                }

                embed.addFields({
                    name: proper,
                    value: displayValue,
                    inline: true,
                });
            }

            embed.setTitle(`**${escapeMarkdown(userProvided)}'s Ranking**`);

            embed.setFooter({ text: `There are ${listOfDocuments.length} players` });

            await interaction.editReply({ embeds: [embed], files: [file] });
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
};