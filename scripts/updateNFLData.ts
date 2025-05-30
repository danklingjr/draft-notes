const fs = require('fs');
const path = require('path');
const nodeFetch = require('node-fetch');

// Load Fantasy Pros rankings
const rankingsPath = path.join(__dirname, '../data/fantasyProsRankings.json');
const FANTASY_PROS_RANKINGS = JSON.parse(fs.readFileSync(rankingsPath, 'utf8'));

// ESPN API endpoints
const TEAMS_URL = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams';
const ROSTER_URL = (teamAbbrev: string) => `https://site.web.api.espn.com/apis/common/v3/sports/football/nfl/teams/${teamAbbrev}/roster`;

// List of offensive positions we want to include
const OFFENSIVE_POSITIONS = ['QB', 'RB', 'WR', 'TE', 'K'];

// Position group mapping
const POSITION_GROUP_TYPES = ['offense', 'specialTeam'];

// NFL team names type
type NFLTeamName = 
  | 'Arizona Cardinals' | 'Atlanta Falcons' | 'Baltimore Ravens' | 'Buffalo Bills'
  | 'Carolina Panthers' | 'Chicago Bears' | 'Cincinnati Bengals' | 'Cleveland Browns'
  | 'Dallas Cowboys' | 'Denver Broncos' | 'Detroit Lions' | 'Green Bay Packers'
  | 'Houston Texans' | 'Indianapolis Colts' | 'Jacksonville Jaguars' | 'Kansas City Chiefs'
  | 'Las Vegas Raiders' | 'Los Angeles Chargers' | 'Los Angeles Rams' | 'Miami Dolphins'
  | 'Minnesota Vikings' | 'New England Patriots' | 'New Orleans Saints' | 'New York Giants'
  | 'New York Jets' | 'Philadelphia Eagles' | 'Pittsburgh Steelers' | 'San Francisco 49ers'
  | 'Seattle Seahawks' | 'Tampa Bay Buccaneers' | 'Tennessee Titans' | 'Washington Commanders';

interface NFLPlayer {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  position: string;
  team: NFLTeamName;
  jerseyNumber?: string;
  height?: string;
  weight?: string;
  age?: number;
  experience?: number;
  college?: string;
  status?: string;
  photoUrl?: string;
  byeWeek?: number;
  overallRank?: number;
  positionRank?: number;
}

interface CacheData {
  lastUpdated: string;
  players: NFLPlayer[];
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// 2025 NFL Bye Week Schedule
const TEAM_BYE_WEEKS: Record<NFLTeamName, number> = {
  'Arizona Cardinals': 8,
  'Atlanta Falcons': 5,
  'Baltimore Ravens': 7,
  'Buffalo Bills': 7,
  'Carolina Panthers': 14,
  'Chicago Bears': 5,
  'Cincinnati Bengals': 10,
  'Cleveland Browns': 9,
  'Dallas Cowboys': 10,
  'Denver Broncos': 12,
  'Detroit Lions': 8,
  'Green Bay Packers': 5,
  'Houston Texans': 6,
  'Indianapolis Colts': 11,
  'Jacksonville Jaguars': 8,
  'Kansas City Chiefs': 10,
  'Las Vegas Raiders': 8,
  'Los Angeles Chargers': 12,
  'Los Angeles Rams': 8,
  'Miami Dolphins': 12,
  'Minnesota Vikings': 6,
  'New England Patriots': 14,
  'New Orleans Saints': 11,
  'New York Giants': 14,
  'New York Jets': 9,
  'Philadelphia Eagles': 9,
  'Pittsburgh Steelers': 5,
  'San Francisco 49ers': 14,
  'Seattle Seahawks': 8,
  'Tampa Bay Buccaneers': 9,
  'Tennessee Titans': 10,
  'Washington Commanders': 12
};

// Fantasy Pros consensus rankings data structure
interface FantasyProsRankings {
  [key: string]: {
    overallRank: number;
    positionRank: number;
  };
}

// Helper function to get Fantasy Pros rankings for a player
function getFantasyProsRankings(player: NFLPlayer) {
  // Try different name formats
  const variations = [
    player.fullName,
    `${player.firstName} ${player.lastName}`,
    player.position === 'DEF' ? `${player.team} Defense` : undefined
  ].filter((name): name is string => name !== undefined);

  for (const name of variations) {
    if (FANTASY_PROS_RANKINGS[name]) {
      return FANTASY_PROS_RANKINGS[name];
    }
  }

  // For unranked players, assign very high ranks based on position
  // This ensures they appear at the end but don't all group together
  const positionBaseRanks: Record<string, number> = {
    'QB': 10000,
    'RB': 11000,
    'WR': 12000,
    'TE': 13000,
    'K': 14000,
    'DEF': 15000
  };

  const baseRank = positionBaseRanks[player.position] || 16000;
  // Add some randomness to spread out players within their position groups
  const randomOffset = Math.floor(Math.random() * 100);
  
  return {
    overallRank: baseRank + randomOffset,
    positionRank: 999
  };
}

async function fetchTeamPlayers(): Promise<NFLPlayer[]> {
  const allPlayers: NFLPlayer[] = [];
  
  try {
    // First get all teams
    console.log('Fetching NFL teams...');
    const teamsResponse = await nodeFetch(TEAMS_URL);
    if (!teamsResponse.ok) {
      throw new Error(`HTTP error! status: ${teamsResponse.status}`);
    }
    const teamsData = await teamsResponse.json();
    
    // Add team defenses first
    if (teamsData.sports?.[0]?.leagues?.[0]?.teams) {
      for (const teamEntry of teamsData.sports[0].leagues[0].teams) {
        const team = teamEntry.team;
        const teamName = team.displayName as NFLTeamName;
        // Create team defense entry
        const teamDef: NFLPlayer = {
          id: `DEF_${team.id}`,
          firstName: teamName,
          lastName: 'Defense',
          fullName: `${teamName} Defense`,
          position: 'DEF',
          team: teamName,
          photoUrl: team.logo,
          byeWeek: TEAM_BYE_WEEKS[teamName]
        };
        
        // Add Fantasy Pros rankings
        const rankings = getFantasyProsRankings(teamDef);
        teamDef.overallRank = rankings.overallRank;
        teamDef.positionRank = rankings.positionRank;
        
        allPlayers.push(teamDef);
        console.log(`Added team defense: ${teamDef.fullName}`);
      }
    }
    
    // Process each team for offensive players and kickers
    if (teamsData.sports?.[0]?.leagues?.[0]?.teams) {
      for (const teamEntry of teamsData.sports[0].leagues[0].teams) {
        const team = teamEntry.team;
        const teamName = team.displayName as NFLTeamName;
        console.log(`\nFetching roster for ${teamName}...`);
        const rosterUrl = ROSTER_URL(team.abbreviation);
        
        const rosterResponse = await nodeFetch(rosterUrl);
        
        if (!rosterResponse.ok) {
          console.error(`Error fetching roster for ${teamName}: ${rosterResponse.status}`);
          continue;
        }
        
        const rosterData = await rosterResponse.json();
        
        // Process each position group
        if (rosterData.positionGroups && Array.isArray(rosterData.positionGroups)) {
          console.log(`Found ${rosterData.positionGroups.length} position groups for ${teamName}`);
          for (const group of rosterData.positionGroups) {
            console.log(`Processing group: ${group.type} - ${group.displayName}`);
            
            // Process both offensive and special teams players
            if (POSITION_GROUP_TYPES.includes(group.type)) {
              if (group.athletes && Array.isArray(group.athletes)) {
                for (const player of group.athletes) {
                  // Check if the player is a kicker or in our offensive positions list
                  if (player.position && 
                      (OFFENSIVE_POSITIONS.includes(player.position.abbreviation) || 
                       player.position.abbreviation === 'K' || 
                       player.position.abbreviation === 'PK' ||
                       player.position.name?.toLowerCase().includes('kicker'))) {
                    const nflPlayer: NFLPlayer = {
                      id: player.id,
                      firstName: player.firstName || '',
                      lastName: player.lastName || '',
                      fullName: player.displayName || `${player.firstName || ''} ${player.lastName || ''}`.trim(),
                      position: player.position.abbreviation === 'PK' ? 'K' : player.position.abbreviation,
                      team: teamName,
                      jerseyNumber: player.jersey,
                      height: player.displayHeight,
                      weight: player.displayWeight,
                      age: player.age,
                      experience: player.experience?.years,
                      college: player.college?.name,
                      status: player.status?.type,
                      photoUrl: player.headshot?.href,
                      byeWeek: TEAM_BYE_WEEKS[teamName]
                    };
                    
                    // Add Fantasy Pros rankings
                    const rankings = getFantasyProsRankings(nflPlayer);
                    nflPlayer.overallRank = rankings.overallRank;
                    nflPlayer.positionRank = rankings.positionRank;
                    
                    allPlayers.push(nflPlayer);
                    console.log(`Added player: ${nflPlayer.fullName} (${nflPlayer.position}) - ${nflPlayer.team}`);
                  }
                }
              }
            }
          }
        } else {
          console.error('No position groups found for', teamName);
        }
        
        // Add a small delay between requests to avoid rate limiting
        await delay(100);
      }
    }

    console.log(`\nTotal players found: ${allPlayers.length}`);
    console.log('\nPosition breakdown:');
    const positionCounts = allPlayers.reduce((acc, player) => {
      acc[player.position] = (acc[player.position] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    console.log(positionCounts);

    return allPlayers;
  } catch (error) {
    console.error('Error fetching NFL players:', error);
    return [];
  }
}

async function updateNFLData() {
  const players = await fetchTeamPlayers();
  
  // First apply Fantasy Pros rankings
  players.forEach(player => {
    const rankings = getFantasyProsRankings(player);
    player.overallRank = rankings.overallRank;
    player.positionRank = rankings.positionRank;
  });

  // Then sort players by overall rank
  const sortedPlayers = [...players].sort((a, b) => {
    const rankA = a.overallRank || 999999;
    const rankB = b.overallRank || 999999;
    return rankA - rankB;
  });

  // Create cache data
  const cacheData: CacheData = {
    lastUpdated: new Date().toISOString(),
    players: sortedPlayers
  };

  // Ensure both data directories exist
  const srcDataDir = path.join(process.cwd(), 'src', 'data');
  const publicDataDir = path.join(process.cwd(), 'public', 'data');
  
  [srcDataDir, publicDataDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  // Write the data to both locations
  const srcFilePath = path.join(srcDataDir, 'nflPlayers.json');
  const publicFilePath = path.join(publicDataDir, 'nflPlayers.json');
  
  const jsonData = JSON.stringify(cacheData, null, 2);
  fs.writeFileSync(srcFilePath, jsonData);
  fs.writeFileSync(publicFilePath, jsonData);
  
  console.log(`Updated NFL data with ${sortedPlayers.length} players`);
  console.log(`Cache files saved to:\n${srcFilePath}\n${publicFilePath}`);
}

// Run the update
updateNFLData().catch(console.error); 