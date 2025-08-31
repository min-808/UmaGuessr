const Jimp = require("jimp");
const path = require("path");
const fs = require("fs");

const guessDir = path.join(__dirname, "../src/assets/guessing");
const cacheDir = path.join(__dirname, "../src/assets/cache");

const BLUR_LEVELS = [51, 41, 31, 21, 11, 1];

async function buildCache() {
    if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
    }

    const files = fs.readdirSync(guessDir);

    console.log(`Caching ${files.length} images...`);

    for (const file of files) {
        const srcPath = path.join(guessDir, file);

        for (const blur of BLUR_LEVELS) {
            const cachePath = path.join(cacheDir, `${blur}-${file}`);
            if (fs.existsSync(cachePath)) continue; // skip if already cached

            const img = await Jimp.read(srcPath);
            if (blur > 1) img.pixelate(blur);

            await img.writeAsync(cachePath);
        }
    }

    console.log("Image cache built");
}

module.exports = { buildCache, cacheDir, BLUR_LEVELS };
