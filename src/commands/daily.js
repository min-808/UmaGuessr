var { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
var { MongoClient } = require("mongodb");

const setup = require('../../firstinit');

var uri = "mongodb+srv://min:" + process.env.MONGODB_PASS + "@discord-seele.u4g75ks.mongodb.net/"

module.exports = {
    data: new SlashCommandBuilder()
    .setName('daily')
    .setDescription('Claim your daily stellar jades!'),

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
                // console.log(currentTime)

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
                        jade_count: 1,
                        daily_timer: 1,
                        bonus_claimed: 1,
                    }
                }

                // Then get the first thing that matches the discord id, and options is the query from before
                var toParseUserUID = await ids.findOne({discord_id: discordID}, options);
                // Then find the thing called hsr_id
                var currentAmount = toParseUserUID['jade_count']
                var pastTime = toParseUserUID['daily_timer']
                var displayHint = !toParseUserUID['bonus_claimed']
                
                // If you can't claim daily yet
                if ((pastTime += 86400000) >= currentTime) {
                    testEmbed.spliceFields(0, 1,
                        {
                            name: "\n",
                            value: `You can claim again in **${((pastTime - currentTime) / (1000 * 60 * 60)).toFixed(1)} hours**`
                        })

                } else { // You can claim
                    const updateValues = {
                        $set: {
                            jade_count: currentAmount += 1000,
                            daily_timer: currentTime
                        }
                    }

                    await ids.updateOne({discord_id: discordID}, updateValues)

                    testEmbed.spliceFields(0, 1, {
                        name: "\n",
                        value: `**You have claimed your daily 1000 jades!**`
                    })

                    testEmbed.setTimestamp();

                    if (displayHint) {
                        testEmbed.setFooter({text: "Get an extra 5000 jades with /bonus"})
                    } else {
                        testEmbed.setFooter({text: "You can claim again in 24 hours"})
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