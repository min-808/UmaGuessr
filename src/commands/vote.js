const { AttachmentBuilder, EmbedBuilder } = require('discord.js')
var { MongoClient } = require("mongodb");

const img = "vote"
const setup = require('../../firstinit');

var uri = "mongodb+srv://min:" + process.env.MONGODB_PASS + "@discord-seele.u4g75ks.mongodb.net/"

module.exports = {
    name: 'vote',
    aliases: ['v'],
    description: 'Vote for the bot',
    
    run: async ({ message }) => {

        const file = new AttachmentBuilder(`src/assets/command_images/${img}.png`);

        try {
            var client_db = new MongoClient(uri)
            var database = client_db.db("uma")
            var ids = database.collection("stats")
            var discordID = BigInt(message.author.id)

            var currentTime = Date.now()

            const count = await ids.countDocuments({ discord_id: discordID });
            if (count < 1) await setup.init(discordID, "uma", "stats", client);

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

            var voteTimer = toParseUserUID['vote_timer']

            let multRemaining = (voteTimer + 300_000) - currentTime; // time LEFT, not time passed
            let voteRemaining = (voteTimer + 43_200_000) - currentTime

            let embed;

            embed = new EmbedBuilder()
                .setColor('LightGrey')
                .setTitle("Vote")
                .setThumbnail(`attachment://${img}.png`)

            if (data["voted"]) { // if voted in the past 12 hours and the point multiplier has not been activated
                if (voteTimer + 43_200_000 < currentTime) { // if voted in past 12 and the multiplier hasn't been activated
                    embed.setTitle("Thanks for Voting!")
                    embed.addFields(
                        {
                            name: "\n",
                            value: "Use the `!redeem` command to start your **5-minute 1.5x point multiplier!**"
                        },
                    )
                } else if (voteTimer + 300_000 > currentTime) { // if voted in past 12 hours and the multiplier is active
                    embed.setTitle("Vote Multiplier Active")
                    embed.addFields(
                        {
                            name: "\n",
                            value: "Your **1.5x point multiplier** is currently active!"
                        },
                    )
                } else if (voteTimer + 300_000 < currentTime) { // if voted in the past 12 hours and the point multiplier expired (just send how much time left till vote)
                    embed.setTitle("Vote Multiplier Expired")

                    embed.addFields(
                        {
                            name: "\n",
                            value: `Your **1.5x point multiplier** expired\nYou can vote again in **${Math.floor(((voteRemaining)) / (1000 * 60 * 60)).toFixed(0)} hours** and **${Math.floor((voteRemaining % (1000 * 60 * 60)) / (1000 * 60))} minutes**\n\nhttps://top.gg/bot/1400050839544008804/vote`
                        },
                    )
                    
                }
            } else { // haven't voted for the bot
                embed.setTitle("Vote for the bot here!")
                embed.addFields(
                    {
                        name: "\n",
                        value: "https://top.gg/bot/1400050839544008804/vote\n\nAs a thanks for voting, you'll be given a **5-minute 1.5x point multiplier**! To activate the reward, please use the `!redeem` command\n\nYou can vote up to **two times** a day to support our bot <3"
                    },
                )
            }
            
            await message.channel.send({ embeds: [embed], files: [file] });
        } catch (error) {
            console.log(error) // log error

            try {
                await message.channel.send(`Unable to send embed: **${error.rawError.message}**\n\nPlease check the bot's permissions and try again`)
            } catch (error) {
                console.log(`Unable to send message: ${error.rawError.message}`)
            }
        }
    }
}