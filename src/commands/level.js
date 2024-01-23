var { SlashCommandBuilder, EmbedBuilder, ButtonStyle, ButtonBuilder, ActionRowBuilder, ComponentType } = require('discord.js');
var { MongoClient } = require("mongodb");

const setup = require('../../firstinit')
const checkLevel = require('../../check-level');

const levelSheet = require('../../src/assets/levels.json')
const LCSheet = require('../../src/assets/light_cones.json')
const charSheet = require('../../src/assets/characters.json')

var uri = "mongodb+srv://min:" + process.env.MONGODB_PASS + "@discord-seele.u4g75ks.mongodb.net/"

module.exports = {
    data: new SlashCommandBuilder()
    .setName('level')
    .setDescription('Level up your characters and light cones. Run the command with no options to see costs')
    .addStringOption((option) => 
        option
            .setName("target")
            .setDescription("Enter the character or light cone you want to level up")
            .setRequired(false)
    )
    .addIntegerOption((option) =>
        option
            .setName("amount")
            .setDescription("Enter the amount of EXP Material you want to use")
            .setRequired(false)
            
    ),

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

                var charMap = new Map()
                for (var [key, value] of Object.entries(charSheet)) {
                    charMap.set(value["name"], key)
                }

                var LCMap = new Map()
                for (var [key, value] of Object.entries(LCSheet)) {
                    LCMap.set(value["name"], key)
                }

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
                        exp_material: 1,
                        credits: 1,
                        characters: 1,
                        inventory: 1,
                        missions: 1,
                        missions_completed: 1,
                    }
                }

                // Then get the first thing that matches the discord id, and options is the query from before
                var toParseUserUID = await ids.findOne({discord_id: discordID}, options);
                var currentEXPMaterial = toParseUserUID['exp_material']
                var currentChars = toParseUserUID['characters']
                var currentInventory = toParseUserUID['inventory']

                if ((interaction.options.get('target') == undefined) && (interaction.options.get('amount') == undefined)) { // Nothing was entered
                    testEmbed.spliceFields(0, 1,
                        {
                            name: "\n",
                            value: `**__Levels__**\n
You can use **EXP Material** in order to level up your characters and light cones
Both characters and light cones go from level **1-80** and have **ascension periods** where you must ascend (/ascend) to increase the max level\n
Each ascension changes how much EXP Material it takes to gain a level\n
**Levels 1-20** - ${levelSheet["char-lc-20"]["cost"]} material per level
**Levels 21-40** - ${levelSheet["char-lc-40"]["cost"]} material per level
**Levels 41-60** - ${levelSheet["char-lc-60"]["cost"]} material per level
**Levels 61-80** - ${levelSheet["char-lc-80"]["cost"]} material per level\n\n
You can earn **EXP Material** by purchasing them for 250 credits with **/buy**, or doing calyxes every two hours with **/calyx**`
                        })
                    
                    interaction.editReply({ embeds: [testEmbed] });
                    await client.close()
                } else if ((interaction.options.get('amount')) && (interaction.options.get('target') == undefined)) { // No character
                    testEmbed.spliceFields(0, 1,
                        {
                            name: "\n",
                            value: `Enter a character or light cone`
                        })
                    
                    interaction.editReply({ embeds: [testEmbed] });
                    await client.close()
                } else if ((interaction.options.get('amount') == undefined) && (interaction.options.get('target'))) { // No amount
                    testEmbed.spliceFields(0, 1,
                        {
                            name: "\n",
                            value: `Enter an amount`
                        })
                    
                    interaction.editReply({ embeds: [testEmbed] });
                    await client.close()
                } else { // Both were entered
                    var inputTarget = interaction.options.get('target').value

                    if ((charMap.get(inputTarget) == undefined) && (LCMap.get(inputTarget) == undefined)) { // Character/light cone doesn't exist
                        testEmbed.spliceFields(0, 1,
                            {
                                name: "\n",
                                value: `**${inputTarget}** doesn't exist! Check spelling/casing`
                        })

                        interaction.editReply({ embeds: [testEmbed] });
                        await client.close()
                    } else { // Character/LC exists
                        if ((!(charMap.get(inputTarget) in currentChars)) && (!(LCMap.get(inputTarget) in currentInventory))) { // You don't own the character or LC
                            testEmbed.spliceFields(0, 1,
                                {
                                    name: "\n",
                                    value: `You don't have **${inputTarget}**`
                            })
    
                            interaction.editReply({ embeds: [testEmbed] });
                            await client.close()
                        } else { // You own the character/LC
                            var amountEntered = interaction.options.get('amount').value
                    
                            if (amountEntered > currentEXPMaterial) { // You don't have enough
                                testEmbed.spliceFields(0, 1,
                                    {
                                        name: "\n",
                                        value: `You don't have enough EXP Material to use. You entered **${amountEntered}** but you have **${currentEXPMaterial}** EXP Material`
                                    })
                                
                                interaction.editReply({ embeds: [testEmbed] });
                                await client.close()
                            } else { // You have enough, success!


                                var checkLC = LCMap.get(inputTarget)
                                var checkChar = charMap.get(inputTarget)

                                if (checkLC != undefined) { // It's an LC
                                    var getStringLevel = "inventory." + LCMap.get(inputTarget) + ".level"
                                    var getStringAscLevel = "inventory." + LCMap.get(inputTarget) + ".asc_level"

                                    var getLevel = await ids.findOne({discord_id: discordID}, {
                                        projection: {
                                            [getStringLevel]: 1,
                                            [getStringAscLevel]: 1,
                                        }
                                    })

                                    var returnLevel = getLevel['inventory'][checkLC]['level'] // Returns the level
                                    var returnAscLevel = getLevel['inventory'][checkLC]['asc_level'] // Returns the asc level

                                    type = "LC"
                                } else { // It's a character
                                    var getStringLevel = "characters." + charMap.get(inputTarget) + ".level"
                                    var getStringAscLevel = "characters." + charMap.get(inputTarget) + ".asc_level"

                                    var getLevel = await ids.findOne({discord_id: discordID}, {
                                        projection: {
                                            [getStringLevel]: 1,
                                            [getStringAscLevel]: 1,
                                        }
                                    })

                                    var returnLevel = getLevel['characters'][checkChar]['level'] // Returns the level
                                    var returnAscLevel = getLevel['characters'][checkChar]['asc_level'] // Returns the asc level

                                    type = "Char"
                                }

                                if ((returnLevel >= 1) && (returnLevel < 80)) { // LC Lv 1-20 MAKE SURE TO DO THE CASE WHERE YOU OVER LEVEL, so return the books back and set to max level

                                    // First step is to find what the max level is, given the asc level

                                    var maxLevel = 0

                                    if (returnAscLevel == 0) {
                                        maxLevel = 20
                                    } else if (returnAscLevel == 1) {
                                        maxLevel = 40
                                    } else if (returnAscLevel == 2) {
                                        maxLevel = 60
                                    } else if (returnAscLevel == 3) {
                                        maxLevel = 80
                                    }
                                    
                                    var costPerLevel = levelSheet[`char-lc-${maxLevel}`]["cost"]
                                    var levelsRemaining = maxLevel - returnLevel

                                    if (returnLevel == maxLevel) {
                                        testEmbed.spliceFields(0, 1,
                                            {
                                                name: "\n",
                                                value: `**${inputTarget}** is at the max level of **${maxLevel}**/${maxLevel}\nTo increase the Ascension level, do **/ascend**`
                                            })
                                        
                                        interaction.editReply({ embeds: [testEmbed] });
                                        await client.close()
                                    } else if (amountEntered > (costPerLevel * levelsRemaining)) { // Level overflow checker
                                        var getMissions = toParseUserUID['missions']

                                        var addMissionID = []
                    
                                        for (var i = 0; i < 5; i++) {
                                            addMissionID.push(getMissions[i]["id"])
                                        }
                    
                                        if ((addMissionID.includes(11)) && (getMissions[addMissionID.indexOf(11)]["completed"] == false)) { // id for level mission
                                            var mission = `missions.${addMissionID.indexOf(11)}.completed`
                                            var missionSymbol = `missions.${addMissionID.indexOf(11)}.completed_symbol`
                    
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

                                        await ids.updateOne({discord_id: discordID}, { 
                                            $inc: {
                                                exp_material: -(costPerLevel * levelsRemaining)
                                            },
                                            $set: {
                                                [getStringLevel]: maxLevel
                                            }
                                        })

                                        testEmbed.spliceFields(0, 1,
                                            {
                                                name: "\n",
                                                value: `You entered **${amountEntered}**, but you only need **${costPerLevel * levelsRemaining}** EXP Material to reach the max level\n**${amountEntered - (costPerLevel * levelsRemaining)}** EXP Material has been returned to you\n\n**${inputTarget}** is now at the max level of **${maxLevel}**/${maxLevel}\nTo increase the Ascension level, do **/ascend**`
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
                                    } else { // The amount entered won't overflow
                                        var getMissions = toParseUserUID['missions']

                                        var addMissionID = []
                    
                                        for (var i = 0; i < 5; i++) {
                                            addMissionID.push(getMissions[i]["id"])
                                        }
                    
                                        if ((addMissionID.includes(11)) && (getMissions[addMissionID.indexOf(11)]["completed"] == false)) { // id for level mission
                                            var mission = `missions.${addMissionID.indexOf(11)}.completed`
                                            var missionSymbol = `missions.${addMissionID.indexOf(11)}.completed_symbol`
                    
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

                                        if (amountEntered % costPerLevel != 0) { // But it doesn't even out, so add as much as you can then return the remaining
                                            var remainder = amountEntered % costPerLevel // How much is left over
                                            var toAdd = Math.floor(amountEntered / costPerLevel) // How much levels to add

                                            await ids.updateOne({discord_id: discordID}, { 
                                                $inc: {
                                                    exp_material: -amountEntered + remainder,
                                                    [getStringLevel]: toAdd,
                                                }
                                            })

                                            if (toAdd < 1) {
                                                testEmbed.spliceFields(0, 1,
                                                    {
                                                        name: "\n",
                                                        value: `**${inputTarget}** is now level **${returnLevel + Math.floor(amountEntered / costPerLevel)}**/${maxLevel}\nIt takes **${costPerLevel}** EXP to level once at Ascension **${returnAscLevel}**\n\nThe remainder of **${remainder}** EXP Material has been returned\n\nYou have **${currentEXPMaterial -amountEntered + remainder}** EXP Material`
                                                    })
                                                
                                                interaction.editReply({ embeds: [testEmbed] });
                                                await client.close()
                                            } else {
                                                testEmbed.spliceFields(0, 1,
                                                    {
                                                        name: "\n",
                                                        value: `**${inputTarget}** is now level **${returnLevel + Math.floor(amountEntered / costPerLevel)}**/${maxLevel}\n\nThe remainder of **${remainder}** EXP Material has been returned\n\nYou have **${currentEXPMaterial -amountEntered + remainder}** EXP Material`
                                                    })
                                                
                                                interaction.editReply({ embeds: [testEmbed] });
                                                await client.close()
                                            }
                                        } else { // Nice even number we good
                                            await ids.updateOne({discord_id: discordID}, { 
                                                $inc: {
                                                    [getStringLevel]: amountEntered / costPerLevel,
                                                    exp_material: -amountEntered
                                                }
                                            })

                                            testEmbed.spliceFields(0, 1,
                                                {
                                                    name: "\n",
                                                    value: `**${inputTarget}** is now level **${returnLevel + (amountEntered / costPerLevel)}**/${maxLevel}\n\nYou have **${currentEXPMaterial - amountEntered}** EXP Material`
                                                })
                                            
                                            interaction.editReply({ embeds: [testEmbed] });
                                            await client.close()
                                        }
                                    }
                                } else { // Max level?
                                    testEmbed.spliceFields(0, 1,
                                        {
                                            name: "\n",
                                            value: `**${inputTarget}** is at the highest possible level of **${returnLevel}**`
                                        })
                                    
                                    interaction.editReply({ embeds: [testEmbed] });
                                    await client.close()
                                }

                            } 
                        }
                    }

                }
            } catch (error) {
                console.log(`There was an error: ${error.stack}`)
                interaction.editReply({ content: "Something broke!"})
                await client.close()
            }
        })();
    }
}