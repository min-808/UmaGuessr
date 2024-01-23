var { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
var { MongoClient } = require("mongodb");

const setup = require('../../firstinit');
const checkLevel = require('../../check-level');

var uri = "mongodb+srv://min:" + process.env.MONGODB_PASS + "@discord-seele.u4g75ks.mongodb.net/"

module.exports = {
    data: new SlashCommandBuilder()
    .setName('weekly')
    .setDescription('Claim your weekly stellar jades!'),

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
                        weekly_timer: 1,
                        bonus_claimed: 1,
                    }
                }

                // Then get the first thing that matches the discord id, and options is the query from before
                var toParseUserUID = await ids.findOne({discord_id: discordID}, options);
                // Then find the thing called hsr_id
                var currentAmount = toParseUserUID['jade_count']
                var pastTime = toParseUserUID['weekly_timer']
                var displayHint = !toParseUserUID['bonus_claimed']
                
                // If you can't claim weekly yet
                if ((pastTime += 604_800_000) >= currentTime) {
                    testEmbed.spliceFields(0, 1,
                        {
                            name: "\n",
                            value: `You can claim again in **${((pastTime - currentTime) / (1000 * 60 * 60 * 24)).toFixed(1)} days**`
                        })

                } else { // You can claim
                    const updateValues = {
                        $inc: {
                            jade_count: 2000,
                            exp: 600,
                        },
                        $set: {
                            weekly_timer: currentTime
                        }
                    }

                    await ids.updateOne({discord_id: discordID}, updateValues)

                    testEmbed.spliceFields(0, 1, {
                        name: "\n",
                        value: `**You have claimed your weekly rewards!**\n
                        +**2000** Stellar Jade
                        +**600** Trailblaze EXP`
                    })

                    var levelSuccess = await checkLevel.checker(discordID, "economy", "inventories")

                    testEmbed.setTimestamp();

                    if (displayHint) {
                        testEmbed.setFooter({text: "Get an extra 5000 jades with /bonus"})
                    } else {
                        testEmbed.setFooter({text: "You can claim again in 7 days"})
                    }
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