const { SlashCommandBuilder } = require('discord.js');
const { MongoClient } = require("mongodb");

const uri = "mongodb+srv://min:" + process.env.MONGODB_PASS + "@discord-seele.u4g75ks.mongodb.net/"

module.exports = {
    data: new SlashCommandBuilder()
    .setName('register')
    .setDescription('Assigns your Star Rail UID with your Discord')
    .addNumberOption((option) => 
        option
            .setName("uid")
            .setDescription("Enter your Star Rail UID")
            .setRequired(true)
    ),

    run: async ({ interaction }) => {

        await interaction.deferReply()

        try {
            const client = new MongoClient(uri)

            const database = client.db("registration");
            const ids = database.collection("ids")

            const userUID = interaction.options.get('uid').value

            const date = new Date();

            // Old "https://api.mihomo.me/sr_info/" + userUID + "?lang=en"
            // Enka "https://enka.network/api/hsr/uid/" + userUID

            const res = await fetch("https://enka.network/api/hsr/uid/" + userUID);
                if (res.ok) {
                    const data = await res.json();
                    var username = String(data?.["detailInfo"]?.['nickname'])
                    var discordID = BigInt(interaction.user.id)
                    var discordUser = interaction.user.username

                    const counter = await ids.countDocuments({discord_id: discordID})
                    if (counter >= 1) { // Update old entry
                        interaction.editReply(`**${discordUser}** has been updated to **${username}**`)

                        const updateDoc = {
                            $set: {
                                hsr_id: userUID,
                                discord_user: discordUser
                            }
                        }

                        await ids.updateOne({discord_id: discordID}, updateDoc)

                        await client.close()

                        //console.log(discordUser)

                    } else { // Make a new entry
                        const doc = {
                            discord_id: BigInt(discordID),
                            hsr_id: userUID,
                            discord_user: discordUser,
                            date_added: `${date.getUTCFullYear()}-${date.getUTCMonth() + 1}-${date.getUTCDate()}`,
                            time_added: `${date.getUTCHours()}:${date.getUTCMinutes()}:${date.getUTCSeconds()}`
                        }
    
                        const result = await ids.insertOne(doc)
                        console.log(`A new entry was inserted with the _id: ${result.insertedId}`)
                        interaction.editReply(`**${discordUser}** has been set to **${username}**`)
                        await client.close();
                    }

                    
                } else {
                    interaction.editReply('Invalid UID!')
                    await client.close()
                }

        } catch (error) {
            interaction.editReply('Something broke! ' + error)
            await client.close()
        }

    }
    
}