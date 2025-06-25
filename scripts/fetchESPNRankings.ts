import path from 'path';
import fs from 'fs';
import { NFLPlayer, NFLData, NFLStats } from '../src/types/nfl';
import { additionalPlayers } from './additionalPlayers';

export interface ESPNRanking {
  name: string;
  position: string;
  team: string;
  rank: number;
  positionRank: number;
  stats2024?: NFLStats;
  projectedStats2025?: NFLStats;
  college?: string;
  experience?: number;
  jerseyNumber?: string;
  height?: string;
  weight?: string;
  age?: number;
  byeWeek?: number;
  avatarUrl?: string;
}

export function generateProjectedStats(position: string, tier: 'elite' | 'good' | 'average'): NFLStats {
  const stats: NFLStats = {};
  
  switch (position) {
    case 'QB':
      stats.passingYards = tier === 'elite' ? 4500 : tier === 'good' ? 4000 : 3500;
      stats.passingTouchdowns = tier === 'elite' ? 35 : tier === 'good' ? 28 : 22;
      stats.interceptions = tier === 'elite' ? 10 : tier === 'good' ? 12 : 15;
      stats.rushingYards = tier === 'elite' ? 400 : tier === 'good' ? 250 : 150;
      stats.rushingTouchdowns = tier === 'elite' ? 5 : tier === 'good' ? 3 : 2;
      break;
    case 'RB':
      stats.rushingYards = tier === 'elite' ? 1400 : tier === 'good' ? 1100 : 800;
      stats.rushingTouchdowns = tier === 'elite' ? 12 : tier === 'good' ? 8 : 5;
      stats.receptions = tier === 'elite' ? 60 : tier === 'good' ? 45 : 30;
      stats.receivingYards = tier === 'elite' ? 500 : tier === 'good' ? 350 : 200;
      stats.receivingTouchdowns = tier === 'elite' ? 4 : tier === 'good' ? 2 : 1;
      break;
    case 'WR':
      stats.receptions = tier === 'elite' ? 100 : tier === 'good' ? 85 : 70;
      stats.receivingYards = tier === 'elite' ? 1400 : tier === 'good' ? 1100 : 900;
      stats.receivingTouchdowns = tier === 'elite' ? 12 : tier === 'good' ? 8 : 6;
      break;
    case 'TE':
      stats.receptions = tier === 'elite' ? 85 : tier === 'good' ? 70 : 55;
      stats.receivingYards = tier === 'elite' ? 1000 : tier === 'good' ? 800 : 600;
      stats.receivingTouchdowns = tier === 'elite' ? 8 : tier === 'good' ? 6 : 4;
      break;
    case 'K':
      stats.fieldGoalsMade = tier === 'elite' ? 32 : tier === 'good' ? 28 : 24;
      stats.fieldGoalsAttempted = tier === 'elite' ? 35 : tier === 'good' ? 32 : 29;
      stats.extraPointsMade = tier === 'elite' ? 45 : tier === 'good' ? 40 : 35;
      break;
    case 'DEF':
      stats.sacks = tier === 'elite' ? 50 : tier === 'good' ? 42 : 35;
      stats.interceptionsMade = tier === 'elite' ? 18 : tier === 'good' ? 14 : 10;
      stats.fumblesRecovered = tier === 'elite' ? 12 : tier === 'good' ? 9 : 7;
      stats.safeties = tier === 'elite' ? 2 : tier === 'good' ? 1 : 0;
      stats.touchdowns = tier === 'elite' ? 5 : tier === 'good' ? 3 : 2;
      break;
  }
  
  return stats;
}

async function fetchESPNRankings(): Promise<ESPNRanking[]> {
  // This would normally fetch from ESPN's API
  // For now, we'll create a placeholder for the data structure
  const rankings: ESPNRanking[] = [
    // Top RBs
    { 
      name: "Christian McCaffrey", position: "RB", team: "SF", rank: 1, positionRank: 1,
      stats2024: generateProjectedStats("RB", "elite"),
      projectedStats2025: generateProjectedStats("RB", "elite"),
      college: "Stanford", experience: 8, jerseyNumber: "23", height: "5'11\"", weight: "205", age: 27, byeWeek: 9
    },
    { 
      name: "Breece Hall", position: "RB", team: "NYJ", rank: 2, positionRank: 2,
      stats2024: generateProjectedStats("RB", "elite"),
      projectedStats2025: generateProjectedStats("RB", "elite"),
      college: "Iowa State", experience: 3, jerseyNumber: "20", height: "6'1\"", weight: "220", age: 22, byeWeek: 7
    },
    { 
      name: "Jahmyr Gibbs", position: "RB", team: "DET", rank: 3, positionRank: 3,
      stats2024: generateProjectedStats("RB", "good"),
      projectedStats2025: generateProjectedStats("RB", "good"),
      college: "Alabama", experience: 2, jerseyNumber: "26", height: "5'9\"", weight: "199", age: 21, byeWeek: 9
    },
    { 
      name: "Bijan Robinson", position: "RB", team: "ATL", rank: 4, positionRank: 4,
      stats2024: generateProjectedStats("RB", "good"),
      projectedStats2025: generateProjectedStats("RB", "good"),
      college: "Texas", experience: 2, jerseyNumber: "7", height: "6'0\"", weight: "215", age: 22, byeWeek: 11
    },
    { 
      name: "De'Von Achane", position: "RB", team: "MIA", rank: 5, positionRank: 5,
      stats2024: generateProjectedStats("RB", "good"),
      projectedStats2025: generateProjectedStats("RB", "good"),
      college: "Texas A&M", experience: 2, jerseyNumber: "28", height: "5'9\"", weight: "188", age: 22, byeWeek: 10
    },
    
    // Top WRs
    { 
      name: "Justin Jefferson", position: "WR", team: "MIN", rank: 6, positionRank: 1,
      stats2024: generateProjectedStats("WR", "elite"),
      projectedStats2025: generateProjectedStats("WR", "elite"),
      college: "LSU", experience: 5, jerseyNumber: "18", height: "6'1\"", weight: "195", age: 24, byeWeek: 7
    },
    { 
      name: "CeeDee Lamb", position: "WR", team: "DAL", rank: 7, positionRank: 2,
      stats2024: generateProjectedStats("WR", "elite"),
      projectedStats2025: generateProjectedStats("WR", "elite"),
      college: "Oklahoma", experience: 5, jerseyNumber: "88", height: "6'2\"", weight: "200", age: 24, byeWeek: 7
    },
    { 
      name: "Ja'Marr Chase", position: "WR", team: "CIN", rank: 8, positionRank: 3,
      stats2024: generateProjectedStats("WR", "elite"),
      projectedStats2025: generateProjectedStats("WR", "elite"),
      college: "LSU", experience: 4, jerseyNumber: "1", height: "6'0\"", weight: "201", age: 24, byeWeek: 7
    },
    { 
      name: "Amon-Ra St. Brown", position: "WR", team: "DET", rank: 9, positionRank: 4,
      stats2024: generateProjectedStats("WR", "good"),
      projectedStats2025: generateProjectedStats("WR", "good"),
      college: "USC", experience: 4, jerseyNumber: "14", height: "6'0\"", weight: "197", age: 24, byeWeek: 9
    },
    { 
      name: "Garrett Wilson", position: "WR", team: "NYJ", rank: 10, positionRank: 5,
      stats2024: generateProjectedStats("WR", "good"),
      projectedStats2025: generateProjectedStats("WR", "good"),
      college: "Ohio State", experience: 3, jerseyNumber: "17", height: "6'0\"", weight: "192", age: 23, byeWeek: 7
    },
    
    // Top QBs
    { 
      name: "Josh Allen", position: "QB", team: "BUF", rank: 25, positionRank: 1,
      stats2024: generateProjectedStats("QB", "elite"),
      projectedStats2025: generateProjectedStats("QB", "elite"),
      college: "Wyoming", experience: 7, jerseyNumber: "17", height: "6'5\"", weight: "237", age: 27, byeWeek: 7
    },
    { 
      name: "Patrick Mahomes", position: "QB", team: "KC", rank: 26, positionRank: 2,
      stats2024: generateProjectedStats("QB", "elite"),
      projectedStats2025: generateProjectedStats("QB", "elite"),
      college: "Texas Tech", experience: 8, jerseyNumber: "15", height: "6'2\"", weight: "225", age: 28, byeWeek: 10
    },
    { 
      name: "Jalen Hurts", position: "QB", team: "PHI", rank: 35, positionRank: 3,
      stats2024: generateProjectedStats("QB", "good"),
      projectedStats2025: generateProjectedStats("QB", "good"),
      college: "Oklahoma", experience: 5, jerseyNumber: "1", height: "6'1\"", weight: "223", age: 25, byeWeek: 10
    },
    { 
      name: "Lamar Jackson", position: "QB", team: "BAL", rank: 45, positionRank: 4,
      stats2024: generateProjectedStats("QB", "good"),
      projectedStats2025: generateProjectedStats("QB", "good"),
      college: "Louisville", experience: 7, jerseyNumber: "8", height: "6'2\"", weight: "212", age: 27, byeWeek: 13
    },
    
    // Top TEs
    { 
      name: "Sam LaPorta", position: "TE", team: "DET", rank: 30, positionRank: 1,
      stats2024: generateProjectedStats("TE", "elite"),
      projectedStats2025: generateProjectedStats("TE", "elite"),
      college: "Iowa", experience: 2, jerseyNumber: "87", height: "6'3\"", weight: "245", age: 22, byeWeek: 9
    },
    { 
      name: "Travis Kelce", position: "TE", team: "KC", rank: 31, positionRank: 2,
      stats2024: generateProjectedStats("TE", "elite"),
      projectedStats2025: generateProjectedStats("TE", "elite"),
      college: "Cincinnati", experience: 12, jerseyNumber: "87", height: "6'5\"", weight: "256", age: 34, byeWeek: 10
    },
    { 
      name: "Trey McBride", position: "TE", team: "ARI", rank: 40, positionRank: 3,
      stats2024: generateProjectedStats("TE", "good"),
      projectedStats2025: generateProjectedStats("TE", "good"),
      college: "Colorado State", experience: 3, jerseyNumber: "85", height: "6'4\"", weight: "246", age: 24, byeWeek: 8
    },
    
    // Top Ks
    { 
      name: "Justin Tucker", position: "K", team: "BAL", rank: 160, positionRank: 1,
      stats2024: generateProjectedStats("K", "elite"),
      projectedStats2025: generateProjectedStats("K", "elite"),
      college: "Texas", experience: 13, jerseyNumber: "9", height: "6'1\"", weight: "188", age: 34, byeWeek: 13
    },
    { 
      name: "Brandon Aubrey", position: "K", team: "DAL", rank: 161, positionRank: 2,
      stats2024: generateProjectedStats("K", "elite"),
      projectedStats2025: generateProjectedStats("K", "elite"),
      college: "Notre Dame", experience: 2, jerseyNumber: "17", height: "6'3\"", weight: "205", age: 28, byeWeek: 7
    },
    { 
      name: "Dustin Hopkins", position: "K", team: "LAC", rank: 162, positionRank: 3,
      stats2024: generateProjectedStats("K", "good"),
      projectedStats2025: generateProjectedStats("K", "good"),
      college: "Florida State", experience: 11, jerseyNumber: "6", height: "6'2\"", weight: "193", age: 33, byeWeek: 5
    },
    
    // Top DEF
    { 
      name: "San Francisco 49ers", position: "DEF", team: "SF", rank: 150, positionRank: 1,
      stats2024: generateProjectedStats("DEF", "elite"),
      projectedStats2025: generateProjectedStats("DEF", "elite"),
      byeWeek: 9
    },
    { 
      name: "Baltimore Ravens", position: "DEF", team: "BAL", rank: 151, positionRank: 2,
      stats2024: generateProjectedStats("DEF", "elite"),
      projectedStats2025: generateProjectedStats("DEF", "elite"),
      byeWeek: 13
    },
    { 
      name: "Dallas Cowboys", position: "DEF", team: "DAL", rank: 152, positionRank: 3,
      stats2024: generateProjectedStats("DEF", "good"),
      projectedStats2025: generateProjectedStats("DEF", "good"),
      byeWeek: 7
    }
  ];

  // Add avatar URLs for all players
  rankings.forEach(player => {
    const safeName = player.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    player.avatarUrl = `https://a.espncdn.com/i/headshots/nfl/players/full/${safeName}.png`;
  });

  // Add additional players
  return [...rankings, ...additionalPlayers];
}

async function updateESPNRankings() {
  try {
    // Load existing NFL data
    const nflDataPath = path.join(__dirname, '../data/nflPlayers.json');
    const nflData: NFLData = JSON.parse(fs.readFileSync(nflDataPath, 'utf-8'));
    
    // Fetch latest ESPN rankings
    const rankings = await fetchESPNRankings();
    
    // Create a map of player names to rankings for quick lookup
    const rankingsMap = new Map(rankings.map(r => [r.name, r]));
    
    // Create a map of existing players for quick lookup
    const existingPlayers = new Map(nflData.players.map((p: NFLPlayer) => [p.fullName, p]));
    
    const updatedPlayers: NFLPlayer[] = [];

    // First add all players from ESPN rankings in their order
    for (const ranking of rankings) {
      const existingPlayer = existingPlayers.get(ranking.name);
      if (existingPlayer) {
        updatedPlayers.push({
          ...existingPlayer,
          position: ranking.position,
          team: ranking.team,
          overallRank: ranking.rank,
          positionRank: ranking.positionRank,
          stats2024: ranking.stats2024,
          projectedStats2025: ranking.projectedStats2025,
          college: ranking.college,
          experience: ranking.experience,
          jerseyNumber: ranking.jerseyNumber,
          height: ranking.height,
          weight: ranking.weight,
          age: ranking.age,
          byeWeek: ranking.byeWeek,
          avatarUrl: ranking.avatarUrl,
          lastUpdated: new Date().toISOString()
        });
      } else {
        // Create new player entry if not found
        const [firstName, ...lastNameParts] = ranking.name.split(' ');
        const lastName = lastNameParts.join(' ');
        updatedPlayers.push({
          id: `${ranking.name}-${ranking.team}-${ranking.position}`.replace(/\s+/g, '-').toLowerCase(),
          firstName,
          lastName,
          fullName: ranking.name,
          position: ranking.position,
          team: ranking.team,
          overallRank: ranking.rank,
          positionRank: ranking.positionRank,
          stats2024: ranking.stats2024,
          projectedStats2025: ranking.projectedStats2025,
          college: ranking.college,
          experience: ranking.experience,
          jerseyNumber: ranking.jerseyNumber,
          height: ranking.height,
          weight: ranking.weight,
          age: ranking.age,
          byeWeek: ranking.byeWeek,
          avatarUrl: ranking.avatarUrl,
          status: 'active',
          lastUpdated: new Date().toISOString()
        });
      }
    }

    // Add any remaining players from original data that weren't in ESPN data
    for (const player of nflData.players) {
      if (!rankingsMap.has(player.fullName)) {
        updatedPlayers.push({
          ...player,
          overallRank: 999,
          positionRank: 999,
          lastUpdated: new Date().toISOString()
        });
      }
    }

    // Sort players by overall rank
    updatedPlayers.sort((a, b) => (a.overallRank || 999) - (b.overallRank || 999));

    // Update the players array and lastUpdated timestamp
    nflData.players = updatedPlayers;
    nflData.lastUpdated = new Date().toISOString();

    // Save updated data
    fs.writeFileSync(nflDataPath, JSON.stringify(nflData, null, 2));
    console.log('\nESPN Rankings Update Results:');
    console.log(`Total NFL players: ${nflData.players.length}`);
    console.log(`Players with rankings: ${rankings.length}`);

    // Copy to public directory for client access
    const publicDataDir = path.join(process.cwd(), 'public', 'data');
    if (!fs.existsSync(publicDataDir)) {
      fs.mkdirSync(publicDataDir, { recursive: true });
    }
    const publicDataPath = path.join(publicDataDir, 'nflPlayers.json');
    fs.copyFileSync(nflDataPath, publicDataPath);
    
    console.log('Rankings updated successfully!');
  } catch (error) {
    console.error('Error updating rankings:', error);
    throw error;
  }
}

// Export for use in other files
export { updateESPNRankings };

// Run if called directly
if (require.main === module) {
  updateESPNRankings()
    .then(() => console.log('Update complete'))
    .catch(console.error);
} 