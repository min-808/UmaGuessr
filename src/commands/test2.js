const { ChannelType } = require("discord.js");
const { MongoClient } = require("mongodb");

var uri = "mongodb+srv://min:" + process.env.MONGODB_PASS + "@discord-seele.u4g75ks.mongodb.net/"

const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'test2',
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
          var client_db = new MongoClient(uri)
          const db = client_db.db("uma");
          const collection = db.collection("stats");

          const adminUser = await client.users.fetch("236186510326628353");
          const dmChannel = await adminUser.createDM();

          let lastId;
          let allMessages = [];

          // Fetch all messages in DM (paginated)
          while (true) {
            const options = { limit: 100 };
            if (lastId) options.before = lastId;

            const messages = await dmChannel.messages.fetch(options);
            if (messages.size === 0) break;

            allMessages = allMessages.concat(Array.from(messages.values()));
            lastId = messages.last().id;
          }

          // Oldest → newest
          allMessages = allMessages.reverse();

          // Process each message
          for (const msg of allMessages) {
            const match = msg.content.match(/^User (\S+) has registered/i);
            if (!match) continue;

            const rawUsername = match[1];
            const username = rawUsername.replace(/\*+/g, ""); // remove any asterisks
            const signupDate = msg.createdAt.toISOString();

            console.log(`Found registration: ${username} at ${signupDate}`);

            //await collection.updateOne(
              //{ username: username },
              //{ $set: { signup: signupDate } }
            //);
          }
            } catch (err) {
              console.error(err);
                embed.spliceFields(0, 1,
                    {
                        name: "\n",
                        value: `error`
                    })
            } finally {
               // await client_db.close();

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
            console.log(error) // log error

        }
    }
}