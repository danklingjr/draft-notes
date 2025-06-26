import React, { useEffect, useState } from 'react';
import { NFLPlayer, getNFLPlayers } from '../services/nflService';
import { useDraft } from '../context/DraftContext';
import PlayerAvatar from './PlayerAvatar';
import { getFantasyPoints, formatPoints } from '../services/fantasyPointsService';
import { savePlayerNotes, loadPlayerNotes } from '../services/notesPersistenceService';

interface PlayerWithPoints extends NFLPlayer {
  lastSeasonPoints?: number;
  projectedPoints?: number;
  projectedFantasyPoints2025?: number;
}

interface PlayerNote {
  id: string;
  note: string;
}

interface PlayerNotes {
  [playerId: string]: string;
}

const DraftBoard: React.FC = () => {
  const [players, setPlayers] = useState<PlayerWithPoints[]>([]);
  const [filteredPlayers, setFilteredPlayers] = useState<PlayerWithPoints[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPosition, setSelectedPosition] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playerNotes, setPlayerNotes] = useState<PlayerNotes>({});
  const positions = ['ALL', 'QB', 'RB', 'WR', 'TE', 'K', 'DEF'];
  const { draftPlayerToMine, draftPlayerToOthers, isPlayerDrafted } = useDraft();

  // Helper function to get a player's sort value
  const getPlayerSortValue = (player: NFLPlayer): number => {
    return player.overallRank || 999999;
  };

  const formatPlayerName = (player: NFLPlayer): string => {
    if (player.position === 'DEF') {
      return player.fullName.replace(' Defense', '');
    }
    return player.fullName;
  };

  const handleNoteChange = (playerId: string, note: string) => {
    setPlayerNotes((prev: PlayerNotes) => ({
      ...prev,
      [playerId]: note
    }));
  };

  const handleNoteBlur = async (playerId: string, note: string) => {
    try {
      const updatedNotes = {
        ...playerNotes,
        [playerId]: note
      };
      await savePlayerNotes(updatedNotes);
    } catch (error) {
      console.error('Error saving note:', error);
    }
  };

  useEffect(() => {
    const loadPlayers = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const nflPlayers = await getNFLPlayers();
        
        if (!nflPlayers || nflPlayers.length === 0) {
          setError('No players found. Please run the update script to fetch the latest NFL data.');
        } else {
          // Fetch fantasy points for each player
          const playersWithPoints = await Promise.all(
            nflPlayers.map(async (player) => {
              const points = await getFantasyPoints(player);
              return {
                ...player,
                ...points
              };
            })
          );

          // Sort players by projected points (if available) or overall rank
          const sortedPlayers = [...playersWithPoints].sort((a, b) => {
            if (a.projectedFantasyPoints2025 && b.projectedFantasyPoints2025) {
              return b.projectedFantasyPoints2025 - a.projectedFantasyPoints2025;
            }
            return getPlayerSortValue(a) - getPlayerSortValue(b);
          });

          setPlayers(sortedPlayers);
          setFilteredPlayers(sortedPlayers);
        }
      } catch (error) {
        console.error('Error loading players:', error);
        setError('Failed to load NFL players. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    loadPlayers();
  }, []);

  useEffect(() => {
    let filtered = [...players].filter(player => !isPlayerDrafted(player.id));
    
    // Apply position filter
    if (selectedPosition !== 'ALL') {
      filtered = filtered.filter(player => player.position === selectedPosition);
    }
    
    // Sort by overall rank
    filtered.sort((a, b) => getPlayerSortValue(a) - getPlayerSortValue(b));
    
    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(player => 
        player.fullName.toLowerCase().includes(searchLower) ||
        player.team.toLowerCase().includes(searchLower)
      );
    }
    
    setFilteredPlayers(filtered);
  }, [searchTerm, selectedPosition, players, isPlayerDrafted]);

  useEffect(() => {
    const loadNotes = async () => {
      try {
        const savedNotes = await loadPlayerNotes();
        setPlayerNotes(savedNotes);
      } catch (error) {
        console.error('Error loading player notes:', error);
      }
    };
    loadNotes();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="text-lg mb-2">Loading players...</div>
          <div className="text-sm text-gray-500">Please wait while we fetch the latest data</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="text-lg text-red-500 mb-2">{error}</div>
          <div className="text-sm text-gray-500">
            Try refreshing the page or check the console for more details
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-32px)] flex flex-col overflow-hidden">
      {/* Search and Filters */}
      <div className="flex items-center gap-4 p-4 bg-white sticky top-0 z-10 border-b border-gray-200 rounded-t-lg">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by player name"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 bg-white rounded border border-gray-300 focus:outline-none focus:border-blue-500"
          />
        </div>
        <div className="flex gap-1">
          {positions.map(pos => (
            <button
              key={pos}
              onClick={() => setSelectedPosition(pos)}
              className={`px-4 py-2 rounded ${
                selectedPosition === pos
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {pos}
            </button>
          ))}
        </div>
      </div>

      {/* Player List */}
      <div className="flex-1 overflow-auto relative rounded-b-lg">
        <table className="w-full">
          <thead className="sticky top-0 z-10">
            <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-200">
              <th className="text-left py-3 px-4 font-medium">PLAYER</th>
              <th className="text-left p-3 font-medium">POS</th>
              <th className="text-left p-3 font-medium">BYE</th>
              <th className="text-left p-3 font-medium">PROJ</th>
              <th className="text-left p-3 font-medium w-64">NOTES</th>
              <th className="text-right py-3 px-4 font-medium">DRAFT</th>
            </tr>
          </thead>
          <tbody>
            {filteredPlayers.map(player => (
              <tr key={player.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4 w-64">
                  <div className="flex items-center gap-3 border-r border-gray-200">
                    <PlayerAvatar player={player} size="md" />
                    <div>
                      <div className="font-medium text-gray-900">
                        {formatPlayerName(player)}
                      </div>
                      <div className="text-xs text-gray-500">{player.team}</div>
                    </div>
                  </div>
                </td>
                <td className="p-3 text-sm text-gray-900">{player.position}</td>
                <td className="p-3 text-sm text-gray-900">{player.byeWeek || '-'}</td>
                <td className="p-3 text-sm text-gray-900">{formatPoints(player.projectedFantasyPoints2025)}</td>
                <td className="p-3 w-auto">
                  <textarea
                    value={playerNotes[player.id] || ''}
                    onChange={(e) => handleNoteChange(player.id, e.target.value)}
                    onBlur={(e) => handleNoteBlur(player.id, e.target.value)}
                    placeholder="Add notes..."
                    className="w-full p-2 text-sm bg-white border border-gray-200 rounded resize-none focus:outline-none focus:border-blue-500"
                    rows={1}
                  />
                </td>
                <td className="py-3 px-4">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => {
                        draftPlayerToOthers(player);
                        setFilteredPlayers(prev => prev.filter(p => p.id !== player.id));
                      }}
                      className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                    >
                      Theirs
                    </button>
                    <button
                      onClick={() => {
                        draftPlayerToMine(player);
                        setFilteredPlayers(prev => prev.filter(p => p.id !== player.id));
                      }}
                      className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      Mine
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DraftBoard; 