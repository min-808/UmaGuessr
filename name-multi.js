const fs = require('fs');
const path = require('path');
const readline = require('readline');
const http = require('http');
const { exec } = require('child_process');


const FOLDER_PATH = './src/assets/new/multis'; // Folder with images to rename
const CHECK_FOLDER_PATH = './src/assets/multi'; // Additional folder to check for existing names
const JSON_FILE_PATH_1 = './src/assets/jp-list.json'; // Path to first JSON file
const JSON_FILE_PATH_2 = './src/assets/global-list.json'; // Path to second JSON file
const SUPPORTED_FORMATS = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
const PORT = 3000;

let currentImagePath = '';
let server = null;
let nicknameData = [];

function loadNicknameData() {
  try {
    let combinedData = [];
    
    if (fs.existsSync(JSON_FILE_PATH_1)) {
      const data1 = fs.readFileSync(JSON_FILE_PATH_1, 'utf8');
      const parsed1 = JSON.parse(data1);
      combinedData = combinedData.concat(Array.isArray(parsed1) ? parsed1 : [parsed1]);
      console.log(`✓ Loaded ${Array.isArray(parsed1) ? parsed1.length : 1} entries from ${JSON_FILE_PATH_1}`);
    } else {
      console.log(`Warning: JSON file not found at ${JSON_FILE_PATH_1}`);
    }
    
    // Load second JSON file
    if (fs.existsSync(JSON_FILE_PATH_2)) {
      const data2 = fs.readFileSync(JSON_FILE_PATH_2, 'utf8');
      const parsed2 = JSON.parse(data2);
      combinedData = combinedData.concat(Array.isArray(parsed2) ? parsed2 : [parsed2]);
      console.log(`✓ Loaded ${Array.isArray(parsed2) ? parsed2.length : 1} entries from ${JSON_FILE_PATH_2}`);
    } else {
      console.log(`Warning: JSON file not found at ${JSON_FILE_PATH_2}`);
    }
    
    nicknameData = combinedData;
    console.log(`✓ Total entries loaded: ${nicknameData.length}\n`);
    
    if (nicknameData.length === 0) {
      console.log('   Proceeding without nickname lookup\n');
    }
  } catch (error) {
    console.error(`✗ Error loading JSON files: ${error.message}`);
    console.log('   Proceeding without nickname lookup\n');
  }
}

function findIdByNickname(nickname) {
  const lowerNickname = nickname.toLowerCase().trim();
  
  for (const entry of nicknameData) {

    if (Array.isArray(entry.names)) {
      const found = entry.names.some(n => n.toLowerCase() === lowerNickname);
      if (found) {
        return entry.id;
      }
    }
  }
  
  return null;
}

function startServer() {
  server = http.createServer((req, res) => {
    if (req.url === '/') {
      const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Image Preview</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              background: #1e1e1e;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              overflow: hidden;
            }
            .container {
              width: 100%;
              height: 100%;
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
              padding: 20px;
            }
            .filename {
              color: #fff;
              font-size: 18px;
              margin-bottom: 20px;
              padding: 10px 20px;
              background: rgba(255, 255, 255, 0.1);
              border-radius: 8px;
            }
            img {
              max-width: 90vw;
              max-height: 85vh;
              object-fit: contain;
              border-radius: 8px;
              box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
            }
            .loading {
              color: #888;
              font-size: 16px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="filename" id="filename">Loading...</div>
            <img id="image" src="/image" alt="Current image" />
          </div>
          <script>
            // Auto-refresh to show new images
            setInterval(() => {
              const img = document.getElementById('image');
              const filename = document.getElementById('filename');
              
              // Fetch current filename
              fetch('/filename')
                .then(r => r.text())
                .then(name => {
                  filename.textContent = name;
                });
              
              // Reload image with cache busting
              img.src = '/image?' + Date.now();
            }, 500);
          </script>
        </body>
        </html>
      `;
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(html);
    } else if (req.url.startsWith('/image')) {
      if (currentImagePath && fs.existsSync(currentImagePath)) {
        const ext = path.extname(currentImagePath).toLowerCase();
        const contentTypes = {
          '.jpg': 'image/jpeg',
          '.jpeg': 'image/jpeg',
          '.png': 'image/png',
          '.gif': 'image/gif',
          '.bmp': 'image/bmp',
          '.webp': 'image/webp'
        };
        
        res.writeHead(200, {
          'Content-Type': contentTypes[ext] || 'image/jpeg',
          'Cache-Control': 'no-cache'
        });
        
        const imageStream = fs.createReadStream(currentImagePath);
        imageStream.pipe(res);
      } else {
        res.writeHead(404);
        res.end('No image');
      }
    } else if (req.url === '/filename') {
      const filename = currentImagePath ? path.basename(currentImagePath) : 'No image loaded';
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end(filename);
    } else {
      res.writeHead(404);
      res.end('Not found');
    }
  });

  server.listen(PORT, () => {
    console.log(`Web preview running at http://localhost:${PORT}`);
  });
}

function openBrowser() {
  const url = `http://localhost:${PORT}`;
  const platform = process.platform;
  
  let command;
  if (platform === 'darwin') {
    command = `open "${url}"`;
  } else if (platform === 'win32') {
    command = `start "" "${url}"`;
  } else {
    command = `xdg-open "${url}"`;
  }
  
  exec(command);
}

function updateCurrentImage(imagePath) {
  currentImagePath = imagePath;
}

function getImageFiles(folderPath) {
  try {
    const files = fs.readdirSync(folderPath);
    return files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return SUPPORTED_FORMATS.includes(ext);
    }).map(file => path.join(folderPath, file));
  } catch (error) {
    console.error(`Error reading folder: ${error.message}`);
    return [];
  }
}

async function getNewNames(currentName) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const names = [];
  let emptyLineCount = 0;
  let hasWarning = false;

  return new Promise((resolve) => {
    console.log(`\nCurrent file: ${currentName}`);
    console.log('Enter new name parts (press Enter twice to confirm):\n');

    rl.on('line', (line) => {
      if (line.trim() === '') {
        emptyLineCount++;
        if (emptyLineCount >= 2) {
          rl.close();
          resolve({ names, hasWarning });
        }
      } else {
        emptyLineCount = 0;
        const input = line.trim();
        

        const id = findIdByNickname(input);
        
        if (id !== null) {
          names.push(id);
          console.log(`✓ Found nickname "${input}" → Using ID: ${id}`);
        } else {

          if (nicknameData.length > 0) {
            console.log(`Warning: "${input}" not found in nickname database`);
            console.log(`Using literal text: ${input}`);
            hasWarning = true;
          }
        }
      }
    });
  });
}

function getAvailableFilename(baseName, ext, currentFolder) {
  let counter = 1;
  let fileName = `${baseName}_${counter}${ext}`;
  
  let currentFolderPath = path.join(currentFolder, fileName);
  let checkFolderPath = path.join(CHECK_FOLDER_PATH, fileName);
  
  while (fs.existsSync(currentFolderPath) || fs.existsSync(checkFolderPath) || fileExistsWithDifferentExtension(baseName, counter, currentFolder) || fileExistsWithDifferentExtension(baseName, counter, CHECK_FOLDER_PATH)) {
    counter++;
    fileName = `${baseName}_${counter}${ext}`;
    currentFolderPath = path.join(currentFolder, fileName);
    checkFolderPath = path.join(CHECK_FOLDER_PATH, fileName);
  }
  
  return { fileName, counter };
}

function fileExistsWithDifferentExtension(baseName, counter, folderPath) {
  const baseFileName = `${baseName}_${counter}`;
  
  try {
    const files = fs.readdirSync(folderPath);
    // Check if any file in the folder has the same base name (ignoring extension)
    return files.some(file => {
      const fileWithoutExt = path.parse(file).name;
      return fileWithoutExt === baseFileName;
    });
  } catch (error) {
    // If folder doesn't exist or can't be read, return false
    return false;
  }
}

function renameFile(oldPath, newNames, hasWarning) {
  if (newNames.length === 0) {
    console.log('No new names provided. Skipping...');
    return oldPath;
  }

  const dir = path.dirname(oldPath);
  const ext = path.extname(oldPath);
  
  const baseName = newNames.join('_');
  
  const { fileName, counter } = getAvailableFilename(baseName, ext, dir);
  const newPath = path.join(dir, fileName);
  
  try {
    fs.renameSync(oldPath, newPath);
    console.log(`✓ Renamed to: ${fileName}`);
    if (hasWarning) {
      console.log(`Note: Some inputs were not found in nickname database`);
    }
    console.log(`  (Checked against both current and ${path.basename(CHECK_FOLDER_PATH)} folders)`);
    return newPath;
  } catch (error) {
    console.error(`✗ Error renaming: ${error.message}`);
    return oldPath;
  }
}

// main function
async function main() {
  console.log('=== Image Renaming Tool (Web Preview) ===\n');
  
  loadNicknameData();
  
  if (!fs.existsSync(CHECK_FOLDER_PATH)) {
    console.log(`Warning: Check folder doesn't exist: ${CHECK_FOLDER_PATH}`);
    console.log('Creating it now...\n');
    fs.mkdirSync(CHECK_FOLDER_PATH, { recursive: true });
  }
  
  const imageFiles = getImageFiles(FOLDER_PATH);
  
  if (imageFiles.length === 0) {
    console.log(`No images found in folder: ${FOLDER_PATH}`);
    return;
  }

  console.log(`Found ${imageFiles.length} image(s)`);
  console.log(`Checking for duplicates in: ${FOLDER_PATH} AND ${CHECK_FOLDER_PATH}\n`);
  
  startServer();
  
  setTimeout(() => {
    openBrowser();
    console.log('Waiting for browser to open...\n');
    
    setTimeout(() => {
      processImages(imageFiles);
    }, 2000);
  }, 1000);
}

async function processImages(imageFiles) {
  console.log('─'.repeat(50));
  console.log('Ready! Start renaming images below:\n');
  
  for (let i = 0; i < imageFiles.length; i++) {
    let imagePath = imageFiles[i];
    const fileName = path.basename(imagePath);

    console.log(`\n[${i + 1}/${imageFiles.length}]`);
    console.log('─'.repeat(50));
    

    updateCurrentImage(imagePath);
    
    const { names, hasWarning } = await getNewNames(fileName);
    
    const newPath = renameFile(imagePath, names, hasWarning);
    
    if (newPath !== imagePath) {
      imagePath = newPath;
      updateCurrentImage(imagePath);
    }
    
    console.log('─'.repeat(50));
  }

  console.log('\nAll images processed!');
  console.log('Closing server...\n');
  
  if (server) {
    server.close();
  }
  
  process.exit(0);
}

// Handle cleanup on exit
process.on('SIGINT', () => {
  console.log('\n\nShutting down...');
  if (server) {
    server.close();
  }
  process.exit(0);
});

// Run the script
main();
