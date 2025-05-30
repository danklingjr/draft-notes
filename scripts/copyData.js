const fs = require('fs');
const path = require('path');

// Ensure public/data directory exists
const publicDataDir = path.join(process.cwd(), 'public', 'data');
if (!fs.existsSync(publicDataDir)) {
  fs.mkdirSync(publicDataDir, { recursive: true });
}

// Copy nflPlayers.json from src/data to public/data
const srcFile = path.join(process.cwd(), 'src', 'data', 'nflPlayers.json');
const destFile = path.join(publicDataDir, 'nflPlayers.json');

try {
  fs.copyFileSync(srcFile, destFile);
  console.log('Successfully copied nflPlayers.json to public/data directory');
} catch (error) {
  console.error('Error copying nflPlayers.json:', error);
  process.exit(1);
} 