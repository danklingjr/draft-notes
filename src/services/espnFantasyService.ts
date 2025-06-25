import { Browser, Page } from 'puppeteer';

const ESPN_PROJECTIONS_URL = 'https://fantasy.espn.com/football/players/projections';
const ESPN_STATS_URL = 'https://fantasy.espn.com/football/players/stats';
const PAGE_TIMEOUT = 60000; // 60 seconds

export interface PlayerProjection {
  name: string;
  team: string;
  position: string;
  projectedPoints: number;
  stats: {
    passing?: {
      yards: number;
      touchdowns: number;
      interceptions: number;
    };
    rushing?: {
      yards: number;
      touchdowns: number;
    };
    receiving?: {
      receptions: number;
      yards: number;
      touchdowns: number;
    };
  };
}

async function parseProjectionsPage(page: Page): Promise<PlayerProjection[]> {
  const players: PlayerProjection[] = [];
  
  try {
    console.log('Waiting for player table to load...');
    
    // Wait for the table to be visible
    await page.waitForSelector('.Table__TBODY', { 
      timeout: PAGE_TIMEOUT,
      visible: true 
    });
    console.log('Table container found');
    
    // Wait for at least one player row
    await page.waitForSelector('.Table__TR', {
      timeout: PAGE_TIMEOUT,
      visible: true
    });
    console.log('Player rows found');

    // Get all player rows
    const playerRows = await page.$$('.Table__TR');
    console.log(`Found ${playerRows.length} player rows`);

    for (const row of playerRows) {
      try {
        // Get player info
        const name = await row.$eval('.player-column a', (el: Element) => (el as HTMLElement).innerText?.trim() || '');
        const position = await row.$eval('.playerinfo__playerpos', (el: Element) => (el as HTMLElement).innerText?.trim() || '');
        const team = await row.$eval('.playerinfo__playerteam', (el: Element) => (el as HTMLElement).innerText?.trim() || '');
        
        console.log(`\nParsing player: ${name} (${position} - ${team})`);
        
        // Get stats based on position
        const stats: PlayerProjection['stats'] = {};
        
        if (position.includes('QB')) {
          const passYards = await row.$eval('td:nth-child(4)', (el: Element) => (el as HTMLElement).innerText || '0');
          const passTD = await row.$eval('td:nth-child(5)', (el: Element) => (el as HTMLElement).innerText || '0');
          const passInt = await row.$eval('td:nth-child(6)', (el: Element) => (el as HTMLElement).innerText || '0');
          
          console.log('QB Stats:', { passYards, passTD, passInt });
          
          stats.passing = {
            yards: parseFloat(passYards.replace(/,/g, '')),
            touchdowns: parseFloat(passTD),
            interceptions: parseFloat(passInt)
          };
        }
        
        if (!position.includes('K') && !position.includes('DST')) {
          const rushYards = await row.$eval('td:nth-child(7)', (el: Element) => (el as HTMLElement).innerText || '0');
          const rushTD = await row.$eval('td:nth-child(8)', (el: Element) => (el as HTMLElement).innerText || '0');
          
          console.log('Rush Stats:', { rushYards, rushTD });
          
          stats.rushing = {
            yards: parseFloat(rushYards.replace(/,/g, '')),
            touchdowns: parseFloat(rushTD)
          };
        }
        
        if (position.includes('RB') || position.includes('WR') || position.includes('TE')) {
          const receptions = await row.$eval('td:nth-child(9)', (el: Element) => (el as HTMLElement).innerText || '0');
          const recYards = await row.$eval('td:nth-child(10)', (el: Element) => (el as HTMLElement).innerText || '0');
          const recTD = await row.$eval('td:nth-child(11)', (el: Element) => (el as HTMLElement).innerText || '0');
          
          console.log('Receiving Stats:', { receptions, recYards, recTD });
          
          stats.receiving = {
            receptions: parseFloat(receptions),
            yards: parseFloat(recYards.replace(/,/g, '')),
            touchdowns: parseFloat(recTD)
          };
        }

        // Get fantasy points - last column
        const projectedPoints = await row.$eval('td:last-child', (el: Element) => {
          const text = (el as HTMLElement).innerText || '0';
          return parseFloat(text);
        });

        players.push({
          name,
          team,
          position,
          projectedPoints,
          stats
        });
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

export async function getProjections(browser: Browser): Promise<PlayerProjection[]> {
  const page = await browser.newPage();
  
  try {
    console.log('Navigating to ESPN projections page...');
    await page.setViewport({ width: 1920, height: 1080 });
    await page.goto(ESPN_PROJECTIONS_URL, { 
      waitUntil: 'networkidle0',
      timeout: PAGE_TIMEOUT 
    });

    // Take a screenshot for debugging
    await page.screenshot({ path: 'debug-projections.png' });
    console.log('Saved debug screenshot to debug-projections.png');

    // Wait for any cookie/consent dialogs and close them
    try {
      const cookieButton = await page.$('[data-tracking-id="cookie-banner-dialog"]');
      if (cookieButton) {
        await cookieButton.click();
        console.log('Closed cookie dialog');
      }
    } catch (error) {
      console.log('No cookie dialog found');
    }

    // Click the "2025 Projections" tab
    console.log('Looking for 2025 Projections tab...');
    await page.waitForSelector('button[value="PROJ_2025"]', { timeout: PAGE_TIMEOUT });
    await page.click('button[value="PROJ_2025"]');
    console.log('Clicked 2025 Projections tab');
    
    // Wait for content to load
    await page.waitForNetworkIdle();
    console.log('Page loaded after clicking tab');

    const players = await parseProjectionsPage(page);
    console.log(`Successfully scraped ${players.length} player projections`);
    return players;
  } catch (error) {
    console.error('Error getting projections:', error);
    throw error;
  } finally {
    await page.close();
  }
}

export async function getLastSeasonPoints(browser: Browser): Promise<Record<string, number>> {
  const page = await browser.newPage();
  const stats: Record<string, number> = {};
  
  try {
    console.log('Navigating to ESPN stats page...');
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Navigate to the stats page
    await page.goto(ESPN_STATS_URL, { 
      waitUntil: 'networkidle0',
      timeout: PAGE_TIMEOUT 
    });

    // Take a screenshot for debugging
    await page.screenshot({ path: 'debug-stats.png' });
    console.log('Saved debug screenshot to debug-stats.png');

    // Wait for any cookie/consent dialogs and close them
    try {
      const cookieButton = await page.$('[data-tracking-id="cookie-banner-dialog"]');
      if (cookieButton) {
        await cookieButton.click();
        console.log('Closed cookie dialog');
      }
    } catch (error) {
      console.log('No cookie dialog found');
    }

    // Click the "2024 Stats" tab
    console.log('Looking for 2024 Stats tab...');
    await page.waitForSelector('button[value="STATS_2024"]', { timeout: PAGE_TIMEOUT });
    await page.click('button[value="STATS_2024"]');
    console.log('Clicked 2024 Stats tab');
    
    // Wait for content to load
    await page.waitForNetworkIdle();
    console.log('Page loaded after clicking tab');

    // Get all player rows
    const playerRows = await page.$$('.Table__TR');
    console.log(`Found ${playerRows.length} player rows for stats`);
    
    for (const row of playerRows) {
      try {
        const name = await row.$eval('.player-column a', (el: Element) => (el as HTMLElement).innerText?.trim() || '');
        const pointsText = await row.$eval('td:last-child', (el: Element) => {
          const text = (el as HTMLElement).innerText || '0';
          return text;
        });
        const points = parseFloat(pointsText);
        stats[name] = points;
      } catch (error) {
        console.error('Error parsing player stats row:', error);
      }
    }

    console.log(`Successfully scraped stats for ${Object.keys(stats).length} players`);
    return stats;
  } catch (error) {
    console.error('Error getting last season stats:', error);
    throw error;
  } finally {
    await page.close();
  }
} 