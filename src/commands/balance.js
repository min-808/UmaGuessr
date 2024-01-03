var { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
var { MongoClient } = require("mongodb");

const setup = require('../../firstinit');

var uri = "mongodb+srv://min:" + process.env.MONGODB_PASS + "@discord-seele.u4g75ks.mongodb.net/"

module.exports = {
    data: new SlashCommandBuilder()
    .setName('balance')
    .setDescription('Check your balances'),

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
            .setFooter({text: `1 trailblaze power replenishes every 6 minutes`})

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
                        jade_count: 1,
                        credits: 1,
                        exp_material: 1,
                        trailblaze_power: 1,
                        fuel: 1,
                        missions: 1,
                        missions_completed: 1,
                    }
                }

                // Then get the first thing that matches the discord id, and options is the query from before
                var toParseUserUID = await ids.findOne({discord_id: discordID}, options);
                
                var getMissions = toParseUserUID['missions']

                var addMissionID = []

                for (var i = 0; i < 5; i++) {
                    addMissionID.push(getMissions[i]["id"])
                }

                if ((addMissionID.includes(6)) && (getMissions[addMissionID.indexOf(6)]["completed"] == false)) { // id for balance mission
                    var mission = `missions.${addMissionID.indexOf(6)}.completed`
                    var missionSymbol = `missions.${addMissionID.indexOf(6)}.completed_symbol`

                    const setTrue = {
                        $set: {
                            [mission]: true,
                            [missionSymbol]: "✅",
                        },
                        $inc: {
                            jade_count: 75,
                        }
                    }

                    await ids.updateOne({discord_id: discordID}, setTrue)
                }

                var finalCheck = await ids.findOne({discord_id: discordID}, options);

                var jade_count = finalCheck['jade_count']
                var credits = finalCheck['credits']
                var exp_material = finalCheck['exp_material']
                var trailblaze_power = finalCheck['trailblaze_power']
                var fuel = finalCheck['fuel']
                
                testEmbed.spliceFields(0, 1,
                    {
                        name: "\n",
                        value: `**${jade_count}** Stellar Jade\n**${credits}** Credits\n**${exp_material}** EXP Material\n\n**${trailblaze_power}**/240 Trailblaze Power\n**${fuel}** Fuel`
                    })

                interaction.editReply({ embeds: [testEmbed] });
                await client.close()

                } catch (error) {
                    console.log(`There was an error: ${error}`)
                    interaction.editReply({ content: "Something broke!"})
                    await client.close()
                }
        })();
    }
}