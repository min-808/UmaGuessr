var { SlashCommandBuilder, EmbedBuilder, ButtonStyle, ButtonBuilder, ActionRowBuilder, ComponentType } = require('discord.js');
var { MongoClient } = require("mongodb");

const setup = require('../../firstinit')

const levelSheet = require('../../src/assets/levels.json')
const LCSheet = require('../../src/assets/light_cones.json')
const charSheet = require('../../src/assets/characters.json')

var uri = "mongodb+srv://min:" + process.env.MONGODB_PASS + "@discord-seele.u4g75ks.mongodb.net/"

module.exports = {
    data: new SlashCommandBuilder()
    .setName('ascend')
    .setDescription('Ascend your characters to increase their max level. Run the command with no options to see costs')
    .addStringOption((option) => 
        option
            .setName("target")
            .setDescription("Enter the character or light cone you want to ascend")
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
                var LCMap = new Map()
                var lowerCaseCharMap = new Map()
                var lowerCaseLCMap = new Map()

                for (var [key, value] of Object.entries(charSheet)) {
                    charMap.set(value["name"], key)
                    lowerCaseCharMap.set(value["name"].toLowerCase(), key)
                }

                for (var [key, value] of Object.entries(LCSheet)) {
                    LCMap.set(value["name"], key)
                    lowerCaseLCMap.set(value["name"].toLowerCase(), key)
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
                        credits: 1,
                        characters: 1,
                        inventory: 1,
                    }
                }

                // Then get the first thing that matches the discord id, and options is the query from before
                var toParseUserUID = await ids.findOne({discord_id: discordID}, options);
                var currentCredits = toParseUserUID['credits']
                var currentChars = toParseUserUID['characters']
                var currentInventory = toParseUserUID['inventory']

                if (interaction.options.get('target') == undefined) { // Nothing was entered
                    testEmbed.spliceFields(0, 1,
                        {
                            name: "\n",
                            value: `**__Ascension__**\n
To **ascend** a character or light cone, you must be at the highest level of the **ascension period**:\n
**Level 20** - costs ${levelSheet["char-lc-20asc"]["cost"]} credits
**Level 40** - costs ${levelSheet["char-lc-40asc"]["cost"]} credits
**Level 60** - costs ${levelSheet["char-lc-60asc"]["cost"]} credits\n\n
You can earn **Credits** by wishing with **/wish**, or doing calyxes every two hours with **/calyx**`
                        })
                    
                    interaction.editReply({ embeds: [testEmbed] });
                    await client.close()
                } else if (interaction.options.get('target')) { // Found a target
                    var inputTarget = interaction.options.get('target').value
                    var lowercaseInput = inputTarget.toLowerCase()

                    if ((lowerCaseCharMap.get(lowercaseInput) == undefined) && (lowerCaseLCMap.get(lowercaseInput) == undefined)) { // Character/light cone doesn't exist
                        testEmbed.spliceFields(0, 1,
                            {
                                name: "\n",
                                value: `\`${inputTarget}\` doesn't exist! Check spelling`
                        })

                        interaction.editReply({ embeds: [testEmbed] });
                        await client.close()
                    } else { // Character/LC exists
                        if ((!(lowerCaseCharMap.get(lowercaseInput) in currentChars)) && (!(lowerCaseLCMap.get(lowercaseInput) in currentInventory))) { // You don't own the character or LC
                            testEmbed.spliceFields(0, 1,
                                {
                                    name: "\n",
                                    value: `You don't have \`${inputTarget}\``
                            })
    
                            interaction.editReply({ embeds: [testEmbed] });
                            await client.close()
                        } else { // You own the character/LC

                            var type = ""

                            var checkLC = lowerCaseLCMap.get(lowercaseInput)
                            var checkChar = lowerCaseCharMap.get(lowercaseInput)

                            if (checkLC != undefined) { // It's an LC
                                var getStringLevel = "inventory." + lowerCaseLCMap.get(lowercaseInput) + ".level"
                                var getStringAscLevel = "inventory." + lowerCaseLCMap.get(lowercaseInput) + ".asc_level"

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
                                var getStringLevel = "characters." + lowerCaseCharMap.get(lowercaseInput) + ".level"
                                var getStringAscLevel = "characters." + lowerCaseCharMap.get(lowercaseInput) + ".asc_level"

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

                            var returnFormat = ""

                            if (type == "LC") {
                                returnFormat = LCSheet[lowerCaseLCMap.get(inputTarget)]["name"]
                            } else if (type == "Char") {
                                returnFormat = charSheet[lowerCaseCharMap.get(inputTarget)]["name"]
                            }

                            // This is hella inefficient, maybe i can put it in a loop? but my brain is not large enough sadly
                            if (((returnLevel == 20) && (returnAscLevel == 0)) || ((returnLevel == 40) && (returnAscLevel == 1)) || 
                                ((returnLevel == 60) && (returnAscLevel == 2))) { // Ascension time

                                if ((returnLevel == 80) && (returnAscLevel == 3)) { // Cannot go above 80
                                    testEmbed.spliceFields(0, 1,
                                        {
                                            name: "\n",
                                            value: `You are at the **highest** Ascension level`
                                        })

                                    await interaction.editReply({ embeds: [testEmbed] });
                                } else {

                                    const yesButton = new ButtonBuilder()
                                        .setLabel('✓')
                                        .setStyle(ButtonStyle.Primary)
                                        .setCustomId('yes')

                                    const noButton = new ButtonBuilder()
                                        .setLabel('✗')
                                        .setStyle(ButtonStyle.Danger)
                                        .setCustomId('no')

                                    const buttonRowLC = new ActionRowBuilder().addComponents(yesButton, noButton)

                                    testEmbed.spliceFields(0, 1,
                                        {
                                            name: "\n",
                                            value: `You have hit the max level for Ascension ${returnAscLevel}\nDo you want to ascend **${returnFormat}** to Ascension **${returnAscLevel + 1}**?\n\nCost: **${levelSheet[`char-lc-${returnLevel}asc`]["cost"]}** credits`
                                        })

                                    const reply = await interaction.editReply({ embeds: [testEmbed], components: [buttonRowLC] });

                                    const collector = reply.createMessageComponentCollector({
                                        componentType: ComponentType.Button,
                                        filter: (i) =>
                                        i.user.id === interaction.user.id && i.channelId === interaction.channelId, // Only the person who did the command can interact
                                        time: 20_000
                                    })
                    
                                    collector.on('collect', async (interaction) => {
                                        if (interaction.customId === 'yes') {

                                            if (currentCredits >= levelSheet[`char-lc-${returnLevel}asc`]["cost"]) { // You have enough credits
                                                await ids.updateOne({discord_id: discordID}, {
                                                    $inc: {
                                                        [getStringAscLevel]: 1,
                                                        credits: -levelSheet[`char-lc-${returnLevel}asc`]["cost"]
                                                    }
                                                })

                                                testEmbed.spliceFields(0, 1,
                                                    {
                                                        name: "\n",
                                                        value: `Ascended **${returnFormat}** to Ascension **${returnAscLevel + 1}**\nThe max level is now **${levelSheet[`char-lc-${returnLevel}asc`]["max_level"]}**\n\nYou now have **${currentCredits - levelSheet[`char-lc-${returnLevel}asc`]["cost"]}** credits`
                                                    })
                                                
                                                interaction.reply({ embeds: [testEmbed] });
                                                await client.close()

                                                collector.stop()
                                            } else { // You don't have enough credits
                                                testEmbed.spliceFields(0, 1,
                                                    {
                                                        name: "\n",
                                                        value: `You don't have enough to ascend. You need **${levelSheet[`char-lc-${returnLevel}asc`]["cost"]}** credits, but you have **${currentCredits}** credits`
                                                    })
                                                
                                                interaction.reply({ embeds: [testEmbed] });
                                                await client.close()

                                                collector.stop()
                                            }
                                        }
                    
                                        if (interaction.customId === 'no') {
                                            testEmbed.spliceFields(0, 1,
                                                {
                                                    name: "\n",
                                                    value: `No action was taken`
                                                })
                                            
                                            interaction.reply({ embeds: [testEmbed] });
                                            await client.close()

                                            collector.stop()
                                        }
                                    })

                                    collector.on('end', async () => {
                                        yesButton.setDisabled(true)
                                        noButton.setDisabled(true)
                    
                                        reply.edit({
                                            components: [buttonRowLC]
                                        })
                                        await client.close()
                                    })
                                }
                                
                                
                            } else {
                                var maxLevel = "?"

                                if (returnAscLevel == 0) {
                                    maxLevel = 20
                                } else if (returnAscLevel == 1) {
                                    maxLevel = 40
                                } else if (returnAscLevel == 2) {
                                    maxLevel = 60
                                } else if (returnAscLevel == 3) {
                                    maxLevel = 80
                                }

                                if (returnLevel == maxLevel) {
                                    testEmbed.spliceFields(0, 1,
                                        {
                                            name: "\n",
                                            value: `**${returnFormat}** has hit the max Ascension level`
                                        })
                                    
                                    interaction.editReply({ embeds: [testEmbed] });
                                    await client.close()
                                } else {
                                    testEmbed.spliceFields(0, 1,
                                        {
                                            name: "\n",
                                            value: `You can't ascend\n\n**${returnFormat}**'s level is **${returnLevel}**/${maxLevel}`
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