const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { MongoClient } = require("mongodb");

const setup = require('../../firstinit');

const uri = "mongodb+srv://min:" + process.env.MONGODB_PASS + "@discord-seele.u4g75ks.mongodb.net/";

const img = "eat"

module.exports = {
    name: 'profile',
    description: 'Show your bot game stats.',
    run: async ({ message }) => {
        const file = new AttachmentBuilder(`src/assets/${img}.png`);
        const user = message.author;

        const embed = new EmbedBuilder()
            .setColor('LightGrey')
            .setThumbnail(`attachment://${img}.png`)
            .addFields({ name: "\n", value: `\n` });

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
                    streak: 1
                }
            });

            const { wins, points, streak } = data;

            embed.spliceFields(0, 1, {
                name: "\n",
                value: `**${user.username}'s Profile**`
            });

            embed.addFields(
                {
                    name: "\n",
                    value: `Total Correct Guesses: **${wins}**`,
                    inline: true
                },
                {
                    name: "\n",
                    value: `Total Points: **${points}**`,
                },
                {
                    name: "\n",
                    value: `Current Streak: **${streak}**`,
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
