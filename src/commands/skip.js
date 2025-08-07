const gameState = require('../../path/to/your/gameState'); // update this path to match your actual file

module.exports = {
    name: 'skip',
    description: 'Skips the current Uma Musume round.',
    run: async ({ message }) => {
        const guildId = message.guild?.id;

        if (!guildId) {
            return message.reply("This command can only be used in a server.");
        }

        const game = gameState.get(guildId);

        if (!game) {
            return message.reply("There is no active Uma to skip!");
        }

        // Optionally add a permission check here (e.g., only mods can skip)
        // if (!message.member.permissions.has('MANAGE_MESSAGES')) return message.reply("You don't have permission to skip!");

        // End current round
        gameState.delete(guildId);

        await message.channel.send("⏭️ The current Uma has been skipped! You can start a new one with `!uma`.");
    }
};
