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
    // TODO: Implement real API call to fantasy data provider
    const data: FantasyPointsData = {
      lastSeasonPoints: 0,
      projectedPoints: 0,
    };

    // Cache the results
    fantasyPointsCache.set(player.id, data);
    return data;
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