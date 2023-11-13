const { SlashCommandBuilder } = require('discord.js');
const CharacterAI = require('node_characterai');
const characterAI = new CharacterAI();

module.exports = {
    data: new SlashCommandBuilder()
    .setName('chat')
    //.setDescription('Chat with characters!'),
    .setDescription('TEST COMMAND')
    .addStringOption((option) => 
        option
            .setName("chat")
            .setDescription("Enter your first message")
            .setRequired(true)
    ),


    run: async ({ interaction, message }) => {

        try {
            await interaction.deferReply()
            message.channel.send("hi")
            await characterAI.authenticateAsGuest();
    
            const characterId = "RYdl1drUQGDft0dj7TMOgYVCZIz96gPFSGb8NT3dhCY"
    
            const chat = await characterAI.createOrContinueChat(characterId);
            const response = await chat.sendAndAwaitResponse(interaction.options.get('chat').value, true)
    
            const currentUser = message.author.id;
    
            message.channel.send("hi")
        } catch (error) {
            console.log(error)
            await interaction.editReply("broken")
        }
        
    }
    
}