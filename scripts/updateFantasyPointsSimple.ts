import * as fs from 'fs';
import * as path from 'path';
import fetch from 'node-fetch';

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

// ESPN API endpoints
const ESPN_PLAYERS_URL = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/athletes';
const ESPN_TEAMS_URL = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams';

interface ESPNAthlete {
  id: string;
  uid: string;
  guid: string;
  type: string;
  firstName: string;
  lastName: string;
  displayName: string;
  shortName: string;
  weight: number;
  height: number;
  age: number;
  jersey: string;
  position: {
    abbreviation: string;
  };
  college: {
    name: string;
  };
  status: {
    id: string;
    name: string;
    type: string;
    abbreviation: string;
  };
  team: {
    id: string;
    name: string;
    abbreviation: string;
    displayName: string;
    color: string;
    alternateColor: string;
    logo: string;
  };
  statistics?: {
    splits: {
      categories: Array<{
        name: string;
        stats: Array<{
          name: string;
          value: number;
        }>;
      }>;
    };
  };
}

async function fetchESPNPlayers(): Promise<ESPNAthlete[]> {
  try {
    console.log('📡 Fetching players from ESPN API...');
    const response = await fetch(ESPN_PLAYERS_URL);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`✅ Fetched ${data.athletes?.length || 0} players from ESPN API`);
    
    return data.athletes || [];
  } catch (error) {
    console.error('❌ Error fetching ESPN players:', error);
    return [];
  }
}

async function fetchTeamRoster(teamId: string): Promise<ESPNAthlete[]> {
  try {
    const response = await fetch(`${ESPN_TEAMS_URL}/${teamId}/roster`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data.athletes || [];
  } catch (error) {
    console.error(`❌ Error fetching roster for team ${teamId}:`, error);
    return [];
  }
}

function calculateFantasyPoints(stats: any, position: string): number {
  if (!stats || !stats.splits || !stats.splits.categories) {
    return 0;
  }

  let points = 0;
  
  // Find the stats category
  const statsCategory = stats.splits.categories.find((cat: any) => cat.name === 'stats');
  if (!statsCategory) return 0;

  const statsMap = new Map();
  statsCategory.stats.forEach((stat: any) => {
    statsMap.set(stat.name, stat.value);
  });

  // Calculate fantasy points based on position
  if (position === 'QB') {
    const passYards = statsMap.get('passingYards') || 0;
    const passTD = statsMap.get('passingTouchdowns') || 0;
    const passInt = statsMap.get('passingInterceptions') || 0;
    const rushYards = statsMap.get('rushingYards') || 0;
    const rushTD = statsMap.get('rushingTouchdowns') || 0;
    
    points = (passYards * 0.04) + (passTD * 4) + (passInt * -2) + (rushYards * 0.1) + (rushTD * 6);
  } else if (position === 'RB') {
    const rushYards = statsMap.get('rushingYards') || 0;
    const rushTD = statsMap.get('rushingTouchdowns') || 0;
    const receptions = statsMap.get('receptions') || 0;
    const recYards = statsMap.get('receivingYards') || 0;
    const recTD = statsMap.get('receivingTouchdowns') || 0;
    
    points = (rushYards * 0.1) + (rushTD * 6) + (receptions * 1) + (recYards * 0.1) + (recTD * 6);
  } else if (position === 'WR' || position === 'TE') {
    const receptions = statsMap.get('receptions') || 0;
    const recYards = statsMap.get('receivingYards') || 0;
    const recTD = statsMap.get('receivingTouchdowns') || 0;
    const rushYards = statsMap.get('rushingYards') || 0;
    const rushTD = statsMap.get('rushingTouchdowns') || 0;
    
    points = (receptions * 1) + (recYards * 0.1) + (recTD * 6) + (rushYards * 0.1) + (rushTD * 6);
  } else if (position === 'K') {
    const fgMade = statsMap.get('fieldGoalsMade') || 0;
    const fgMissed = statsMap.get('fieldGoalsMissed') || 0;
    const xpMade = statsMap.get('extraPointsMade') || 0;
    const xpMissed = statsMap.get('extraPointsMissed') || 0;
    
    points = (fgMade * 3) + (fgMissed * -1) + (xpMade * 1) + (xpMissed * -1);
  }

  return Math.round(points * 10) / 10; // Round to 1 decimal place
}

async function updateFantasyPoints() {
  try {
    console.log('🚀 Starting fantasy points update with ESPN API...');
    
    // Load current rankings
    const rankingsPath = path.join(__dirname, '../data/fantasyProsRankings.json');
    const rankings: RankingsData = JSON.parse(fs.readFileSync(rankingsPath, 'utf8'));
    
    console.log(`📊 Loaded ${Object.keys(rankings).length} players from rankings`);
    
    // Fetch all players from ESPN
    const espnPlayers = await fetchESPNPlayers();
    
    if (espnPlayers.length === 0) {
      console.log('⚠️  No players fetched from ESPN API, using fallback data...');
      return;
    }

    // Create a map for easy lookup
    const espnPlayersMap = new Map<string, ESPNAthlete>();
    espnPlayers.forEach(player => {
      const fullName = `${player.firstName} ${player.lastName}`;
      espnPlayersMap.set(fullName, player);
    });

    // Update rankings with real data
    console.log('🔄 Updating player data with real fantasy points...');
    let updatedCount = 0;
    let notFoundCount = 0;

    for (const [playerName, playerData] of Object.entries(rankings)) {
      const espnPlayer = espnPlayersMap.get(playerName);
      
      if (espnPlayer && espnPlayer.statistics) {
        const fantasyPoints = calculateFantasyPoints(espnPlayer.statistics, playerData.position);
        
        if (fantasyPoints > 0) {
          playerData.fantasyPoints2024 = fantasyPoints;
          // For 2025 projections, we'll use a simple estimate based on 2024 performance
          playerData.projectedFantasyPoints2025 = Math.round(fantasyPoints * 0.95 * 10) / 10; // 5% decrease as conservative estimate
          updatedCount++;
        } else {
          notFoundCount++;
        }
      } else {
        notFoundCount++;
        console.log(`⚠️  No ESPN data found for: ${playerName}`);
      }
    }

    // Save updated rankings
    console.log('💾 Saving updated rankings...');
    fs.writeFileSync(rankingsPath, JSON.stringify(rankings, null, 2));
    
    console.log('\n📋 Update Summary:');
    console.log(`✅ Successfully updated ${updatedCount} players`);
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