const API_KEY = '3';  // Free tier API key
const BASE_URL = 'https://www.thesportsdb.com/api/v1/json';

export interface NFLPlayer {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  position: string;
  team: string;
  jerseyNumber?: string;
  height?: string;
  weight?: string;
  age?: number;
  experience?: number;
  college?: string;
  status?: string;
  photoUrl?: string;
  adp?: number;
  positionRank?: number;
  overallRank?: number;
  hasActualADP?: boolean;
  byeWeek?: number;
  projectedFantasyPoints2025?: number;
  avatarUrl?: string;
  avatarFallback?: string;
}

interface NFLTeam {
  idTeam: string;
  strTeam: string;
}

// Let's try a single team first to test the API
const TEST_TEAMS = [
  'Kansas City Chiefs',
  'San Francisco 49ers',
  'Philadelphia Eagles'
];

export interface NFLData {
  lastUpdated: string;
  players: NFLPlayer[];
}

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

export async function getNFLPlayers(): Promise<NFLPlayer[]> {
  try {
    console.log('Attempting to fetch FantasyPros rankings data...');
    const response = await fetch('/data/fantasyProsRankings.json');
    
    if (!response.ok) {
      console.error('Failed to fetch FantasyPros rankings:', response.status, response.statusText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const fantasyProsData = await response.json() as Record<string, FantasyProsPlayer>;
    console.log('Received FantasyPros data:', fantasyProsData);
    
    if (!fantasyProsData || typeof fantasyProsData !== 'object') {
      console.error('Invalid FantasyPros data format:', fantasyProsData);
      throw new Error('Invalid data format received');
    }

    // Transform FantasyPros data to NFLPlayer format
    const players: NFLPlayer[] = Object.entries(fantasyProsData).map(([name, playerData]) => {
      const [firstName, ...lastNameParts] = name.split(' ');
      const lastName = lastNameParts.join(' ');
      
      return {
        id: `${name}-${playerData.team}-${playerData.position}`.replace(/\s+/g, '-').toLowerCase(),
        firstName,
        lastName,
        fullName: name,
        position: playerData.position,
        team: playerData.team,
        overallRank: playerData.overallRank,
        positionRank: playerData.positionRank,
        byeWeek: playerData.byeWeek,
        projectedFantasyPoints2025: playerData.projectedFantasyPoints2025,
        avatarUrl: playerData.avatarUrl,
        avatarFallback: playerData.avatarFallback,
        status: 'active'
      };
    });

    console.log(`Successfully loaded ${players.length} players from FantasyPros rankings`);
    return players;
  } catch (error) {
    console.error('Error loading FantasyPros player data:', error);
    throw error;
  }
}

// Team logo URLs for fallback
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

function getTeamLogoUrl(team: string): string {
  // Handle special cases
  const normalizedTeam = team === 'JAC' ? 'JAX' : team;
  return TEAM_LOGOS[normalizedTeam] || 'https://via.placeholder.com/150?text=No+Logo';
}

export const getPlayerImage = (player: NFLPlayer): string => {
  // Use avatarUrl first (NFL.com headshots), then fallback to team logo
  return player.avatarUrl || getTeamLogoUrl(player.team);
}; 