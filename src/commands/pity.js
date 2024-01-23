var { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
var { MongoClient } = require("mongodb");

const setup = require('../../firstinit');
const checkLevel = require('../../check-level');

const emoteSheet = require('../../src/assets/emotes.json')

var uri = "mongodb+srv://min:" + process.env.MONGODB_PASS + "@discord-seele.u4g75ks.mongodb.net/"

module.exports = {
    data: new SlashCommandBuilder()
    .setName('pity')
    .setDescription('Check your pity'),

    run: ({ interaction }) => {
             
        (async () => { // run, and if an error occurs, you can catch it

            await interaction.deferReply();

            // Placeholder embed for now
            var testEmbed = new EmbedBuilder()
            .setColor(0x9a7ee7)
            .addFields(
                {
                    name: "\n",
                    value: "\n"
                },
            )

            try {

                var client = new MongoClient(uri)

                var database = client.db("economy");
                var ids = database.collection("inventories")
                var discordID = BigInt(interaction.user.id)

                // Check how many documents are in the query (discord_id)
                var counter = await ids.countDocuments({discord_id: discordID})

                if (counter < 1) {
                    // If document not found, make a new database entry, do this for all economy commands
                    await setup.init(discordID, "economy", "inventories")
                }

                var options = {
                    projection: {
                        wish_count: 1,
                        four_star_pity: 1,
                        five_star_pity: 1,
                        missions: 1,
                        missions_completed: 1,
                    }
                }

                // Then get the first thing that matches the discord id, and options is the query from before
                var toParseUserUID = await ids.findOne({discord_id: discordID}, options);
                
                var wishCount = toParseUserUID['wish_count']
                var fourStarPity = toParseUserUID['four_star_pity']
                var fiveStarPity = toParseUserUID['five_star_pity']

                var getMissions = toParseUserUID['missions']

                var addMissionID = []

                for (var i = 0; i < 5; i++) {
                    addMissionID.push(getMissions[i]["id"])
                }

                if ((addMissionID.includes(7)) && (getMissions[addMissionID.indexOf(7)]["completed"] == false)) { // id for balance mission
                    var mission = `missions.${addMissionID.indexOf(7)}.completed`
                    var missionSymbol = `missions.${addMissionID.indexOf(7)}.completed_symbol`

                    const setTrue = {
                        $set: {
                            [mission]: true,
                            [missionSymbol]: "✅",
                        },
                        $inc: {
                            jade_count: 75,
                            exp: 290,
                        }
                    }

                    await ids.updateOne({discord_id: discordID}, setTrue)
                }

                var levelSuccess = await checkLevel.checker(discordID, "economy", "inventories")
                
                testEmbed.spliceFields(0, 1,
                    {
                        name: `\n`,
                        value: `Total Wishes: **${wishCount}**\n
5${emoteSheet["Stars"]["StarBig"]["id"]} Pity: **${fiveStarPity}**\n
4${emoteSheet["Stars"]["StarBig"]["id"]} Pity: **${fourStarPity}**`
                    })

                interaction.editReply({ embeds: [testEmbed] });

                if (levelSuccess) {
                    var levelEmbed = new EmbedBuilder()
                    .setColor(0x9a7ee7)
                    .addFields(
                        {
                            name: "\n",
                            value: "You leveled up!"
                        },
                    )
                    await interaction.channel.send({ embeds: [levelEmbed] })
                }
                
                await client.close()
            } catch (error) {
                console.log(`There was an error: ${error.stack}`)
                interaction.editReply({ content: "Something broke!"})
                await client.close()
            }
        })();
    }
}