const { AttachmentBuilder, EmbedBuilder, SlashCommandBuilder } = require('discord.js')
const { getMongoClient } = require('../connect-db.js');

const setup = require('../../firstinit');

const { gameState, activeChannels } = require('../commands/uma.js');

module.exports = {
    name: 'skip',
    aliases: ['s'],
    description: 'Skip the current uma and end the game',

    data: new SlashCommandBuilder()
        .setName('skip')
        .setDescription('Skip the current uma and end the game'),
    
    run: async ({ interaction }) => {

        const originDir = path.join(__dirname, "../assets/guessing")

        try {
            await interaction.deferReply()

            var client_db = new getMongoClient()
            var database = client_db.db("uma")
            var ids = database.collection("profiles")
            var discordID = BigInt(interaction.user.id)

            const count = await ids.countDocuments({ discord_id: discordID });
            if (count < 1) await setup.init(discordID, "uma", "profiles", client);

            var logChannel = await client.channels.fetch(process.env.UMA_LOG_CHANNEL)

            const state = gameState.get(sentMsg.id); // CURRENTLY ON THE PROBLEM OF LOCATING SENTMSG.ID. I PROBABLY GOTTA PUT IT IN THE GAMESTATE, BUT HOW IS IT GONNA GRAB SENT MSG ID? ALSO MAKE SURE TO UPDATE THE GAMESTATE INTHE PREFIX OCMMAND
            if (!state) return;

            if (interaction.user.id == state.author) { // Check if slash command issuer is the same as game starter
                state.messageCollector.stop()
                state.collector.stop()

            }

            try {
                if (logChannel) {
                    await logChannel.send(`(${d.toLocaleString("en-US", { timeZone: "Pacific/Honolulu", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true } )}): ${data["username"]} - ${umaProper} (${type}/${data["type"]}/${interaction.options.getString('region') ?? 'no args'}) - Skipped with ${state.hintsUsed} hints, ${(Date.now() - state.startTime) / 1000} sec, 0/${initialPointsJP} points **(slash command)**`)
                }
            } catch (err) {
                console.error("Log channel fetch/send error:", err);

                gameState.delete(sentMsg.id);
                activeChannels.delete(channelID);
                return;
            }

            console.log(`(${d.toLocaleString("en-US", { timeZone: "Pacific/Honolulu", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true } )}): ${data["username"]} - ${umaProper} (${type}/${data["type"]}/${interaction.options.getString('region') ?? 'no args'}) - Skipped with ${state.hintsUsed} hints, ${(Date.now() - state.startTime) / 1000} sec, 0/${initialPointsJP} points **(slash command)**`)

            gameState.delete(sentMsg.id);
            activeChannels.delete(channelID);

            await ids.updateOne({ discord_id: discordID }, { // Remove streak if author skipped
                $set: {
                    streak: 0,
                }
            });

            try {
                var imagePath = path.join(originDir, `${state.chooseImg}`);
                var file = new AttachmentBuilder(fs.readFileSync(imagePath), { name: 'skipped.jpg' })
            } catch (err) {
                await interaction.editReply('There was an error with the image. Skipped');
                console.error('Image file error:', err);

                gameState.delete(sentMsg.id);
                activeChannels.delete(channelID);
                return;
            }

            const skippedEmbed = EmbedBuilder.from(sentMsg.embeds[0])
                .setImage('attachment://skipped.jpg')
                .setFooter({ text: `Skipped! The correct answer was ${state.proper}` });

            await sentMsg.channel.send(`Skipped, the answer was **${state.proper}**`);

            await sentMsg.edit({
                embeds: [skippedEmbed],
                files: [file],
                components: []
            });

            return

            let embed = new EmbedBuilder()
                            .setColor('LightGrey')
                            .setTitle("Vote")
                            .setThumbnail(`attachment://${img}.png`)

            embed.addFields({ name: "\n", value: "hi "})
            
            await interaction.editReply({ embeds: [embed], files: [file] });
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