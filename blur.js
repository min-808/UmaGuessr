const { buildCache } = require("./src/cache-images.js");

async function run() {
  await buildCache();
}

run()