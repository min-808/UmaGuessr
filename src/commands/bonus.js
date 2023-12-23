var { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
var { MongoClient } = require("mongodb");

const setup = require('../../firstinit');

var uri = "mongodb+srv://min:" + process.env.MONGODB_PASS + "@discord-seele.u4g75ks.mongodb.net/"

module.exports = {
    data: new SlashCommandBuilder()
    .setName('bonus')
    .setDescription('Get a one-time bonus of 5000 stellar jade!'),

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
                var discordID = parseInt(interaction.user.id)

                // Check how many documents are in the query (discord_id)
                var counter = await ids.countDocuments({discord_id: discordID})

                // If document found, get the hsr_id (set to 1, and id set to 0)
                if (counter < 1) {
                    // If document not found, make a new database entry, do this for all economy commands
                    await setup.init(discordID, "economy", "inventories")
                }

                const addJade = {
                    $inc: {
                        jade_count: 5000
                    }
                }

                const setTrue = {
                    $set : {
                        bonus_claimed: true
                    }
                }

                var broadSearch = await ids.findOne({ discord_id: discordID })
                var claimed = broadSearch["bonus_claimed"]

                if (claimed) {
                    testEmbed.spliceFields(0, 1,
                        {
                            name: "\n",
                            value: `You already claimed the bonus!`
                    })
                } else {
                    await ids.updateOne({ discord_id: discordID }, addJade);
                    await ids.updateOne({ discord_id: discordID }, setTrue)
                    
                    testEmbed.spliceFields(0, 1,
                        {
                            name: "\n",
                            value: `You have claimed your one-time **5000 stellar jade** bonus!`
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