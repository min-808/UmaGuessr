const fs = require('fs');
const path = require('path');

// Change this to your desired folder path
const folderPath = 'C:/Users/kenda/Desktop/Code/Bots/uma/src/assets/guessing'; // current folder

fs.readdir(folderPath, (err, files) => {
    if (err) {
        console.error('Error reading folder:', err);
        return;
    }

    const fileNames = files.filter(file => fs.lstatSync(path.join(folderPath, file)).isFile());

    const output = fileNames.join('\n');

    fs.writeFile('filenames.txt', output, (err) => {
        if (err) {
            console.error('Error writing to text file:', err);
        } else {
            console.log('Filenames saved to filenames.txt');
        }
    });
});
