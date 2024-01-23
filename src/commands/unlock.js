var { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
var { MongoClient } = require("mongodb");

const setup = require('../../firstinit');
const areaSheet = require('../../src/assets/areas.json')

var uri = "mongodb+srv://min:" + process.env.MONGODB_PASS + "@discord-seele.u4g75ks.mongodb.net/"

module.exports = {
    data: new SlashCommandBuilder()
    .setName('unlock')
    .setDescription('Spend credits to unlock new planets'),

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
                        assignment_level: 1,
                        credits: 1,
                    }
                }

                // Then get the first thing that matches the discord id, and options is the query from before
                var toParseUserUID = await ids.findOne({discord_id: discordID}, options);
                var currentLevel = toParseUserUID['assignment_level']
                var currentCredits = toParseUserUID['credits']

                if (currentLevel == Object.keys(areaSheet).length - 1) {
                    testEmbed.spliceFields(0, 1,
                        {
                            name: "\n",
                            value: `You are at the **max** assignment level`
                        })
                } else {
                    if (currentCredits < areaSheet[currentLevel + 1]['unlock_cost']) {
                        testEmbed.spliceFields(0, 1,
                            {
                                name: "\n",
                                value: `You need **${areaSheet[currentLevel + 1]['unlock_cost'] - currentCredits}** more credits to unlock **${areaSheet[currentLevel + 1]['name']}**`
                            })
                    } else { // you have enough
                        var newLevelCost = areaSheet[currentLevel + 1]['unlock_cost']
                        await ids.updateOne({ discord_id: discordID }, { $inc: { credits: -newLevelCost, assignment_level: 1 }})
                        var getNew = await ids.findOne({discord_id: discordID}, options)
                        var newCredits = getNew['credits']

                        testEmbed.spliceFields(0, 1,
                            {
                                name: "\n",
                                value: `**${areaSheet[currentLevel + 1]['name']}** unlocked! You now have **${newCredits}** Credits`
                            })
                    }
                }

                interaction.editReply({ embeds: [testEmbed] });
                await client.close()

                } catch (error) {
                    console.log(`There was an error: ${error.stack}`)
                    interaction.editReply({ content: "Something broke!"})
                    await client.close()
                }
        })();
    }
}