var { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
var { MongoClient } = require("mongodb");

const setup = require('../../firstinit');
const calyxSheet = require('../../src/assets/calyx.json');
const missions = require('./missions');

let choices = ["info", "upgrade"]

var uri = "mongodb+srv://min:" + process.env.MONGODB_PASS + "@discord-seele.u4g75ks.mongodb.net/"

module.exports = {
    data: new SlashCommandBuilder()
    .setName('calyx')
    .setDescription('Available every 2 hours, claim free credits and exp material')
    .addStringOption((option) => 
        option
            .setName("options")
            .setDescription("Get info about calyxes or upgrade the level")
            .setRequired(false)
            .setAutocomplete(true)
    ),

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

                var currentTime = Date.now();

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
                        _id: 0,
                        credits: 1,
                        exp_material: 1,
                        calyx_timer: 1,
                        calyx_level: 1,
                        fuel: 1,
                        missions: 1,
                        missions_completed: 1,
                    }
                }

                // Then get the first thing that matches the discord id, and options is the query from before
                var toParseUserUID = await ids.findOne({discord_id: discordID}, options);
                // Then find the thing called hsr_id
                var pastTime = toParseUserUID['calyx_timer']
                var currentLevel = toParseUserUID['calyx_level']
                var currentCredits = toParseUserUID['credits']

                if (interaction.options.get('options') == undefined) { // You didn't select upgrade
                    // If you can't run the calyx yet
                    if ((pastTime += 7_200_000) >= currentTime) { // every 2 hours
                        testEmbed.spliceFields(0, 1,
                            {
                                name: "\n",
                                value: `You can run the Calyx again in **${((pastTime - currentTime) / (1000 * 60 * 60)).toFixed(1)} hours**`
                            })

                    } else { // You can run the calyx

                        var getLowCredits = calyxSheet[currentLevel]["low_credits"]
                        var getHighCredits = calyxSheet[currentLevel]["high_credits"]

                        var getLowEXP = calyxSheet[currentLevel]["low_exp"]
                        var getHighEXP = calyxSheet[currentLevel]["high_exp"]

                        var getFuelChance = calyxSheet[currentLevel]["fuel_chance"]

                        // Do the luck math

                        var resultingCredits = Math.floor(Math.random() * (getHighCredits - getLowCredits + 1) + getLowCredits)
                        var resultingEXP = Math.floor(Math.random() * (getHighEXP - getLowEXP + 1) + getLowEXP)
                        
                        var resultingFuel = 0

                        // Roll fuel chance

                        var rolledNum = Math.floor(Math.random() * (100) + 1) // 1 to 100 inclusive
                        if (rolledNum < getFuelChance) {
                            resultingFuel += 1
                        }

                        
                        const updateValues = {
                            $inc: {
                                credits: resultingCredits,
                                exp_material: resultingEXP,
                                fuel: resultingFuel
                            }
                        }

                        const setTimer = {
                            $set: {
                                calyx_timer: currentTime
                            }
                        }
                        

                        await ids.updateOne({discord_id: discordID}, updateValues)
                        await ids.updateOne({discord_id: discordID}, setTimer)

                        var getUpdated = await ids.findOne({discord_id: discordID}, options);

                        var retCredits = getUpdated["credits"]
                        var retEXP = getUpdated["exp_material"]
                        var retFuel = getUpdated["fuel"]

                        if (resultingFuel > 0) { // You got fuel
                            testEmbed.spliceFields(0, 1, {
                                name: "\n",
                                value: `**Level ${currentLevel} Calyx Completed!**\n
**+${resultingCredits}** Credits
**+${resultingEXP}** EXP Material
**+${resultingFuel}** Fuel 🌟\n
You now have **${retCredits}** Credits, **${retEXP}** EXP Material, and **${retFuel}** Fuel`
                            })
                            .setFooter({ text: `You can do the Calyx again in 2 hours` })
                        } else {
                            testEmbed.spliceFields(0, 1, {
                                name: "\n",
                                value: `**Level ${currentLevel} Calyx Completed!**\n
**+${resultingCredits}** Credits
**+${resultingEXP}** EXP Material\n
You now have **${retCredits}** Credits and **${retEXP}** EXP Material`
                            })
                            .setFooter({ text: `You can do the Calyx again in 2 hours` })
                        }

                        var getMissions = toParseUserUID['missions']

                        var addMissionID = []

                        for (var i = 0; i < 5; i++) {
                            addMissionID.push(getMissions[i]["id"])
                        }

                        if ((addMissionID.includes(0)) && (getMissions[addMissionID.indexOf(0)]["completed"] == false)) { // id for balance mission
                            var mission = `missions.${addMissionID.indexOf(0)}.completed`
                            var missionSymbol = `missions.${addMissionID.indexOf(0)}.completed_symbol`

                            const setTrue = {
                                $set: {
                                    [mission]: true,
                                    [missionSymbol]: "✅",
                                },
                                $inc: {
                                    jade_count: 75
                                }
                            }

                            // Possible bug where if you finish right when there's a reset, it incorrectly updates the wrong mission since its index 0 and it changes

                            await ids.updateOne({discord_id: discordID}, setTrue)
                        } //
                    }
                        
                    interaction.editReply({ embeds: [testEmbed] });

                    await client.close()

                } else if (interaction.options.get("options").value == "upgrade") { // You want to upgrade
                    if (currentCredits >= calyxSheet[currentLevel]["next_cost"]) { // You have enough credits to upgrade
                        if (currentLevel == 5) { // You're already at the max level (5)
                            testEmbed.spliceFields(0, 1, {
                                name: "\n",
                                value: `You're already at the max Calyx level. More levels will come out soon`
                            })
        
                            interaction.editReply({ embeds: [testEmbed] });
                            await client.close()
                        } else { // You're not at the max level
                            const upgradeCalyx = {
                                $inc: {
                                    calyx_level: 1,
                                    credits: -calyxSheet[currentLevel]["next_cost"]
                                }
                            }

                            await ids.updateOne({discord_id: discordID}, upgradeCalyx)

                            var getNewUpdated = await ids.findOne({discord_id: discordID}, options)
                            var getNewLevel = getNewUpdated['calyx_level']
                            var getNewCredits = getNewUpdated['credits']
    
                            testEmbed.spliceFields(0, 1, {
                                name: "\n",
                                value: `You are now Calyx level **${getNewLevel}**\n\nYou now have **${getNewCredits}** credits`
                            })
        
                            interaction.editReply({ embeds: [testEmbed] });
                            await client.close()
                        }
                    
                    } else { // You don't have enough credits to upgrade
                        testEmbed.spliceFields(0, 1, {
                            name: "\n",
                            value: `You need **${calyxSheet[currentLevel]["next_cost"] - currentCredits}** more credits to unlock level **${currentLevel + 1}**`
                        })
    
                        interaction.editReply({ embeds: [testEmbed] });
                        await client.close()
                    }
                } else if (interaction.options.get('options').value == "info") { // you selected info
                    testEmbed.spliceFields(0, 1, {
                        name: "\n",
                        value: `poop edit later`
                    })

                    interaction.editReply({ embeds: [testEmbed] });
                    await client.close()
                } else { // Invalid option
                    testEmbed.spliceFields(0, 1, {
                        name: "\n",
                        value: `Invalid option, select from list`
                    })

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