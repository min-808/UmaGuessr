const { AttachmentBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'ranks',
    description: 'Shows the list of point ranks',

    run: async ({ message }) => {

        try {
            const embed = new EmbedBuilder()
                .setColor('LightGrey')
                .setTitle("Ranks")
                .addFields(
                    {
                        name: "\n",
                        value: `
<:g_rank:1437691349015986228> 0-99 points
<:f_rank:1437691358596042812> 100-499 points
<:e_rank:1437691365902516244> 500-999 points
<:d_rank:1437691373200478238> 1,000-4,999 points
<:c_rank:1437691381618311168> 5,000-9,999 points
<:b_rank:1437691389524574368> 10,000-19,999 points
<:a_rank:1437691397128851559> 20,000-49,999 points
<:s_rank:1437691404745707671> 50,000-99,999 points
<:ss_rank:1437691411939201054> 100,000-249,999 points
<:ug_rank:1437732889755389993> 250,000-299,999 points
<:uf_rank:1437732891319861258> 300,000-374,999 points
<:ue_rank:1437732958176936002> 375,000-474,999 points
<:ud_rank:1437732960362303549> 475,000-599,999 points
<:uc_rank:1437732961750618152> 600,000-749,999 points
<:ub_rank:1437732963147190334> 750,000-949,999 points
<:ua_rank:1437732965021913098> 950,000-1,199,999 points
<:us_rank:1437732966741839872> 1,200,000+ points
`
                    }
                )

            await message.channel.send({ embeds: [embed] })
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