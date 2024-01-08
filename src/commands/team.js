var { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
var { MongoClient } = require("mongodb");

const setup = require('../../firstinit');
const charSheet = require('../../src/assets/characters.json')

var uri = "mongodb+srv://min:" + process.env.MONGODB_PASS + "@discord-seele.u4g75ks.mongodb.net/"

var charMap = new Map()
for (var [key, value] of Object.entries(charSheet)) {
    charMap.set(value["name"], key)
}

module.exports = {
    data: new SlashCommandBuilder()
    .setName('team')
    .setDescription('Set up your team to send on assignments')
    .addStringOption((option) => 
        option
            .setName("add")
            .setDescription("Add a character to your team")
            .setRequired(false)
    )
    .addStringOption((option) => 
        option
            .setName("remove")
            .setDescription("Remove a character from your team")
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
                        team: 1,
                        characters: 1,
                        missions: 1,
                        missions_completed: 1,
                    }
                }

                // Then get the first thing that matches the discord id, and options is the query from before
                var toParseUserUID = await ids.findOne({discord_id: discordID}, options);
                var team = toParseUserUID['team']
                var characters = toParseUserUID['characters']

                var getMissions = toParseUserUID['missions']
                var addMissionID = []

                if ((interaction.options.get('add') == undefined) && (interaction.options.get('remove') == undefined)) { // No options entered, so just show their current team
                    var displayChars = []
                    var lvChars = []

                    for (var i = 0; i < 4; i++) {
                        if (team[i]["id"] == -1) { // -1 means no entry
                            displayChars.push("None")
                            lvChars.push(``)
                        } else {
                            displayChars.push(charSheet[team[i]["id"]]["name"])
                            lvChars.push(`Level: **${characters[team[i]["id"]]["level"]}**`)
                        }
                    }

                    for (var i = 0; i < 5; i++) {
                        addMissionID.push(getMissions[i]["id"])
                    }

                    if ((addMissionID.includes(10)) && (getMissions[addMissionID.indexOf(10)]["completed"] == false)) { // id for team mission
                        var mission = `missions.${addMissionID.indexOf(10)}.completed`
                        var missionSymbol = `missions.${addMissionID.indexOf(10)}.completed_symbol`

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
                    }

                    
                    testEmbed.spliceFields(0, 1,
                        {
                            name: "\n",
                            value: `**Your Current Team**\n
**${displayChars[0]}**
${lvChars[0]}\n
**${displayChars[1]}**
${lvChars[1]}\n
**${displayChars[2]}**
${lvChars[2]}\n
**${displayChars[3]}**
${lvChars[3]}\n`
                        })
    
                    interaction.editReply({ embeds: [testEmbed] });
                    await client.close()
                } else if ((interaction.options.get('add')) && (interaction.options.get('remove') == undefined)) { // You want to add a character
                    var character = (interaction.options.get('add').value).toLowerCase() // thank you stackoverflow
                                                                                .split(' ')
                                                                                .map((s) => s.charAt(0).toUpperCase() + s.substring(1))
                                                                                .join(' ');

                    if (charMap.get(character) == undefined) { // The character doesn't exist
                        testEmbed.spliceFields(0, 1,
                            {
                                name: "\n",
                                value: `Unable to find the character`
                            })
        
                        interaction.editReply({ embeds: [testEmbed] });
                        await client.close()
                    } else { // Character exists
                        if (!(charMap.get(character) in characters)) { // You don't have the character
                            testEmbed.spliceFields(0, 1,
                                {
                                    name: "\n",
                                    value: `You don't own **${character}**`
                                })
            
                            interaction.editReply({ embeds: [testEmbed] });
                            await client.close()
                        } else { // You have the character and it exists awesome

                            var checkFull = []
                            for (var i = 0; i < 4; i++) {
                                checkFull.push(team[i]["id"])
                            }

                            if (checkFull.includes(parseInt(charMap.get(character)))) { // The character is in the team already
                                testEmbed.spliceFields(0, 1,
                                    {
                                        name: "\n",
                                        value: `**${character}** is already in your team`
                                    })
                
                                interaction.editReply({ embeds: [testEmbed] });
                                await client.close()
                            } else if (!(checkFull.includes(-1))) { // If there is no space
                                testEmbed.spliceFields(0, 1,
                                    {
                                        name: "\n",
                                        value: `Team is full. Couldn't add **${character}**`
                                    })
                
                                interaction.editReply({ embeds: [testEmbed] });
                                await client.close()
                            } else { // There is space
                                    var updateTeamIndex = checkFull.indexOf(-1) // Get the first instance of -1
                                    var updateTeam = 'team.' + updateTeamIndex + ".id"
                                    var updateTeamBoolean = 'characters.' + charMap.get(character) + ".inTeam"
    
                                    await ids.updateOne({discord_id: discordID}, {
                                        $set: {
                                            [updateTeamBoolean]: true,
                                            [updateTeam]: parseInt(charMap.get(character))
                                        }
                                    })
        
                                    testEmbed.spliceFields(0, 1,
                                        {
                                            name: "\n",
                                            value: `Added **${character}** to your team`
                                        })
                    
                                    interaction.editReply({ embeds: [testEmbed] });
                                    await client.close()
                            }
                        }
                    }
                } else if ((interaction.options.get('add') == undefined) && (interaction.options.get('remove'))) { // You want to remove a character
                    var character = (interaction.options.get('remove').value).toLowerCase() // thank you stackoverflow
                                                                                .split(' ')
                                                                                .map((s) => s.charAt(0).toUpperCase() + s.substring(1))
                                                                                .join(' ');

                    if (charMap.get(character) == undefined) { // The character doesn't exist
                        testEmbed.spliceFields(0, 1,
                            {
                                name: "\n",
                                value: `Unable to find the character`
                            })
        
                        interaction.editReply({ embeds: [testEmbed] });
                        await client.close()
                    } else { // Character exists
                        if (!(charMap.get(character) in characters)) { // You don't have the character
                            testEmbed.spliceFields(0, 1,
                                {
                                    name: "\n",
                                    value: `You don't own **${character}**`
                                })
            
                            interaction.editReply({ embeds: [testEmbed] });
                            await client.close()
                        } else { // You have the character and it exists awesome

                            var currentTeamIDs = []
                            for (var i = 0; i < 4; i++) {
                                currentTeamIDs.push(team[i]["id"])
                            }

                            if (!(currentTeamIDs.includes(parseInt(charMap.get(character))))) { // The character isn't in the team
                                testEmbed.spliceFields(0, 1,
                                    {
                                        name: "\n",
                                        value: `**${character}** isn't in the team`
                                    })
                
                                interaction.editReply({ embeds: [testEmbed] });
                                await client.close()
                            } else { // In the team
                                    var updateTeamIndex = currentTeamIDs.indexOf(parseInt(charMap.get(character))) // Get the index of the character
                                    var updateTeam = 'team.' + updateTeamIndex + ".id"
                                    var updateTeamBoolean = 'characters.' + charMap.get(character) + ".inTeam"
    
                                    await ids.updateOne({discord_id: discordID}, {
                                        $set: {
                                            [updateTeamBoolean]: false,
                                            [updateTeam]: -1
                                        }
                                    })
        
                                    testEmbed.spliceFields(0, 1,
                                        {
                                            name: "\n",
                                            value: `Removed **${character}** from your team`
                                        })
                    
                                    interaction.editReply({ embeds: [testEmbed] });
                                    await client.close()
                            }
                        }
                    }
                } else if ((interaction.options.get('add')) && (interaction.options.get('remove'))) { // Selected both => Remove first then add
                    testEmbed.spliceFields(0, 1,
                        {
                            name: "\n",
                            value: `Select only one option`
                        })
    
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