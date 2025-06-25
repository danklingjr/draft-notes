import { Browser, Page } from 'puppeteer';

const FANTASY_PROS_URL = 'https://draftwizard.fantasypros.com/football/cheat-sheets/edit/?sport=nfl&sheetKey=nfl~ade8583f-6667-4541-bd12-e0895275bc6e';
const PAGE_TIMEOUT = 60000; // 60 seconds

export interface PlayerData {
  name: string;
  team: string;
  position: string;
  rank: number;
}

async function parsePlayersPage(page: Page): Promise<PlayerData[]> {
  const players: PlayerData[] = [];
  
  try {
    console.log('Waiting for player table to load...');
    
    // Wait for the table to be visible
    await page.waitForSelector('.player-row', { 
      timeout: PAGE_TIMEOUT,
      visible: true 
    });
    console.log('Player rows found');

    // Get all player rows
    const playerRows = await page.$$('.player-row');
    console.log(`Found ${playerRows.length} player rows`);

    let rank = 1;
    for (const row of playerRows) {
      try {
        // Get player info
        const name = await row.$eval('.player-name', (el: Element) => (el as HTMLElement).innerText?.trim() || '');
        const position = await row.$eval('.position', (el: Element) => (el as HTMLElement).innerText?.trim() || '');
        const team = await row.$eval('.team', (el: Element) => (el as HTMLElement).innerText?.trim() || '');
        
        console.log(`Parsing player: ${name} (${position} - ${team})`);
        
        players.push({
          name,
          team,
          position,
          rank
        });
        
        rank++;
      } catch (error) {
        console.error('Error parsing player row:', error);
      }
    }
  } catch (error) {
    console.error('Error parsing players page:', error);
    throw error;
  }

  return players;
}

export async function getFantasyProsRankings(browser: Browser): Promise<PlayerData[]> {
  const page = await browser.newPage();
  
  try {
    console.log('Navigating to FantasyPros Draft Wizard...');
    await page.setViewport({ width: 1920, height: 1080 });
    await page.goto(FANTASY_PROS_URL, { 
      waitUntil: 'networkidle0',
      timeout: PAGE_TIMEOUT 
    });

    // Take a screenshot for debugging
    await page.screenshot({ path: 'debug-fantasypros.png' });
    console.log('Saved debug screenshot to debug-fantasypros.png');

    // Wait for any cookie/consent dialogs and close them
    try {
      const cookieButton = await page.$('[data-testid="cookie-consent-button"]');
      if (cookieButton) {
        await cookieButton.click();
        console.log('Closed cookie dialog');
      }
    } catch (error) {
      console.log('No cookie dialog found');
    }

    // Wait for content to load
    await page.waitForNetworkIdle();
    console.log('Page loaded');

    const players = await parsePlayersPage(page);
    console.log(`Successfully scraped ${players.length} player rankings`);
    return players;
  } catch (error) {
    console.error('Error getting FantasyPros rankings:', error);
    throw error;
  } finally {
    await page.close();
  }
} 