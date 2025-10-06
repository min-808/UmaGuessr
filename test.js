const fs = require("fs");
const { MongoClient } = require("mongodb")
require('dotenv').config();

// regex patterns for the different log lines
const startPattern = /started a game with the correct answer being (.+)/;
const correctPattern = /Answered by .* with .* \d+ hints, .* sec, \d+\/\d+ points/;
const skipPattern = /Skipped with .* points/;
const timeoutPattern = /No one answered, .* points/;

// function to normalize uma names
function normalizeUma(name) {
    return name.replace(/\s*\*\*?\(slash command\)\*\*?/g, "").trim();
}

// dictionary to track stats
const stats = {}; // {umaKey: { total: X, wins: Y }}

// read log file
const lines = fs.readFileSync("bot (6).log", "utf-8").split("\n");

let currentUma = null;

for (const line of lines) {
    // check if game started
    const startMatch = line.match(startPattern);
    if (startMatch) {
        currentUma = normalizeUma(startMatch[1].trim());
        const key = currentUma.toLowerCase().replace(/\./g, "").replace(/\s+/g, "");
        if (!stats[key]) stats[key] = { total: 0, wins: 0 };
        stats[key].total += 1;
        continue;
    }

    // check if correct
    if (correctPattern.test(line) && currentUma) {
        const key = currentUma.toLowerCase().replace(/\./g, "").replace(/\s+/g, "");
        stats[key].wins += 1;
        currentUma = null;
        continue;
    }

    // check if skipped or timed out
    if ((skipPattern.test(line) || timeoutPattern.test(line)) && currentUma) {
        currentUma = null;
        continue;
    }
}

// print results sorted by descending win %
console.log(`${"Uma".padEnd(30)} ${"Total".padStart(5)} ${"Wins".padStart(5)} ${"Win %".padStart(7)}`);
console.log("-".repeat(50));

const sortedStats = Object.entries(stats).sort((a, b) => {
    const aRate = a[1].total > 0 ? a[1].wins / a[1].total : 0;
    const bRate = b[1].total > 0 ? b[1].wins / b[1].total : 0;
    return bRate - aRate;
});

for (const [uma, data] of sortedStats) {
    const total = data.total;
    const wins = data.wins;
    const winRate = total > 0 ? (wins / total) * 100 : 0;
    console.log(`${uma.padEnd(30)} ${String(total).padStart(5)} ${String(wins).padStart(5)} ${winRate.toFixed(2).padStart(7)}`);
}


async function saveStatsToMongo(stats) {
    var uri = "mongodb+srv://min:" + process.env.MONGODB_PASS + "@discord-seele.u4g75ks.mongodb.net/"
const dbName = "uma";
const collectionName = "count";
    const client = new MongoClient(uri);

    try {
        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection(collectionName);

        for (const [uma, data] of Object.entries(stats)) {
            // Upsert: insert if doesn't exist, update if exists
            await collection.updateOne(
                { name: uma }, // filter by UMA name
                { $set: { total: data.count, wins: data.wins } },
                { upsert: true }
            );
            console.log(`Saved stats for UMA: ${uma}`);
        }

        console.log("All stats saved successfully!");
    } catch (err) {
        console.error("Error saving stats to MongoDB:", err);
    } finally {
        await client.close();
    }
}

saveStatsToMongo(stats)