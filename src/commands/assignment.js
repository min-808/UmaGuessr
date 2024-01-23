var { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
var { MongoClient } = require("mongodb");

const setup = require('../../firstinit');
const checkLevel = require('../../check-level');

const LCSheet = require('../../src/assets/light_cones.json')
const charSheet = require('../../src/assets/characters.json')
const areaSheet = require('../../src/assets/areas.json')

let choices = []
for (var i = 0; i < Object.keys(areaSheet).length; i++) {
    choices.push(Object.values(areaSheet)[i].name)
}

var charMap = new Map()
for (var [key, value] of Object.entries(charSheet)) {
    charMap.set(value["name"], key)
}

/*
Eventually figure out how to get a better GUI to put this stuff in
Maybe take inspiration from the BG guessing game in bathbot
*/

var uri = "mongodb+srv://min:" + process.env.MONGODB_PASS + "@discord-seele.u4g75ks.mongodb.net/"

module.exports = {
    data: new SlashCommandBuilder()
    .setName('assignment')
    .setDescription('Send your team on assignments to earn stellar jade. Run the command with no options to see info')
    .addStringOption((option) => 
        option
            .setName("planet")
            .setDescription("Select the planet you want to go on assignment to")
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
    }

    ,

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

                // If document found, get the hsr_id (set to 1, and id set to 0)
                if (counter < 1) {

                    // If document not found, make a new database entry, do this for all economy commands
                    await setup.init(discordID, "economy", "inventories")
                }
                var options = {
                    projection: {
                        jade_count: 1,
                        assignment_level: 1,
                        trailblaze_power: 1,
                        credits: 1,
                        characters: 1,
                        inventory: 1,
                        missions: 1,
                        missions_completed: 1,
                        trailblaze_power_used_today: 1,
                        team: 1,
                    }
                }

                // Then get the first thing that matches the discord id, and options is the query from before
                var toParseUserUID = await ids.findOne({discord_id: discordID}, options);

                var retLevel = toParseUserUID['assignment_level']
                var retCredits = toParseUserUID['credits']
                var currentTP = toParseUserUID['trailblaze_power']
                var currentChars = toParseUserUID['characters']
                var currentLC = toParseUserUID['inventory']
                var team = toParseUserUID['team']

                if (interaction.options.get('planet')) { // If planet is found
                    var planet = interaction.options.get('planet').value
                    if (!(choices.includes(planet))) { // Can't find planet
                        testEmbed.spliceFields(0, 1,
                            {
                                name: "\n",
                                value: `Unable to find the planet. Check spelling or select from list`
                            })
        
                        interaction.editReply({ embeds: [testEmbed] });
                        await client.close()
                    } else { { // Planet exists
                            var reqPlanet = ""

                            for (var i = 0; i < Object.keys(areaSheet).length; i++) {
                                if (Object.values(areaSheet)[i].name == planet) {
                                    reqPlanet = Object.values(areaSheet)[i]
                                }
                            }
                            var reqPlanetLv = parseInt(reqPlanet.id)
                            
                            if (retLevel < reqPlanetLv) { // You try to go to a planet that's not in your level
                                testEmbed.spliceFields(0, 1,
                                    {
                                        name: "\n",
                                        value: `You cannot access **${planet}** yet. You need to be level **${reqPlanetLv + 1}**, but you're level **${retLevel + 1}**`
                                    })
                
                                interaction.editReply({ embeds: [testEmbed] });
                                await client.close()
                            } else {
                                if (currentTP < reqPlanet.trailblaze_cost) { // You don't have enough trailblaze power
                                    testEmbed.spliceFields(0, 1,
                                        {
                                            name: "\n",
                                            value: `You don't have enough Trailblaze Power. You need **${reqPlanet.trailblaze_cost}**, but you have **${currentTP}**`
                                        })
                    
                                    interaction.editReply({ embeds: [testEmbed] });
                                    await client.close()
                                } else { // Success

                                    var baseReward = reqPlanet.base_reward
                                    var charBonus = 0
                                    var LCBonus = 0
                                    var levelBonus = 0
                                    var eidolonBonus = 0

                                    characterArr = []
                                    characterArrReadable = ""

                                    for (var i = 0; i < 4; i++) {
                                        if (team[i]['id'] != -1) {
                                            characterArr.push(team[i]['id'])
                                        }
                                    }

                                    if (characterArr.length >= 1) { // Good you have a team
                                        for (var i = 0; i < characterArr.length; i++) {
                                            if (i < characterArr.length - 1) {
                                                characterArrReadable += charSheet[characterArr[i]]["name"] + ", "
                                            } else {
                                                characterArrReadable += charSheet[characterArr[i]]["name"]
                                            }
    
                                            // Character Bonus
                                            if ((charSheet[characterArr[i]]["rarity"] == 4) || (charSheet[characterArr[i]]["name"] == "Trailblazer")) {
                                                charBonus += Math.floor(Math.random() * (40 - 30 + 1) + 30)
                                                eidolonBonus += (currentChars[characterArr[i]]["eidolon"]) * 6
                                            } else if (charSheet[characterArr[i]]["rarity"] == 5) {
                                                charBonus += Math.floor(Math.random() * (80 - 70 + 1) + 70)
                                                eidolonBonus += (currentChars[characterArr[i]]["eidolon"]) * 70
                                            }
    
                                            var findLC = currentChars[characterArr[i]]["lc"]
    
                                            // LC Bonus
                                            if (findLC == -1) { // Holding nothing
                                                LCBonus += 0
                                            } else if (LCSheet[findLC]["rarity"] == 3) {
                                                LCBonus += 10
                                                eidolonBonus += (currentLC[findLC]["si"]) * 2
                                            } else if (LCSheet[findLC]["rarity"] == 4) {
                                                LCBonus += Math.floor(Math.random() * (30 - 25 + 1) + 25)
                                                eidolonBonus += (currentLC[findLC]["si"]) * 6
                                            } else if (LCSheet[findLC]["rarity"] == 5) {
                                                LCBonus += Math.floor(Math.random() * (80 - 70 + 1) + 70)
                                                eidolonBonus += (currentLC[findLC]["si"]) * 70
                                            }
    
                                            // Level Bonus
                                            if ((currentChars[characterArr[i]]["level"]) == 1) {
                                                levelBonus += 0
                                            } else {
                                                levelBonus += ((currentChars[characterArr[i]]["level"]) * 1)
                                            }

                                            // Level Bonus for LC
                                            if ((currentChars[characterArr[i]]["lc"]) == -1) {
                                                levelBonus += 0
                                            } else if (currentLC[currentChars[characterArr[i]]["lc"]]["level"] == 1) {
                                                levelBonus += 0
                                            } else if (currentLC[currentChars[characterArr[i]]["lc"]]["level"] >= 1) {
                                                levelBonus += ((currentLC[currentChars[characterArr[i]]["lc"]]["level"]) * 1)
                                            }

                                        }
    
                                        var total = baseReward + charBonus + LCBonus + levelBonus + eidolonBonus
                                        var TPCost = reqPlanet.trailblaze_cost
                                        var EXPGain = reqPlanet.exp_reward
    
                                        const updateAll = {
                                            $inc: {
                                                trailblaze_power: -TPCost,
                                                jade_count: total,
                                                trailblaze_power_used_today: TPCost,
                                                exp: EXPGain,
                                            }
                                        }
    
                                        await ids.updateOne({discord_id: discordID}, updateAll)
                                        var updatedInfo = await ids.findOne({discord_id: discordID}, options);
    
                                        var getMissions = toParseUserUID['missions']
    
                                        var addMissionID = []
                
                                        for (var i = 0; i < 5; i++) {
                                            addMissionID.push(getMissions[i]["id"])
                                        }
                
                                        if ((addMissionID.includes(1)) && (getMissions[addMissionID.indexOf(1)]["completed"] == false)) { // id for assignment mission
                                            var mission = `missions.${addMissionID.indexOf(1)}.completed`
                                            var missionSymbol = `missions.${addMissionID.indexOf(1)}.completed_symbol`
                
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
    
                                        if ((addMissionID.includes(3)) && (getMissions[addMissionID.indexOf(3)]["completed"] == false)) { // id for 160 power mission
                                            if (updatedInfo['trailblaze_power_used_today'] >= 160) {
                                                var mission = `missions.${addMissionID.indexOf(3)}.completed`
                                                var missionSymbol = `missions.${addMissionID.indexOf(3)}.completed_symbol`
                    
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
                                        }

                                        var levelSuccess = await checkLevel.checker(discordID, "economy", "inventories")
    
                                        var finalInfo = await ids.findOne({discord_id: discordID}, options);
    
                                        var retPower = finalInfo['trailblaze_power']
                                        var retJades = finalInfo['jade_count']
        
                                        testEmbed.spliceFields(0, 1,
                                            {
                                                name: "\n",
                                                value: `**Assignment Completed at ${areaSheet[retLevel]["name"]}**\nWith ${characterArrReadable}\n
**+${baseReward}** (Base Reward)
**+${charBonus}** (Character Bonus)
**+${LCBonus}** (Light Cone Bonus)
**+${eidolonBonus}** (Eidolon/SI Bonus)
**+${levelBonus}** (Level Bonus)\n
**${total}** Total Stellar Jade earned\n**${EXPGain}** Trailblaze EXP earned\n
You now have **${retPower}** Trailblaze Power and **${retJades}** Stellar Jade`
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
                                    } else {
                                        testEmbed.spliceFields(0, 1,
                                            {
                                                name: "\n",
                                                value: `Set up a team with **/team** first`
                                            })

                                        interaction.editReply({ embeds: [testEmbed] });
                                        await client.close()
                                    }

                                    
                                    
                                }
                            }
                        }
                    }

                } else if (interaction.options.get('character') && !interaction.options.get('planet')) {
                    testEmbed.spliceFields(0, 1,
                        {
                            name: "\n",
                            value: `Select a planet`
                        })
    
                    interaction.editReply({ embeds: [testEmbed] });
                    await client.close()
                } else if (!interaction.options.get('character') && interaction.options.get('planet')) {
                    testEmbed.spliceFields(0, 1,
                        {
                            name: "\n",
                            value: `Select a character`
                        })
    
                    interaction.editReply({ embeds: [testEmbed] });
                    await client.close()
                } else {
                    // Give info on assignments, etc

                    if (retLevel == 0) {
                        testEmbed.spliceFields(0, 1,
                            {
                                name: "**__Assignments__**",
                                value: `You can send your characters on assignments to various planets to earn stellar jade\n
It costs **Trailblaze Power** (/power) to go on assignments, with each planet varying in trailblaze power cost
**Higher rarity** characters and light cones give you more stellar jade upon completing the assignment (rarity bonus > eidolon bonus)
**Leveling up** your characters and light cones also give a small bonus\n\n
**__Planets__**
To unlock planets, upgrade your **level** (/unlock) at the cost of credits\n
1. Herta Space Station **(unlocked!)**\n**${Object.values(areaSheet)[0]["base_reward"]}** jade / **${Object.values(areaSheet)[0]["trailblaze_cost"]}** power\n
2. Jarilo-VI **(costs ${Object.values(areaSheet)[1]["unlock_cost"]} credits to unlock)**\n**${Object.values(areaSheet)[1]["base_reward"]}** jade / **${Object.values(areaSheet)[1]["trailblaze_cost"]}** power\n
3. Xianzhou Luofu **(costs ${Object.values(areaSheet)[2]["unlock_cost"]} credits to unlock)**\n**${Object.values(areaSheet)[2]["base_reward"]}** jade / **${Object.values(areaSheet)[2]["trailblaze_cost"]}** power\n
\n
Current highest planet: **${areaSheet[retLevel].name}**
Current credits: **${retCredits}**`
                            })
    
                        interaction.editReply({ embeds: [testEmbed] });
                        await client.close()
                    } else if (retLevel == 1) {
                        testEmbed.spliceFields(0, 1,
                            {
                                name: "**__Assignments__**",
                                value: `You can send your characters on assignments to various planets to earn stellar jade\n
It costs **Trailblaze Power** (/power) to go on assignments, with each planet varying in trailblaze power cost
**Higher rarity** characters and light cones give you more stellar jade upon completing the assignment (rarity bonus > eidolon bonus)
**Leveling up** your characters and light cones also give a small bonus\n\n
**__Planets__**
To unlock planets, upgrade your **level** (/unlock) at the cost of credits\n
1. Herta Space Station **(unlocked!)**\n**${Object.values(areaSheet)[0]["base_reward"]}** jade / **${Object.values(areaSheet)[0]["trailblaze_cost"]}** power\n
2. Jarilo-VI **(unlocked!)**\n**${Object.values(areaSheet)[1]["base_reward"]}** jade / **${Object.values(areaSheet)[1]["trailblaze_cost"]}** power\n
3. Xianzhou Luofu **(costs ${Object.values(areaSheet)[2]["unlock_cost"]} credits to unlock)**\n**${Object.values(areaSheet)[2]["base_reward"]}** jade / **${Object.values(areaSheet)[2]["trailblaze_cost"]}** power\n
\n
Current highest planet: **${areaSheet[retLevel].name}**
Current credits: **${retCredits}**`
                            })
    
                        interaction.editReply({ embeds: [testEmbed] });
                        await client.close()
                    } else if (retLevel == 2) {
                        testEmbed.spliceFields(0, 1,
                            {
                                name: "**__Assignments__**",
                                value: `You can send your characters on assignments to various planets to earn stellar jade\n
It costs **Trailblaze Power** (/power) to go on assignments, with each planet varying in trailblaze power cost
**Higher rarity** characters and light cones give you more stellar jade upon completing the assignment (rarity bonus > eidolon bonus)
**Leveling up** your characters and light cones also give a small bonus\n\n
**__Planets__**
To unlock planets, upgrade your **level** (/unlock) at the cost of credits\n
1. Herta Space Station **(unlocked!)**\n**${Object.values(areaSheet)[0]["base_reward"]}** jade / **${Object.values(areaSheet)[0]["trailblaze_cost"]}** power\n
2. Jarilo-VI **(unlocked!)**\n**${Object.values(areaSheet)[1]["base_reward"]}** jade / **${Object.values(areaSheet)[1]["trailblaze_cost"]}** power\n
3. Xianzhou Luofu **(unlocked!)**\n**${Object.values(areaSheet)[2]["base_reward"]}** jade / **${Object.values(areaSheet)[2]["trailblaze_cost"]}** power\n
\n
Current highest planet: **${areaSheet[retLevel].name}**
Current credits: **${retCredits}**`
                            })
    
                        interaction.editReply({ embeds: [testEmbed] });
                        await client.close()
                    } else if (retLevel == 3) {
                        // erm add when penacony is released
                    }
                }

                } catch (error) {
                    console.log(`There was an error: ${error.stack}`)
                    interaction.editReply({ content: "something broke pls let me know"})
                    await client.close()
                }
        })();
    }
}