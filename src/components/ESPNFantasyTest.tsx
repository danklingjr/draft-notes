import React, { useEffect, useState } from 'react';
import { getProjections, getLastSeasonPoints } from '../services/espnFantasyService';

interface PlayerStats {
  name: string;
  team: string;
  position: string;
  projectedPoints2025: number;
  points2024: number;
  stats: {
    passing?: {
      yards: number;
      touchdowns: number;
      interceptions: number;
    };
    rushing?: {
      yards: number;
      touchdowns: number;
    };
    receiving?: {
      receptions: number;
      yards: number;
      touchdowns: number;
    };
  };
}

const ESPNFantasyTest: React.FC = () => {
  const [playerStats, setPlayerStats] = useState<PlayerStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        setError(null);

        console.log('\n=== Starting ESPN Fantasy Test ===');

        // Dynamically import puppeteer
        console.log('Importing Puppeteer...');
        const puppeteer = await import('puppeteer');
        console.log('Puppeteer imported successfully:', puppeteer);

        // Launch browser with additional options
        console.log('Launching browser...');
        const browser = await puppeteer.default.launch({
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--disable-gpu',
            '--window-size=1920,1080',
            '--disable-web-security',
            '--disable-features=IsolateOrigins,site-per-process'
          ],
          defaultViewport: {
            width: 1920,
            height: 1080
          }
        });
        console.log('Browser launched successfully');

        try {
          // Get 2025 projections
          console.log('Fetching 2025 projections...');
          const projections = await getProjections(browser);
          console.log('Got 2025 projections:', projections.length);

          // Get 2024 stats
          console.log('Fetching 2024 stats...');
          const stats2024 = await getLastSeasonPoints(browser);
          console.log('Got 2024 stats:', Object.keys(stats2024).length);

          // Combine the data
          console.log('Combining data...');
          const combinedStats = projections.map(player => ({
            name: player.name,
            team: player.team,
            position: player.position,
            projectedPoints2025: player.projectedPoints,
            points2024: stats2024[player.name] || 0,
            stats: player.stats
          }));

          // Sort by projected points
          combinedStats.sort((a, b) => b.projectedPoints2025 - a.projectedPoints2025);

          setPlayerStats(combinedStats);
        } catch (err) {
          console.error('Error during data fetching:', err);
          setError(err instanceof Error ? err.message : 'Error fetching player data');
        } finally {
          console.log('Closing browser...');
          await browser.close();
          console.log('Browser closed');
        }
      } catch (err) {
        console.error('Error in setup:', err);
        setError(err instanceof Error ? err.message : 'Error setting up browser');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="p-4 bg-white/10 rounded-lg">
        <h2 className="text-xl font-bold mb-4 text-white">Loading ESPN Fantasy Data</h2>
        <div className="text-gray-300">Please wait while we fetch the latest data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-white/10 rounded-lg">
        <h2 className="text-xl font-bold mb-4 text-white">Error Loading ESPN Fantasy Data</h2>
        <div className="text-red-400">{error}</div>
        <div className="text-gray-300 mt-2">Check the browser console for more details.</div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white/10 rounded-lg">
      <h2 className="text-xl font-bold mb-4 text-white">ESPN Fantasy Data</h2>
      
      {playerStats.length === 0 ? (
        <div className="text-gray-300">No player data available.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left text-gray-300">
            <thead className="text-xs uppercase bg-white/5">
              <tr>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Team</th>
                <th className="px-4 py-2">Pos</th>
                <th className="px-4 py-2">2025 Proj</th>
                <th className="px-4 py-2">2024 Points</th>
                <th className="px-4 py-2">Stats</th>
              </tr>
            </thead>
            <tbody>
              {playerStats.map((player, index) => (
                <tr key={index} className="border-b border-white/10 hover:bg-white/5">
                  <td className="px-4 py-2">{player.name}</td>
                  <td className="px-4 py-2">{player.team}</td>
                  <td className="px-4 py-2">{player.position}</td>
                  <td className="px-4 py-2">{player.projectedPoints2025.toFixed(1)}</td>
                  <td className="px-4 py-2">{player.points2024.toFixed(1)}</td>
                  <td className="px-4 py-2">
                    {player.stats.passing && (
                      <div>
                        Pass: {player.stats.passing.yards}yds, {player.stats.passing.touchdowns}td, {player.stats.passing.interceptions}int
                      </div>
                    )}
                    {player.stats.rushing && (
                      <div>
                        Rush: {player.stats.rushing.yards}yds, {player.stats.rushing.touchdowns}td
                      </div>
                    )}
                    {player.stats.receiving && (
                      <div>
                        Rec: {player.stats.receiving.receptions}rec, {player.stats.receiving.yards}yds, {player.stats.receiving.touchdowns}td
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ESPNFantasyTest; 