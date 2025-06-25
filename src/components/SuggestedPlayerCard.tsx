import React from 'react';
import { NFLPlayer } from '../services/nflService';
import PlayerAvatar from './PlayerAvatar';
import { formatPoints } from '../services/fantasyPointsService';

interface PlayerWithPoints extends NFLPlayer {
  lastSeasonPoints?: number;
  projectedPoints?: number;
  projectedFantasyPoints2025?: number;
}

interface SuggestedPlayerCardProps {
  player: PlayerWithPoints;
  onSelect: (type: 'mine' | 'theirs') => void;
}

const SuggestedPlayerCard: React.FC<SuggestedPlayerCardProps> = ({ player, onSelect }) => {
  return (
    <div className="bg-white rounded-lg overflow-hidden">
      {/* Header with player info and points */}
      <div className="relative">
        <div className="flex items-center gap-2 p-2">
          <PlayerAvatar player={player} size="sm" />
          <div className="flex-1 min-w-0">
            <div className="font-medium text-gray-900 truncate">{player.fullName}</div>
            <div className="text-xs text-gray-500">
              {player.team}, {player.position} - Bye {player.byeWeek}
            </div>
          </div>
        </div>
        <div className="absolute top-2 right-2 bg-gray-900 text-white px-2 py-1 rounded text-xs font-medium">
          {formatPoints(player.projectedFantasyPoints2025)}
        </div>
      </div>

      {/* Action buttons */}
      <div className="px-3 py-2 flex justify-between gap-2">
        <button
          onClick={() => onSelect('theirs')}
          className="flex-1 py-1.5 text-center bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-sm"
        >
          Theirs
        </button>
        <button
          onClick={() => onSelect('mine')}
          className="flex-1 py-1.5 text-center bg-blue-500 hover:bg-blue-600 text-white rounded text-sm"
        >
          Mine
        </button>
      </div>
    </div>
  );
};

export default SuggestedPlayerCard; 