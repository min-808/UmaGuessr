var { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
var { MongoClient } = require("mongodb");

const setup = require('../../firstinit');

const LCSheet = require('../../src/assets/light_cones.json')
const charSheet = require('../../src/assets/characters.json')
const emoteSheet = require('../../src/assets/emotes.json')
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
    .setDescription('Send your characters on assignments to earn stellar jade')
    .addStringOption((option) =>
        option
            .setName("character")
            .setDescription("Enter the character to send on the assignment")
            .setRequired(false)
            
    )
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
                var discordID = parseInt(interaction.user.id)

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
                    }
                }

                // Then get the first thing that matches the discord id, and options is the query from before
                var toParseUserUID = await ids.findOne({discord_id: discordID}, options);

                var retLevel = toParseUserUID['assignment_level']
                var retCredits = toParseUserUID['credits']
                var currentTP = toParseUserUID['trailblaze_power']
                var currentChars = toParseUserUID['characters']

                if (interaction.options.get('character') && interaction.options.get('planet')) { // If a character and planet are found

                    var planet = interaction.options.get('planet').value
                    var character = (interaction.options.get('character').value).toLowerCase() // thank you stackoverflow
                                                                                .split(' ')
                                                                                .map((s) => s.charAt(0).toUpperCase() + s.substring(1))
                                                                                .join(' ');

                    if ((!choices.includes(planet) && (charMap.get(character) == undefined)) || (choices.includes(planet) && (charMap.get(character) == undefined)) || (!choices.includes(planet) && (charMap.get(character)))) { // Can't find character or planet
                        testEmbed.spliceFields(0, 1,
                            {
                                name: "\n",
                                value: `Unable to find the character or planet. Check spelling or select from list`
                            })
        
                        interaction.editReply({ embeds: [testEmbed] });
                        await client.close()
                    } else if ((charMap.get(character)) && ((choices.includes(planet)))) { // Character AND planet exist
                        if ((!(charMap.get(character) in currentChars))) { // But you don't have the character
                            testEmbed.spliceFields(0, 1,
                                {
                                    name: "\n",
                                    value: `You don't own ${character}`
                                })
            
                            interaction.editReply({ embeds: [testEmbed] });
                            await client.close()
                        } else if (charMap.get(character) in currentChars) { // You have the character
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
                                        value: `You cannot access **${planet}** yet. You need to be level \`${reqPlanetLv + 1}\`, but you're level \`${retLevel + 1}\``
                                    })
                
                                interaction.editReply({ embeds: [testEmbed] });
                                await client.close()
                            } else {
                                if (currentTP < reqPlanet.trailblaze_cost) { // You don't have enough trailblaze power
                                    testEmbed.spliceFields(0, 1,
                                        {
                                            name: "\n",
                                            value: `You don't have enough Trailblaze Power. You need \`${reqPlanet.trailblaze_cost}\`, but you have \`${currentTP}\``
                                        })
                    
                                    interaction.editReply({ embeds: [testEmbed] });
                                    await client.close()
                                } else {

                                    var baseReward = reqPlanet.base_reward
                                    var charBonus = 0
                                    var LCBonus = 0
                                    var levelBonus = 0

                                    if (charSheet[charMap.get(character)]["rarity"] == 4) {
                                        charBonus += Math.floor(Math.random() * (60 - 50 + 1) + 50)
                                    } else if (character == "Trailblazer") {
                                        charBonus += Math.floor(Math.random() * (80 - 70 + 1) + 70)
                                    } else if (charSheet[charMap.get(character)]["rarity"] == 5) {
                                        charBonus += charBonus += Math.floor(Math.random() * (170 - 160 + 1) + 160)
                                    }

                                    var findLC = currentChars[charMap.get(character)]["lc"]

                                    if (findLC == -1) { // Holding nothing
                                        LCBonus += 0
                                    } else if (LCSheet[findLC]["rarity"] == 3) {
                                        LCBonus += Math.floor(Math.random() * (40 - 30 + 1) + 30)
                                    } else if (LCSheet[findLC]["rarity"] == 4) {
                                        LCBonus += Math.floor(Math.random() * (70 - 60 + 1) + 60)
                                    } else if (LCSheet[findLC]["rarity"] == 5) {
                                        LCBonus += Math.floor(Math.random() * (160 - 150 + 1) + 150)
                                    }

                                    levelBonus += (currentChars[charMap.get(character)]["level"]) * 2
    
                                    var total = baseReward + charBonus + LCBonus + levelBonus
                                    var TPCost = reqPlanet.trailblaze_cost

                                    const updateAll = {
                                        $inc: {
                                            trailblaze_power: -TPCost,
                                            jade_count: total,
                                        }
                                    }

                                    await ids.updateOne({discord_id: discordID}, updateAll)

                                    var updatedInfo = await ids.findOne({discord_id: discordID}, options);
                                    var retPower = updatedInfo['trailblaze_power']
                                    var retJades = updatedInfo['jade_count']
    
                                    testEmbed.spliceFields(0, 1,
                                        {
                                            name: "\n",
                                            value: `**Assignment Completed!**\n
**+${baseReward}** (Base Reward)
**+${charBonus}** (Character Bonus)
**+${LCBonus}** (Light Cone Bonus)
**+${levelBonus}** (Level Bonus)\n
**${total}** Total Stellar Jade earned\n\n
You now have **${retPower}** Trailblaze Power and **${retJades}** Stellar Jade`
                                        })
                    
                                    interaction.editReply({ embeds: [testEmbed] });
                                    await client.close()
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
    **Higher rarity** characters and light cones give you more stellar jade upon completing the assignment\n\n
    **__Planets__**
    To unlock planets, upgrade your **level** (/unlock) at the cost of credits\n
    1. Herta Space Station **(unlocked!)**\n**${Object.values(areaSheet)[0]["base_reward"]}** jade / **${Object.values(areaSheet)[0]["trailblaze_cost"]}** power\n
    2. Jarilo-VI **(costs ${Object.values(areaSheet)[1]["unlock_cost"]} credits)**\n**${Object.values(areaSheet)[1]["base_reward"]}** jade / **${Object.values(areaSheet)[1]["trailblaze_cost"]}** power\n
    3. Xianzhou Luofu **(costs ${Object.values(areaSheet)[2]["unlock_cost"]} credits)**\n**${Object.values(areaSheet)[2]["base_reward"]}** jade / **${Object.values(areaSheet)[2]["trailblaze_cost"]}** power\n
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
    **Higher rarity** characters and light cones give you more stellar jade upon completing the assignment\n\n
    **__Planets__**
    To unlock planets, upgrade your **level** (/unlock) at the cost of credits\n
    1. Herta Space Station **(unlocked!)**\n**${Object.values(areaSheet)[0]["base_reward"]}** jade / **${Object.values(areaSheet)[0]["trailblaze_cost"]}** power\n
    2. Jarilo-VI **(unlocked!)**\n**${Object.values(areaSheet)[1]["base_reward"]}** jade / **${Object.values(areaSheet)[1]["trailblaze_cost"]}** power\n
    3. Xianzhou Luofu **(costs ${Object.values(areaSheet)[2]["unlock_cost"]} credits)**\n**${Object.values(areaSheet)[2]["base_reward"]}** jade / **${Object.values(areaSheet)[2]["trailblaze_cost"]}** power\n
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
    **Higher rarity** characters and light cones give you more stellar jade upon completing the assignment\n\n
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
                    console.log(`There was an error: ${error}`)
                    interaction.editReply({ content: "something broke let me know lol"})
                    await client.close()
                }
        })();
    }
}