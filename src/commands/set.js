var { MongoClient } = require("mongodb");

const setup = require('../../firstinit');

var uri = "mongodb+srv://min:" + process.env.MONGODB_PASS + "@discord-seele.u4g75ks.mongodb.net/"

module.exports = {
    name: 'set',
    description: `Change the region you default to for the guessing game`,

    run: async ({ message }) => {

        const user = message.author;

        try {
            var client = new MongoClient(uri)
            var database = client.db("uma");
            var ids = database.collection("stats")
            var discordID = BigInt(user.id)
            
            var newType;
            var oldType;
            var proper;

            const count = await ids.countDocuments({ discord_id: discordID });
            if (count < 1) await setup.init(discordID, "uma", "stats");

            var options = {
                projection: {
                    _id: 0,
                    type: 1,
                }
            }

            var broadSearch = await ids.findOne({ discord_id: discordID })
            oldType = broadSearch["type"]

            if (message.content.toLowerCase().includes("g")) {
                newType = 'g'
                proper = 'Global'
                await message.channel.send("Game region default set to " + `**${proper}**` + ".\nThe `!uma` command will now automatically default to this region")
            } else if (message.content.toLowerCase().includes("j")) {
                newType = 'j'
                proper = "JP"
                await message.channel.send("Set your game region default to " + `**${proper}**` + ".\nWhenever you use `!uma`, it will now automatically default to this region")
            } else {
                newType = oldType
                await message.channel.send(`Invalid region. Please choose ` + "`g` or `jp`")
            }

            const changeType = {
                $set: {
                    type: newType
                }
            }

            await ids.updateOne({ discord_id: discordID }, changeType);
            await client.close()
        } catch (error) {
            console.log(`There was an error: ${error.stack}`)
            interaction.editReply({ content: "Something broke!"})
            await client.close()
        }
    }
}