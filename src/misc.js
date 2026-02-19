function returnRankedMessage(oldPoints, newPoints) {
    if (
        (oldPoints < 100 && newPoints >= 100) ||
        (oldPoints < 500 && newPoints >= 500) ||
        (oldPoints < 1000 && newPoints >= 1000) ||
        (oldPoints < 5000 && newPoints >= 5000) ||
        (oldPoints < 10000 && newPoints >= 10000) ||
        (oldPoints < 20000 && newPoints >= 20000) ||
        (oldPoints < 50000 && newPoints >= 50000) ||
        (oldPoints < 100000 && newPoints >= 100000) ||
        (oldPoints < 250000 && newPoints >= 250000) ||
        (oldPoints < 300000 && newPoints >= 300000) ||
        (oldPoints < 375000 && newPoints >= 375000) ||
        (oldPoints < 475000 && newPoints >= 475000) ||
        (oldPoints < 600000 && newPoints >= 600000) ||
        (oldPoints < 750000 && newPoints >= 750000) ||
        (oldPoints < 950000 && newPoints >= 950000) ||
        (oldPoints < 1200000 && newPoints >= 1200000)
    ) {

        let rankSymbol;
        let prevRankSymbol;

        switch (true) {
            case (newPoints < 100):
                prevRankSymbol = null
                rankSymbol = "<:g_rank:1438093909648474162>";
                return { rankSymbol, prevRankSymbol }
            case (newPoints < 500):
                prevRankSymbol = "<:g_rank:1438093909648474162>";
                rankSymbol = "<:f_rank:1438093911284519013>";
                return { rankSymbol, prevRankSymbol }
            case (newPoints < 1000):
                prevRankSymbol = "<:f_rank:1438093911284519013>";
                rankSymbol = "<:e_rank:1438093913331208232>";
                return { rankSymbol, prevRankSymbol }
            case (newPoints < 5000):
                prevRankSymbol = "<:e_rank:1438093913331208232>";
                rankSymbol = "<:d_rank:1438093914564464670>";
                return { rankSymbol, prevRankSymbol }
            case (newPoints < 10000):
                prevRankSymbol = "<:d_rank:1438093914564464670>";
                rankSymbol = "<:c_rank:1438093915939930152>";
                return { rankSymbol, prevRankSymbol }
            case (newPoints < 20000):
                prevRankSymbol = "<:c_rank:1438093915939930152>";
                rankSymbol = "<:b_rank:1438093918276419584>";
                return { rankSymbol, prevRankSymbol }
            case (newPoints < 50000):
                prevRankSymbol = "<:b_rank:1438093918276419584>";
                rankSymbol = "<:a_rank:1438093920079970415>";
                return { rankSymbol, prevRankSymbol }
            case (newPoints < 100000):
                prevRankSymbol = "<:a_rank:1438093920079970415>";
                rankSymbol = "<:s_rank:1438093922030190622>";
                return { rankSymbol, prevRankSymbol }
            case (newPoints < 250000):
                prevRankSymbol = "<:s_rank:1438093922030190622>";
                rankSymbol = "<:ss_rank:1438093923896786975>";
                return { rankSymbol, prevRankSymbol }
            case (newPoints < 300000):
                prevRankSymbol = "<:ss_rank:1438093923896786975>";
                rankSymbol = "<:ug_rank:1438093925113008138>";
                return { rankSymbol, prevRankSymbol }
            case (newPoints < 375000):
                prevRankSymbol = "<:ug_rank:1438093925113008138>";
                rankSymbol = "<:uf_rank:1438093926639861770>";
                return { rankSymbol, prevRankSymbol }
            case (newPoints < 475000):
                prevRankSymbol = "<:uf_rank:1438093926639861770>";
                rankSymbol = "<:ue_rank:1438093928560721980>";
                return { rankSymbol, prevRankSymbol }
            case (newPoints < 600000):
                prevRankSymbol = "<:ue_rank:1438093928560721980>";
                rankSymbol = "<:ud_rank:1438093930314072084>";
                return { rankSymbol, prevRankSymbol }
            case (newPoints < 750000):
                prevRankSymbol = "<:ud_rank:1438093930314072084>";
                rankSymbol = "<:uc_rank:1438093932671139901>";
                return { rankSymbol, prevRankSymbol }
            case (newPoints < 950000):
                prevRankSymbol = "<:uc_rank:1438093932671139901>";
                rankSymbol = "<:ub_rank:1438093934395133973>";
                return { rankSymbol, prevRankSymbol }
            case (newPoints < 1200000):
                prevRankSymbol = "<:ub_rank:1438093934395133973>";
                rankSymbol = "<:ua_rank:1438093935300841534>";
                return { rankSymbol, prevRankSymbol }
            default:
                prevRankSymbol = "<:ua_rank:1438093935300841534>";
                rankSymbol = "<:us_rank:1438093937419227156>";
                return { rankSymbol, prevRankSymbol }
        }
    } else {
        return { rankSymbol: null, prevRankSymbol: null }
    }
}

function returnRankedEmote(displayValue) {
    let rankSymbol

    switch (true) {
        case (displayValue < 100):
            rankSymbol = "<:g_rank:1438093909648474162>";
            break;
        case (displayValue < 500):
            rankSymbol = "<:f_rank:1438093911284519013>";
            break;
        case (displayValue < 1000):
            rankSymbol = "<:e_rank:1438093913331208232>";
            break;
        case (displayValue < 5000):
            rankSymbol = "<:d_rank:1438093914564464670>";
            break;
        case (displayValue < 10000):
            rankSymbol = "<:c_rank:1438093915939930152>";
            break;
        case (displayValue < 20000):
            rankSymbol = "<:b_rank:1438093918276419584>";
            break;
        case (displayValue < 50000):
            rankSymbol = "<:a_rank:1438093920079970415>";
            break;
        case (displayValue < 100000):
            rankSymbol = "<:s_rank:1438093922030190622>";
            break;
        case (displayValue < 250000):
            rankSymbol = "<:ss_rank:1438093923896786975>";
            break;
        case (displayValue < 300000):
            rankSymbol = "<:ug_rank:1438093925113008138>";
            break;
        case (displayValue < 375000):
            rankSymbol = "<:uf_rank:1438093926639861770>";
            break;
        case (displayValue < 475000):
            rankSymbol = "<:ue_rank:1438093928560721980>";
            break;
        case (displayValue < 600000):
            rankSymbol = "<:ud_rank:1438093930314072084>";
            break;
        case (displayValue < 750000):
            rankSymbol = "<:uc_rank:1438093932671139901>";
            break;
        case (displayValue < 950000):
            rankSymbol = "<:ub_rank:1438093934395133973>";
            break;
        case (displayValue < 1200000):
            rankSymbol = "<:ua_rank:1438093935300841534>";
            break;
        default:
            rankSymbol = "<:us_rank:1438093937419227156>";
            break;
    }

    return rankSymbol
}

function returnRankedRole(displayValue) {
    let rankSymbol

    switch (true) {
        case (displayValue < 100):
            rankSymbol = "1465241245403316398";
            break;
        case (displayValue < 500):
            rankSymbol = "1465241244782428322";
            break;
        case (displayValue < 1000):
            rankSymbol = "1465241243801092281";
            break;
        case (displayValue < 5000):
            rankSymbol = "1465241243289124961";
            break;
        case (displayValue < 10000):
            rankSymbol = "1465241242823692338";
            break;
        case (displayValue < 20000):
            rankSymbol = "1465241145574555709";
            break;
        case (displayValue < 50000):
            rankSymbol = "1465241139719442462";
            break;
        case (displayValue < 100000):
            rankSymbol = "1465241139060670464";
            break;
        case (displayValue < 250000):
            rankSymbol = "1465241138410557583";
            break;
        case (displayValue < 300000):
            rankSymbol = "1473792886914027755";
            break;
        case (displayValue < 375000):
            rankSymbol = "1465241138079207517";
            break;
        case (displayValue < 475000):
            rankSymbol = "1465241137571823711";
            break;
        case (displayValue < 600000):
            rankSymbol = "1465241136527442042";
            break;
        case (displayValue < 750000):
            rankSymbol = "1465241136468856893";
            break;
        case (displayValue < 950000):
            rankSymbol = "1465241135793307708";
            break;
        case (displayValue < 1200000):
            rankSymbol = "1465241129174831125";
            break;
        default:
            rankSymbol = "1465241057842298901";
            break;
    }

    return rankSymbol
}

module.exports = {
    returnRankedMessage,
    returnRankedEmote,
    returnRankedRole
};