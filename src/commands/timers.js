var { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
var { MongoClient } = require("mongodb");

const setup = require('../../firstinit');
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
                    }
                }

                // Then get the first thing that matches the discord id, and options is the query from before
                var toParseUserUID = await ids.findOne({discord_id: discordID}, options);
                var dailyTimer = toParseUserUID['daily_timer']
                var weeklyTimer = toParseUserUID['weekly_timer']
                var calyxTimer = toParseUserUID['calyx_timer']
                var TP = toParseUserUID['trailblaze_power']
                var MTP = toParseUserUID['max_trailblaze_power']

                if ((dailyTimer += 86_000_000) >= currentTime) {
                    var getDaily = `${((dailyTimer - currentTime) / (1000 * 60 * 60)).toFixed(1)} hours`
                } else {
                    var getDaily = "Claimable"
                }

                if ((weeklyTimer += 604_800_000) >= currentTime) {
                    var getWeekly = `${((weeklyTimer - currentTime) / (1000 * 60 * 60 * 24)).toFixed(1)} days`
                } else {
                    var getWeekly = "Claimable"
                }

                if ((calyxTimer += 7_200_000) >= currentTime) {
                    var getCalyx = `${((calyxTimer - currentTime) / (1000 * 60 * 60)).toFixed(1)} hours`
                } else {
                    var getCalyx = "Claimable"
                }

                if (TP < MTP) {
                    var difference = MTP - TP
                    var timeDiff = difference * 6

                    var getTP = `${(timeDiff / 60).toFixed(1)} hours`
                } else {
                    var getTP = "Trailblaze Power is Full"
                }

                
                testEmbed.spliceFields(0, 1,
                    {
                        name: "\n",
                        value: `**Timers**\n
**Weekly** - ${getWeekly}
**Daily** - ${getDaily}
**Calyx** - ${getCalyx}

**Full Trailblaze Power** - ${getTP}`
                    })

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