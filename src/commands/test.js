var { MongoClient } = require("mongodb");
const { EmbedBuilder, AttachmentBuilder } = require('discord.js')
const path = require('path');

var uri = "mongodb+srv://min:" + process.env.MONGODB_PASS + "@discord-seele.u4g75ks.mongodb.net/"

module.exports = {
    name: 'test',
    description: 'admin command',
    
    run: async ({ message, client }) => {

      try {
          let embed;

      if (message.author.id == "236186510326628353") {
        var client_db = new MongoClient(uri)
        var database = client_db.db("uma");
        var ids = database.collection("stats")

        const user = message.author;
        var discordID = BigInt(user.id)

        var broadSearch = await ids.findOne({ discord_id: discordID })
        strictType = broadSearch["strict"]
      
        embed = new EmbedBuilder()
            .setColor('LightGrey')
            .setTitle("test - admin")
            .addFields(
                {
                    name: "\n",
                    value: 
                    `prefix on db: ${strictType}\nprefix on cache: ${client.strictCache.get(discordID)}`
                },
              )
            await message.channel.send({ embeds: [embed] });
          } else {
          embed = new EmbedBuilder()
            .setColor('LightGrey')
            .setTitle("addfields - admin")
            .addFields(
                {
                    name: "\n",
                    value: 
                    "you can't do this"
                },
            )

            await message.channel.send({ embeds: [embed] });
      }
      } catch (error) {
            const msg = error?.rawError?.message || error?.message || String(error);
            console.error("Main uma error:", msg);

            try {
                await message.channel.send(
                    `**Unable to send embed**\n\nPlease check the bot's permissions and try again`
                );
            } catch (sendErr) {
                console.error("Unable to send error message:", sendErr?.message || sendErr);
            }
        }
    }
}