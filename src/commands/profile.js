const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { MongoClient } = require("mongodb");

const setup = require('../../firstinit');

const uri = "mongodb+srv://min:" + process.env.MONGODB_PASS + "@discord-seele.u4g75ks.mongodb.net/";

const img = "profile"

module.exports = {
    name: 'profile',
    aliases: ['p'],
    description: 'Show your bot game stats',
    run: async ({ message }) => {
        const file = new AttachmentBuilder(`src/assets/command_images/${img}.png`);
        const user = message.author;

        const embed = new EmbedBuilder()
            .setColor('LightGrey')
            .setThumbnail(`attachment://${img}.png`)

        try {
            const client = new MongoClient(uri);
            const database = client.db("uma");
            const ids = database.collection("stats");
            const discordID = BigInt(user.id);

            const count = await ids.countDocuments({ discord_id: discordID });
            if (count < 1) await setup.init(discordID, "uma", "stats");

            const data = await ids.findOne({ discord_id: discordID }, {
                projection: {
                    wins: 1,
                    points: 1,
                    streak: 1,
                    points_today: 1,
                    wins_today: 1,
                }
            });

            const allUsers = await ids.find({}, { projection: { discord_id: 1, points: 1 } })
                .sort({ points: -1 })
                .toArray();

            const rank = allUsers.findIndex(entry => entry.discord_id.toString() === discordID.toString()) + 1;

            const { wins, points, streak, points_today, wins_today } = data;

            embed.setTitle(`**${user.username}'s Profile**`)

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
                    value: `Total correct guesses: **${wins}**\nTotal points: **${points}**\nCurrent streak: **${streak}**`,
                },
                {
                    name: "\n",
                    value: "\n",
                },
                {
                    name: "__Today__",
                    value: `Correct guesses today: **${wins_today}**\nPoints earned today: **${points_today}**`,
                }
            );

            await message.channel.send({ embeds: [embed], files: [file] });

            await client.close();
        } catch (err) {
            console.error(err);
            message.channel.send("Something went wrong while retrieving your profile.");
            await client.close()
        }
    }
};
