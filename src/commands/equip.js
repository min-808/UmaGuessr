var { SlashCommandBuilder, EmbedBuilder, ChatInputCommandInteraction } = require('discord.js');
var { MongoClient } = require("mongodb");

const setup = require('../../firstinit');

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

                var inputChar = (interaction.options.get('character').value).toLowerCase() // thank you stackoverflow
                                                                            .split(' ')
                                                                            .map((s) => s.charAt(0).toUpperCase() + s.substring(1))
                                                                            .join(' ');
                var inputLC = interaction.options.get('lightcone').value

                // Using a hashmap to reverse key value pairs (key = character name, value = id)

                var charMap = new Map()
                for (var [key, value] of Object.entries(charSheet)) {
                    charMap.set(value["name"], key)
                }
                // console.log(charMap)

                var LCMap = new Map()
                for (var [key, value] of Object.entries(LCSheet)) {
                    LCMap.set(value["name"], key)
                }
                // console.log(LCMap)

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

                if ((charMap.get(inputChar) == undefined) || (LCMap.get(inputLC) == undefined)) { // If the character and light cones don't exist at all
                    // console.log(currentChars)
                    testEmbed.spliceFields(0, 1,
                        {
                            name: "\n",
                            value: `Character \`${inputChar}\` or Light Cone \`${inputLC}\` doesn't exist! Check spelling/casing`
                    })
                } else if ((charMap.get(inputChar) && (!(charMap.get(inputChar) in currentChars))) || (LCMap.get(inputLC) && (!(LCMap.get(inputLC) in currentInventory)))) { // If you don't own either light cone or character
                    testEmbed.spliceFields(0, 1,
                        {
                            name: "\n",
                            value: `You don't have Character \`${inputChar}\` or Light Cone \`${inputLC}\``
                    })
                } else if ((charMap.get(inputChar) && (charMap.get(inputChar) in currentChars)) && (LCMap.get(inputLC) && (LCMap.get(inputLC) in currentInventory))) {// If you have both
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
                                jade_count: 75
                            }
                        }

                        await ids.updateOne({discord_id: discordID}, setTrue)
                    } //

                    // Either unequip the current and put the new one on
                    // OR put the new one on

                    var lc = "characters." + charMap.get(inputChar) + ".lc"
                    var equipped = "inventory." + LCMap.get(inputLC) + ".equipped_on"

                    const getLC = {
                        projection: {
                            _id: 0,
                            [lc]: 1,
                            [equipped]: 1
                        }
                    }

                    const setLC = { 
                        $set: { 
                            [lc]: parseInt(LCMap.get(inputLC))
                        } 
                    }

                    const setEquipped = {
                        $set: {
                            [equipped]: parseInt(charMap.get(inputChar))
                        }
                    }

                    var message = `\`${inputChar}\` has equipped \`${inputLC}\``

                    var findLC = await ids.findOne({discord_id: discordID}, getLC)

                    var getCurrentCharLC = findLC["characters"][charMap.get(inputChar)]["lc"]
                    var getEquippedOn = findLC["inventory"][LCMap.get(inputLC)]["equipped_on"]

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
                        var oldCharNumber = findLC['inventory'][LCMap.get(inputLC)]['equipped_on']
                        var test = "characters." + oldCharNumber + ".lc"
                        await ids.updateOne({discord_id: discordID}, { $set: { [test]: -1 }})
                        await ids.updateOne({discord_id: discordID}, setLC)
                        await ids.updateOne({discord_id: discordID}, setEquipped)

                        message = `\`${inputChar}\` has equipped \`${inputLC}\`\n\n${charSheet[oldCharNumber]["name"]} is now holding \`Nothing\``
                    } else if ((getEquippedOn == -1) && (getCurrentCharLC != -1)) { // Case 3
                        // I have to: Get the light cone via the character and set it to equipped -1. Then set the new light cone to be equipped by the character, and the character to hold the new lightcone
                        var oldLC = findLC['characters'][charMap.get(inputChar)]['lc']
                        var test = "inventory." + oldLC + ".equipped_on"
                        await ids.updateOne({discord_id: discordID}, { $set: { [test]: -1 }})
                        await ids.updateOne({discord_id: discordID}, setLC)
                        await ids.updateOne({discord_id: discordID}, setEquipped)
                    } else if ((getEquippedOn != -1) && (getCurrentCharLC != -1)) { // Case 4
                        // the most complicated one
                        var findBroad = await ids.findOne({discord_id: discordID})
                        
                        var toChangeLC = findBroad['characters'][charMap.get(inputChar)]['lc'] // LC
                        var toChangeChar = findBroad['inventory'][LCMap.get(inputLC)]['equipped_on'] // Char

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

                        message = `\`${inputChar}\` has swapped items with \`${charSheet[toChangeChar]["name"]}\`\n\n\`${inputChar}\` now has \`${LCSheet[newLC]["name"]}\`\n\`${charSheet[toChangeChar]["name"]}\` now has \`${LCSheet[toChangeLC]["name"]}\``
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
                await client.close()

            } catch (error) {
                console.log(`There was an error: ${error}`)
                interaction.editReply({ content: "Something broke!"})
                await client.close()
            }
        })();
    }
}