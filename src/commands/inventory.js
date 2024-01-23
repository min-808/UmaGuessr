var { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
var { MongoClient } = require("mongodb");

const setup = require('../../firstinit');
const checkLevel = require('../../check-level');
const buttonPagination = require('../../button-pagination')

const charSheet = require('../../src/assets/characters.json')
const LCSheet = require('../../src/assets/light_cones.json')
const emoteSheet = require('../../src/assets/emotes.json')

const levelSheet = require('../assets/levels.json')

var uri = "mongodb+srv://min:" + process.env.MONGODB_PASS + "@discord-seele.u4g75ks.mongodb.net/"

module.exports = {
    data: new SlashCommandBuilder()
    .setName('inventory')
    .setDescription('Check your light cones and items'),

    run: ({ interaction }) => {
             
        (async () => { // run, and if an error occurs, you can catch it

            try {

                var client = new MongoClient(uri)

                var database = client.db("economy");
                var ids = database.collection("inventories")
                var discordID = BigInt(interaction.user.id)

                var counter = await ids.countDocuments({discord_id: discordID})

                if (counter >= 1) { // If you have an account with the bot AND you have at least one thing in your inventory

                    var options = {
                        projection: {
                            inventory: 1,
                            missions: 1,
                            missions_completed: 1,
                        }
                    }
    
                    var toParseUserUID = await ids.findOne({discord_id: discordID}, options)
                    var listOfItems = toParseUserUID['inventory']
                    
                    var getMissions = toParseUserUID['missions']

                    var addMissionID = []

                    for (var i = 0; i < 5; i++) {
                        addMissionID.push(getMissions[i]["id"])
                    }

                    if ((addMissionID.includes(9)) && (getMissions[addMissionID.indexOf(9)]["completed"] == false)) { // id for inventory mission
                        var mission = `missions.${addMissionID.indexOf(9)}.completed`
                        var missionSymbol = `missions.${addMissionID.indexOf(9)}.completed_symbol`

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
                                value: "Your Trailblaze Level increased!\n\nClaim rewards with **/rewards** or check your level with **/profile**"
                            },
                        )
                        await interaction.channel.send({ embeds: [levelEmbed] })
                    }
    
                    // console.log(listOfItems)
                    var size = Object.keys(listOfItems).length
                    var permaSize = Object.keys(listOfItems).length
    
                    // console.log(size)

                    var showPerPage = 5

                    if (size > 0) {
                
                        var pages = Math.floor(size / showPerPage)
                        if (size % showPerPage != 0) { // In case of uneven pages
                            pages += 1;
                        }

                        const embeds = []
                        var whoItsOn = ""

                        var getLevelValues = Object.values(levelSheet)

                        for (let i = 0; i < pages; i++) {
                            embeds.push(new EmbedBuilder().setDescription(`**Inventory | Page (${i + 1}/${pages})**`)
                            .setColor(0x9a7ee7)
                            .addFields(
                                { name: "\n", value: "\n" },
                                { name: "\n", value: "\n" },
                                { name: "\n", value: "\n" },
                                { name: "\n", value: "\n" },
                                { name: "\n", value: "\n" }
                            )
                            )

                            if (size >= showPerPage) { // fill the page!
                                
                                for (var j = 0; j < showPerPage; j++) {
                                    currentItem = Object.keys(listOfItems)[Object.keys(listOfItems).length - 1] // Set the current item to the last one

                                    if (listOfItems[currentItem]["equipped_on"] == -1) {
                                        whoItsOn = "None"
                                    } else {
                                        whoItsOn = charSheet[listOfItems[currentItem]["equipped_on"]]["name"]
                                    }

                                    embeds[i].spliceFields(j, j + 1,
                                        {
                                            name: `**${LCSheet[currentItem]["name"]}** (${LCSheet[currentItem]["rarity"]}${emoteSheet["Stars"]["StarBig"]["id"]})`, value: `Equipped on: **${whoItsOn}**\nLevel: **${listOfItems[currentItem]["level"]}**/${getLevelValues[4 + listOfItems[currentItem]['asc_level']]["max_level"]}\nSuperimpose: **${listOfItems[currentItem]["si"]}**`
                                        }
                                    )
                                    delete listOfItems[`${currentItem}`] // Remove the first item from your list
                                }
                                embeds[i].setFooter({text: `You have ${permaSize} items`})
                                size -= showPerPage // Decrement
                            } else if (size < showPerPage) { // only fill as much as you need (size)
                                for (var h = 0; h < size; h++) {
                                    currentItem = Object.keys(listOfItems)[Object.keys(listOfItems).length - 1]

                                    if (listOfItems[currentItem]["equipped_on"] == -1) {
                                        whoItsOn = "None"
                                    } else {
                                        whoItsOn = charSheet[listOfItems[currentItem]["equipped_on"]]["name"]
                                    }

                                    embeds[i].spliceFields(h, h + 1,
                                        {
                                            name: `**${LCSheet[currentItem]["name"]}** (${LCSheet[currentItem]["rarity"]}${emoteSheet["Stars"]["StarBig"]["id"]})`, value: `Equipped on: **${whoItsOn}**\nLevel: **${listOfItems[currentItem]["level"]}**/${getLevelValues[4 + listOfItems[currentItem]['asc_level']]["max_level"]}\nSuperimpose: **${listOfItems[currentItem]["si"]}**`
                                        }
                                    )
                                    delete listOfItems[`${currentItem}`]
                                }
                                embeds[i].setFooter({text: `You have ${permaSize} items`})
                                size = 0
                            }
                        }
                        await buttonPagination(interaction, embeds)
                        
                        await client.close()
                    } else if (size == 0) { // You have an account but you didn't wish yet; 0 inventory
                        var testEmbed = new EmbedBuilder()
                        .setDescription(`**Inventory | Page (1/1)**`)
                        .setColor(0x9a7ee7)
                        .addFields(
                            { name: "You have no items!", value: "\n" }
                        )
                        
                        await interaction.deferReply()
                        interaction.editReply({ embeds: [testEmbed] });
                        await client.close()
                        }
                } else if (counter == 0) { // You don't have an account yet, this assumes you have 0 inventory
                    
                    await setup.init(discordID, "economy", "inventories")

                    var testEmbed = new EmbedBuilder()
                        .setDescription(`**Inventory | Page (1/1)**`)
                        .setColor(0x9a7ee7)
                        .addFields(
                            { name: "You have no items!", value: "\n" }
                    )
                    
                    await interaction.deferReply()
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