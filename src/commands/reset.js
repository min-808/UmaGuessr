var { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
var { MongoClient } = require("mongodb");
const missionSheet = require('../../src/assets/missions.json')

var myID = "236186510326628353"

var uri = "mongodb+srv://min:" + process.env.MONGODB_PASS + "@discord-seele.u4g75ks.mongodb.net/"

module.exports = {
    data: new SlashCommandBuilder()
    .setName('reset')
    .setDescription('admin command'),

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
                var discordID = String(interaction.user.id)
                
                if (discordID != myID) {
                    testEmbed.spliceFields(0, 1,
                        {
                            name: "\n",
                            value: `you can't do this`
                        })

                } else {

                var currentDate = new Date()
                var currentTime = currentDate.toLocaleTimeString('en-US')

                console.log(`[${currentTime}] - Resetting daily missions...`)

                // Randomize missions

                var missions = []

                while (missions.length < 5) {
                    var randomNum = Math.floor(Math.random() * Object.keys(missionSheet).length) // Grabs a random id
                    if (missions.indexOf(randomNum) == -1) { // Ensures uniqueness
                        missions.push(randomNum)
                    }
                }

                const update = {
                    $set: {
                        'missions': [
                            { 
                                "id": missionSheet[missions[0]]['id'],
                                "description": missionSheet[missions[0]]['description'],
                                "reward": 75,
                                "completed": false,
                                "completed_symbol": "❌"
                            },
                            { 
                                "id": missionSheet[missions[1]]['id'],
                                "description": missionSheet[missions[1]]['description'],
                                "reward": 75,
                                "completed": false,
                                "completed_symbol": "❌"
                            },
                            { 
                                "id": missionSheet[missions[2]]['id'],
                                "description": missionSheet[missions[2]]['description'],
                                "reward": 75,
                                "completed": false,
                                "completed_symbol": "❌"
                            },
                            { 
                                "id": missionSheet[missions[3]]['id'],
                                "description": missionSheet[missions[3]]['description'],
                                "reward": 75,
                                "completed": false,
                                "completed_symbol": "❌"
                            },
                            { 
                                "id": missionSheet[missions[4]]['id'],
                                "description": missionSheet[missions[4]]['description'],
                                "reward": 75,
                                "completed": false,
                                "completed_symbol": "❌"
                            },
                        ],
                        missions_completed: false,
                        trailblaze_power_used_today: 0,
                        missions_claimed: false,
                    }

                }

                await ids.updateMany({}, update)

                    testEmbed.spliceFields(0, 1, {
                        name: "\n",
                        value: `done`
                    })
                }
                    
                interaction.editReply({ embeds: [testEmbed] });
                await client.close()
            } catch (error) {
                console.log(`There was an error: ${error.stack}`)
                interaction.editReply({ content: "Something broke!"})
                await client.close()
            }
        })();
    }
}