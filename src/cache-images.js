const Jimp = require("jimp");
const path = require("path");
const fs = require("fs");

const guessDir = path.join(__dirname, "../src/assets/guessing");
const cacheDir = path.join(__dirname, "../src/assets/cache");

const multiDir = path.join(__dirname, "../src/assets/multi")
const multiCacheDir = path.join(__dirname, "../src/assets/multi_cache")

const BLUR_LEVELS = [51, 41, 31, 21, 11];
const MULTI_BLUR_LEVELS = [19, 15, 11];

async function buildCache() {
    if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
    }

    const files = fs.readdirSync(guessDir).filter(f =>
        /\.(jpe?g|png|bmp|webp|gif)$/i.test(f)
    )

    const guessFiles = fs.readdirSync(multiDir).filter(f =>
        /\.(jpe?g|png|bmp|webp|gif)$/i.test(f)
    )

    console.log(`Caching ${files.length} single images...`);

    for (let file of files) {
        const srcPath = path.join(guessDir, file);

        for (const blur of BLUR_LEVELS) {
            const cachePath = path.join(cacheDir, `${blur}-${file}`);
            if (fs.existsSync(cachePath)) continue; // skip if already cached

            const img = await Jimp.read(srcPath);
            if (blur > 1) img.pixelate(blur);

            await img.writeAsync(cachePath);
        }
    }

    console.log(`Caching ${guessFiles.length} multi images...`);

    for (let file of guessFiles) {
        const srcPath = path.join(multiDir, file);

        for (const blur of MULTI_BLUR_LEVELS) {
            const cachePath = path.join(multiCacheDir, `${blur}-${file}`);
            if (fs.existsSync(cachePath)) continue; // skip if already cached

            const img = await Jimp.read(srcPath);
            if (blur > 1) img.pixelate(blur);

            await img.writeAsync(cachePath);
        }
    }

    console.log("Image caches built");
}

module.exports = { buildCache };
