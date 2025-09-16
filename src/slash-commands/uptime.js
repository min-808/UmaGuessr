var { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const { MongoClient } = require('mongodb');

var uri = "mongodb+srv://min:" + process.env.MONGODB_PASS + "@discord-seele.u4g75ks.mongodb.net/"

module.exports = {
    name: 'uptime',
    description: 'Get bot uptime',
    data: new SlashCommandBuilder()
        .setName('uptime')
        .setDescription('Get bot uptime'),

    run: async ({ interaction }) => {

        var embed = new EmbedBuilder()
            .setColor('LightGrey')
            .setTitle('Uptime')
            .addFields(
                {
                    name: "\n",
                    value: "\n"
                },
            )

        try {
            await interaction.deferReply()

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

            var writeTime;

            let sec = Math.floor((getNewTime - getOldTime) / (1000))
            let mins = Math.floor((getNewTime - getOldTime) / (1000 * 60))
            let hours = Math.floor((getNewTime - getOldTime) / (1000 * 60 * 60))
            let days = Math.floor((getNewTime - getOldTime) / (1000 * 60 * 60 * 24))

            if ((getNewTime - getOldTime) < 60_000) { // Seconds -> Minutes -> Hours -> Days
                writeTime = `${sec.toFixed(0)} seconds`
            } else if ((getNewTime - getOldTime) < 3_600_000) {
                writeTime = `${mins.toFixed(0)} minutes and ${(sec - (mins * 60)).toFixed(0)} seconds`
            } else if ((getNewTime - getOldTime) < 86_400_000) {
                writeTime = `${hours.toFixed(0)} hours, ${(mins - (hours * 60)).toFixed(0)} minutes, and ${(sec - (mins * 60)).toFixed(0)} seconds`
            } else {
                writeTime = `${days.toFixed(0)} days and ${(hours - (days * 24)).toFixed(0)} hours`
            }
            
            embed.spliceFields(0, 1,
                {
                    name: "\n",
                    value: `The bot has been up for **${writeTime}**`
                })

            await interaction.editReply({ embeds: [embed] });
            await client.close()

        } catch (error) {
            const msg = error?.message || String(error);
            console.error("Main uma error:", msg);

            // Send ephemeral fallback safely
            try {
                if (interaction.deferred || interaction.replied) {
                    await interaction.editReply(`Unable to send message: **${msg}**`);
                } else {
                    await interaction.reply({ content: `Unable to send message: **${msg}**`, flags: 64 });
                }
            } catch (sendErr) {
                console.error("Unable to send error message:", sendErr?.message || sendErr);
            }
        }
    }
}