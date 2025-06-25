import * as fs from 'fs';
import * as path from 'path';
import puppeteer from 'puppeteer';
import { getProjections, getLastSeasonPoints } from '../src/services/espnFantasyService';

interface PlayerData {
  overallRank: number;
  positionRank: number;
  team: string;
  position: string;
  byeWeek: number;
  fantasyPoints2024: number;
  projectedFantasyPoints2025: number;
  avatarUrl: string;
  avatarFallback: string;
}

interface RankingsData {
  [playerName: string]: PlayerData;
}

async function updateFantasyPoints() {
  let browser;
  
  try {
    console.log('🚀 Starting fantasy points update...');
    
    // Load current rankings
    const rankingsPath = path.join(__dirname, '../data/fantasyProsRankings.json');
    const rankings: RankingsData = JSON.parse(fs.readFileSync(rankingsPath, 'utf8'));
    
    console.log(`📊 Loaded ${Object.keys(rankings).length} players from rankings`);
    
    // Launch browser
    console.log('🌐 Launching browser...');
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
    console.log('📈 Fetching 2025 projections from ESPN...');
    const projections = await getProjections(browser);
    console.log(`✅ Got ${projections.length} player projections`);

    // Get 2024 stats
    console.log('📊 Fetching 2024 stats from ESPN...');
    const stats2024 = await getLastSeasonPoints(browser);
    console.log(`✅ Got stats for ${Object.keys(stats2024).length} players`);

    // Create lookup maps for easier matching
    const projectionsMap = new Map<string, number>();
    const statsMap = new Map<string, number>();

    projections.forEach(player => {
      projectionsMap.set(player.name, player.projectedPoints);
    });

    Object.entries(stats2024).forEach(([name, points]) => {
      statsMap.set(name, points);
    });

    // Update rankings with real data
    console.log('🔄 Updating player data with real fantasy points...');
    let updatedCount = 0;
    let notFoundCount = 0;

    for (const [playerName, playerData] of Object.entries(rankings)) {
      const projection2025 = projectionsMap.get(playerName);
      const stats2024Points = statsMap.get(playerName);

      if (projection2025 !== undefined) {
        playerData.projectedFantasyPoints2025 = projection2025;
        updatedCount++;
      }

      if (stats2024Points !== undefined) {
        playerData.fantasyPoints2024 = stats2024Points;
        updatedCount++;
      } else {
        // For rookies or players who didn't play in 2024, keep 0
        if (playerData.fantasyPoints2024 === 0) {
          // This is expected for rookies
        } else {
          notFoundCount++;
          console.log(`⚠️  No 2024 stats found for: ${playerName}`);
        }
      }
    }

    // Save updated rankings
    console.log('💾 Saving updated rankings...');
    fs.writeFileSync(rankingsPath, JSON.stringify(rankings, null, 2));
    
    console.log('\n📋 Update Summary:');
    console.log(`✅ Successfully updated ${updatedCount} data points`);
    console.log(`⚠️  ${notFoundCount} players not found in ESPN data`);
    console.log(`📁 Updated file saved to: ${rankingsPath}`);

    // Show some examples of updated data
    console.log('\n📊 Sample Updated Players:');
    const samplePlayers = Object.entries(rankings).slice(0, 5);
    samplePlayers.forEach(([name, data]) => {
      console.log(`${name}: 2024=${data.fantasyPoints2024}, 2025=${data.projectedFantasyPoints2025}`);
    });

  } catch (error) {
    console.error('❌ Error updating fantasy points:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
      console.log('🔒 Browser closed');
    }
  }
}

// Run the update
updateFantasyPoints()
  .then(() => {
    console.log('🎉 Fantasy points update completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Fantasy points update failed:', error);
    process.exit(1);
  }); 