import React, { useState, useEffect } from 'react';
import { useDraft } from '../context/DraftContext';
import SuggestedPlayerCard from './SuggestedPlayerCard';
import { NFLPlayer, getNFLPlayers } from '../services/nflService';
import { getFantasyPoints } from '../services/fantasyPointsService';

interface PlayerWithPoints extends NFLPlayer {
  lastSeasonPoints?: number;
  projectedPoints?: number;
}

const SuggestionsSidebar: React.FC = () => {
  const { myDraftedPlayers, otherDraftedPlayers, draftPlayerToMine, draftPlayerToOthers } = useDraft();
  const [allPlayers, setAllPlayers] = useState<PlayerWithPoints[]>([]);

  // Load all players with fantasy points
  useEffect(() => {
    const loadPlayers = async () => {
      try {
        const nflPlayers = await getNFLPlayers();
        const playersWithPoints = await Promise.all(
          nflPlayers.map(async (player) => {
            const points = await getFantasyPoints(player);
            return {
              ...player,
              ...points
            };
          })
        );
        setAllPlayers(playersWithPoints);
      } catch (error) {
        console.error('Error loading players:', error);
      }
    };
    loadPlayers();
  }, []);

  // Get top 5 available players by projected points
  const suggestedPlayers = React.useMemo(() => {
    const draftedIds = new Set([
      ...myDraftedPlayers.map(p => p.id),
      ...otherDraftedPlayers.map(p => p.id)
    ]);
    
    return allPlayers
      .filter(p => !draftedIds.has(p.id))
      .sort((a, b) => (b.projectedPoints || 0) - (a.projectedPoints || 0))
      .slice(0, 5);
  }, [allPlayers, myDraftedPlayers, otherDraftedPlayers]);

  const handleSelect = (player: NFLPlayer, type: 'mine' | 'theirs') => {
    if (type === 'mine') {
      draftPlayerToMine(player);
    } else {
      draftPlayerToOthers(player);
    }
  };

  return (
    <div className="h-full w-80 flex flex-col bg-[#0A1929] rounded-lg overflow-hidden">
      <div className="p-4 flex items-center gap- text-white">
        <div className="bg-pink-500 w-8 h-8 rounded-full flex items-center justify-center">
          <span className="text-lg">🐷</span>
        </div>
        <div>
          <div className="text-sm font-medium">ROUND 1</div>
          <div className="text-xs text-gray-400">PICK 21</div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-2 gap-3">
        {suggestedPlayers.map((player) => (
          <SuggestedPlayerCard
            key={player.id}
            player={player}
            onSelect={(type) => handleSelect(player, type)}
          />
        ))}
      </div>
    </div>
  );
};

export default SuggestionsSidebar; 