var { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
var { MongoClient } = require("mongodb");

const setup = require('../../firstinit');

var uri = "mongodb+srv://min:" + process.env.MONGODB_PASS + "@discord-seele.u4g75ks.mongodb.net/"

module.exports = {
    data: new SlashCommandBuilder()
    .setName('uptime')
    .setDescription('Get bot uptime'),

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
                var ids = database.collection("uptime")

                // Check how many documents are in the query (discord_id)

                var options = {
                    projection: {
                        time: 1
                    }
                }

                // Then get the first thing that matches the discord id, and options is the query from before
                var toParseUserUID = await ids.findOne({}, options);
                var getOldTime = toParseUserUID['time']

                var getNewTime = Date.now()
                
                testEmbed.spliceFields(0, 1,
                    {
                        name: "\n",
                        value: `The bot has been up for **${((getNewTime - getOldTime) / (1000 * 60 * 60)).toFixed(1)}** hours`
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