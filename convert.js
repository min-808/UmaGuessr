const fs = require('fs');
const path = require('path');

const folderPath = 'C:/Users/kenda/Desktop/uma_images/pt2'; // Change if needed

fs.readdir(folderPath, (err, files) => {
  if (err) {
    console.error('Error reading folder:', err);
    return;
  }

  for (const file of files) {
    const currentPath = path.join(folderPath, file);
    const lowerCaseName = file.toLowerCase();
    const lowerCasePath = path.join(folderPath, lowerCaseName);

    if (file !== lowerCaseName) {
      const tempPath = path.join(folderPath, `__temp__${file}`);

      // Step 1: Rename to temporary name to break case conflict
      fs.rename(currentPath, tempPath, (err) => {
        if (err) {
          console.error(`Failed temp-rename ${file}:`, err);
          return;
        }

        // Step 2: Rename from temp to lowercase
        fs.rename(tempPath, lowerCasePath, (err) => {
          if (err) {
            console.error(`Failed final rename ${file} -> ${lowerCaseName}:`, err);
          } else {
            console.log(`Renamed: ${file} -> ${lowerCaseName}`);
          }
        });
      });
    }
  }
});
