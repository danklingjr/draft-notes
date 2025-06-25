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

// Team logo URLs as fallback
const TEAM_LOGOS: { [key: string]: string } = {
  'ARI': 'https://a.espncdn.com/i/teamlogos/nfl/500/ari.png',
  'ATL': 'https://a.espncdn.com/i/teamlogos/nfl/500/atl.png',
  'BAL': 'https://a.espncdn.com/i/teamlogos/nfl/500/bal.png',
  'BUF': 'https://a.espncdn.com/i/teamlogos/nfl/500/buf.png',
  'CAR': 'https://a.espncdn.com/i/teamlogos/nfl/500/car.png',
  'CHI': 'https://a.espncdn.com/i/teamlogos/nfl/500/chi.png',
  'CIN': 'https://a.espncdn.com/i/teamlogos/nfl/500/cin.png',
  'CLE': 'https://a.espncdn.com/i/teamlogos/nfl/500/cle.png',
  'DAL': 'https://a.espncdn.com/i/teamlogos/nfl/500/dal.png',
  'DEN': 'https://a.espncdn.com/i/teamlogos/nfl/500/den.png',
  'DET': 'https://a.espncdn.com/i/teamlogos/nfl/500/det.png',
  'GB': 'https://a.espncdn.com/i/teamlogos/nfl/500/gb.png',
  'HOU': 'https://a.espncdn.com/i/teamlogos/nfl/500/hou.png',
  'IND': 'https://a.espncdn.com/i/teamlogos/nfl/500/ind.png',
  'JAX': 'https://a.espncdn.com/i/teamlogos/nfl/500/jax.png',
  'KC': 'https://a.espncdn.com/i/teamlogos/nfl/500/kc.png',
  'LV': 'https://a.espncdn.com/i/teamlogos/nfl/500/lv.png',
  'LAC': 'https://a.espncdn.com/i/teamlogos/nfl/500/lac.png',
  'LAR': 'https://a.espncdn.com/i/teamlogos/nfl/500/lar.png',
  'MIA': 'https://a.espncdn.com/i/teamlogos/nfl/500/mia.png',
  'MIN': 'https://a.espncdn.com/i/teamlogos/nfl/500/min.png',
  'NE': 'https://a.espncdn.com/i/teamlogos/nfl/500/ne.png',
  'NO': 'https://a.espncdn.com/i/teamlogos/nfl/500/no.png',
  'NYG': 'https://a.espncdn.com/i/teamlogos/nfl/500/nyg.png',
  'NYJ': 'https://a.espncdn.com/i/teamlogos/nfl/500/nyj.png',
  'PHI': 'https://a.espncdn.com/i/teamlogos/nfl/500/phi.png',
  'PIT': 'https://a.espncdn.com/i/teamlogos/nfl/500/pit.png',
  'SF': 'https://a.espncdn.com/i/teamlogos/nfl/500/sf.png',
  'SEA': 'https://a.espncdn.com/i/teamlogos/nfl/500/sea.png',
  'TB': 'https://a.espncdn.com/i/teamlogos/nfl/500/tb.png',
  'TEN': 'https://a.espncdn.com/i/teamlogos/nfl/500/ten.png',
  'WAS': 'https://a.espncdn.com/i/teamlogos/nfl/500/wsh.png'
};

function getTeamLogoUrl(team: string): string {
  const normalizedTeam = team === 'JAC' ? 'JAX' : team;
  return TEAM_LOGOS[normalizedTeam] || 'https://via.placeholder.com/150?text=No+Logo';
}

function normalizePlayerName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

async function fetchPlayerHeadshot(playerName: string): Promise<string> {
  try {
    const normalizedName = normalizePlayerName(playerName);
    const url = `https://www.nfl.com/players/${normalizedName}/`;
    
    console.log(`Fetching headshot for ${playerName} from ${url}`);
    
    const response = await fetch(url);
    if (!response.ok) {
      console.log(`No NFL.com page found for ${playerName}, using team logo`);
      return '';
    }
    
    const html = await response.text();
    const ogImageMatch = html.match(/<meta property="og:image" content="([^"]+)"/);
    
    if (ogImageMatch && ogImageMatch[1]) {
      const headshotUrl = ogImageMatch[1];
      console.log(`Found headshot for ${playerName}: ${headshotUrl}`);
      return headshotUrl;
    }
    
    console.log(`No headshot found for ${playerName}, using team logo`);
    return '';
  } catch (error) {
    console.log(`Error fetching headshot for ${playerName}:`, error);
    return '';
  }
}

async function fetchPlayerHeadshots() {
  try {
    // Read the current fantasyProsRankings
    const rankingsPath = path.join(__dirname, '../data/fantasyProsRankings.json');
    const rankingsData = fs.readFileSync(rankingsPath, 'utf8');
    const rankings: Record<string, FantasyProsPlayer> = JSON.parse(rankingsData);

    console.log(`Fetching headshots for ${Object.keys(rankings).length} players...`);

    // Create a cache file to store headshot URLs
    const cachePath = path.join(__dirname, '../data/playerHeadshots.json');
    let headshotCache: Record<string, string> = {};
    
    if (fs.existsSync(cachePath)) {
      const cacheData = fs.readFileSync(cachePath, 'utf8');
      headshotCache = JSON.parse(cacheData);
    }

    let updatedCount = 0;
    const playerNames = Object.keys(rankings);
    
    // Process players in batches to avoid overwhelming the server
    const batchSize = 10;
    for (let i = 0; i < playerNames.length; i += batchSize) {
      const batch = playerNames.slice(i, i + batchSize);
      
      console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(playerNames.length / batchSize)}`);
      
      for (const playerName of batch) {
        const playerData = rankings[playerName];
        
        // Skip defenses - they should use team logos
        if (playerData.position === 'DEF') {
          rankings[playerName] = {
            ...playerData,
            avatarUrl: getTeamLogoUrl(playerData.team)
          };
          continue;
        }
        
        // Check if we have a cached headshot
        if (headshotCache[playerName]) {
          rankings[playerName] = {
            ...playerData,
            avatarUrl: headshotCache[playerName]
          };
          continue;
        }
        
        // Fetch headshot from NFL.com
        const headshotUrl = await fetchPlayerHeadshot(playerName);
        
        if (headshotUrl) {
          // Cache the successful headshot
          headshotCache[playerName] = headshotUrl;
          rankings[playerName] = {
            ...playerData,
            avatarUrl: headshotUrl
          };
          updatedCount++;
        } else {
          // Use team logo as fallback
          rankings[playerName] = {
            ...playerData,
            avatarUrl: getTeamLogoUrl(playerData.team)
          };
        }
        
        // Add a small delay to be respectful to the server
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Save cache after each batch
      fs.writeFileSync(cachePath, JSON.stringify(headshotCache, null, 2));
    }

    // Write the updated rankings back to the file
    fs.writeFileSync(rankingsPath, JSON.stringify(rankings, null, 2));
    
    console.log('Successfully updated player headshots!');
    console.log(`Updated ${updatedCount} players with NFL.com headshots`);
    console.log(`Used team logos for ${playerNames.length - updatedCount} players`);
    
  } catch (error) {
    console.error('Error fetching player headshots:', error);
    throw error;
  }
}

// Run the fetch
fetchPlayerHeadshots().catch(console.error); 