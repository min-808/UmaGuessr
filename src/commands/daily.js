var { SlashCommandBuilder, AttachmentBuilder, EmbedBuilder } = require('discord.js');
var { MongoClient } = require("mongodb");

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
            .setFooter({ text: "You can claim again in 24 hours" })

            try {
                var currentTime = Date.now();
                // console.log(currentTime)

                var client = new MongoClient(uri)

                var database = client.db("economy");
                var ids = database.collection("stellar jades")
                var discordID = parseInt(interaction.user.id)

                // Check how many documents are in the query (discord_id)
                var counter = await ids.countDocuments({discord_id: discordID})

                // If document found, get the hsr_id (set to 1, and id set to 0)
                if (counter >= 1) {

                    var options = {
                        projection: {
                            _id: 0,
                            amount: 1,
                            dailytimer: 1
                        }
                    }

                    // Then get the first thing that matches the discord id, and options is the query from before
                    var toParseUserUID = await ids.findOne({discord_id: discordID}, options);
                    // Then find the thing called hsr_id
                    var currentAmount = toParseUserUID['amount']
                    var pastTime = toParseUserUID['dailytimer']
                    
                    // If you can't claim daily yet
                    if ((pastTime += 86400000) >= currentTime) {
                        testEmbed.spliceFields(0, 1,
                            {
                                name: "\n",
                                value: `You can't claim daily right now`
                            })

                        testEmbed.setFooter({ text: "\n" })

                    } else { // You can claim
                        
                        // Update entries
                        const updateValues = {
                            $set: {
                                amount: currentAmount += 500,
                                dailytimer: currentTime
                            }
                        }

                        await ids.updateOne({discord_id: discordID}, updateValues)

                        // Get the new value
                        var toParseUserUID = await ids.findOne({discord_id: discordID}, options);
                        var updatedAmount = toParseUserUID['amount']

                        testEmbed.spliceFields(0, 1, {
                            name: "\n",
                            value: `**You have successfully claimed your daily 500 jades!** ${updatedAmount}`
                        })

                        testEmbed.setTimestamp();
                    }
                        
                    interaction.editReply({ embeds: [testEmbed] });
                    await client.close()

                } else {
                    // If document not found, make a new database entry, do this for all economy commands

                    // Outline of new database entry
                    const doc = {
                        discord_id: parseInt(discordID),
                        amount: 0,
                        dailytimer: 0,
                        hourlytimer: 0,
                        assignmenttimer: 0,
                        maxassignments: 1
                    }

                    const result = await ids.insertOne(doc);
                    console.log(`A new entry was inserted with the _id: ${result.insertedId}`);
                    
                    // Up to here is default for every economy command, further on is command-specific
                    
                    const updateValues = {
                        $set: {
                            amount: 500,
                            dailytimer: currentTime
                        }
                    }

                    await ids.updateOne({discord_id: discordID}, updateValues)

                    // Get the new value
                    var toParseUserUID = await ids.findOne({discord_id: discordID}, options);
                    var updatedAmount = toParseUserUID['amount']

                    testEmbed.spliceFields(0, 1, {
                        name: "\n",
                        value: `**You have successfully claimed your daily 500 jades!**`
                    })

                    testEmbed.setTimestamp();
                    
                    interaction.editReply({ embeds: [testEmbed] });
                    await client.close()
                }

                } catch (error) {
                    console.log(`There was an error: ${error}`)
                    interaction.editReply({ content: "Something broke!"})
                    await client.close()
            }
        })();
    }
}