var { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
var { MongoClient } = require("mongodb");

const setup = require('../../firstinit');
const calculate = require('../../pity-calculator');

const LCSheet = require('../../src/assets/light_cones.json')
const charSheet = require('../../src/assets/characters.json')
const emoteSheet = require('../../src/assets/emotes.json')

var uri = "mongodb+srv://min:" + process.env.MONGODB_PASS + "@discord-seele.u4g75ks.mongodb.net/"

module.exports = {
    data: new SlashCommandBuilder()
    .setName('wish')
    .setDescription('Wish for characters and items!'),

    run: ({ interaction }) => {
             
        (async () => { // run, and if an error occurs, you can catch it

            await interaction.deferReply();

            // Placeholder embed for now
            var testEmbed = new EmbedBuilder()
            .setColor(0x9a7ee7)
            .setThumbnail()
            .setFooter( {text: "\n"} )
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
                var discordID = parseInt(interaction.user.id)

                // Check how many documents are in the query (discord_id)
                var counter = await ids.countDocuments({discord_id: discordID})

                // If document found, get the hsr_id (set to 1)
                if (counter >= 1) {

                    var options = {
                        projection: {
                            jade_count: 1,
                            inventory: 1,
                            characters: 1,
                            eidolons: 1,
                            wish_count: 1,
                            four_star_pity: 1,
                            five_star_pity: 1
                        }
                    }

                    // Then get the first thing that matches the discord id, and match it to the options query above
                    var toParseUserUID = await ids.findOne({discord_id: discordID}, options);
                    // Then find the thing
                    var currentAmount = toParseUserUID['jade_count']
                    
                    // You don't have enough to wish
                    if (currentAmount < 160) {
                        testEmbed.spliceFields(0, 1, {
                            name: "\n",
                            value: `You have **${currentAmount}** stellar jade, you need **160** to wish`
                        })
                        
                        interaction.editReply({ embeds: [testEmbed] });
                        await client.close()
                    } else {

                        threeStarLC = [20000, 20001, 20002, 20003, 20004, 20005, 20006, 20007, 20008, 20009, 20010, 20011, 20012, 20013, 20014, 20015, 20016, 20017, 20018, 20019, 20020]
                        
                        fourStarChars = [1001, 1002, 1008, 1009, 1013, 1105, 1103, 1106, 1108, 1109, 1206, 1201, 1202, 1207, 1111, 1110, 1210] // stopped at guinaifen
                        fourStarLC = [21000, 21001, 21002, 21003, 21004, 21005, 21006, 21007, 21008, 21009, 21010, 21011, 21012, 21013, 21014, 21015, 21016, 21017, 21018, 21019, 21020]
                        
                        fiveStarChars = [1003, 1004, 1101, 1104, 1107, 1209, 1211]
                        fiveStarLC = [23000, 23002, 23003, 23004, 23005, 23012, 23013]

                        // Roll!
                        var rolledNum = Math.floor(Math.random() * (167) + 1)
                        console.log(rolledNum)

                        var result = "";

                        // Check if you got a 5 star
                        if ((rolledNum == 1) || (calculate.pity5S(toParseUserUID['five_star_pity']) == true)) {
                            // Update pity to 0
                            const update5SPity = {
                                $set: {
                                    five_star_pity: 0
                                },
                                $inc: {
                                    wish_count: 1,
                                    four_star_pity: 1
                                }
                            }
                            await ids.updateOne({ discord_id: discordID }, update5SPity);

                            // Check if you got a weapon or character
                            var fiveStarFF = Math.floor(Math.random() * (2) + 1)
                            if (fiveStarFF == 1) { // FF = Fifty-Fifty
                                chooseFSC = Math.floor(Math.random() * (fiveStarChars.length))
                                testEmbed.setThumbnail(`https://raw.githubusercontent.com/Mar-7th/StarRailRes/master/icon/character/${fiveStarChars[chooseFSC]}.png`)
                                testEmbed.setFooter( {text: `Current pity: ${(await ids.findOne({discord_id: discordID}, options))['five_star_pity']}`} )

                                result = `${charSheet[fiveStarChars[chooseFSC]]["name"]} (${emoteSheet["Stars"]["StarBig"]["id"] + emoteSheet["Stars"]["StarBig"]["id"] + emoteSheet["Stars"]["StarBig"]["id"] + emoteSheet["Stars"]["StarBig"]["id"] + emoteSheet["Stars"]["StarBig"]["id"]})`
                            } else {
                                chooseFSLC = Math.floor(Math.random() * (fiveStarLC.length))
                                testEmbed.setThumbnail(`https://raw.githubusercontent.com/Mar-7th/StarRailRes/master/icon/light_cone/${fiveStarLC[chooseFSLC]}.png`)
                                testEmbed.setFooter( {text: `Current pity: ${(await ids.findOne({discord_id: discordID}, options))['five_star_pity']}`} )

                                result = `${LCSheet[fiveStarLC[chooseFSLC]]["name"]} (${emoteSheet["Stars"]["StarBig"]["id"] + emoteSheet["Stars"]["StarBig"]["id"] + emoteSheet["Stars"]["StarBig"]["id"] + emoteSheet["Stars"]["StarBig"]["id"] + emoteSheet["Stars"]["StarBig"]["id"]})`
                            }
                        // Check if you got a 4 star
                        } else if (((rolledNum > 1) && (rolledNum < 12)) || (calculate.pity4S(toParseUserUID['four_star_pity']) == true)) {
                            // Update pity to 0
                            const update4SPity = {
                                $set: {
                                    four_star_pity: 0
                                },
                                $inc: {
                                    wish_count: 1,
                                    five_star_pity: 1
                                }
                            }
                            await ids.updateOne({ discord_id: discordID }, update4SPity);

                            // Check if you got a weapon or character
                            var fourStarFF = Math.floor(Math.random() * (2) + 1);
                            if (fourStarFF == 1) {
                                chooseFourSC = Math.floor(Math.random() * (fourStarChars.length))
                                testEmbed.setThumbnail(`https://raw.githubusercontent.com/Mar-7th/StarRailRes/master/icon/character/${fourStarChars[chooseFourSC]}.png`)
                                testEmbed.setFooter( {text: `Current pity: ${(await ids.findOne({discord_id: discordID}, options))['five_star_pity']}`} )

                                result = `${charSheet[fourStarChars[chooseFourSC]]["name"]} (${emoteSheet["Stars"]["StarBig"]["id"] + emoteSheet["Stars"]["StarBig"]["id"] + emoteSheet["Stars"]["StarBig"]["id"] + emoteSheet["Stars"]["StarBig"]["id"]})`
                            } else {
                                chooseFourSLC = Math.floor(Math.random() * (fourStarLC.length))
                                testEmbed.setThumbnail(`https://raw.githubusercontent.com/Mar-7th/StarRailRes/master/icon/light_cone/${fourStarLC[chooseFourSLC]}.png`)
                                testEmbed.setFooter( {text: `Current pity: ${(await ids.findOne({discord_id: discordID}, options))['five_star_pity']}`} )

                                result = `${LCSheet[fourStarLC[chooseFourSLC]]["name"]} (${emoteSheet["Stars"]["StarBig"]["id"] + emoteSheet["Stars"]["StarBig"]["id"] + emoteSheet["Stars"]["StarBig"]["id"] + emoteSheet["Stars"]["StarBig"]["id"]})`
                            }
                        // You got a 3 star sadge
                        } else {
                            // Update wish count
                            const update3SPity = {
                                $inc: {
                                    wish_count: 1,
                                    four_star_pity: 1,
                                    five_star_pity: 1
                                }
                            }
                            await ids.updateOne({ discord_id: discordID }, update3SPity);

                            chooseTSLC = Math.floor(Math.random() * (threeStarLC.length))
                            testEmbed.setThumbnail(`https://raw.githubusercontent.com/Mar-7th/StarRailRes/master/icon/light_cone/${threeStarLC[chooseTSLC]}.png`)
                            testEmbed.setFooter( {text: `Current pity: ${(await ids.findOne({discord_id: discordID}, options))['five_star_pity']}`} )

                            var name = "inventory." + LCSheet[threeStarLC[chooseTSLC]]["name"]

                            console.log(await ids.countDocuments({ inventory: { $eq: "Fine Fruit" } }))

                            const add3S = {
                                $set: { [name] : 1 }
                            }
                            await ids.updateOne({ discord_id: discordID }, add3S)

                            result = `${LCSheet[threeStarLC[chooseTSLC]]["name"]} (${emoteSheet["Stars"]["StarBig"]["id"] + emoteSheet["Stars"]["StarBig"]["id"] + emoteSheet["Stars"]["StarBig"]["id"]})`
                        }



                        const updateDoc = {
                            $inc: {
                                jade_count: -160,
                            }
                        }
                        await ids.updateOne({discord_id: discordID}, updateDoc)

                        testEmbed.spliceFields(0, 1,
                            {
                                name: "\n",
                                value: `You got **${result}**\n
                                You now have **${(await ids.findOne({discord_id: discordID}, options))['jade_count']}** stellar jade`
                            })

                        interaction.editReply({ embeds: [testEmbed] });
                        await client.close()
                    }

                } else {
                    // If document not found, make a new database entry, do this for all economy commands

                    await setup.init(discordID, "economy", "inventories")
 
                    // Get the new value
                    var toParseUserUID = await ids.findOne({discord_id: discordID}, options);
                    var updatedAmount = toParseUserUID['jade_count']

                    testEmbed.spliceFields(0, 1, {
                        name: "\n",
                        value: `You have **${updatedAmount}** stellar jade, you need **160** to wish`
                    })
                    
                    interaction.editReply({ embeds: [testEmbed] });
                    await client.close()
                }

                } catch (error) {
                    console.log(`There was an error: ${error}`)
                    interaction.editReply({ content: "Something broke!"})
                    await client.close()
            }
        })()
    }
}