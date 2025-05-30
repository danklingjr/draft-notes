import * as fs from 'fs';
import * as path from 'path';
import nodeFetch from 'node-fetch';
import { load } from 'cheerio';
import { NFLPlayer } from '../src/services/nflService';

interface ADPData {
  name: string;
  team: string;
  position: string;
  adp: number;
  positionRank: number;
  overallRank: number;
}

interface NFLData {
  lastUpdated: string;
  players: NFLPlayer[];
}

// Map both abbreviations and common variations to full team names
const teamNameMap: { [key: string]: string } = {
  // Abbreviations
  'ARI': 'Arizona Cardinals',
  'ATL': 'Atlanta Falcons',
  'BAL': 'Baltimore Ravens',
  'BUF': 'Buffalo Bills',
  'CAR': 'Carolina Panthers',
  'CHI': 'Chicago Bears',
  'CIN': 'Cincinnati Bengals',
  'CLE': 'Cleveland Browns',
  'DAL': 'Dallas Cowboys',
  'DEN': 'Denver Broncos',
  'DET': 'Detroit Lions',
  'GB': 'Green Bay Packers',
  'HOU': 'Houston Texans',
  'IND': 'Indianapolis Colts',
  'JAC': 'Jacksonville Jaguars',
  'JAX': 'Jacksonville Jaguars',
  'KC': 'Kansas City Chiefs',
  'LV': 'Las Vegas Raiders',
  'LAC': 'Los Angeles Chargers',
  'LAR': 'Los Angeles Rams',
  'MIA': 'Miami Dolphins',
  'MIN': 'Minnesota Vikings',
  'NE': 'New England Patriots',
  'NO': 'New Orleans Saints',
  'NYG': 'New York Giants',
  'NYJ': 'New York Jets',
  'PHI': 'Philadelphia Eagles',
  'PIT': 'Pittsburgh Steelers',
  'SF': 'San Francisco 49ers',
  'SEA': 'Seattle Seahawks',
  'TB': 'Tampa Bay Buccaneers',
  'TEN': 'Tennessee Titans',
  'WAS': 'Washington Commanders',
  
  // Common variations
  'Arizona': 'Arizona Cardinals',
  'Atlanta': 'Atlanta Falcons',
  'Baltimore': 'Baltimore Ravens',
  'Buffalo': 'Buffalo Bills',
  'Carolina': 'Carolina Panthers',
  'Chicago': 'Chicago Bears',
  'Cincinnati': 'Cincinnati Bengals',
  'Cleveland': 'Cleveland Browns',
  'Dallas': 'Dallas Cowboys',
  'Denver': 'Denver Broncos',
  'Detroit': 'Detroit Lions',
  'Green Bay': 'Green Bay Packers',
  'Houston': 'Houston Texans',
  'Indianapolis': 'Indianapolis Colts',
  'Jacksonville': 'Jacksonville Jaguars',
  'Kansas City': 'Kansas City Chiefs',
  'Las Vegas': 'Las Vegas Raiders',
  'Los Angeles Chargers': 'Los Angeles Chargers',
  'Los Angeles Rams': 'Los Angeles Rams',
  'Miami': 'Miami Dolphins',
  'Minnesota': 'Minnesota Vikings',
  'New England': 'New England Patriots',
  'New Orleans': 'New Orleans Saints',
  'New York Giants': 'New York Giants',
  'New York Jets': 'New York Jets',
  'Philadelphia': 'Philadelphia Eagles',
  'Pittsburgh': 'Pittsburgh Steelers',
  'San Francisco': 'San Francisco 49ers',
  'Seattle': 'Seattle Seahawks',
  'Tampa Bay': 'Tampa Bay Buccaneers',
  'Tennessee': 'Tennessee Titans',
  'Washington': 'Washington Commanders',
  
  // Legacy names that might appear
  'Raiders': 'Las Vegas Raiders',
  'Commanders': 'Washington Commanders',
  'Football Team': 'Washington Commanders',
  'Redskins': 'Washington Commanders'
};

function normalizeTeamName(team: string): string {
  // Remove common suffixes and clean up the name
  const cleanTeam = team
    .replace(/\s*(Football Team|Commanders|Raiders|Cardinals|Falcons|Ravens|Bills|Panthers|Bears|Bengals|Browns|Cowboys|Broncos|Lions|Packers|Texans|Colts|Jaguars|Chiefs|Chargers|Rams|Dolphins|Vikings|Patriots|Saints|Giants|Jets|Eagles|Steelers|49ers|Seahawks|Buccaneers|Titans)$/, '')
    .trim();

  // Try to find a match in our map
  return teamNameMap[cleanTeam] || teamNameMap[team] || team;
}

async function fetchFantasyProsADP(): Promise<ADPData[]> {
  try {
    console.log('Using mock ADP data for testing...');
    const positions = ['QB', 'RB', 'WR', 'TE'];
    const mockPlayers: ADPData[] = [];
    let overallRank = 1;

    // Generate mock ADP data for each position
    positions.forEach(position => {
      const playersPerPosition = position === 'QB' ? 32 : position === 'TE' ? 24 : 50;
      for (let i = 1; i <= playersPerPosition; i++) {
        // Add some variance to ADP
        const variance = Math.random() * 5 - 2.5; // Random number between -2.5 and 2.5
        const adp = overallRank + variance;

        // Top players from each position
        let name = '';
        let team = '';
        
        if (position === 'QB') {
          const qbs = [
            ['Patrick Mahomes', 'Kansas City Chiefs'],
            ['Josh Allen', 'Buffalo Bills'],
            ['Jalen Hurts', 'Philadelphia Eagles'],
            ['Lamar Jackson', 'Baltimore Ravens'],
            ['Justin Herbert', 'Los Angeles Chargers'],
            ['Joe Burrow', 'Cincinnati Bengals'],
            ['Trevor Lawrence', 'Jacksonville Jaguars'],
            ['Justin Fields', 'New York Jets'],
            ['Dak Prescott', 'Dallas Cowboys'],
            ['Tua Tagovailoa', 'Miami Dolphins']
          ];
          [name, team] = i <= qbs.length ? qbs[i - 1] : [`QB${i}`, 'Team'];
        } else if (position === 'RB') {
          const rbs = [
            ['Christian McCaffrey', 'San Francisco 49ers'],
            ['Bijan Robinson', 'Atlanta Falcons'],
            ['Breece Hall', 'New York Jets'],
            ['Saquon Barkley', 'Philadelphia Eagles'],
            ['Tony Pollard', 'Tennessee Titans'],
            ['Travis Etienne Jr.', 'Jacksonville Jaguars'],
            ['Jahmyr Gibbs', 'Detroit Lions'],
            ['Josh Jacobs', 'Green Bay Packers'],
            ['Kenneth Walker III', 'Seattle Seahawks'],
            ['Rachaad White', 'Tampa Bay Buccaneers']
          ];
          [name, team] = i <= rbs.length ? rbs[i - 1] : [`RB${i}`, 'Team'];
        } else if (position === 'WR') {
          const wrs = [
            ['Justin Jefferson', 'Minnesota Vikings'],
            ['Ja\'Marr Chase', 'Cincinnati Bengals'],
            ['Tyreek Hill', 'Miami Dolphins'],
            ['CeeDee Lamb', 'Dallas Cowboys'],
            ['A.J. Brown', 'Philadelphia Eagles'],
            ['Stefon Diggs', 'New England Patriots'],
            ['Davante Adams', 'Los Angeles Rams'],
            ['Cooper Kupp', 'Seattle Seahawks'],
            ['Garrett Wilson', 'New York Jets'],
            ['DeVonta Smith', 'Philadelphia Eagles']
          ];
          [name, team] = i <= wrs.length ? wrs[i - 1] : [`WR${i}`, 'Team'];
        } else {
          const tes = [
            ['Travis Kelce', 'Kansas City Chiefs'],
            ['Mark Andrews', 'Baltimore Ravens'],
            ['T.J. Hockenson', 'Minnesota Vikings'],
            ['Dallas Goedert', 'Philadelphia Eagles'],
            ['George Kittle', 'San Francisco 49ers'],
            ['Kyle Pitts', 'Atlanta Falcons'],
            ['David Njoku', 'Cleveland Browns'],
            ['Dalton Schultz', 'Houston Texans'],
            ['Pat Freiermuth', 'Pittsburgh Steelers'],
            ['Cole Kmet', 'Chicago Bears']
          ];
          [name, team] = i <= tes.length ? tes[i - 1] : [`TE${i}`, 'Team'];
        }

        mockPlayers.push({
          name,
          team,
          position,
          adp,
          positionRank: i,
          overallRank
        });
        overallRank++;
      }
    });

    console.log(`Created ${mockPlayers.length} mock players with ADP data`);
    return mockPlayers;
  } catch (error) {
    console.error('Error creating mock ADP data:', error);
    return [];
  }
}

async function mergeADPData() {
  try {
    // Read existing NFL player data
    const nflDataPath = path.join(process.cwd(), 'src', 'data', 'nflPlayers.json');
    const nflData: NFLData = JSON.parse(fs.readFileSync(nflDataPath, 'utf8'));

    // Fetch ADP data
    const adpData = await fetchFantasyProsADP();

    // Create maps for quick lookups
    const adpMap = new Map<string, ADPData>();
    const adpNameMap = new Map<string, ADPData>();
    const adpPositionMap = new Map<string, ADPData[]>();

    // Build lookup maps
    adpData.forEach(player => {
      // Full key with team and position
      const key = `${player.name.toLowerCase()}-${normalizeTeamName(player.team)}-${player.position}`;
      adpMap.set(key, player);

      // Name-only key for fallback
      const nameKey = `${player.name.toLowerCase()}-${player.position}`;
      adpNameMap.set(nameKey, player);

      // Position-based key for overall rank fallback
      const posPlayers = adpPositionMap.get(player.position) || [];
      posPlayers.push(player);
      adpPositionMap.set(player.position, posPlayers);
    });

    // Sort position maps by overall rank
    for (const [pos, players] of adpPositionMap.entries()) {
      adpPositionMap.set(pos, players.sort((a, b) => a.overallRank - b.overallRank));
    }

    // Get the highest ADP value from FantasyPros data
    const maxFantasyProsADP = Math.max(...adpData.map(p => p.adp));

    // Update NFL players with ADP data
    let playersWithADP = 0;
    let playersWithFallbackRank = 0;
    const playersWithoutADP: string[] = [];

    // First pass: Assign ADP to players with direct matches
    nflData.players = nflData.players.map((player: NFLPlayer) => {
      // Try to find ADP data by name and team
      const key = `${player.fullName.toLowerCase()}-${normalizeTeamName(player.team)}-${player.position}`;
      const nameKey = `${player.fullName.toLowerCase()}-${player.position}`;
      
      const adpInfo = adpMap.get(key) || adpNameMap.get(nameKey);
      
      if (adpInfo) {
        playersWithADP++;
        return {
          ...player,
          adp: adpInfo.adp,
          positionRank: adpInfo.positionRank,
          overallRank: adpInfo.overallRank,
          hasActualADP: true // Mark players with actual ADP data
        };
      } else {
        // For players without ADP, we'll assign values in the second pass
        playersWithoutADP.push(`${player.fullName} (${player.position} - ${player.team})`);
        return {
          ...player,
          hasActualADP: false
        };
      }
    });

    // Group players by position
    const positionGroups = new Map<string, NFLPlayer[]>();
    nflData.players.forEach(player => {
      const posPlayers = positionGroups.get(player.position) || [];
      posPlayers.push(player);
      positionGroups.set(player.position, posPlayers);
    });

    // Sort and assign fallback ranks for each position group
    let nextOverallRank = maxFantasyProsADP + 1;
    const sortedPlayers: NFLPlayer[] = [];

    // First, add all players with actual ADP
    const playersWithActualADP = nflData.players
      .filter(p => p.hasActualADP)
      .sort((a, b) => (a.adp || 0) - (b.adp || 0));
    sortedPlayers.push(...playersWithActualADP);

    // Then, handle players without ADP by position
    const positions = ['QB', 'RB', 'WR', 'TE', 'K', 'DEF', 'FB'];
    positions.forEach(pos => {
      const posPlayers = nflData.players
        .filter(p => p.position === pos && !p.hasActualADP)
        .map(player => ({
          ...player,
          adp: nextOverallRank,
          positionRank: playersWithActualADP.filter(p => p.position === pos).length + 1,
          overallRank: nextOverallRank++
        }));
      sortedPlayers.push(...posPlayers);
      playersWithFallbackRank += posPlayers.length;
    });

    // Update the players array with the sorted results
    nflData.players = sortedPlayers;

    // Update lastUpdated timestamp
    nflData.lastUpdated = new Date().toISOString();

    // Save updated data
    fs.writeFileSync(nflDataPath, JSON.stringify(nflData, null, 2));
    console.log('\nADP Data Merge Results:');
    console.log(`Total NFL players: ${nflData.players.length}`);
    console.log(`Total ADP entries: ${adpData.length}`);
    console.log(`Players with ADP data: ${playersWithADP}`);
    console.log(`Players with fallback ranking: ${playersWithFallbackRank}`);
    console.log('\nPlayers without ADP data:');
    playersWithoutADP.forEach(player => console.log(player));

    // Copy to public directory
    const publicDataDir = path.join(process.cwd(), 'public', 'data');
    if (!fs.existsSync(publicDataDir)) {
      fs.mkdirSync(publicDataDir, { recursive: true });
    }
    const publicDataPath = path.join(publicDataDir, 'nflPlayers.json');
    fs.copyFileSync(nflDataPath, publicDataPath);
    console.log('\nUpdated NFL data file with ADP information');
    console.log('Copied updated data to public directory');
  } catch (error) {
    console.error('Error merging ADP data:', error);
  }
}

// Run the update
mergeADPData().catch(console.error); 