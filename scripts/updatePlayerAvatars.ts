import fs from 'fs';
import path from 'path';

interface FantasyProsPlayer {
  overallRank: number;
  positionRank: number;
  team: string;
  position: string;
  byeWeek: number;
  projectedFantasyPoints2025: number;
  avatarUrl?: string;
  avatarFallback: string;
}

// Team abbreviations mapping
const TEAM_ABBREVIATIONS: { [key: string]: string } = {
  'Arizona Cardinals': 'ARI',
  'Atlanta Falcons': 'ATL',
  'Baltimore Ravens': 'BAL',
  'Buffalo Bills': 'BUF',
  'Carolina Panthers': 'CAR',
  'Chicago Bears': 'CHI',
  'Cincinnati Bengals': 'CIN',
  'Cleveland Browns': 'CLE',
  'Dallas Cowboys': 'DAL',
  'Denver Broncos': 'DEN',
  'Detroit Lions': 'DET',
  'Green Bay Packers': 'GB',
  'Houston Texans': 'HOU',
  'Indianapolis Colts': 'IND',
  'Jacksonville Jaguars': 'JAX',
  'Kansas City Chiefs': 'KC',
  'Las Vegas Raiders': 'LV',
  'Los Angeles Chargers': 'LAC',
  'Los Angeles Rams': 'LAR',
  'Miami Dolphins': 'MIA',
  'Minnesota Vikings': 'MIN',
  'New England Patriots': 'NE',
  'New Orleans Saints': 'NO',
  'New York Giants': 'NYG',
  'New York Jets': 'NYJ',
  'Philadelphia Eagles': 'PHI',
  'Pittsburgh Steelers': 'PIT',
  'San Francisco 49ers': 'SF',
  'Seattle Seahawks': 'SEA',
  'Tampa Bay Buccaneers': 'TB',
  'Tennessee Titans': 'TEN',
  'Washington Commanders': 'WAS'
};

// Team logo URLs - these are reliable and work
const TEAM_LOGOS: { [key: string]: string } = {
  'ARI': 'https://a.espncdn.com/i/teamlogos/nfl/500/ari.png',
  'ATL': 'https://a.espncdn.com/i/teamlogos/nfl/500/atl.png',
  'BAL': 'https://a.espncdn.com/i/teamlogos/nfl/500/bal.png',
  'BUF': 'https://a.espncdn.com/i/teamlogos/nfl/500/buf.png',
  'CAR': 'https://a.espncdn.com/i/teamlogos/nfl/500/car.png',
  'CHI': 'https://a.espncdn.com/i/teamlogos/nfl/500/chi.png',
  'CIN': 'https://a.espncdn.com/i/teamlogos/nfl/500/cin.png',
  'CLE': 'https://a.espncdn.com/i/teamlogos/nfl/500/cle.png',
  'DAL': 'https://a.espncdn.com/i/teamlogos/nfl/500/dal.png',
  'DEN': 'https://a.espncdn.com/i/teamlogos/nfl/500/den.png',
  'DET': 'https://a.espncdn.com/i/teamlogos/nfl/500/det.png',
  'GB': 'https://a.espncdn.com/i/teamlogos/nfl/500/gb.png',
  'HOU': 'https://a.espncdn.com/i/teamlogos/nfl/500/hou.png',
  'IND': 'https://a.espncdn.com/i/teamlogos/nfl/500/ind.png',
  'JAX': 'https://a.espncdn.com/i/teamlogos/nfl/500/jax.png',
  'KC': 'https://a.espncdn.com/i/teamlogos/nfl/500/kc.png',
  'LV': 'https://a.espncdn.com/i/teamlogos/nfl/500/lv.png',
  'LAC': 'https://a.espncdn.com/i/teamlogos/nfl/500/lac.png',
  'LAR': 'https://a.espncdn.com/i/teamlogos/nfl/500/lar.png',
  'MIA': 'https://a.espncdn.com/i/teamlogos/nfl/500/mia.png',
  'MIN': 'https://a.espncdn.com/i/teamlogos/nfl/500/min.png',
  'NE': 'https://a.espncdn.com/i/teamlogos/nfl/500/ne.png',
  'NO': 'https://a.espncdn.com/i/teamlogos/nfl/500/no.png',
  'NYG': 'https://a.espncdn.com/i/teamlogos/nfl/500/nyg.png',
  'NYJ': 'https://a.espncdn.com/i/teamlogos/nfl/500/nyj.png',
  'PHI': 'https://a.espncdn.com/i/teamlogos/nfl/500/phi.png',
  'PIT': 'https://a.espncdn.com/i/teamlogos/nfl/500/pit.png',
  'SF': 'https://a.espncdn.com/i/teamlogos/nfl/500/sf.png',
  'SEA': 'https://a.espncdn.com/i/teamlogos/nfl/500/sea.png',
  'TB': 'https://a.espncdn.com/i/teamlogos/nfl/500/tb.png',
  'TEN': 'https://a.espncdn.com/i/teamlogos/nfl/500/ten.png',
  'WAS': 'https://a.espncdn.com/i/teamlogos/nfl/500/wsh.png'
};

function getTeamAbbreviation(teamName: string): string {
  // Handle special cases
  if (teamName === 'JAC') return 'JAX';
  return TEAM_ABBREVIATIONS[teamName] || teamName;
}

function getTeamLogoUrl(teamName: string): string {
  const abbreviation = getTeamAbbreviation(teamName);
  return TEAM_LOGOS[abbreviation] || 'https://via.placeholder.com/150?text=No+Logo';
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function generatePlayerAvatarUrl(name: string, team: string, position: string): string {
  // Use team logos for all players - this is reliable and works
  return getTeamLogoUrl(team);
}

async function updatePlayerAvatars() {
  try {
    // Read the current fantasyProsRankings
    const rankingsPath = path.join(__dirname, '../data/fantasyProsRankings.json');
    const rankingsData = fs.readFileSync(rankingsPath, 'utf8');
    const rankings: Record<string, FantasyProsPlayer> = JSON.parse(rankingsData);

    console.log(`Updating avatars for ${Object.keys(rankings).length} players...`);

    // Update each player's avatar
    Object.entries(rankings).forEach(([playerName, playerData]) => {
      const newAvatarUrl = generatePlayerAvatarUrl(playerName, playerData.team, playerData.position);
      
      // Update the player data
      rankings[playerName] = {
        ...playerData,
        avatarUrl: newAvatarUrl
      };
    });

    // Write the updated data back to the file
    fs.writeFileSync(rankingsPath, JSON.stringify(rankings, null, 2));
    
    console.log('Successfully updated player avatars!');
    console.log(`Updated ${Object.keys(rankings).length} players with team logos`);
    
  } catch (error) {
    console.error('Error updating player avatars:', error);
    throw error;
  }
}

// Run the update
updatePlayerAvatars().catch(console.error); 