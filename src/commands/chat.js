const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const CharacterAI = require('node_characterai');
const characterAI = new CharacterAI();

const fs = require('node:fs')

var currentlyInConversation = 0
var checkInstances = []

module.exports = {
    data: new SlashCommandBuilder()
    .setName('chat')
    .setDescription('Chat with character.ai characters! (prone to crashing!)')
    .addStringOption((option) => 
        option
            .setName("character")
            .setDescription("Enter the character you want to chat with")
            .setRequired(true)
    ),


    run: async ({ interaction }) => {

        try {

            await interaction.deferReply()

            if (!checkInstances.includes(interaction.user.id)) {
                var char = interaction.options.get("character").value
    
                var testEmbed = new EmbedBuilder()
                .setColor(0x9a7ee7)
                .addFields(
                    {
                        name: "\n",
                        value: "\n"
                    },
                )
    
                if (!characterAI.isAuthenticated()) { // So multiple people can chat with the bot
                    await characterAI.authenticateWithToken(process.env.SESSION_TOKEN)
                }
    
                var findChar = await characterAI.searchCharacters(char)
                var getID = findChar["characters"][0]['external_id']
                var getName = findChar["characters"][0]['participant__name']
                var getDesc = findChar["characters"][0]['title']
                var getFile = findChar["characters"][0]['avatar_file_name']

                if (getDesc == "") {
                    getDesc = findChar["characters"][0]['title']
                } else {
                    getDesc = `*${findChar["characters"][0]['title']}*\n`
                }
    
                console.log(`${interaction.user.username} is chatting with ${getName}`)
                console.log("Num interactions: " + findChar["characters"][0]["participant__num_interactions"])
                console.log("Score: " + findChar["characters"][0]["search_score"])
    
                const chat = await characterAI.createOrContinueChat(getID);
                chat.saveAndStartNewChat() // So the personalities reset everytime hopefully
    
                currentlyInConversation++
                console.log(currentlyInConversation)

                checkInstances.push(interaction.user.id)
    
                testEmbed.spliceFields(0, 1, {
                    name: "\n", value: `You are now chatting with **${getName}**\n${getDesc}\nThe chat will stay open for 40 minutes or until you type \`end\`\n\nSend your first message`
                })
                testEmbed.setThumbnail(`https://characterai.io/i/80/static/avatars/${getFile}`)
    
                interaction.editReply({ embeds: [testEmbed] })
                
    
                const collector = interaction.channel.createMessageCollector({ // Fix when you delete the message, since the reply can't go through
                    filter: (message) =>
                        message.author.id === interaction.user.id && message.channelId === interaction.channelId, // Only the person who started the chat can talk with them
                        time: 2_400_000 // 40min
                })
    
                collector.on('collect', async (message) => {
                    if (message.content == `end` || message.content == `End`) {
                        collector.stop()
                    } else {
                        const response = await chat.sendAndAwaitResponse(message.content, true);
                        message.reply(response.text)
                    }
                })
                
                collector.on('end', () => {
                    currentlyInConversation--
                    checkInstances = checkInstances.filter(item => item !== interaction.user.id)
                    console.log(currentlyInConversation)
                    if (currentlyInConversation == 0) {
                        characterAI.unauthenticate() // Ends the session for everyone if no one's chatting anymore
                    }
                    interaction.channel.send(
                        `${interaction.user}'s chat with **${getName}** has ended`
                    )
                })
            } else {
                console.log("no")
                interaction.editReply("You can only talk to one character at a time!\nEnd your current conversation to talk to a new character")
            }
        } catch (error) {
            console.log(error.stack)
            await interaction.editReply("Could not find character, or something broke. Something probably broke lmk :(")
        }
        
    }
    
}