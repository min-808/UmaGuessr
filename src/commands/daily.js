var { EmbedBuilder } = require('discord.js');
var { MongoClient } = require("mongodb");

const img = "oguri"

const setup = require('../../firstinit');

var uri = "mongodb+srv://min:" + process.env.MONGODB_PASS + "@discord-seele.u4g75ks.mongodb.net/"

module.exports = {
    name: 'daily',
    description: 'Claim your daily points',

    run: async ({ message }) => {

        const file = new AttachmentBuilder(`src/assets/${img}.png`);

        const user = message.author;

        const embed = new EmbedBuilder()
            .setColor('LightGrey')
            .setThumbnail(`attachment://${img}.png`)
            .addFields({ name: "\n", value: `\n` });

        try {
            var currentTime = Date.now();

            var client = new MongoClient(uri)
            var database = client.db("uma");
            var ids = database.collection("stats")
            var discordID = BigInt(user.id)

            const count = await ids.countDocuments({ discord_id: discordID });
            if (count < 1) await setup.init(discordID, "uma", "stats");

            var options = {
                projection: {
                    _id: 0,
                    points: 1,
                    daily_timer: 1,
                }
            }

            var toParseUserUID = await ids.findOne({discord_id: discordID}, options);
            var pastTime = toParseUserUID['daily_timer']

            let sec = Math.floor((pastTime - currentTime) / (1000))
            let mins = Math.floor((pastTime - currentTime) / (1000 * 60))
            let hours = Math.floor((pastTime - currentTime) / (1000 * 60 * 60))
            let days = Math.floor((pastTime - currentTime) / (1000 * 60 * 60 * 24))

            if ((pastTime - currentTime) < 60_000) { // Seconds -> Minutes -> Hours -> Days
                writeTime = `${sec.toFixed(0)} seconds`
            } else if ((pastTime - currentTime) < 3_600_000) {
                writeTime = `${mins.toFixed(0)} minutes and ${(sec - (mins * 60)).toFixed(0)} seconds`
            } else if ((pastTime - currentTime) < 86_400_000) {
                writeTime = `${hours.toFixed(0)} hours, ${(mins - (hours * 60)).toFixed(0)} minutes, and ${(sec - (mins * 60)).toFixed(0)} seconds`
            } else {
                writeTime = `${days.toFixed(0)} days`
            }
            
            // If you can't claim daily yet
            if ((pastTime += 86_400_000) >= currentTime) {
                embed.spliceFields(0, 1,
                    {
                        name: "\n",
                        value: `You can claim again in **${writeTime}**`
                    })

            } else { // You can claim
                const updateValues = {
                    $inc: {
                        points: 75,
                    },
                    $set: {
                        daily_timer: currentTime
                    }
                }

                await ids.updateOne({discord_id: discordID}, updateValues)
                
                embed.spliceFields(0, 1, {
                    name: "\n",
                    value: `You claimed your daily **75** points`
                })

                embed.setTimestamp();
            }

            await message.channel.send({ embeds: [embed], files: [file] });

            await client.close()
        } catch (error) {
            console.log(`There was an error: ${error.stack}`)
            interaction.editReply({ content: "Something broke!"})
            await client.close()
        }
    }
}