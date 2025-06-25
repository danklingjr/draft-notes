import * as fs from 'fs/promises';
import * as path from 'path';
import puppeteer from 'puppeteer';
import { getNFLProjections } from '../src/services/nflFantasyService';

interface NFLPlayer {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  position: string;
  team: string;
  points2024?: number;
  projectedPoints2025?: number;
  rank?: number;
}

interface NFLData {
  lastUpdated: string;
  players: NFLPlayer[];
}

async function updateNFLRankings() {
  console.log('Starting NFL rankings update...');
  
  try {
    // Launch browser
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox']
    });

    try {
      // Get NFL data
      console.log('Fetching NFL data...');
      const nflData = await getNFLProjections(browser);
      console.log(`Fetched ${nflData.length} players from NFL.com`);

      // Read existing players file
      const playersPath = path.join(process.cwd(), 'src/data/nflPlayers.json');
      const existingData: NFLData = JSON.parse(
        await fs.readFile(playersPath, 'utf-8')
      );

      // Update player data
      const updatedPlayers = existingData.players.map(player => {
        const nflPlayer = nflData.find(p => 
          p.name.toLowerCase() === player.fullName.toLowerCase() ||
          p.name.toLowerCase() === `${player.firstName} ${player.lastName}`.toLowerCase()
        );

        if (nflPlayer) {
          return {
            ...player,
            points2024: nflPlayer.points2024,
            projectedPoints2025: nflPlayer.projectedPoints2025,
            rank: nflPlayer.rank
          };
        }
        return player;
      });

      // Sort players by rank
      updatedPlayers.sort((a, b) => {
        if (!a.rank) return 1;
        if (!b.rank) return -1;
        return a.rank - b.rank;
      });

      // Save updated data
      const updatedData: NFLData = {
        lastUpdated: new Date().toISOString(),
        players: updatedPlayers
      };

      await fs.writeFile(playersPath, JSON.stringify(updatedData, null, 2));
      console.log('Successfully updated NFL rankings and points data');

    } finally {
      await browser.close();
    }
  } catch (error) {
    console.error('Error updating NFL rankings:', error);
    process.exit(1);
  }
}

updateNFLRankings(); 