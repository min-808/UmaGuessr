var { SlashCommandBuilder, EmbedBuilder, ChatInputCommandInteraction } = require('discord.js');
var { MongoClient } = require("mongodb");

const setup = require('../../firstinit');
const checkLevel = require('../../check-level');

const LCSheet = require('../../src/assets/light_cones.json')
const charSheet = require('../../src/assets/characters.json');

var uri = "mongodb+srv://min:" + process.env.MONGODB_PASS + "@discord-seele.u4g75ks.mongodb.net/"

module.exports = {
    data: new SlashCommandBuilder()
    .setName('equip')
    .setDescription('Put light cones on your character!')
    .addStringOption((option) => 
        option
            .setName("character")
            .setDescription("Type in the character")
            .setRequired(true)
    )
    .addStringOption((option) => 
        option
            .setName("lightcone")
            .setDescription("Type in the light cone")
            .setRequired(true)
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

                var inputChar = interaction.options.get('character').value
                var inputLC = interaction.options.get('lightcone').value

                var lowercaseInputChar = inputChar.toLowerCase()
                var lowercaseInputLC = inputLC.toLowerCase()

                // console.log(inputChar)

                // Using a hashmap to reverse key value pairs (key = character name, value = id)

                var lowerCaseCharMap = new Map()
                var lowerCaseLCMap = new Map()
                var charMap = new Map()
                var LCMap = new Map()

                for (var [key, value] of Object.entries(charSheet)) {
                    charMap.set(value["name"], key)
                    lowerCaseCharMap.set(value["name"].toLowerCase(), key)
                }

                for (var [key, value] of Object.entries(LCSheet)) {
                    LCMap.set(value["name"], key)
                    lowerCaseLCMap.set(value["name"].toLowerCase(), key)
                }
                // console.log(lowerCaseCharMap)

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
                        inventory: 1,
                        characters: 1,
                        missions: 1,
                        missions_completed: 1,
                    }
                }

                // Then get the first thing that matches the discord id, and options is the query from before
                var toParseUserUID = await ids.findOne({discord_id: discordID}, options);

                var currentInventory = toParseUserUID['inventory']
                var currentChars = toParseUserUID['characters']

                if ((lowerCaseCharMap.get(lowercaseInputChar) == undefined) || (lowerCaseLCMap.get(lowercaseInputLC) == undefined)) { // If the character and light cones don't exist at all
                    // console.log(currentChars)
                    testEmbed.spliceFields(0, 1,
                        {
                            name: "\n",
                            value: `Character \`${inputChar}\` or Light Cone \`${inputLC}\` doesn't exist! Check spelling/casing`
                    })
                } else if ((lowerCaseCharMap.get(lowercaseInputChar) && (!(lowerCaseCharMap.get(lowercaseInputChar) in currentChars))) || (lowerCaseLCMap.get(lowercaseInputLC) && (!(lowerCaseLCMap.get(lowercaseInputLC) in currentInventory)))) { // If you don't own either light cone or character
                    testEmbed.spliceFields(0, 1,
                        {
                            name: "\n",
                            value: `You don't have Character \`${inputChar}\` or Light Cone \`${inputLC}\``
                    })
                } else if ((lowerCaseCharMap.get(lowercaseInputChar) && (lowerCaseCharMap.get(lowercaseInputChar) in currentChars)) && (lowerCaseLCMap.get(lowercaseInputLC) && (lowerCaseLCMap.get(lowercaseInputLC) in currentInventory))) {// If you have the LC
                    // Success

                    var getMissions = toParseUserUID['missions']

                    var addMissionID = []

                    for (var i = 0; i < 5; i++) {
                        addMissionID.push(getMissions[i]["id"])
                    }

                    if ((addMissionID.includes(4)) && (getMissions[addMissionID.indexOf(4)]["completed"] == false)) { // id for balance mission
                        var mission = `missions.${addMissionID.indexOf(4)}.completed`
                        var missionSymbol = `missions.${addMissionID.indexOf(4)}.completed_symbol`

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

                    // Either unequip the current and put the new one on
                    // OR put the new one on

                    var lc = "characters." + lowerCaseCharMap.get(lowercaseInputChar) + ".lc"
                    var equipped = "inventory." + lowerCaseLCMap.get(lowercaseInputLC) + ".equipped_on"

                    const getLC = {
                        projection: {
                            _id: 0,
                            [lc]: 1,
                            [equipped]: 1
                        }
                    }

                    const setLC = { 
                        $set: { 
                            [lc]: parseInt(lowerCaseLCMap.get(lowercaseInputLC))
                        } 
                    }

                    const setEquipped = {
                        $set: {
                            [equipped]: parseInt(lowerCaseCharMap.get(lowercaseInputChar))
                        }
                    }

                    var message = `\`${charSheet[lowerCaseCharMap.get(lowercaseInputChar)]["name"]}\` has equipped \`${LCSheet[lowerCaseLCMap.get(lowercaseInputLC)]["name"]}\`` // upper case this

                    var findLC = await ids.findOne({discord_id: discordID}, getLC)

                    var getCurrentCharLC = findLC["characters"][lowerCaseCharMap.get(lowercaseInputChar)]["lc"]
                    var getEquippedOn = findLC["inventory"][lowerCaseLCMap.get(lowercaseInputLC)]["equipped_on"]

                    /* 
                    Four cases
                        Case 1. If the LC isn't held by anybody AND the character isn't holding an LC
                        Case 2. If the LC is held by someone AND the character isn't holding an LC
                        Case 3. If the LC isn't held by anyone AND the character is holding an LC
                        Case 4. If the LC is held by someone AND the character is holding an LC (in this case, swap LCs)

                        For cases 2 and 4, let the person know that the old character is holding nothing/it was swapped
                        Also for case 4, make sure to check that you're not swapping the same character with each other. Weird output but still functions
                    */

                    if ((getEquippedOn == -1) && (getCurrentCharLC == -1)) { // Case 1
                        await ids.updateOne({discord_id: discordID}, setLC) // Set character to hold LC
                        await ids.updateOne({discord_id: discordID}, setEquipped) // Set LC to be equipped by character
                    } else if ((getEquippedOn != -1) && (getCurrentCharLC == -1)) { // Case 2
                        // I have to: Get the character it's on via the LC, set that character to hold nothing, set the LC to the new character, then set new character to hold said LC
                        var oldCharNumber = findLC['inventory'][lowerCaseLCMap.get(lowercaseInputLC)]['equipped_on']
                        var test = "characters." + oldCharNumber + ".lc"
                        await ids.updateOne({discord_id: discordID}, { $set: { [test]: -1 }})
                        await ids.updateOne({discord_id: discordID}, setLC)
                        await ids.updateOne({discord_id: discordID}, setEquipped)

                        message = `\`${charSheet[lowerCaseCharMap.get(lowercaseInputChar)]["name"]}\` has equipped \`${LCSheet[lowerCaseLCMap.get(lowercaseInputLC)]["name"]}\`\n\n\`${charSheet[oldCharNumber]["name"]}\` is now holding Nothing` // upper case this
                    } else if ((getEquippedOn == -1) && (getCurrentCharLC != -1)) { // Case 3
                        // I have to: Get the light cone via the character and set it to equipped -1. Then set the new light cone to be equipped by the character, and the character to hold the new lightcone
                        var oldLC = findLC['characters'][lowerCaseCharMap.get(lowercaseInputChar)]['lc']
                        var test = "inventory." + oldLC + ".equipped_on"
                        await ids.updateOne({discord_id: discordID}, { $set: { [test]: -1 }})
                        await ids.updateOne({discord_id: discordID}, setLC)
                        await ids.updateOne({discord_id: discordID}, setEquipped)
                    } else if ((getEquippedOn != -1) && (getCurrentCharLC != -1)) { // Case 4
                        // the most complicated one
                        var findBroad = await ids.findOne({discord_id: discordID})
                        
                        var toChangeLC = findBroad['characters'][lowerCaseCharMap.get(lowercaseInputChar)]['lc'] // LC
                        var toChangeChar = findBroad['inventory'][lowerCaseLCMap.get(lowercaseInputLC)]['equipped_on'] // Char

                        var newLC = findBroad['characters'][toChangeChar]['lc'] // LC
                        var newChar = findBroad['inventory'][toChangeLC]['equipped_on'] // Char
                        
                        var newSetLC = "characters." + newChar + ".lc"
                        var newSetChar = "inventory." + newLC + ".equipped_on"

                        var oldSetLC = "characters." + toChangeChar + ".lc" // LC
                        var oldSetChar = "inventory." + toChangeLC + ".equipped_on" // LC

                        await ids.updateOne({discord_id: discordID}, { $set: { [newSetLC]: parseInt(newLC) }}) 
                        //console.log(newSetLC + " and " + newLC)
                        await ids.updateOne({discord_id: discordID}, { $set: { [oldSetLC]: parseInt(toChangeLC) }})
                        //console.log(oldSetLC + " and " + toChangeLC)
                        await ids.updateOne({discord_id: discordID}, { $set: { [newSetChar]: parseInt(newChar) }})
                        //console.log(newSetChar + " and " + newChar)
                        await ids.updateOne({discord_id: discordID}, { $set: { [oldSetChar]: parseInt(toChangeChar) }})
                        //console.log(oldSetChar + " and " + toChangeChar)

                        message = `\`${charSheet[lowerCaseCharMap.get(lowercaseInputChar)]["name"]}\` has swapped items with \`${charSheet[toChangeChar]["name"]}\`\n\n\`${charSheet[lowerCaseCharMap.get(lowercaseInputChar)]["name"]}\` now has \`${LCSheet[newLC]["name"]}\`\n\`${charSheet[toChangeChar]["name"]}\` now has \`${LCSheet[toChangeLC]["name"]}\`` // upper case this
                    } else {
                        console.log("I messed up somewhere")
                    }
                    
                    testEmbed.spliceFields(0, 1,
                        {
                            name: "\n",
                            value: message
                    })
                }

                interaction.editReply({ embeds: [testEmbed] });

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

                await client.close()

            } catch (error) {
                console.log(`There was an error: ${error.stack}`)
                interaction.editReply({ content: "Something broke!"})
                await client.close()
            }
        })();
    }
}