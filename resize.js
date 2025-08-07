const fs = require("fs");
const path = require("path");
const Jimp = require("jimp");

// Change this to your image folder
const inputFolder = "C:/Users/kenda/Desktop/uma";
const outputFolder = "C:/Users/kenda/Desktop/uma_out";

const maxWidth = 500;

// Ensure output folder exists
if (!fs.existsSync(outputFolder)) {
  fs.mkdirSync(outputFolder);
}

fs.readdir(inputFolder, (err, files) => {
  if (err) throw err;

  files.forEach(async (file) => {
    const ext = path.extname(file).toLowerCase();
    if (![".jpg", ".jpeg", ".png", ".bmp"].includes(ext)) return;

    try {
      const imagePath = path.join(inputFolder, file);
      const image = await Jimp.read(imagePath);

      if (image.bitmap.width > maxWidth) {
        image.resize(maxWidth, Jimp.AUTO);
      }

      const outputPath = path.join(outputFolder, file);
      await image.writeAsync(outputPath);
      console.log(`Resized ${file}`);
    } catch (err) {
      console.error(`Failed to process ${file}:`, err);
    }
  });
});
