var { MongoClient } = require("mongodb");

var uri = "mongodb+srv://min:" + process.env.MONGODB_PASS + "@discord-seele.u4g75ks.mongodb.net/"

const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'addfields',
    description: 'admin command',
    
    run: async ({ message, client }) => {

      try {
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

            const user = message.author;
            var discordID = BigInt(user.id)

            const response = await fetch(`https://discord.com/api/v10/users/${discordID}`, {
                headers: {
                    'Authorization': 'Bot ' + process.env.TOKEN
                }
            });

            const parse = await response.json();

            let returnedUsername = String(parse?.username ?? 'Unknown');
            let returnedDiscriminator = String(parse?.discriminator ?? 'Unknown')

            if (returnedDiscriminator === "0") {
              returnedDiscriminator = "";
            }

              const result = await ids.updateMany(
                { }, // match all documents
                {
                  $set: {
                    vote_timer: 0
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

              embed.setThumbnail(`attachment://${badImg}.png`)
                embed.spliceFields(0, 1,
                    {
                        name: "\n",
                        value: `error`
                    })
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

      } catch (error) {
            console.log(error.rawError.message) // log error

            try {
                await message.channel.send(`Unable to send embed: **${error.rawError.message}**\n\nPlease check the bot's permissions and try again`)
            } catch (error) {
                console.log(`Unable to send message: ${error.rawError.message}`)
            }
        }
    }
}