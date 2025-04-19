const fs = require('fs');
const path = require('path');

// Create the public/assets directory if it doesn't exist
const publicAssetsDir = path.join(__dirname, '../../public/assets');
if (!fs.existsSync(publicAssetsDir)) {
  fs.mkdirSync(publicAssetsDir, { recursive: true });
}

// Copy the icebreakers file from src/assets to public/assets
const srcFile = path.join(__dirname, '../assets/icebreakers.txt');
const destFile = path.join(publicAssetsDir, 'icebreakers.txt');

fs.copyFile(srcFile, destFile, (err) => {
  if (err) {
    console.error('Error copying icebreakers file:', err);
  } else {
    console.log('Icebreakers file copied successfully to public/assets');
  }
});
