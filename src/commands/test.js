var { MongoClient } = require("mongodb");

var uri = "mongodb+srv://min:" + process.env.MONGODB_PASS + "@discord-seele.u4g75ks.mongodb.net/"

const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'test',
    description: 'admin command',
    
    run: async ({ message, client }) => {

      try {
          let embed;

      if (message.author.id == "236186510326628353") {
        embed = new EmbedBuilder()
            .setColor('LightGrey')
            .setTitle("test - admin")
            .addFields(
                {
                    name: "\n",
                    value: 
                    "test"
                },
            )

          try {
              client.users.fetch('236186510326628353').then((user) => { user.send('hi') })
            } catch (err) {
              console.error(err);
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