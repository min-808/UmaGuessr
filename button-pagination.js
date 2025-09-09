const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');

module.exports = async (source, pages, time = 75 * 1000) => {
    try {
        if (!source || !Array.isArray(pages) || pages.length === 0)
            throw new Error("invalid arguments");

        const edit = async (content) => { // helper function. can be either message or interaction
            if (source.editReply) { // interaction
                return await source.editReply(content);
            } else if (source.edit) { // message
                return await source.edit(content);
            } else {
                throw new Error("Invalid source for pagination");
            }
        };

        if (pages.length === 1) {
            return await edit({
                embeds: [pages[index].embed],
                components: [],
                content: null,
                ...(pages[index].file ? { files: [{ attachment: pages[index].file }] } : {})
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

        const msg = await edit({
            embeds: [pages[index].embed],
            components: [row],
            content: null,
            fetchReply: true,
            ...(pages[index].file ? { files: [{ attachment: pages[index].file }] } : {})
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

            await edit({
                embeds: [pages[index].embed],
                components: [row],
                ...(pages[index].file ? { files: [{ attachment: pages[index].file }] } : {})
            });

            collector.resetTimer();
        });

        collector.on('end', async () => {
            await edit({
                embeds: [pages[index].embed],
                components: [],
                ...(pages[index].file ? { files: [{ attachment: pages[index].file }] } : {})
            });
        });
    } catch (e) {
        console.log(e);
    }
};