var { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { getMongoClient } = require('../connect-db.js');

const img = "daily"
const badImg = "n_daily"

const setup = require('../../firstinit');

module.exports = {
    name: 'daily',
    aliases: ['d'],
    description: 'Claim your daily points',

    run: async ({ message, client, args }) => {

        var file = new AttachmentBuilder(`src/assets/command_images/${img}.png`);

        const user = message.author;

        const embed = new EmbedBuilder()
            .setTitle('Daily')
            .setColor('LightGrey')
            .setThumbnail(`attachment://${img}.png`)
            .addFields({ name: "\n", value: `\n` });

        try {
            var currentTime = Date.now();

            var client_db = new getMongoClient();
            var database = client_db.db("uma");
            var ids = database.collection("profiles")
            var discordID = BigInt(user.id)

            var brokenStreak = false
            var pts = 75

            const count = await ids.countDocuments({ discord_id: discordID });
            if (count < 1) await setup.init(discordID, "uma", "profiles", client);

            var options = {
                projection: {
                    _id: 0,
                    points: 1,
                    daily_timer: 1,
                    daily_streak: 1,
                    top_daily_streak: 1,
                    restrict: 1,
                    reminder_msg_sent: 1,
                    reminder_msg_opt: 1,
                }
            }

            var toParseUserUID = await ids.findOne({discord_id: discordID}, options);

            if (toParseUserUID['restrict'] == true) {
                embed.spliceFields(0, 1,
                {
                    name: "\n",
                    value: `You are currently **restricted** and cannot use this command.`
                })

                await message.channel.send({ embeds: [embed] });
                return
            }
            
            if (args.length == 0) {
                var pastTime = toParseUserUID['daily_timer']
                var dailyStreak = toParseUserUID['daily_streak']

                if (pastTime + 169_200_000 < currentTime) {
                    brokenStreak = true
                }

                let remaining = (pastTime + 84_600_000) - currentTime; // time LEFT, not time passed

                let sec = Math.floor(remaining / 1000);
                let mins = Math.floor(remaining / (1000 * 60));
                let hours = Math.floor(remaining / (1000 * 60 * 60));
                let days = Math.floor(remaining / (1000 * 60 * 60 * 24));

                if (remaining < 60_000) {
                    writeTime = `${sec.toFixed(0)} seconds`;
                } else if (remaining < 3_600_000) {
                    writeTime = `${mins.toFixed(0)} minutes and ${(sec - (mins * 60)).toFixed(0)} seconds`;
                } else if (remaining < 84_600_000) {
                    writeTime = `${hours.toFixed(0)} hours, ${(mins - (hours * 60)).toFixed(0)} minutes, and ${(sec - (mins * 60)).toFixed(0)} seconds`;
                } else {
                    writeTime = `${days.toFixed(0)} days`;
                }
                
                // If you can't claim daily yet
                if ((pastTime + 84_600_000) >= currentTime) {
                    file = new AttachmentBuilder(`src/assets/command_images/${badImg}.png`)

                    embed.setThumbnail(`attachment://${badImg}.png`)
                    embed.spliceFields(0, 1,
                        {
                            name: "\n",
                            value: `You can claim again in **${writeTime}**`
                        })

                } else { // You can claim
                    var updateValues;
                    let calcNewTopStreak;
                    let currentTop = toParseUserUID['top_daily_streak']

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

                        calcNewTopStreak = currentTop
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

                        dailyStreak += 1 // updated daily streak
                        calcNewTopStreak = Math.max(currentTop, dailyStreak)
                        
                        updateValues = {
                            $inc: {
                                points: pts,
                                daily_streak: 1,
                            },
                            $set: {
                                daily_timer: currentTime,
                                reminder_msg_sent: false,
                                top_daily_streak: calcNewTopStreak,
                            }
                        }
                    }
                    
                    await ids.updateOne({discord_id: discordID}, updateValues)
                    
                    embed.spliceFields(0, 1, {
                        name: "\n",
                        value: `You claimed your daily **${pts}** points\n\nCurrent Daily streak: **${dailyStreak} days**\nTop Daily Streak: **${calcNewTopStreak} days**`
                    })
                }

                await message.channel.send({ embeds: [embed], files: [file] });
            } else if (args.length > 0) {
                if (((args[0].length == 1) && (args[0].toLowerCase() == "r")) || (args[0].toLowerCase().includes("reminder"))) {
                    // toggle reminder for user

                    if (toParseUserUID['reminder_msg_opt']) {
                        embed.spliceFields(0, 1,
                        {
                            name: "\n",
                            value: `Toggled daily reminder message **off**\n\nYou will **no longer receive a DM** whenever your \`!daily\` is claimable`
                        })
                        
                        await ids.updateOne({discord_id: discordID}, { $set: {reminder_msg_opt: false} })
                    } else {
                        embed.spliceFields(0, 1,
                        {
                            name: "\n",
                            value: `Toggled daily reminder message **on**\n\nYou will now **receive a DM** whenever your \`!daily\` is claimable\n\nMake sure to turn on "Allow DMs from server members" in your Discord settings to receive the reminder messages`
                        })

                        await ids.updateOne({discord_id: discordID}, { $set: {reminder_msg_opt: true} })
                    }

                    await message.channel.send({ embeds: [embed], files: [file] });
                } else {
                    // invalid argument
                    embed.spliceFields(0, 1,
                    {
                        name: "\n",
                        value: `Usage: \n\n\`!daily\` or \`!daily reminder\``
                    })

                    await message.channel.send({ embeds: [embed], files: [file] });
                }
            }
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