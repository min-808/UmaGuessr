const { EmbedBuilder } = require('discord.js');
const { MongoClient } = require("mongodb");
const buttonPagination = require('../../button-pagination');

const uri = "mongodb+srv://min:" + process.env.MONGODB_PASS + "@discord-seele.u4g75ks.mongodb.net/";

module.exports = {
    name: 'leaderboard',
    aliases: ['lb'],
    description: 'The global leaderboard sorted by wish count',

    run: async ({ message }) => {
        const sent = await message.channel.send({ content: 'Fetching leaderboard, please wait...' });

        let type;
        let proper;

        if (message.content.toLowerCase().includes("wins") || message.content.toLowerCase().includes("w")) {
            type = "wins"
            proper = "Total Wins"
        } else if (message.content.toLowerCase().includes("daily") || message.content.toLowerCase().includes("d")) {
            type = "points_today"
            proper = "Points Today"
        } else {
            type = "points"
            proper = "Total Points"
        }


        const client = new MongoClient(uri);
        try {
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
                }
            };

            const selectedOption = type
            const countType = proper

            let listOfDocuments = await ids.find({}, options).toArray();

            listOfDocuments.sort((a, b) => b[selectedOption] - a[selectedOption]);

            for (let doc of listOfDocuments) {
                const foundID = doc.discord_id;

                const response = await fetch(`https://discord.com/api/v10/users/${foundID}`, {
                    headers: {
                        'Authorization': 'Bot ' + process.env.TOKEN
                    }
                });

                const parse = await response.json();
                let returnedUsername = String(parse?.username ?? 'Unknown');
                let returnedDiscriminator = String(parse?.discriminator ?? '');

                if (returnedDiscriminator !== '0') {
                    returnedUsername += `#${returnedDiscriminator}`;
                }

                doc.discord_id = returnedUsername;
            }

            const permaSize = listOfDocuments.length;
            const showPerPage = 5;
            let totalCount = 1;
            let pages = Math.ceil(listOfDocuments.length / showPerPage);
            const embeds = [];

            for (let i = 0; i < pages; i++) {
                const embed = new EmbedBuilder()
                    .setTitle(`**Leaderboard (${proper})  |  Page (${i + 1}/${pages})**`)
                    .setColor('LightGrey')

                for (let j = 0; j < showPerPage && listOfDocuments.length > 0; j++) {
                    const entry = listOfDocuments.shift();
                    embed.addFields({
                        name: "",
                        value: `${totalCount}. **${entry.discord_id}** - ${entry[selectedOption]} ${countType}`
                    });
                    totalCount++;
                }

                embed.setFooter({ text: `There are ${permaSize} players` });
                embeds.push({
                    embed: embed,

                })
            }

            await buttonPagination(sent, embeds);
        } catch (error) {
            console.error(`There was an error: ${error.stack}`);
            await sent.edit({ content: "Something broke while building the leaderboard." });
        } finally {
            await client.close();
        }
    }
}
