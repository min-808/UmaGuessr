var { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
var { MongoClient } = require("mongodb");

const setup = require('../../firstinit');

const LCSheet = require('../../src/assets/light_cones.json')
const charSheet = require('../../src/assets/characters.json');

var uri = "mongodb+srv://min:" + process.env.MONGODB_PASS + "@discord-seele.u4g75ks.mongodb.net/"

module.exports = {
    data: new SlashCommandBuilder()
    .setName('unequip')
    .setDescription('Unequip a light cone from a character')
    .addStringOption((option) => 
        option
            .setName("character")
            .setDescription("Type in the character")
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

                // Using a hashmap to reverse key value pairs

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
                var discordID = parseInt(interaction.user.id)

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
                    }
                }

                // Then get the first thing that matches the discord id, and options is the query from before
                var toParseUserUID = await ids.findOne({discord_id: discordID}, options);

                var currentInventory = toParseUserUID['inventory']
                var currentChars = toParseUserUID['characters']

                if (charMap.get(inputChar) == undefined) { // If the character doesn't exist at all
                    testEmbed.spliceFields(0, 1,
                        {
                            name: "\n",
                            value: `Character \`${inputChar}\` doesn't exist! Check spelling/casing`
                    })
                } else if (charMap.get(inputChar) && (!(charMap.get(inputChar) in currentChars))) { // If you don't own the character
                    testEmbed.spliceFields(0, 1,
                        {
                            name: "\n",
                            value: `You don't have Character \`${inputChar}\``
                    })
                } else if (charMap.get(inputChar) && (charMap.get(inputChar) in currentChars)) {// If you have the character
                    // Almost success, check if they're holding something

                    var lc = "characters." + charMap.get(inputChar) + ".lc"

                    const getLC = {
                        projection: {
                            _id: 0,
                            [lc]: 1,
                            [equipped_on]: 1
                        }
                    }

                    var findLC = await ids.findOne({discord_id: discordID}, getLC)
                    var getCurrentCharLC = findLC["characters"][charMap.get(inputChar)]["lc"]
                    
                    if (getCurrentCharLC == -1) {
                        // Holding nothing
                        testEmbed.spliceFields(0, 1,
                            {
                                name: "\n",
                                value: `\`${inputChar}\` has no light cone to remove`
                        })
                    } else {
                        // Unequip
                        var equipped_on = "inventory." + getCurrentCharLC + ".equipped_on"

                        const setLC = { 
                            $set: { 
                                [lc]: -1
                            } 
                        }

                        const setEquipped = {
                            $set: {
                                [equipped_on]: -1
                            }
                        }

                        await ids.updateOne({discord_id: discordID}, setLC)
                        await ids.updateOne({discord_id: discordID}, setEquipped)

                        testEmbed.spliceFields(0, 1,
                            {
                                name: "\n",
                                value: `Removed \`${LCSheet[getCurrentCharLC]["name"]}\` from \`${inputChar}\``
                        })
                    }

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