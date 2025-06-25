import { NextApiRequest, NextApiResponse } from 'next';
import puppeteer from 'puppeteer';
import { getProjections, getLastSeasonPoints } from '../../../services/espnFantasyService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let browser;
  try {
    console.log('Launching browser...');
    browser = await puppeteer.launch({
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
    res.status(200).json(players);
  } catch (error) {
    console.error('Error in /api/espn/players:', error);
    res.status(500).json({ error: 'Failed to fetch player data' });
  } finally {
    if (browser) {
      console.log('Closing browser...');
      await browser.close();
    }
  }
} 