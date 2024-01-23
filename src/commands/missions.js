var { SlashCommandBuilder, EmbedBuilder, Embed } = require('discord.js');
var { MongoClient } = require("mongodb");

const setup = require('../../firstinit');

let choices = ["claim"]

var uri = "mongodb+srv://min:" + process.env.MONGODB_PASS + "@discord-seele.u4g75ks.mongodb.net/"

module.exports = {
    data: new SlashCommandBuilder()
    .setName('missions')
    .setDescription('Check your daily missions'),

    async autocomplete (interaction) {

        const value = interaction.options.getFocused()

        const filtered = choices.filter(choice => choice.toLowerCase().includes(value));

        if (!interaction) return;

        await interaction.respond(
            filtered.map(choice => ({ name: choice, value: choice }))
        );
    },

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
                        missions: 1,
                        missions_completed: 1,
                        missions_claimed: 1,
                    }
                }

                // Then get the first thing that matches the discord id, and options is the query from before
                var toParseUserUID = await ids.findOne({discord_id: discordID}, options);
                var missions = toParseUserUID['missions']
                var missionsChecker = []

                for (var i = 0; i < missions.length; i++) {
                    missionsChecker.push(missions[i]["completed"])
                }

                console.log(missionsChecker)
                
                if (!(missionsChecker.includes(false))) { // Update missions_completed to true if all done
                    const setTrue = {
                        $set: {
                            missions_completed: true,
                        }
                    }
                    
                    await ids.updateOne({discord_id: discordID}, setTrue)
                }

                var getUpdated = await ids.findOne({discord_id: discordID}, options)
                var completed = getUpdated['missions_completed']
                var hasClaimed = getUpdated['missions_claimed']
    
                if (completed == false) { // Not all done
                    testEmbed.spliceFields(0, 1,
                        {
                            name: "\n",
                            value: `**Daily Missions\n**
${missions[0]["completed_symbol"]} ${missions[0]["description"]}
Reward: **75** stellar jade & **290** Trailblaze EXP\n
${missions[1]["completed_symbol"]} ${missions[1]["description"]}
Reward: **75** stellar jade & **290** Trailblaze EXP\n
${missions[2]["completed_symbol"]} ${missions[2]["description"]}
Reward: **75** stellar jade & **290** Trailblaze EXP\n
${missions[3]["completed_symbol"]} ${missions[3]["description"]}
Reward: **75** stellar jade & **290** Trailblaze EXP\n
${missions[4]["completed_symbol"]} ${missions[4]["description"]}
Reward: **75** stellar jade & **290** Trailblaze EXP\n
❌ Complete all missions (Do /missions after completed to claim)
Reward: **1** fuel`
                        })
                        .setFooter({ text: `Resets daily at 4am EST` })
    
                    interaction.editReply({ embeds: [testEmbed] });
                    await client.close()
                } else { // All done and hasn't claimed fuel

                    if (hasClaimed == false) {
                        const updateAll = {
                            $set: {
                                missions_claimed: true
                            },
                            $inc: {
                                fuel: 1
                            }
                        }

                        await ids.updateOne({discord_id: discordID}, updateAll)

                        const fuelClaimedEmbed = new EmbedBuilder()
                            .setColor(0x9a7ee7)
                            .addFields({ name: `\n`, value: `Claimed your **1** fuel` })

                        interaction.channel.send({ embeds: [fuelClaimedEmbed] });
                    }
                    testEmbed.spliceFields(0, 1,
                        {
                            name: "\n",
                            value: `**Daily Missions\n**
${missions[0]["completed_symbol"]} ${missions[0]["description"]}
Reward: **75** stellar jade\n
${missions[1]["completed_symbol"]} ${missions[1]["description"]}
Reward: **75** stellar jade\n
${missions[2]["completed_symbol"]} ${missions[2]["description"]}
Reward: **75** stellar jade\n
${missions[3]["completed_symbol"]} ${missions[3]["description"]}
Reward: **75** stellar jade\n
${missions[4]["completed_symbol"]} ${missions[4]["description"]}
Reward: **75** stellar jade\n
⭐ Complete all missions
Reward: **1** fuel`
                        })
                        .setFooter({ text: `Resets daily at 4am EST` })

                    interaction.editReply({ embeds: [testEmbed] });
                    await client.close()
                } 
            } catch (error) {
                console.log(`There was an error: ${error.stack}`)
                interaction.editReply({ content: "Something broke!"})
                await client.close()
            }
        })();
    }
}