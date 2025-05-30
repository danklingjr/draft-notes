import { NFLPlayer } from './nflService';

interface FantasyPointsData {
  lastSeasonPoints?: number;
  projectedPoints?: number;
}

const fantasyPointsCache = new Map<string, FantasyPointsData>();

export async function getFantasyPoints(player: NFLPlayer): Promise<FantasyPointsData> {
  // Check cache first
  if (fantasyPointsCache.has(player.id)) {
    return fantasyPointsCache.get(player.id)!;
  }

  try {
    // Construct search query
    const searchQuery = `${player.fullName} ${player.team} ${player.position} fantasy points 2024 projections`;
    
    // TODO: Replace with actual API call to fantasy data provider
    // For now, return mock data based on position
    const mockData: FantasyPointsData = {
      lastSeasonPoints: getMockLastSeasonPoints(player),
      projectedPoints: getMockProjectedPoints(player),
    };

    // Cache the results
    fantasyPointsCache.set(player.id, mockData);
    return mockData;
  } catch (error) {
    console.error('Error fetching fantasy points:', error);
    return {};
  }
}

// Mock data generator based on position
function getMockLastSeasonPoints(player: NFLPlayer): number {
  const basePoints: { [key: string]: number } = {
    'QB': 280,
    'RB': 180,
    'WR': 170,
    'TE': 120,
    'K': 130,
    'DEF': 110,
  };

  const base = basePoints[player.position] || 100;
  const variance = base * 0.3; // 30% variance
  return Math.round(base + (Math.random() * variance * 2 - variance));
}

function getMockProjectedPoints(player: NFLPlayer): number {
  const lastSeason = getMockLastSeasonPoints(player);
  const variance = lastSeason * 0.2; // 20% variance
  return Math.round(lastSeason + (Math.random() * variance * 2 - variance));
}

// Helper to format points
export function formatPoints(points: number | undefined): string {
  if (points === undefined) return '-';
  return points.toFixed(1);
} 