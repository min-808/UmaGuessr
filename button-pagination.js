const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');

module.exports = async (message, pages, time = 60 * 1000) => {
    try {
        if (!message || !Array.isArray(pages) || pages.length === 0)
            throw new Error("invalid arguments");

        if (pages.length === 1) {
            return await message.edit({
                embeds: pages,
                components: [],
                content: null
            });
        }

        const front = new ButtonBuilder()
            .setCustomId('front')
            .setEmoji('⏮')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(true);

        const prev = new ButtonBuilder()
            .setCustomId('prev')
            .setEmoji('⬅')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(true);

        const next = new ButtonBuilder()
            .setCustomId('next')
            .setEmoji('➡️')
            .setStyle(ButtonStyle.Primary);

        const end = new ButtonBuilder()
            .setCustomId('end')
            .setEmoji('⏭')
            .setStyle(ButtonStyle.Primary);

        const row = new ActionRowBuilder().addComponents(front, prev, next, end);
        let index = 0;

        const msg = await message.edit({
            embeds: [pages[index]],
            components: [row],
            content: null,
            fetchReply: true
        });

        const collector = msg.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time
        });

        collector.on('collect', async (i) => {

            await i.deferUpdate();

            switch (i.customId) {
                case 'front':
                    index = 0;
                    break;
                case 'prev':
                    if (index > 0) index--;
                    break;
                case 'next':
                    if (index < pages.length - 1) index++;
                    break;
                case 'end':
                    index = pages.length - 1;
                    break;
            }

            front.setDisabled(index === 0);
            prev.setDisabled(index === 0);
            next.setDisabled(index === pages.length - 1);
            end.setDisabled(index === pages.length - 1);

            await msg.edit({
                embeds: [pages[index]],
                components: [row]
            });

            collector.resetTimer();
        });

        collector.on('end', async () => {
            await msg.edit({
                embeds: [pages[index]],
                components: []
            });
        });
    } catch (e) {
        console.log(e);
    }
};
