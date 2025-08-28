module.exports = {
    name: 'ping',
    description: 'Replies with the bot ping',

    run: async ({ message }) => {

        try {
            const sent = await message.channel.send("Pinging...")
            const ping = sent.createdTimestamp - message.createdTimestamp

            sent.edit(`:ping_pong: ${ping}ms`)
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