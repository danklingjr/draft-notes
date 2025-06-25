import { ESPNRanking, generateProjectedStats } from './fetchESPNRankings';

export const additionalPlayers: ESPNRanking[] = [
  // More RBs
  {
    name: "Saquon Barkley", position: "RB", team: "PHI", rank: 11, positionRank: 6,
    college: "Penn State", experience: 7, jerseyNumber: "26", height: "6'0\"", weight: "232", age: 27, byeWeek: 10
  },
  {
    name: "Jonathan Taylor", position: "RB", team: "IND", rank: 12, positionRank: 7,
    college: "Wisconsin", experience: 5, jerseyNumber: "28", height: "5'10\"", weight: "226", age: 25, byeWeek: 11
  },
  
  // More WRs
  {
    name: "A.J. Brown", position: "WR", team: "PHI", rank: 13, positionRank: 6,
    college: "Ole Miss", experience: 6, jerseyNumber: "11", height: "6'1\"", weight: "226", age: 26, byeWeek: 10
  },
  {
    name: "Tyreek Hill", position: "WR", team: "MIA", rank: 14, positionRank: 7,
    college: "West Alabama", experience: 9, jerseyNumber: "10", height: "5'10\"", weight: "191", age: 30, byeWeek: 10
  },
  
  // More QBs
  {
    name: "Justin Fields", position: "QB", team: "PIT", rank: 46, positionRank: 5,
    college: "Ohio State", experience: 4, jerseyNumber: "1", height: "6'3\"", weight: "228", age: 25, byeWeek: 6
  },
  {
    name: "Dak Prescott", position: "QB", team: "DAL", rank: 47, positionRank: 6,
    college: "Mississippi State", experience: 9, jerseyNumber: "4", height: "6'2\"", weight: "238", age: 30, byeWeek: 7
  },
  
  // More TEs
  {
    name: "Mark Andrews", position: "TE", team: "BAL", rank: 41, positionRank: 4,
    college: "Oklahoma", experience: 7, jerseyNumber: "89", height: "6'5\"", weight: "256", age: 28, byeWeek: 13
  },
  {
    name: "Dallas Goedert", position: "TE", team: "PHI", rank: 42, positionRank: 5,
    college: "South Dakota State", experience: 7, jerseyNumber: "88", height: "6'5\"", weight: "256", age: 29, byeWeek: 10
  },
  
  // More Kickers
  {
    name: "Harrison Butker", position: "K", team: "KC", rank: 163, positionRank: 4,
    college: "Georgia Tech", experience: 8, jerseyNumber: "7", height: "6'4\"", weight: "199", age: 28, byeWeek: 10
  },
  {
    name: "Jake Elliott", position: "K", team: "PHI", rank: 164, positionRank: 5,
    college: "Memphis", experience: 8, jerseyNumber: "4", height: "5'9\"", weight: "167", age: 29, byeWeek: 10
  },
  
  // More DEF
  {
    name: "Philadelphia Eagles", position: "DEF", team: "PHI", rank: 153, positionRank: 4,
    byeWeek: 10
  },
  {
    name: "Buffalo Bills", position: "DEF", team: "BUF", rank: 154, positionRank: 5,
    byeWeek: 7
  }
];

// Add stats and projections for each player
additionalPlayers.forEach(player => {
  let tier: 'elite' | 'good' | 'average';
  
  // Determine tier based on position rank
  if (player.positionRank <= 2) tier = 'elite';
  else if (player.positionRank <= 5) tier = 'good';
  else tier = 'average';
  
  // Generate stats
  player.stats2024 = generateProjectedStats(player.position, tier);
  player.projectedStats2025 = generateProjectedStats(player.position, tier);
  
  // Add avatar URL
  const safeName = player.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
  player.avatarUrl = `https://a.espncdn.com/i/headshots/nfl/players/full/${safeName}.png`;
}); 