import { Browser, Page } from 'puppeteer';

const NFL_PROJECTIONS_URL = 'https://fantasy.nfl.com/research/projections?position=0&statCategory=projectedStats&statSeason=2025&statType=seasonProjectedStats';
const NFL_SCORING_URL = 'https://fantasy.nfl.com/research/scoringleaders';
const PAGE_TIMEOUT = 60000; // 60 seconds

export interface NFLPlayerData {
  name: string;
  team: string;
  position: string;
  projectedPoints2025: number;
  points2024: number;
  rank: number;
}

async function parseProjectionsPage(page: Page): Promise<NFLPlayerData[]> {
  const players: NFLPlayerData[] = [];
  
  try {
    console.log('Waiting for player table to load...');
    
    // Wait for the table to be visible
    await page.waitForSelector('table.tableType-player tbody tr', { 
      timeout: PAGE_TIMEOUT,
      visible: true 
    });
    console.log('Player rows found');

    // Get all player rows
    const playerRows = await page.$$('table.tableType-player tbody tr');
    console.log(`Found ${playerRows.length} player rows`);

    let rank = 1;
    for (const row of playerRows) {
      try {
        // Get player info from the first cell which contains name and team/position
        const playerCell = await row.$('.playerNameFull');
        if (!playerCell) {
          console.log('No player name cell found');
          continue;
        }

        const playerText = await playerCell.evaluate((el: Element) => (el as HTMLElement).innerText);
        console.log('Player text:', playerText);
        
        // Get team and position
        const teamPosCell = await row.$('.playerTeam');
        if (!teamPosCell) {
          console.log('No team/position cell found');
          continue;
        }

        const teamPosText = await teamPosCell.evaluate((el: Element) => (el as HTMLElement).innerText);
        console.log('Team/Position text:', teamPosText);
        
        // Parse team and position - format is usually "QB - TEAM" or "WR - TEAM"
        const teamPosMatch = teamPosText.match(/([A-Z]+)\s*-\s*([A-Z]+)/);
        if (!teamPosMatch) {
          console.log('Could not parse team/position:', teamPosText);
          continue;
        }

        const [_, position, team] = teamPosMatch;

        // Get projected points from the last cell
        const pointsCell = await row.$('td:last-child');
        const projectedPoints = pointsCell ? 
          parseFloat(await pointsCell.evaluate((el: Element) => (el as HTMLElement).innerText)) : 0;

        console.log(`Adding player: ${playerText} (${position} - ${team}) with ${projectedPoints} points`);

        players.push({
          name: playerText.trim(),
          team,
          position,
          projectedPoints2025: projectedPoints,
          points2024: 0, // Will be updated later
          rank
        });
        
        rank++;
      } catch (error) {
        console.error('Error parsing player row:', error);
      }
    }
  } catch (error) {
    console.error('Error parsing projections page:', error);
    throw error;
  }

  return players;
}

async function parseScoringPage(page: Page): Promise<Map<string, number>> {
  const scores = new Map<string, number>();
  
  try {
    console.log('Waiting for scoring table to load...');
    
    // Wait for the table to be visible
    await page.waitForSelector('table.tableType-player tbody tr', { 
      timeout: PAGE_TIMEOUT,
      visible: true 
    });
    console.log('Player rows found');

    // Get all player rows
    const playerRows = await page.$$('table.tableType-player tbody tr');
    console.log(`Found ${playerRows.length} player rows`);

    for (const row of playerRows) {
      try {
        // Get player info from the first cell
        const playerCell = await row.$('.playerNameFull');
        if (!playerCell) continue;

        const playerText = await playerCell.evaluate((el: Element) => (el as HTMLElement).innerText);

        // Get points from the last cell
        const pointsCell = await row.$('td:last-child');
        const points = pointsCell ? 
          parseFloat(await pointsCell.evaluate((el: Element) => (el as HTMLElement).innerText)) : 0;

        scores.set(playerText.trim(), points);
      } catch (error) {
        console.error('Error parsing player row:', error);
      }
    }
  } catch (error) {
    console.error('Error parsing scoring page:', error);
    throw error;
  }

  return scores;
}

export async function getNFLProjections(browser: Browser): Promise<NFLPlayerData[]> {
  const page = await browser.newPage();
  
  try {
    console.log('Navigating to NFL projections page...');
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Enable request interception
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      if (['image', 'stylesheet', 'font'].includes(request.resourceType())) {
        request.abort();
      } else {
        request.continue();
      }
    });

    await page.goto(NFL_PROJECTIONS_URL, { 
      waitUntil: 'networkidle0',
      timeout: PAGE_TIMEOUT 
    });

    // Take a screenshot for debugging
    await page.screenshot({ path: 'debug-nfl-projections.png' });
    console.log('Saved debug screenshot to debug-nfl-projections.png');

    // Wait for content to load
    await page.waitForNetworkIdle();
    console.log('Page loaded');

    const players = await parseProjectionsPage(page);
    console.log(`Successfully scraped ${players.length} player projections`);

    // Now get 2024 scoring data
    console.log('Navigating to NFL scoring page...');
    await page.goto(NFL_SCORING_URL, { 
      waitUntil: 'networkidle0',
      timeout: PAGE_TIMEOUT 
    });

    // Take a screenshot for debugging
    await page.screenshot({ path: 'debug-nfl-scoring.png' });
    console.log('Saved debug screenshot to debug-nfl-scoring.png');

    // Wait for content to load
    await page.waitForNetworkIdle();
    console.log('Page loaded');

    const scores = await parseScoringPage(page);
    console.log(`Successfully scraped ${scores.size} player scores`);

    // Merge scoring data with projections
    return players.map(player => ({
      ...player,
      points2024: scores.get(player.name) || 0
    }));
  } catch (error) {
    console.error('Error getting NFL data:', error);
    throw error;
  } finally {
    await page.close();
  }
} 