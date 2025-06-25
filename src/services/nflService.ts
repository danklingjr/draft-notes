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

export const getPlayerImage = (player: NFLPlayer): string => {
  return player.avatarUrl || player.photoUrl || 'https://via.placeholder.com/150?text=No+Image';
}; 