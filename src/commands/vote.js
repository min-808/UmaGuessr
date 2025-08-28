const { AttachmentBuilder, EmbedBuilder } = require('discord.js')
var { MongoClient } = require("mongodb");

const img = "vote"
const voteChecker = new Set()
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

            const count = await ids.countDocuments({ discord_id: discordID });
            if (count < 1) await setup.init(discordID, "uma", "stats", client);

            var options = {
                projection: {
                    _id: 0,
                    inventory: 1,
                    votes: 1,
                }
            }

            var toParseUserUID = await ids.findOne({discord_id: discordID}, options);
            var voteCount = toParseUserUID['votes']

            let embed;

            embed = new EmbedBuilder()
                .setColor('LightGrey')
                .setTitle("Vote")
                .setThumbnail(`attachment://${img}.png`)
                .setFooter({ text:`You voted a total of ${voteCount} times` })
                .addFields(
                    {
                        name: "\n",
                        value: `**Vote for the bot here!**\nhttps://top.gg/bot/1400050839544008804/vote\n\nVote rewards are currently **WIP**, but feel free to vote to support us :)\n\n~~You can vote twice a day, and you'll get a Director's Fan as a reward for doing so. The Director's Fan can be activated with \`!boost\` to start a 1.5x point multiplier for 5 minutes\n\nYou can check your inventory and see your current items with \`!inventory\`~~`
                    },
                )

            // embed.addFields({name: "\n", value: "You can vote now!"})

            await message.channel.send({ embeds: [embed], files: [file] });
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