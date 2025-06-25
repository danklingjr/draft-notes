export interface NFLStats {
  passingYards?: number;
  passingTouchdowns?: number;
  interceptions?: number;
  rushingYards?: number;
  rushingTouchdowns?: number;
  receptions?: number;
  receivingYards?: number;
  receivingTouchdowns?: number;
  fieldGoalsMade?: number;
  fieldGoalsAttempted?: number;
  extraPointsMade?: number;
  sacks?: number;
  interceptionsMade?: number;
  fumblesRecovered?: number;
  safeties?: number;
  touchdowns?: number;
  specialTeamsTouchdowns?: number;
  points?: number;
}

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
  status: string;
  photoUrl?: string;
  avatarUrl?: string;
  byeWeek?: number;
  overallRank: number;
  positionRank: number;
  stats2024?: NFLStats;
  projectedStats2025?: NFLStats;
  adp?: number;
  trend?: number;
  news?: string[];
  lastUpdated?: string;
}

export interface NFLData {
  lastUpdated: string;
  players: NFLPlayer[];
} 