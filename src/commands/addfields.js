var { MongoClient } = require("mongodb");

var uri = "mongodb+srv://min:" + process.env.MONGODB_PASS + "@discord-seele.u4g75ks.mongodb.net/"

const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'addfields',
    description: 'admin command',
    
    run: async ({ message }) => {

      let embed;

      if (message.author.id == "236186510326628353") {
        embed = new EmbedBuilder()
            .setColor('LightGrey')
            .setTitle("addfields - admin")
            .addFields(
                {
                    name: "\n",
                    value: 
                    "done"
                },
            )

          try {
            var client = new MongoClient(uri)
            var database = client.db("uma");
            var ids = database.collection("stats")

              const result = await ids.updateMany(
                {}, // match all documents
                {
                  $set: {
                    "daily_streak": 0,
                  }
                  /*
                  ,
                  $unset: {
                    "stats": ""
                  }
                  */
                }
              );

              console.log(`Updated ${result.modifiedCount} documents.`);
            } catch (err) {
              console.error(err);
            } finally {
              await client.close();

            }
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
      }

        await message.channel.send({ embeds: [embed] });
    }
}