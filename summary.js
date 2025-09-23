const fs = require("fs");
const path = require("path");
const Jimp = require("jimp");

const inputFolder = "src/assets/horses";

const widthStats = {};
const extensionCounts = {};

fs.readdir(inputFolder, async (err, files) => {
  if (err) throw err;

  const imageFiles = files.filter(file => {
    const ext = path.extname(file).toLowerCase();
    return [".jpg", ".jpeg", ".png", ".bmp", ".webp", ".gif"].includes(ext);
  });

  for (const file of imageFiles) {
    const ext = path.extname(file).toLowerCase();

    // Count extensions
    extensionCounts[ext] = (extensionCounts[ext] || 0) + 1;

    try {
      const imagePath = path.join(inputFolder, file);
      const image = await Jimp.read(imagePath);
      const width = image.bitmap.width;

      if (!widthStats[width]) {
        widthStats[width] = { count: 0, files: [] };
      }

      widthStats[width].count++;
      widthStats[width].files.push(file);
    } catch (error) {
      console.error(`Failed to read ${file}:`, error);
    }
  }

  // Print extension summary
  console.log("File Type Counts:");
  Object.entries(extensionCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([ext, count]) => {
      console.log(`${ext} - ${count} file${count !== 1 ? "s" : ""}`);
    });

  // Print width summary
  console.log("\nImage Width Summary:");
  Object.entries(widthStats)
    .sort((a, b) => b[1].count - a[1].count)
    .forEach(([width, { count, files }]) => {
      console.log(`${width}px - ${count} picture${count !== 1 ? "s" : ""}`);
      if (count <= 12) {
        files.forEach(f => console.log(`   - ${f}`));
      }
    });
});
