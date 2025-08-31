var { EmbedBuilder, AttachmentBuilder } = require('discord.js');
var { MongoClient } = require("mongodb");

const img = "daily"
const badImg = "n_daily"

const setup = require('../../firstinit');

var uri = "mongodb+srv://min:" + process.env.MONGODB_PASS + "@discord-seele.u4g75ks.mongodb.net/"

module.exports = {
    name: 'daily',
    aliases: ['d'],
    description: 'Claim your daily points',

    run: async ({ message, client }) => {

        var file = new AttachmentBuilder(`src/assets/command_images/${img}.png`);

        const user = message.author;

        const embed = new EmbedBuilder()
            .setTitle('Daily')
            .setColor('LightGrey')
            .setThumbnail(`attachment://${img}.png`)
            .addFields({ name: "\n", value: `\n` });

        try {
            var currentTime = Date.now();

            var client_db = new MongoClient(uri)
            var database = client_db.db("uma");
            var ids = database.collection("stats")
            var discordID = BigInt(user.id)

            var brokenStreak = false
            var pts = 75

            const count = await ids.countDocuments({ discord_id: discordID });
            if (count < 1) await setup.init(discordID, "uma", "stats", client);

            var options = {
                projection: {
                    _id: 0,
                    points: 1,
                    daily_timer: 1,
                    daily_streak: 1,
                }
            }

            var toParseUserUID = await ids.findOne({discord_id: discordID}, options);
            var pastTime = toParseUserUID['daily_timer']
            var dailyStreak = toParseUserUID['daily_streak']

            if (pastTime + 172_800_000 < currentTime) {
                brokenStreak = true
            }

            let remaining = (pastTime + 86_400_000) - currentTime; // time LEFT, not time passed

            let sec = Math.floor(remaining / 1000);
            let mins = Math.floor(remaining / (1000 * 60));
            let hours = Math.floor(remaining / (1000 * 60 * 60));
            let days = Math.floor(remaining / (1000 * 60 * 60 * 24));

            if (remaining < 60_000) {
                writeTime = `${sec.toFixed(0)} seconds`;
            } else if (remaining < 3_600_000) {
                writeTime = `${mins.toFixed(0)} minutes and ${(sec - (mins * 60)).toFixed(0)} seconds`;
            } else if (remaining < 86_400_000) {
                writeTime = `${hours.toFixed(0)} hours, ${(mins - (hours * 60)).toFixed(0)} minutes, and ${(sec - (mins * 60)).toFixed(0)} seconds`;
            } else {
                writeTime = `${days.toFixed(0)} days`;
            }
            
            // If you can't claim daily yet
            if ((pastTime + 86_400_000) >= currentTime) {
                file = new AttachmentBuilder(`src/assets/command_images/${badImg}.png`)

                embed.setThumbnail(`attachment://${badImg}.png`)
                embed.spliceFields(0, 1,
                    {
                        name: "\n",
                        value: `You can claim again in **${writeTime}**`
                    })

            } else { // You can claim
                var updateValues;

                if (brokenStreak) { // Reset streak
                    console.log("daily streak broken")
                    dailyStreak = 1
                    updateValues = {
                        $inc: {
                            points: pts,
                        },
                        $set: {
                            daily_timer: currentTime,
                            daily_streak: 1
                        }
                    }
                } else {
                    switch (dailyStreak) {
                        case 0:
                            pts = 75
                            break
                        case 1:
                            pts = 85
                            break
                        case 2:
                            pts = 100
                            break
                        case 3:
                            pts = 120
                            break
                        case 4:
                            pts = 150
                            break
                        case 5:
                            pts = 180
                            break
                        case 6:
                            pts = 220
                            break
                        default:
                            pts = 220
                            break
                    }

                    dailyStreak += 1
                    
                    updateValues = {
                        $inc: {
                            points: pts,
                            daily_streak: 1,
                        },
                        $set: {
                            daily_timer: currentTime
                        }
                    }
                }
                
                await ids.updateOne({discord_id: discordID}, updateValues)
                
                embed.spliceFields(0, 1, {
                    name: "\n",
                    value: `You claimed your daily **${pts}** points`
                })

                embed.setFooter({ text: `Daily streak: ${dailyStreak} days` });
            }

            await message.channel.send({ embeds: [embed], files: [file] });

            await client_db.close()
        } catch (error) {
            console.log(error.rawError.message) // log error

            try {
                await message.channel.send(`Unable to send embed: **${error.rawError.message}**\n\nPlease check the bot's permissions and try again`)
            } catch (error) {
                console.log(`Unable to send message: ${error.rawError.message}`)
            }
        }
    }
}