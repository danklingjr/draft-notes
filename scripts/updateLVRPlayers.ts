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

async function updateLVRPlayers() {
  try {
    // Read the current fantasyProsRankings
    const rankingsPath = path.join(__dirname, '../data/fantasyProsRankings.json');
    const rankingsData = fs.readFileSync(rankingsPath, 'utf8');
    const rankings: Record<string, FantasyProsPlayer> = JSON.parse(rankingsData);

    console.log('Updating Las Vegas Raiders players...');

    let updatedCount = 0;
    const lvrTeamLogo = 'https://a.espncdn.com/i/teamlogos/nfl/500/lv.png';

    // Update each player's avatar if they're on LVR
    Object.entries(rankings).forEach(([playerName, playerData]) => {
      if (playerData.team === 'LVR') {
        rankings[playerName] = {
          ...playerData,
          avatarUrl: lvrTeamLogo
        };
        updatedCount++;
        console.log(`Updated ${playerName} (${playerData.position}) to use LVR team logo`);
      }
    });

    // Write the updated data back to the file
    fs.writeFileSync(rankingsPath, JSON.stringify(rankings, null, 2));
    
    console.log(`Successfully updated ${updatedCount} Las Vegas Raiders players!`);
    
  } catch (error) {
    console.error('Error updating LVR players:', error);
    throw error;
  }
}

// Run the update
updateLVRPlayers().catch(console.error); 