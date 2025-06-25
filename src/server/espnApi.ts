import express, { Request, Response } from 'express';
import puppeteer, { Browser } from 'puppeteer';
import { getProjections, getLastSeasonPoints } from '../services/espnFantasyService';

const router = express.Router();

// Cache management
let cachedPlayers: any[] | null = null;
let cacheTime: number | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
let browserInstance: Browser | null = null;
let isDataFetching = false;

async function getBrowser(): Promise<Browser> {
  if (!browserInstance) {
    console.log('Launching new browser instance...');
    browserInstance = await puppeteer.launch({
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
  }
  return browserInstance;
}

async function closeBrowser() {
  if (browserInstance) {
    console.log('Closing browser instance...');
    await browserInstance.close();
    browserInstance = null;
  }
}

// Cleanup on process exit
process.on('SIGTERM', closeBrowser);
process.on('SIGINT', closeBrowser);

async function fetchPlayersData(): Promise<any[]> {
  if (isDataFetching) {
    throw new Error('Data fetch already in progress');
  }

  isDataFetching = true;
  const browser = await getBrowser();

  try {
    // Get 2025 projections
    console.log('Fetching 2025 projections...');
    const projections = await getProjections(browser);
    console.log('Got 2025 projections:', projections.length);

    // Get 2024 stats
    console.log('Fetching 2024 stats...');
    const stats2024 = await getLastSeasonPoints(browser);
    console.log('Got 2024 stats:', Object.keys(stats2024).length);

    // Convert ESPN data to NFLPlayer format
    const players = projections.map(player => {
      const [firstName, ...lastNameParts] = player.name.split(' ');
      const lastName = lastNameParts.join(' ');
      
      return {
        id: `${player.name}-${player.team}-${player.position}`.replace(/\s+/g, '-').toLowerCase(),
        firstName,
        lastName,
        fullName: player.name,
        position: player.position,
        team: player.team,
        projectedPoints2025: player.projectedPoints,
        points2024: stats2024[player.name] || 0,
        stats: player.stats
      };
    });

    console.log(`Successfully processed ${players.length} players`);
    return players;
  } finally {
    isDataFetching = false;
  }
}

router.get('/players', async (req: Request, res: Response) => {
  try {
    // Check cache first
    if (cachedPlayers && cacheTime && (Date.now() - cacheTime < CACHE_DURATION)) {
      console.log('Returning cached players data');
      return res.json(cachedPlayers);
    }

    // If a fetch is already in progress, wait a bit and check cache again
    if (isDataFetching) {
      console.log('Data fetch in progress, waiting...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      if (cachedPlayers && cacheTime && (Date.now() - cacheTime < CACHE_DURATION)) {
        console.log('Returning cached players data after wait');
        return res.json(cachedPlayers);
      }
    }

    // Fetch fresh data
    const players = await fetchPlayersData();
    
    // Update cache
    cachedPlayers = players;
    cacheTime = Date.now();
    
    res.json(players);
  } catch (error) {
    console.error('Error in /espn/players:', error);
    res.status(500).json({ error: 'Failed to fetch player data' });
  }
});

export default router; 