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

export async function getNFLPlayers(): Promise<NFLPlayer[]> {
  try {
    console.log('Attempting to fetch NFL players data...');
    const response = await fetch('/data/nflPlayers.json');
    
    if (!response.ok) {
      console.error('Failed to fetch NFL players:', response.status, response.statusText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const cacheData = await response.json() as NFLData;
    console.log('Received data:', cacheData);
    
    if (!cacheData || !cacheData.players || !Array.isArray(cacheData.players)) {
      console.error('Invalid cache data format:', cacheData);
      throw new Error('Invalid data format received');
    }

    console.log(`Successfully loaded ${cacheData.players.length} players`);
    return cacheData.players;
  } catch (error) {
    console.error('Error loading NFL player data:', error);
    throw error;
  }
}

export const getPlayerImage = (player: NFLPlayer): string => {
  return player.photoUrl || 'https://via.placeholder.com/150?text=No+Image';
}; 