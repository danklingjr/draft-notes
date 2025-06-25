import fs from 'fs';
import path from 'path';

interface FantasyPlayer {
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
  fantasyPoints2024: number;
  projectedFantasyPoints2025: number;
  avatarUrl: string;
  avatarFallback: string;
}

interface UpdatedFantasyProsPlayer {
  overallRank: number;
  positionRank: number;
  team: string;
  position: string;
  byeWeek: number;
  projectedFantasyPoints2025: number;
  avatarFallback: string;
  avatarUrl?: string;
}

async function updateFantasyProsRankings() {
  try {
    // Read the fantasy_players_sorted.json file
    const sortedPlayersPath = path.join(__dirname, '../data/fantasy_players_sorted.json');
    const sortedPlayersData = fs.readFileSync(sortedPlayersPath, 'utf8');
    const sortedPlayers: FantasyPlayer[] = JSON.parse(sortedPlayersData);

    // Read the fantasyProsRankings.json file
    const rankingsPath = path.join(__dirname, '../data/fantasyProsRankings.json');
    const rankingsData = fs.readFileSync(rankingsPath, 'utf8');
    const rankings: Record<string, FantasyProsPlayer> = JSON.parse(rankingsData);

    // Create a map of player names to their data from sorted players
    const sortedPlayersMap = new Map<string, FantasyPlayer>();
    sortedPlayers.forEach(player => {
      sortedPlayersMap.set(player.name, player);
    });

    // Create updated rankings object
    const updatedRankings: Record<string, UpdatedFantasyProsPlayer> = {};

    // Process players in the order they appear in sorted players
    sortedPlayers.forEach((sortedPlayer, index) => {
      const playerName = sortedPlayer.name;
      const existingPlayer = rankings[playerName];

      if (existingPlayer) {
        // Update the player data, but do NOT touch avatarUrl unless missing
        const { fantasyPoints2024, avatarUrl, ...rest } = existingPlayer;
        updatedRankings[playerName] = {
          ...rest,
          overallRank: index + 1, // Use the position in sorted list as overall rank
          team: sortedPlayer.team,
          position: sortedPlayer.position,
          byeWeek: sortedPlayer.bye,
          projectedFantasyPoints2025: sortedPlayer.projectedPoints
        };
        if (avatarUrl !== undefined) {
          (updatedRankings[playerName] as any).avatarUrl = avatarUrl;
        } else {
          // If missing, generate ESPN avatar URL
          (updatedRankings[playerName] as any).avatarUrl = getESPNAvatarUrl(playerName);
        }
      } else {
        // Player exists in sorted list but not in rankings - create new entry, generate ESPN avatarUrl
        console.log(`Creating new entry for: ${playerName}`);
        updatedRankings[playerName] = {
          overallRank: index + 1,
          positionRank: 1, // Default position rank
          team: sortedPlayer.team,
          position: sortedPlayer.position,
          byeWeek: sortedPlayer.bye,
          projectedFantasyPoints2025: sortedPlayer.projectedPoints,
          avatarFallback: getInitials(playerName),
          avatarUrl: getESPNAvatarUrl(playerName)
        };
      }
    });

    // Check for players in rankings that are not in sorted players
    Object.keys(rankings).forEach(playerName => {
      if (!sortedPlayersMap.has(playerName)) {
        console.log(`Player in rankings but not in sorted list: ${playerName}`);
      }
    });

    // Write the updated rankings back to file
    const outputPath = path.join(__dirname, '../data/fantasyProsRankings.json');
    fs.writeFileSync(outputPath, JSON.stringify(updatedRankings, null, 2));

    console.log(`Successfully updated ${Object.keys(updatedRankings).length} players`);
    console.log(`Removed fantasyPoints2024 field`);
    console.log(`Updated projectedFantasyPoints2025 with data from fantasy_players_sorted.json`);
    console.log(`Sorted players according to fantasy_players_sorted.json order`);

  } catch (error) {
    console.error('Error updating fantasy pros rankings:', error);
  }
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, 2);
}

function getESPNAvatarUrl(name: string): string {
  const safeName = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
  return `https://a.espncdn.com/i/headshots/nfl/players/full/${safeName}.png`;
}

updateFantasyProsRankings(); 