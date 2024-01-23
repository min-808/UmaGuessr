var { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
var { MongoClient } = require("mongodb");

const setup = require('../../firstinit');
const checkLevel = require('../../check-level');
const daily = require('./daily');

var uri = "mongodb+srv://min:" + process.env.MONGODB_PASS + "@discord-seele.u4g75ks.mongodb.net/"

module.exports = {
    data: new SlashCommandBuilder()
    .setName('timers')
    .setDescription('Check the remaining time left on your commands'),

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

                var currentTime = Date.now();

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
                        daily_timer: 1,
                        weekly_timer: 1,
                        calyx_timer: 1,
                        trailblaze_power: 1,
                        max_trailblaze_power: 1,
                        missions: 1,
                    }
                }

                // Then get the first thing that matches the discord id, and options is the query from before
                var toParseUserUID = await ids.findOne({discord_id: discordID}, options);
                var dailyTimer = toParseUserUID['daily_timer']
                var weeklyTimer = toParseUserUID['weekly_timer']
                var calyxTimer = toParseUserUID['calyx_timer']
                var TP = toParseUserUID['trailblaze_power']
                var MTP = toParseUserUID['max_trailblaze_power']

                var getMissions = toParseUserUID['missions']

                var addMissionID = []

                for (var i = 0; i < 5; i++) {
                    addMissionID.push(getMissions[i]["id"])
                }

                if ((addMissionID.includes(12)) && (getMissions[addMissionID.indexOf(12)]["completed"] == false)) { // id for timers mission
                    var mission = `missions.${addMissionID.indexOf(12)}.completed`
                    var missionSymbol = `missions.${addMissionID.indexOf(12)}.completed_symbol`

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

                if ((dailyTimer += 86_000_000) >= currentTime) {
                    var getDaily = `${Math.floor((dailyTimer - currentTime) / (1000 * 60 * 60)).toFixed(0)} hours, ${(((dailyTimer - currentTime) / 1000 / 60) % 60).toFixed(0)} minutes`
                } else {
                    var getDaily = "__Claimable__"
                }

                if ((weeklyTimer += 604_800_000) >= currentTime) {
                    var getWeekly = `${Math.floor((weeklyTimer - currentTime) / (1000 * 60 * 60 * 24)).toFixed(0)} days, ${Math.floor(((weeklyTimer - currentTime) / 1000 / 60 / 60) % 24).toFixed(0)} hours`
                } else {
                    var getWeekly = "__Claimable__"
                }

                if ((calyxTimer += 7_200_000) >= currentTime) {
                    var getCalyx = `${Math.floor((calyxTimer - currentTime) / (1000 * 60 * 60)).toFixed(0)} hour, ${(((calyxTimer - currentTime) / 1000 / 60) % 60).toFixed(0)} minutes`
                } else {
                    var getCalyx = "__Claimable__"
                }

                if (TP < MTP) {
                    var differenceMS = (MTP - TP) * 360000

                    var getTP = `${Math.floor((differenceMS) / (1000 * 60 * 60)).toFixed(0)} hours, ${(((differenceMS) / 1000 / 60) % 60).toFixed(0)} minutes`
                } else {
                    var getTP = "__Full__"
                }

                
                testEmbed.spliceFields(0, 1,
                    {
                        name: "\n",
                        value: `**Weekly** - ${getWeekly}
**Daily** - ${getDaily}
**Calyx** - ${getCalyx}

**Full Trailblaze Power** - ${getTP}`
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

                } catch (error) {
                    console.log(`There was an error: ${error.stack}`)
                    interaction.editReply({ content: "Something broke!"})
                    await client.close()
                }
        })();
    }
}