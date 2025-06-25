import { getProjections, getLastSeasonPoints } from '../services/espnService';

// Test players representing different positions
const testPlayers = [
  {
    id: 'mahomes',
    firstName: 'Patrick',
    lastName: 'Mahomes',
    fullName: 'Patrick Mahomes',
    team: 'KC',
    position: 'QB'
  },
  {
    id: 'mccaffrey',
    firstName: 'Christian',
    lastName: 'McCaffrey',
    fullName: 'Christian McCaffrey',
    team: 'SF',
    position: 'RB'
  },
  {
    id: 'jefferson',
    firstName: 'Justin',
    lastName: 'Jefferson',
    fullName: 'Justin Jefferson',
    team: 'MIN',
    position: 'WR'
  },
  {
    id: 'kelce',
    firstName: 'Travis',
    lastName: 'Kelce',
    fullName: 'Travis Kelce',
    team: 'KC',
    position: 'TE'
  }
];

async function runTests() {
  console.log('Testing ESPN Fantasy Football Integration\n');

  for (const player of testPlayers) {
    console.log(`Testing ${player.fullName} (${player.position}):`);
    
    try {
      // Test projections
      console.log('  Fetching 2025 projections...');
      const projections = await getProjections(player);
      console.log(`  2025 Projected Points: ${projections?.toFixed(1) || 'Not found'}`);

      // Test last season stats
      console.log('  Fetching 2024 stats...');
      const lastSeason = await getLastSeasonPoints(player);
      console.log(`  2024 Season Points: ${lastSeason?.toFixed(1) || 'Not found'}`);
      
      console.log('  Status: ✅ Success\n');
    } catch (error) {
      console.error(`  Status: ❌ Error: ${error}\n`);
    }
  }
}

// Run the tests
runTests().catch(console.error); 