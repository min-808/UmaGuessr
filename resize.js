const fs = require("fs");
const path = require("path");
const Jimp = require("jimp");

// Change this to your image folder
const inputFolder = "C:/Users/kenda/Downloads/upscale_results";
const outputFolder = inputFolder

const maxWidth = 850;

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

      // Resize if needed
      if (image.bitmap.width > maxWidth) {
        image.resize(maxWidth, Jimp.AUTO);
      }

      // Convert to JPG if not already
      const baseName = path.parse(file).name; // filename without extension
      const outputPath = path.join(outputFolder, `${baseName}.jpg`);
      await image.quality(90).writeAsync(outputPath); // set quality to 90

      console.log(`Processed ${file} -> ${baseName}.jpg`);
    } catch (err) {
      console.error(`Failed to process ${file}:`, err);
    }
  });
});
