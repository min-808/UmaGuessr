const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require("discord.js");

const img = "ranks"

module.exports = {
    name: 'ranks',
    description: 'Shows the list of point ranks',

    data: new SlashCommandBuilder()
        .setName('ranks')
        .setDescription('Replies with all the ranks'),

    run: async ({ interaction }) => {
        var file = new AttachmentBuilder(`src/assets/command_images/${img}.png`);

        try {
            await interaction.deferReply()

            const embed = new EmbedBuilder()
                .setColor('LightGrey')
                .setTitle("Ranks")
                .setThumbnail(`attachment://${img}.png`)
                .addFields(
                    {
                        name: "\n",
                        value: `
<:g_rank:1438093909648474162> 0-99 points
<:f_rank:1438093911284519013> 100-499 points
<:e_rank:1438093913331208232> 500-999 points
<:d_rank:1438093914564464670> 1,000-4,999 points
<:c_rank:1438093915939930152> 5,000-9,999 points
<:b_rank:1438093918276419584> 10,000-19,999 points
<:a_rank:1438093920079970415> 20,000-49,999 points
<:s_rank:1438093922030190622> 50,000-99,999 points
<:ss_rank:1438093923896786975> 100,000-249,999 points
<:ug_rank:1438093925113008138> 250,000-299,999 points
<:uf_rank:1438093926639861770> 300,000-374,999 points
<:ue_rank:1438093928560721980> 375,000-474,999 points
<:ud_rank:1438093930314072084> 475,000-599,999 points
<:uc_rank:1438093932671139901> 600,000-749,999 points
<:ub_rank:1438093934395133973> 750,000-949,999 points
<:ua_rank:1438093935300841534> 950,000-1,199,999 points
<:us_rank:1438093937419227156> 1,200,000+ points
`
                    }
                )

            await interaction.editReply({ embeds: [embed], files: [file] })
        } catch (error) {
            const msg = error?.rawError?.message || error?.message || String(error);
            console.error("Main uma error:", msg);

            // Send ephemeral fallback safely
            try {
                if (interaction.deferred || interaction.replied) {
                    await interaction.editReply(`**Unable to send embed**\n\nPlease check the bot's permissions and try again`);
                } else {
                    await interaction.reply({ content: `**Unable to send embed**\n\nPlease check the bot's permissions and try again`, flags: 64 });
                }
            } catch (sendErr) {
                console.error("Unable to send error message:", sendErr?.message || sendErr);
            }
        }
    }
}