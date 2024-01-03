var { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
var { MongoClient } = require("mongodb");

const setup = require('../../firstinit');
const calculate = require('../../pity-calculator');

const LCSheet = require('../../src/assets/light_cones.json')
const charSheet = require('../../src/assets/characters.json')
const emoteSheet = require('../../src/assets/emotes.json')

const cooldowns = new Set(); // To store unique values

var uri = "mongodb+srv://min:" + process.env.MONGODB_PASS + "@discord-seele.u4g75ks.mongodb.net/"

module.exports = {
    data: new SlashCommandBuilder()
    .setName('wish')
    .setDescription('Wish for characters and light cones!')
    .addStringOption((option) => 
        option
            .setName("multi")
            .setDescription('10x Wish')
            .addChoices({
                name: "10", value: "10"
            })
    ),

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
                var discordID = BigInt(interaction.user.id)

                // Check how many documents are in the query (discord_id)
                var counter = await ids.countDocuments({discord_id: discordID})

                var multipleWish = interaction.options.getString('multi')

                // If document found, get the hsr_id (set to 1)
                if (counter < 1) {
                    // If document not found, make a new database entry, do this for all economy commands
                    await setup.init(discordID, "economy", "inventories")
                }

                var options = {
                    projection: {
                        jade_count: 1,
                        inventory: 1,
                        characters: 1,
                        wish_count: 1,
                        four_star_pity: 1,
                        five_star_pity: 1,
                        exp_material: 1,
                        credits: 1,
                    }
                }

                var threeStarLC = [20000, 20001, 20002, 20003, 20004, 20005, 20006, 20007, 20008, 20009, 20010, 20011, 20012, 20013, 20014, 20015, 20016, 20017, 20018, 20019, 20020]
                        
                var fourStarChars = [1001, 1002, 1008, 1009, 1013, 1105, 1103, 1106, 1108, 1109, 1206, 1201, 1202, 1207, 1111, 1110, 1210] // stopped at guinaifen
                var fourStarLC = [21000, 21001, 21002, 21003, 21004, 21005, 21006, 21007, 21008, 21009, 21010, 21011, 21012, 21013, 21014, 21015, 21016, 21017, 21018, 21019, 21020]
                
                var fiveStarChars = [1003, 1004, 1101, 1104, 1107, 1209, 1211]
                var fiveStarLC = [23000, 23002, 23003, 23004, 23005, 23012, 23013]

                // Then get the first thing that matches the discord id, and match it to the options query above
                var toParseUserUID = await ids.findOne({discord_id: discordID}, options);
                // Then find the thing
                var currentAmount = toParseUserUID['jade_count']

                if (multipleWish == "10") {
                    // If you're doing 10x but don't have enough to multi-wish
                    if (currentAmount < 1600) {
                        testEmbed.spliceFields(0, 1, {
                            name: "\n",
                            value: `You have **${currentAmount}** stellar jade, you need **1600** to 10x wish`
                        })

                        interaction.editReply({ embeds: [testEmbed] });
                        await client.close()
                        } else {
                            // You have enough for a 10x

                            if (cooldowns.has(interaction.user.id)) { // But you're on cooldown
                                testEmbed.spliceFields(0, 1, {
                                    name: "\n",
                                    value: `Please wait a few seconds before doing another 10x wish!`
                                })
        
                                interaction.editReply({ embeds: [testEmbed] });
                                await client.close()
                            } else { // Add to cooldowns, wait 7 seconds then remove from set
                                cooldowns.add(interaction.user.id);
                                setTimeout(() => cooldowns.delete(interaction.user.id), 7000);

                                testEmbed.addFields(
                                    { name: "\n", value: "\n" },
                                    { name: "\n", value: "\n" },
                                    { name: "\n", value: "\n" },
                                    { name: "\n", value: "\n" },
                                    { name: "\n", value: "\n" },
                                    { name: "\n", value: "\n" },
                                    { name: "\n", value: "\n" },
                                    { name: "\n", value: "\n" },
                                    { name: "\n", value: "\n" }
                                )
    
                                var amountDueToDupes = 0
                                
                                // Roll!
    
                                // 10x
                                for (var i = 0; i < 10; i++) {
                                    var rolledNum = Math.floor(Math.random() * (167) + 1)
                                    console.log(rolledNum)
    
                                    var result = "";
    
                                    // Check if you got a 5 star (== 1)
                                    var reset = await ids.findOne({discord_id: discordID})
                                    if ((rolledNum == 1) || (calculate.pity5S(reset['five_star_pity']) == true)) {
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
                                        if ((fiveStarFF == 1)) { // FF = Fifty-Fifty (1 or 2)
                                            chooseFSC = Math.floor(Math.random() * (fiveStarChars.length))
                                            testEmbed.setThumbnail(`https://raw.githubusercontent.com/Mar-7th/StarRailRes/master/icon/character/${fiveStarChars[chooseFSC]}.png`)
                                            testEmbed.setFooter( {text: `Current pity: ${(await ids.findOne({discord_id: discordID}, options))['five_star_pity']}`} )
    
                                            var level = "characters." + fiveStarChars[chooseFSC] + ".level"
                                            var lc = "characters." + fiveStarChars[chooseFSC] + ".lc"
                                            var eidolon = "characters." + fiveStarChars[chooseFSC] + ".eidolon"
                                            var inTeam = "characters." + fiveStarChars[chooseFSC] + ".inTeam"
    
                                            var characterCollection = (await ids.findOne({discord_id: discordID}, options))['characters'] //here
                                            if (fiveStarChars[chooseFSC] in characterCollection) {
                                                // console.log("found") // Just increase eidolon level, make sure it caps at 6
    
                                                const getEidolon = {
                                                    projection: {
                                                        _id: 0,
                                                        [eidolon]: 1
                                                    }
                                                }
    
                                                var findEV = await ids.findOne({discord_id: discordID}, getEidolon)
                                                var getEV = findEV["characters"][fiveStarChars[chooseFSC]]["eidolon"]
                                                
                                                if (getEV >= 6) { // E6 + duplicate
                                                    await ids.updateOne({discord_id: discordID}, { $inc: { credits: 6000 } } )
                                                    result = `${emoteSheet["Stars"]["Maxed"]["id"]} ${charSheet[fiveStarChars[chooseFSC]]["name"]} (${emoteSheet["Stars"]["StarBig"]["id"] + emoteSheet["Stars"]["StarBig"]["id"] + emoteSheet["Stars"]["StarBig"]["id"] + emoteSheet["Stars"]["StarBig"]["id"] + emoteSheet["Stars"]["StarBig"]["id"]})`
                                                    amountDueToDupes += 6000;
                                                } else { // you got a duplicate
                                                    await ids.updateOne({ discord_id: discordID }, { $inc: { [eidolon] : 1 } })
                                                    await ids.updateOne({discord_id: discordID}, { $inc: { credits: 1600 } } )
                                                    result = `${emoteSheet["Stars"]["Dupe"]["id"]} ${charSheet[fiveStarChars[chooseFSC]]["name"]} (${emoteSheet["Stars"]["StarBig"]["id"] + emoteSheet["Stars"]["StarBig"]["id"] + emoteSheet["Stars"]["StarBig"]["id"] + emoteSheet["Stars"]["StarBig"]["id"] + emoteSheet["Stars"]["StarBig"]["id"]})`
                                                    amountDueToDupes += 1600;
                                                }
                                            } else {
                                                // console.log("new")
                                                await ids.updateOne({ discord_id: discordID }, { $inc: { [level] : 1 } })
                                                await ids.updateOne({ discord_id: discordID }, { $inc: { [lc] : -1 } })
                                                await ids.updateOne({ discord_id: discordID }, { $set: { [eidolon] : 0 } })
                                                await ids.updateOne({ discord_id: discordID }, { $set: { [inTeam] : false } })
                                                await ids.updateOne({ discord_id: discordID }, { $inc: { credits: 1000 } } )
                                                result = `${charSheet[fiveStarChars[chooseFSC]]["name"]} (${emoteSheet["Stars"]["StarBig"]["id"] + emoteSheet["Stars"]["StarBig"]["id"] + emoteSheet["Stars"]["StarBig"]["id"] + emoteSheet["Stars"]["StarBig"]["id"] + emoteSheet["Stars"]["StarBig"]["id"]})`
                                                amountDueToDupes += 1000
                                            }
                                        } else { // YOU GOT A LIGHT CONE
                                            chooseFSLC = Math.floor(Math.random() * (fiveStarLC.length))
                                            testEmbed.setThumbnail(`https://raw.githubusercontent.com/Mar-7th/StarRailRes/master/icon/light_cone/${fiveStarLC[chooseFSLC]}.png`)
                                            testEmbed.setFooter( {text: `Current pity: ${(await ids.findOne({discord_id: discordID}, options))['five_star_pity']}`} )
    
                                            var level = "inventory." + fiveStarLC[chooseFSLC] + ".level"
                                            var si = "inventory." + fiveStarLC[chooseFSLC] + ".si"
                                            var equipped = "inventory." + fiveStarLC[chooseFSLC] + ".equipped_on"
    
                                            var inventoryCollection = (await ids.findOne({discord_id: discordID}, options))['inventory']
                                            if (fiveStarLC[chooseFSLC] in inventoryCollection) {
                                                // console.log("found")
    
                                                const getSI = {
                                                    projection: {
                                                        _id: 0,
                                                        [si]: 1
                                                    }
                                                }
    
                                                var findSV = await ids.findOne({discord_id: discordID}, getSI)
                                                var getSV = findSV["inventory"][fiveStarLC[chooseFSLC]]["si"]
    
                                                if (getSV >= 5) { // You have 5 si already
                                                    await ids.updateOne({discord_id: discordID}, { $inc: { credits: 6000 } } )
                                                    result = result = `${emoteSheet["Stars"]["Maxed"]["id"]} ${LCSheet[fiveStarLC[chooseFSLC]]["name"]} (${emoteSheet["Stars"]["StarBig"]["id"] + emoteSheet["Stars"]["StarBig"]["id"] + emoteSheet["Stars"]["StarBig"]["id"] + emoteSheet["Stars"]["StarBig"]["id"] + emoteSheet["Stars"]["StarBig"]["id"]})`
                                                    amountDueToDupes += 6000;
                                                } else { // You got a duplicate
                                                    await ids.updateOne({discord_id: discordID}, { $inc: { credits: 1600 } } )
                                                    await ids.updateOne({ discord_id: discordID }, { $inc: { [si] : 1 } })
                                                    result = `${emoteSheet["Stars"]["Dupe"]["id"]} ${LCSheet[fiveStarLC[chooseFSLC]]["name"]} (${emoteSheet["Stars"]["StarBig"]["id"] + emoteSheet["Stars"]["StarBig"]["id"] + emoteSheet["Stars"]["StarBig"]["id"] + emoteSheet["Stars"]["StarBig"]["id"] + emoteSheet["Stars"]["StarBig"]["id"]})`
                                                    amountDueToDupes += 1600;
                                                }
                                            } else { // Your first time getting the lc
                                                // console.log("new")
                                                await ids.updateOne({ discord_id: discordID }, { $set: { [level] : 1 } })
                                                await ids.updateOne({ discord_id: discordID }, { $set: { [si] : 0 } })
                                                await ids.updateOne({ discord_id: discordID }, { $set: { [equipped] : -1 } })
                                                await ids.updateOne({ discord_id: discordID }, { $inc: { credits: 1000 } } )
                                                result = `${LCSheet[fiveStarLC[chooseFSLC]]["name"]} (${emoteSheet["Stars"]["StarBig"]["id"] + emoteSheet["Stars"]["StarBig"]["id"] + emoteSheet["Stars"]["StarBig"]["id"] + emoteSheet["Stars"]["StarBig"]["id"] + emoteSheet["Stars"]["StarBig"]["id"]})`
                                                amountDueToDupes += 1000;
                                            }
                                        }
                                    // Check if you got a 4 star
                                    } else if (((rolledNum > 1) && (rolledNum < 12)) || (calculate.pity4S(reset['four_star_pity']) == true)) {
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
                                        if (fourStarFF == 1) { // FF = Fifty-Fifty (1 or 2) YOU GOT A CHARACTER
                                            chooseFourSC = Math.floor(Math.random() * (fourStarChars.length))
                                            testEmbed.setThumbnail(`https://raw.githubusercontent.com/Mar-7th/StarRailRes/master/icon/character/${fourStarChars[chooseFourSC]}.png`)
                                            testEmbed.setFooter( {text: `Current pity: ${(await ids.findOne({discord_id: discordID}, options))['five_star_pity']}`} )
    
                                            var level = "characters." + fourStarChars[chooseFourSC] + ".level"
                                            var lc = "characters." + fourStarChars[chooseFourSC] + ".lc"
                                            var eidolon = "characters." + fourStarChars[chooseFourSC] + ".eidolon"
                                            var inTeam = "characters." + fourStarChars[chooseFourSC] + ".inTeam"
    
                                            var characterCollection = (await ids.findOne({discord_id: discordID}, options))['characters']
                                            if (fourStarChars[chooseFourSC] in characterCollection) {
                                                // console.log("found")
    
                                                const getEidolon = {
                                                    projection: {
                                                        _id: 0,
                                                        [eidolon]: 1
                                                    }
                                                }
    
                                                var findEV = await ids.findOne({ discord_id: discordID }, getEidolon)
                                                var getEV = findEV["characters"][fourStarChars[chooseFourSC]]["eidolon"]
    
                                                if (getEV >= 6) { // Dupe + E6
                                                    await ids.updateOne({discord_id: discordID}, { $inc: { credits: 600 }})
                                                    result = `${emoteSheet["Stars"]["Maxed"]["id"]} ${charSheet[fourStarChars[chooseFourSC]]["name"]} (${emoteSheet["Stars"]["StarBig"]["id"] + emoteSheet["Stars"]["StarBig"]["id"] + emoteSheet["Stars"]["StarBig"]["id"] + emoteSheet["Stars"]["StarBig"]["id"]})`
                                                    amountDueToDupes += 600
                                                } else { // you got a duplicate
                                                    await ids.updateOne({ discord_id: discordID }, { $inc: { [eidolon]: 1 } })
                                                    await ids.updateOne({ discord_id: discordID }, { $inc: { credits: 320 } } )
                                                    result = `${emoteSheet["Stars"]["Dupe"]["id"]} ${charSheet[fourStarChars[chooseFourSC]]["name"]} (${emoteSheet["Stars"]["StarBig"]["id"] + emoteSheet["Stars"]["StarBig"]["id"] + emoteSheet["Stars"]["StarBig"]["id"] + emoteSheet["Stars"]["StarBig"]["id"]})`
                                                    amountDueToDupes += 320
                                                }
                                            } else { // Your first time getting the character
                                                // console.log("new")
                                                await ids.updateOne({ discord_id: discordID }, { $inc: { [level] : 1 } })
                                                await ids.updateOne({ discord_id: discordID }, { $inc: { [lc] : -1 } })
                                                await ids.updateOne({ discord_id: discordID }, { $set: { [eidolon] : 0 } })
                                                await ids.updateOne({ discord_id: discordID }, { $set: { [inTeam] : false } })
                                                await ids.updateOne({ discord_id: discordID }, { $inc: { credits: 200 } } )
                                                result = `${charSheet[fourStarChars[chooseFourSC]]["name"]} (${emoteSheet["Stars"]["StarBig"]["id"] + emoteSheet["Stars"]["StarBig"]["id"] + emoteSheet["Stars"]["StarBig"]["id"] + emoteSheet["Stars"]["StarBig"]["id"]})`
                                                amountDueToDupes += 200
                                            }
                                        } else { // YOU GOT A LIGHTCONE
                                            chooseFourSLC = Math.floor(Math.random() * (fourStarLC.length))
                                            testEmbed.setThumbnail(`https://raw.githubusercontent.com/Mar-7th/StarRailRes/master/icon/light_cone/${fourStarLC[chooseFourSLC]}.png`)
                                            testEmbed.setFooter( {text: `Current pity: ${(await ids.findOne({discord_id: discordID}, options))['five_star_pity']}`} )
    
                                            var level = "inventory." + fourStarLC[chooseFourSLC] + ".level"
                                            var si = "inventory." + fourStarLC[chooseFourSLC] + ".si"
                                            var equipped = "inventory." + fourStarLC[chooseFourSLC] + ".equipped_on"
    
                                            var inventoryCollection = (await ids.findOne({discord_id: discordID}, options))['inventory']
                                            if (fourStarLC[chooseFourSLC] in inventoryCollection) {
                                                // console.log("found")
    
                                                const getSI = {
                                                    projection: {
                                                        _id: 0,
                                                        [si]: 1
                                                    }
                                                }
    
                                                var findSV = await ids.findOne({discord_id: discordID}, getSI)
                                                var getSV = findSV["inventory"][fourStarLC[chooseFourSLC]]["si"]
    
                                                if (getSV >= 5) { // You have 5 si already
                                                    await ids.updateOne({discord_id: discordID}, { $inc: { credits: 600 } } )
                                                    result = `${emoteSheet["Stars"]["Maxed"]["id"]} ${LCSheet[fourStarLC[chooseFourSLC]]["name"]} (${emoteSheet["Stars"]["StarBig"]["id"] + emoteSheet["Stars"]["StarBig"]["id"] + emoteSheet["Stars"]["StarBig"]["id"] + emoteSheet["Stars"]["StarBig"]["id"]})`
                                                    amountDueToDupes += 600
                                                } else { // You got a duplicate
                                                    await ids.updateOne({discord_id: discordID}, { $inc: { credits: 320 } } )
                                                    await ids.updateOne({ discord_id: discordID }, { $inc: { [si] : 1 } })
                                                    result = `${emoteSheet["Stars"]["Dupe"]["id"]} ${LCSheet[fourStarLC[chooseFourSLC]]["name"]} (${emoteSheet["Stars"]["StarBig"]["id"] + emoteSheet["Stars"]["StarBig"]["id"] + emoteSheet["Stars"]["StarBig"]["id"] + emoteSheet["Stars"]["StarBig"]["id"]})`
                                                    amountDueToDupes += 320
                                                }
                                            } else { // Your first time getting the lc
                                                // console.log("new")
                                                await ids.updateOne({ discord_id: discordID }, { $set: { [level] : 1 } })
                                                await ids.updateOne({ discord_id: discordID }, { $set: { [si] : 0 } })
                                                await ids.updateOne({ discord_id: discordID }, { $set: { [equipped] : -1 } })
                                                await ids.updateOne({ discord_id: discordID }, { $inc: { credits: 200 } } )
                                                result = `${LCSheet[fourStarLC[chooseFourSLC]]["name"]} (${emoteSheet["Stars"]["StarBig"]["id"] + emoteSheet["Stars"]["StarBig"]["id"] + emoteSheet["Stars"]["StarBig"]["id"] + emoteSheet["Stars"]["StarBig"]["id"]})`
                                                amountDueToDupes += 200
                                            }
                                        }
                                    // You got a 3 star sadge, must be a light cone
                                    } else {
                                        // Update wish count and pities
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
    
                                        var level = "inventory." + threeStarLC[chooseTSLC] + ".level"
                                        var si = "inventory." + threeStarLC[chooseTSLC] + ".si"
                                        var equipped = "inventory." + threeStarLC[chooseTSLC] + ".equipped_on"
    
                                        var inventoryCollection = (await ids.findOne({discord_id: discordID}, options))['inventory']
                                        if (threeStarLC[chooseTSLC] in inventoryCollection) {
                                            // console.log("found")
    
                                            const getSI = {
                                                projection: {
                                                    _id: 0,
                                                    [si]: 1
                                                }
                                            }
    
                                            var findSV = await ids.findOne({discord_id: discordID}, getSI)
                                            var getSV = findSV["inventory"][threeStarLC[chooseTSLC]]["si"]
    
                                            if (getSV >= 5) { // You have 5 si already
                                                await ids.updateOne({discord_id: discordID}, { $inc: { credits: 100 } } )
                                                result = `${emoteSheet["Stars"]["Maxed"]["id"]} ${LCSheet[threeStarLC[chooseTSLC]]["name"]} (${emoteSheet["Stars"]["StarBig"]["id"] + emoteSheet["Stars"]["StarBig"]["id"] + emoteSheet["Stars"]["StarBig"]["id"]})`
                                                amountDueToDupes += 100
                                            } else { // You got a duplicate
                                                await ids.updateOne({discord_id: discordID}, { $inc: { credits: 70 } } )
                                                await ids.updateOne({ discord_id: discordID }, { $inc: { [si] : 1 } })
                                                result = `${emoteSheet["Stars"]["Dupe"]["id"]} ${LCSheet[threeStarLC[chooseTSLC]]["name"]} (${emoteSheet["Stars"]["StarBig"]["id"] + emoteSheet["Stars"]["StarBig"]["id"] + emoteSheet["Stars"]["StarBig"]["id"]})`
                                                amountDueToDupes += 70
                                            }
                                        } else { // Your first time getting the lc
                                            // console.log("new")
                                            await ids.updateOne({ discord_id: discordID }, { $set: { [level] : 1 } })
                                            await ids.updateOne({ discord_id: discordID }, { $set: { [si] : 0 } })
                                            await ids.updateOne({ discord_id: discordID }, { $set: { [equipped] : -1 } })
                                            await ids.updateOne({ discord_id: discordID }, { $inc: { credits: 50 } } )
                                            result = `${LCSheet[threeStarLC[chooseTSLC]]["name"]} (${emoteSheet["Stars"]["StarBig"]["id"] + emoteSheet["Stars"]["StarBig"]["id"] + emoteSheet["Stars"]["StarBig"]["id"]})`
                                            amountDueToDupes += 50
                                        }
                                    }
    
                                    // Update with all 10 wishes
                                    const updateDoc = {
                                        $inc: {
                                            jade_count: -160,
                                        }
                                    }
                                    await ids.updateOne({discord_id: discordID}, updateDoc)
    
                                    testEmbed.spliceFields(i, i + 1,
                                        {
                                            name: "\n",
                                            value: `You got **${result}**`
                                        })
                                }
                                
                            var reset = await ids.findOne({discord_id: discordID})
    
                            testEmbed.spliceFields(9, 10,
                                {
                                    name: "\n",
                                    value: `You got **${result}**\n\nYou got **${amountDueToDupes}** Credits from duplicates\nYou now have **${reset['jade_count']}** stellar jade`
                                })
    
                            interaction.editReply({ embeds: [testEmbed] });
                            await client.close()
                            }

                    }
                } else {
                    // You don't have enough to wish
                    if (currentAmount < 160) {
                        testEmbed.spliceFields(0, 1, {
                            name: "\n",
                            value: `You have **${currentAmount}** stellar jade, you need **160** to wish`
                        })
                        
                        interaction.editReply({ embeds: [testEmbed] });
                        await client.close()
                    } else {

                        // Roll!
                        var rolledNum = Math.floor(Math.random() * (167) + 1)
                        console.log(rolledNum)

                        var result = "";

                        // Check if you got a 5 star (== 1)
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
                            if ((fiveStarFF == 1)) { // FF = Fifty-Fifty (1 or 2)
                                chooseFSC = Math.floor(Math.random() * (fiveStarChars.length))
                                testEmbed.setThumbnail(`https://raw.githubusercontent.com/Mar-7th/StarRailRes/master/icon/character/${fiveStarChars[chooseFSC]}.png`)
                                testEmbed.setFooter( {text: `Current pity: ${(await ids.findOne({discord_id: discordID}, options))['five_star_pity']}`} )

                                var level = "characters." + fiveStarChars[chooseFSC] + ".level"
                                var lc = "characters." + fiveStarChars[chooseFSC] + ".lc"
                                var eidolon = "characters." + fiveStarChars[chooseFSC] + ".eidolon"
                                var inTeam = "characters." + fiveStarChars[chooseFSC] + ".inTeam"

                                var characterCollection = (await ids.findOne({discord_id: discordID}, options))['characters'] //here
                                if (fiveStarChars[chooseFSC] in characterCollection) {
                                    // console.log("found") // Just increase eidolon level, make sure it caps at 6

                                    const getEidolon = {
                                        projection: {
                                            _id: 0,
                                            [eidolon]: 1
                                        }
                                    }

                                    var findEV = await ids.findOne({discord_id: discordID}, getEidolon)
                                    var getEV = findEV["characters"][fiveStarChars[chooseFSC]]["eidolon"]
                                    
                                    if (getEV >= 6) {
                                        await ids.updateOne({discord_id: discordID}, { $inc: { credits: 6000 } } )
                                        result = `${charSheet[fiveStarChars[chooseFSC]]["name"]}, but you already have six eidolons!\n\n+6000 Credits`
                                    } else { // you got a duplicate
                                        await ids.updateOne({ discord_id: discordID }, { $inc: { [eidolon] : 1 } })
                                        await ids.updateOne({discord_id: discordID}, { $inc: { credits: 1600 } } )
                                        result = `${charSheet[fiveStarChars[chooseFSC]]["name"]} (${emoteSheet["Stars"]["StarBig"]["id"] + emoteSheet["Stars"]["StarBig"]["id"] + emoteSheet["Stars"]["StarBig"]["id"] + emoteSheet["Stars"]["StarBig"]["id"] + emoteSheet["Stars"]["StarBig"]["id"]})\n\nEidolon Level: ${getEV + 1}\n+1600 Credits`
                                    }
                                } else {
                                    // console.log("new")
                                    await ids.updateOne({ discord_id: discordID }, { $inc: { [level] : 1 } })
                                    await ids.updateOne({ discord_id: discordID }, { $inc: { [lc] : -1 } })
                                    await ids.updateOne({ discord_id: discordID }, { $set: { [eidolon] : 0 } })
                                    await ids.updateOne({ discord_id: discordID }, { $set: { [inTeam] : false } })
                                    await ids.updateOne({ discord_id: discordID }, { $inc: { credits: 1000 } } )
                                    result = `${charSheet[fiveStarChars[chooseFSC]]["name"]} (${emoteSheet["Stars"]["StarBig"]["id"] + emoteSheet["Stars"]["StarBig"]["id"] + emoteSheet["Stars"]["StarBig"]["id"] + emoteSheet["Stars"]["StarBig"]["id"] + emoteSheet["Stars"]["StarBig"]["id"]})\n\n+1000 Credits`
                                }
                            } else { // YOU GOT A LIGHT CONE
                                chooseFSLC = Math.floor(Math.random() * (fiveStarLC.length))
                                testEmbed.setThumbnail(`https://raw.githubusercontent.com/Mar-7th/StarRailRes/master/icon/light_cone/${fiveStarLC[chooseFSLC]}.png`)
                                testEmbed.setFooter( {text: `Current pity: ${(await ids.findOne({discord_id: discordID}, options))['five_star_pity']}`} )

                                var level = "inventory." + fiveStarLC[chooseFSLC] + ".level"
                                var si = "inventory." + fiveStarLC[chooseFSLC] + ".si"
                                var equipped = "inventory." + fiveStarLC[chooseFSLC] + ".equipped_on"

                                var inventoryCollection = (await ids.findOne({discord_id: discordID}, options))['inventory']
                                if (fiveStarLC[chooseFSLC] in inventoryCollection) {
                                    // console.log("found")

                                    const getSI = {
                                        projection: {
                                            _id: 0,
                                            [si]: 1
                                        }
                                    }

                                    var findSV = await ids.findOne({discord_id: discordID}, getSI)
                                    var getSV = findSV["inventory"][fiveStarLC[chooseFSLC]]["si"]

                                    if (getSV >= 5) { // You have 5 si already
                                        await ids.updateOne({discord_id: discordID}, { $inc: { credits: 6000 } } )
                                        result = result = `${LCSheet[fiveStarLC[chooseFSLC]]["name"]}, but you already have five superimpositions!\n\n+6000 Credits`
                                    } else { // You got a duplicate
                                        await ids.updateOne({discord_id: discordID}, { $inc: { credits: 1600 } } )
                                        await ids.updateOne({ discord_id: discordID }, { $inc: { [si] : 1 } })
                                        result = `${LCSheet[fiveStarLC[chooseFSLC]]["name"]} (${emoteSheet["Stars"]["StarBig"]["id"] + emoteSheet["Stars"]["StarBig"]["id"] + emoteSheet["Stars"]["StarBig"]["id"] + emoteSheet["Stars"]["StarBig"]["id"] + emoteSheet["Stars"]["StarBig"]["id"]})\n\nSI Level: ${getSV + 1}\n+1600 Credits`
                                    }
                                } else { // Your first time getting the lc
                                    // console.log("new")
                                    await ids.updateOne({ discord_id: discordID }, { $set: { [level] : 1 } })
                                    await ids.updateOne({ discord_id: discordID }, { $set: { [si] : 0 } })
                                    await ids.updateOne({ discord_id: discordID }, { $set: { [equipped] : -1 } })
                                    await ids.updateOne({ discord_id: discordID }, { $inc: { credits: 1000 } } )
                                    result = `${LCSheet[fiveStarLC[chooseFSLC]]["name"]} (${emoteSheet["Stars"]["StarBig"]["id"] + emoteSheet["Stars"]["StarBig"]["id"] + emoteSheet["Stars"]["StarBig"]["id"] + emoteSheet["Stars"]["StarBig"]["id"] + emoteSheet["Stars"]["StarBig"]["id"]})\n\n+1000 Credits`
                                }
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
                            if (fourStarFF == 1) { // FF = Fifty-Fifty (1 or 2) YOU GOT A CHARACTER
                                chooseFourSC = Math.floor(Math.random() * (fourStarChars.length))
                                testEmbed.setThumbnail(`https://raw.githubusercontent.com/Mar-7th/StarRailRes/master/icon/character/${fourStarChars[chooseFourSC]}.png`)
                                testEmbed.setFooter( {text: `Current pity: ${(await ids.findOne({discord_id: discordID}, options))['five_star_pity']}`} )

                                var level = "characters." + fourStarChars[chooseFourSC] + ".level"
                                var lc = "characters." + fourStarChars[chooseFourSC] + ".lc"
                                var eidolon = "characters." + fourStarChars[chooseFourSC] + ".eidolon"
                                var inTeam = "characters." + fourStarChars[chooseFourSC] + ".inTeam"

                                var characterCollection = (await ids.findOne({discord_id: discordID}, options))['characters']
                                if (fourStarChars[chooseFourSC] in characterCollection) {
                                    // console.log("found")

                                    const getEidolon = {
                                        projection: {
                                            _id: 0,
                                            [eidolon]: 1
                                        }
                                    }

                                    var findEV = await ids.findOne({ discord_id: discordID }, getEidolon)
                                    var getEV = findEV["characters"][fourStarChars[chooseFourSC]]["eidolon"]

                                    if (getEV >= 6) {
                                        await ids.updateOne({discord_id: discordID}, { $inc: { credits: 600 }})
                                        result = `${charSheet[fourStarChars[chooseFourSC]]["name"]}, but you already have six eidolons!\n\n+600 Credits`
                                    } else { // you got a duplicate
                                        await ids.updateOne({ discord_id: discordID }, { $inc: { [eidolon]: 1 } })
                                        await ids.updateOne({ discord_id: discordID }, { $inc: { credits: 320 } } )
                                        result = `${charSheet[fourStarChars[chooseFourSC]]["name"]} (${emoteSheet["Stars"]["StarBig"]["id"] + emoteSheet["Stars"]["StarBig"]["id"] + emoteSheet["Stars"]["StarBig"]["id"] + emoteSheet["Stars"]["StarBig"]["id"]})\n\nEidolon Level: ${getEV + 1}\n+320 Credits`
                                    }
                                } else { // Your first time getting the character
                                    // console.log("new")
                                    await ids.updateOne({ discord_id: discordID }, { $inc: { [level] : 1 } })
                                    await ids.updateOne({ discord_id: discordID }, { $inc: { [lc] : -1 } })
                                    await ids.updateOne({ discord_id: discordID }, { $set: { [eidolon] : 0 } })
                                    await ids.updateOne({ discord_id: discordID }, { $set: { [inTeam] : false } })
                                    await ids.updateOne({ discord_id: discordID }, { $inc: { credits: 200 } } )
                                    result = `${charSheet[fourStarChars[chooseFourSC]]["name"]} (${emoteSheet["Stars"]["StarBig"]["id"] + emoteSheet["Stars"]["StarBig"]["id"] + emoteSheet["Stars"]["StarBig"]["id"] + emoteSheet["Stars"]["StarBig"]["id"]})\n\n+200 Credits`
                                }
                            } else { // YOU GOT A LIGHTCONE
                                chooseFourSLC = Math.floor(Math.random() * (fourStarLC.length))
                                testEmbed.setThumbnail(`https://raw.githubusercontent.com/Mar-7th/StarRailRes/master/icon/light_cone/${fourStarLC[chooseFourSLC]}.png`)
                                testEmbed.setFooter( {text: `Current pity: ${(await ids.findOne({discord_id: discordID}, options))['five_star_pity']}`} )

                                var level = "inventory." + fourStarLC[chooseFourSLC] + ".level"
                                var si = "inventory." + fourStarLC[chooseFourSLC] + ".si"
                                var equipped = "inventory." + fourStarLC[chooseFourSLC] + ".equipped_on"

                                var inventoryCollection = (await ids.findOne({discord_id: discordID}, options))['inventory']
                                if (fourStarLC[chooseFourSLC] in inventoryCollection) {
                                    // console.log("found")

                                    const getSI = {
                                        projection: {
                                            _id: 0,
                                            [si]: 1
                                        }
                                    }

                                    var findSV = await ids.findOne({discord_id: discordID}, getSI)
                                    var getSV = findSV["inventory"][fourStarLC[chooseFourSLC]]["si"]

                                    if (getSV >= 5) { // You have 5 si already
                                        await ids.updateOne({discord_id: discordID}, { $inc: { credits: 600 } } )
                                        result = `${LCSheet[fourStarLC[chooseFourSLC]]["name"]}, but you already have five superimpositions!\n\n+600 Credits`
                                    } else { // You got a duplicate
                                        await ids.updateOne({discord_id: discordID}, { $inc: { credits: 320 } } )
                                        await ids.updateOne({ discord_id: discordID }, { $inc: { [si] : 1 } })
                                        result = `${LCSheet[fourStarLC[chooseFourSLC]]["name"]} (${emoteSheet["Stars"]["StarBig"]["id"] + emoteSheet["Stars"]["StarBig"]["id"] + emoteSheet["Stars"]["StarBig"]["id"] + emoteSheet["Stars"]["StarBig"]["id"]})\n\nSI Level: ${getSV + 1}\n+320 Credits`
                                    }
                                } else { // Your first time getting the lc
                                    // console.log("new")
                                    await ids.updateOne({ discord_id: discordID }, { $set: { [level] : 1 } })
                                    await ids.updateOne({ discord_id: discordID }, { $set: { [si] : 0 } })
                                    await ids.updateOne({ discord_id: discordID }, { $set: { [equipped] : -1 } })
                                    await ids.updateOne({ discord_id: discordID }, { $inc: { credits: 200 } } )
                                    result = `${LCSheet[fourStarLC[chooseFourSLC]]["name"]} (${emoteSheet["Stars"]["StarBig"]["id"] + emoteSheet["Stars"]["StarBig"]["id"] + emoteSheet["Stars"]["StarBig"]["id"] + emoteSheet["Stars"]["StarBig"]["id"]})\n\n+200 Credits`
                                }
                            }
                        // You got a 3 star sadge, must be a light cone
                        } else {
                            // Update wish count and pities
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

                            var level = "inventory." + threeStarLC[chooseTSLC] + ".level"
                            var si = "inventory." + threeStarLC[chooseTSLC] + ".si"
                            var equipped = "inventory." + threeStarLC[chooseTSLC] + ".equipped_on"

                            var inventoryCollection = (await ids.findOne({discord_id: discordID}, options))['inventory']
                            if (threeStarLC[chooseTSLC] in inventoryCollection) {
                                // console.log("found")

                                const getSI = {
                                    projection: {
                                        _id: 0,
                                        [si]: 1
                                    }
                                }

                                var findSV = await ids.findOne({discord_id: discordID}, getSI)
                                var getSV = findSV["inventory"][threeStarLC[chooseTSLC]]["si"]

                                if (getSV >= 5) { // You have 5 si already
                                    await ids.updateOne({discord_id: discordID}, { $inc: { credits: 100 } } )
                                    result = `${LCSheet[threeStarLC[chooseTSLC]]["name"]}, but you already have five superimpositions!\n\n+100 Credits`
                                } else { // You got a duplicate
                                    await ids.updateOne({discord_id: discordID}, { $inc: { credits: 70 } } )
                                    await ids.updateOne({ discord_id: discordID }, { $inc: { [si] : 1 } })
                                    result = `${LCSheet[threeStarLC[chooseTSLC]]["name"]} (${emoteSheet["Stars"]["StarBig"]["id"] + emoteSheet["Stars"]["StarBig"]["id"] + emoteSheet["Stars"]["StarBig"]["id"]})\n\nSI Level: ${getSV + 1}\n+70 Credits`
                                }
                            } else { // Your first time getting the lc
                                // console.log("new")
                                await ids.updateOne({ discord_id: discordID }, { $set: { [level] : 1 } })
                                await ids.updateOne({ discord_id: discordID }, { $set: { [si] : 0 } })
                                await ids.updateOne({ discord_id: discordID }, { $set: { [equipped] : -1 } })
                                await ids.updateOne({ discord_id: discordID }, { $inc: { credits: 50 } } )
                                result = `${LCSheet[threeStarLC[chooseTSLC]]["name"]} (${emoteSheet["Stars"]["StarBig"]["id"] + emoteSheet["Stars"]["StarBig"]["id"] + emoteSheet["Stars"]["StarBig"]["id"]})\n+50 Credits`
                            }
                        }

                        // console.log(result)

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
                }
                
            } catch (error) {
                console.log(`There was an error: ${error}`)
                interaction.editReply({ content: "Failed creating embed, please don't spam the command! Wishes have been calculated"})
                await client.close()
            }
        })()
    }
}