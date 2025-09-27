module.exports = {
    name: 'ping',
    description: 'Replies with the bot ping',

    run: async ({ message }) => {

        try {
            const sent = await message.channel.send("Pinging...")
            const ping = sent.createdTimestamp - message.createdTimestamp

            sent.edit(`:ping_pong: ${ping}ms`)
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