const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Load JSON files
const global = require('./src/assets/global-list.json');
const jp = require('./src/assets/jp-list.json');
const data = require('./src/assets/full.json');

// Make sure downloads folder exists
const downloadFolder = path.join(__dirname, 'src/assets/voices');
if (!fs.existsSync(downloadFolder)) {
  fs.mkdirSync(downloadFolder);
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function downloadMp3() {
  for (const item of data) {
    const number = item.id;
    const name = item.name_en_internal;
    const apiUrl = `https://umapyoi.net/api/v1/character/${number}`;

    try {
      const filePath = path.join(downloadFolder, `${name}.mp3`);

      // ✅ Skip if file already exists
      if (fs.existsSync(filePath)) {
        console.log(`⏩ Skipping ${name}, file already exists`);
        continue;
      }

      console.log(`Fetching API for ${name}: ${apiUrl}`);
      const apiResponse = await axios.get(apiUrl);

      const voiceUrl = apiResponse.data.voice;
      if (!voiceUrl) {
        console.warn(`⚠️ No voice link found for number ${number}`);
        continue;
      }

      console.log(`Downloading voice: ${voiceUrl}`);
      const voiceResponse = await axios.get(voiceUrl, { responseType: 'stream' });

      const writer = fs.createWriteStream(filePath);
      voiceResponse.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });

      console.log(`✅ Saved: ${filePath}`);
    } catch (err) {
      console.error(`❌ Failed for number ${number}:`, err.message);
    }

    // ⏱️ Wait 1s between requests
    await sleep(1000);
  }
}

downloadMp3();
