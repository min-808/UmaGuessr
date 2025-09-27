const fs = require('fs');
const path = require('path');

function checkVoices(data, folderPath) {
    const expectedVoices = new Set();
    data.forEach(obj => {
        expectedVoices.add(`${obj.id}.mp3`);
    });

    const actualVoices = new Set(fs.existsSync(folderPath) ? fs.readdirSync(folderPath) : []);

    const missing = [...expectedVoices].filter(file => !actualVoices.has(file));
    const extras = [...actualVoices].filter(file => !expectedVoices.has(file));

    if (missing.length === 0 && extras.length === 0) {
        console.log("Voice check: All mp3 files are accounted for");
    } else {
        if (missing.length > 0) {
            console.log("Voice check: Missing mp3 files (listed in JSON but not found in folder):");
            console.log(missing.join('\n'));
        }
        if (extras.length > 0) {
            console.log("Voice check: Extra mp3 files (in folder but not listed in JSON):");
            console.log(extras.join('\n'));
        }
    }
}

// Example usage
const global = require('./src/assets/global-list.json');
const jp = require('./src/assets/jp-list.json');
const data = global.concat(jp);

checkVoices(data, path.join(__dirname, 'src/assets/voices'));
