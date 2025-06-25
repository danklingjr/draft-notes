import fs from 'fs';
import path from 'path';

interface DefensePlayer {
  name: string;
  team: string;
  position: string;
  avatarUrl: string;
  projectedPoints: number;
  bye: number;
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

async function mergeDefenses() {
  try {
    // Read the defense players
    const defensesPath = path.join(__dirname, '../data/fantasy_def_players.json');
    const defensesData = fs.readFileSync(defensesPath, 'utf8');
    const defenses: DefensePlayer[] = JSON.parse(defensesData);

    // Read the current fantasyProsRankings
    const rankingsPath = path.join(__dirname, '../data/fantasyProsRankings.json');
    const rankingsData = fs.readFileSync(rankingsPath, 'utf8');
    const rankings: Record<string, FantasyProsPlayer> = JSON.parse(rankingsData);

    // Clean up defense names (remove newlines and extra spaces)
    const cleanedDefenses = defenses.map(defense => ({
      ...defense,
      name: defense.name.replace(/\n\s+/g, ' ').trim()
    }));

    // Convert defenses to FantasyPros format
    const defenseEntries: [string, FantasyProsPlayer][] = cleanedDefenses.map((defense, index) => {
      return [
        defense.name,
        {
          overallRank: 0, // Will be set after sorting
          positionRank: index + 1,
          team: defense.team,
          position: defense.position,
          byeWeek: defense.bye,
          projectedFantasyPoints2025: defense.projectedPoints,
          avatarUrl: defense.avatarUrl,
          avatarFallback: defense.team
        }
      ];
    });

    // Combine all players and sort by projected points
    const allPlayers = [
      ...Object.entries(rankings),
      ...defenseEntries
    ];

    // Sort by projected fantasy points (descending)
    allPlayers.sort((a, b) => b[1].projectedFantasyPoints2025 - a[1].projectedFantasyPoints2025);

    // Update overall ranks and position ranks
    const positionCounts: { [key: string]: number } = {};
    const updatedRankings: Record<string, FantasyProsPlayer> = {};

    allPlayers.forEach(([name, player], index) => {
      // Update overall rank
      player.overallRank = index + 1;

      // Update position rank
      if (!positionCounts[player.position]) {
        positionCounts[player.position] = 0;
      }
      positionCounts[player.position]++;
      player.positionRank = positionCounts[player.position];

      updatedRankings[name] = player;
    });

    // Write the updated rankings back to file
    const outputPath = path.join(__dirname, '../data/fantasyProsRankings.json');
    fs.writeFileSync(outputPath, JSON.stringify(updatedRankings, null, 2));

    // Copy to public directory
    const publicPath = path.join(__dirname, '../public/data/fantasyProsRankings.json');
    fs.writeFileSync(publicPath, JSON.stringify(updatedRankings, null, 2));

    console.log(`Successfully merged ${defenses.length} defenses into fantasyProsRankings.json`);
    console.log(`Total players: ${allPlayers.length}`);
    console.log(`Defenses added: ${defenses.map(d => d.name.replace(/\n\s+/g, ' ').trim()).join(', ')}`);

  } catch (error) {
    console.error('Error merging defenses:', error);
  }
}

mergeDefenses(); 