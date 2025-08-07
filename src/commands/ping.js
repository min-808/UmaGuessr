module.exports = {
    name: 'ping',
    description: 'Replies with the bot ping',

    run: async ({ message }) => {

        const sent = await message.channel.send("Pinging...")
        const ping = sent.createdTimestamp - message.createdTimestamp

        sent.edit(`:ping_pong: ${ping}ms`)
    }
    
}