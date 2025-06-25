import * as fs from 'fs';
import * as path from 'path';
import puppeteer from 'puppeteer';
import { getProjections, getLastSeasonPoints } from '../src/services/espnFantasyService';

interface NFLPlayer {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  position: string;
  team: string;
  points2024?: number;
  projectedPoints2025?: number;
  stats?: any;
}

interface NFLData {
  lastUpdated: string;
  players: NFLPlayer[];
}

async function updateESPNData() {
  try {
    // Launch browser
    console.log('Launching browser...');
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1920,1080',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process'
      ],
      defaultViewport: {
        width: 1920,
        height: 1080
      }
    });

    // Get 2025 projections
    console.log('Fetching 2025 projections...');
    const projections = await getProjections(browser);
    console.log('Got 2025 projections:', projections.length);

    // Get 2024 stats
    console.log('Fetching 2024 stats...');
    const stats2024 = await getLastSeasonPoints(browser);
    console.log('Got 2024 stats:', Object.keys(stats2024).length);

    // Close browser
    await browser.close();

    // Create maps for quick lookups
    const projectionMap = new Map(projections.map(p => [p.name, p]));
    const statsMap = new Map(Object.entries(stats2024));

    // Read existing NFL player data
    const nflDataPath = path.join(process.cwd(), 'src', 'data', 'nflPlayers.json');
    const nflData: NFLData = JSON.parse(fs.readFileSync(nflDataPath, 'utf8'));

    // Create a map of existing players
    const existingPlayers = new Map(nflData.players.map(p => [p.fullName, p]));

    // Create a new array for updated players
    const updatedPlayers: NFLPlayer[] = [];

    // First add all players from ESPN projections in their order
    for (const projection of projections) {
      const existingPlayer = existingPlayers.get(projection.name);
      if (existingPlayer) {
        updatedPlayers.push({
          ...existingPlayer,
          points2024: stats2024[projection.name] || 0,
          projectedPoints2025: projection.projectedPoints,
          stats: projection.stats
        });
      } else {
        // Create new player entry if not found
        const [firstName, ...lastNameParts] = projection.name.split(' ');
        const lastName = lastNameParts.join(' ');
        updatedPlayers.push({
          id: `${projection.name}-${projection.team}-${projection.position}`.replace(/\s+/g, '-').toLowerCase(),
          firstName,
          lastName,
          fullName: projection.name,
          position: projection.position,
          team: projection.team,
          points2024: stats2024[projection.name] || 0,
          projectedPoints2025: projection.projectedPoints,
          stats: projection.stats
        });
      }
    }

    // Add any remaining players from original data that weren't in ESPN data
    for (const player of nflData.players) {
      if (!projectionMap.has(player.fullName)) {
        updatedPlayers.push({
          ...player,
          points2024: 0,
          projectedPoints2025: 0
        });
      }
    }

    // Update the players array and lastUpdated timestamp
    nflData.players = updatedPlayers;
    nflData.lastUpdated = new Date().toISOString();

    // Save updated data
    fs.writeFileSync(nflDataPath, JSON.stringify(nflData, null, 2));
    console.log('\nESPN Data Update Results:');
    console.log(`Total NFL players: ${nflData.players.length}`);
    console.log(`Players with 2025 projections: ${projections.length}`);
    console.log(`Players with 2024 stats: ${Object.keys(stats2024).length}`);

    // Copy to public directory
    const publicDataDir = path.join(process.cwd(), 'public', 'data');
    if (!fs.existsSync(publicDataDir)) {
      fs.mkdirSync(publicDataDir, { recursive: true });
    }
    const publicDataPath = path.join(publicDataDir, 'nflPlayers.json');
    fs.copyFileSync(nflDataPath, publicDataPath);
    console.log('\nUpdated NFL data file with ESPN information');
    console.log('Copied updated data to public directory');
  } catch (error) {
    console.error('Error updating ESPN data:', error);
  }
}

// Run the update
updateESPNData().catch(console.error); 