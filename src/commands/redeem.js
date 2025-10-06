const { AttachmentBuilder, EmbedBuilder } = require('discord.js')
var { MongoClient } = require("mongodb");

const img = "vote"
const setup = require('../../firstinit');

module.exports = {
    name: 'redeem',
    aliases: ['redeem', 'r'],
    description: 'Redeem your vote reward',
    
    run: async ({ message }) => {

        const file = new AttachmentBuilder(`src/assets/command_images/${img}.png`);

        try {
            var client_db = new MongoClient(process.env.MONGODB_URI)
            var database = client_db.db("uma")
            var ids = database.collection("profiles")
            var discordID = BigInt(message.author.id)

            var currentTime = Date.now()

            const count = await ids.countDocuments({ discord_id: discordID });
            if (count < 1) await setup.init(discordID, "uma", "profiles", client);

            var options = {
                projection: {
                    _id: 0,
                    inventory: 1,
                    votes: 1,
                    vote_timer: 1,
                }
            }

            const response = await fetch(`https://top.gg/api/bots/${process.env.CLIENT_ID}/check?userId=${discordID}`, {
                headers: {
                    'Authorization': process.env.TOPGG_WEBHOOK_TOKEN
                }
            });

            const data = await response.json()

            var toParseUserUID = await ids.findOne({discord_id: discordID}, options);
            var voteCount = toParseUserUID['votes']
            var voteTimer = toParseUserUID['vote_timer']

            let embed;

            embed = new EmbedBuilder()
                .setColor('LightGrey')
                .setTitle("Vote")
                .setThumbnail(`attachment://${img}.png`)

            let multRemaining = (voteTimer + 300_000) - currentTime; // time LEFT, not time passed
            let voteRemaining = (voteTimer + 43_200_000) - currentTime

            if (data["voted"]) { // if voted in the past 12 hours and the point multiplier has not been activated
                if (voteTimer + 43_200_000 < currentTime) {
                    embed.setTitle("Thanks for Voting!")
                    embed.addFields(
                        {
                            name: "\n",
                            value: `A **1.5x point multiplier** has been activated for the next **5 minutes**`
                        },
                    )

                    await ids.updateOne({ discord_id: discordID }, { $set: { vote_timer: currentTime }, $inc: { votes: 1 } });
                } else if (voteTimer + 300_000 > currentTime) { // if voted in the past 12 hours and the point multiplier is active (send how much time left in multiplier)
                    embed.setTitle("Point Multiplier Active")

                    if (multRemaining < 60_000) {
                        embed.addFields(
                        {
                            name: "\n",
                            value: `Your **1.5x point multiplier** is currently active\n\nRemaining time: **${((Math.floor(multRemaining / 1000)) - ((Math.floor(multRemaining / (1000 * 60))) * 60)).toFixed(0)} seconds**`
                        },
                        )

                    } else {
                        embed.addFields(
                        {
                            name: "\n",
                            value: `Your **1.5x point multiplier** is currently active\n\nRemaining time: **${(Math.floor(multRemaining / (1000 * 60))).toFixed(0)} minutes and ${((Math.floor(multRemaining / 1000)) - ((Math.floor(multRemaining / (1000 * 60))) * 60)).toFixed(0)} seconds**`
                        },
                        )
                    }
                } else if (voteTimer + 300_000 < currentTime) { // if voted in the past 12 hours and the point multiplier expired (just send how much time left till vote)
                    embed.setTitle("Vote Multiplier Expired")

                    embed.addFields(
                        {
                            name: "\n",
                            value: `Your **1.5x point multiplier** expired\n\nVote again in ${Math.floor(((voteRemaining)) / (1000 * 60 * 60)).toFixed(0)} hours`
                        },
                    )
                    
                }
            } else { // hasn't voted in the past 12 hours, send msg
                embed.setTitle("Vote for the bot here!")
                    embed.addFields(
                        {
                            name: "\n",
                            value: "You don't have a point multiplier to redeem right now!\n\n**Vote for the bot here!**\nhttps://top.gg/bot/1400050839544008804/vote"
                        },
                    )
            }
            
            await message.channel.send({ embeds: [embed], files: [file] });
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