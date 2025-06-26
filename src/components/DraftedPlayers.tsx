import React, { useEffect } from 'react';
import { useDraft } from '../context/DraftContext';
import PlayerAvatar from './PlayerAvatar';

const DraftedPlayers: React.FC = () => {
  const { draftOrder, undraftPlayer } = useDraft();

  // Debug logging
  useEffect(() => {
    console.log('DraftedPlayers: Received updated data:', {
      draftOrder: draftOrder.map(entry => ({
        name: entry.player.fullName,
        team: entry.team
      }))
    });
  }, [draftOrder]);

  const formatPlayerName = (player: any): string => {
    if (player.position === 'DEF') {
      return player.fullName.replace(' Defense', '');
    }
    return player.fullName;
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-gray-200 bg-gray-50">
        <h3 className="text-sm font-medium text-gray-900">All Drafted Players</h3>
        <p className="text-xs text-gray-500 mt-1">Chronological order</p>
      </div>

      {/* Players List */}
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-1 p-2">
          {draftOrder.map((entry, draftOrderIndex) => (
            <div
              key={`${entry.player.id}-${draftOrderIndex}`}
              className={`flex items-center gap-2 p-2 rounded border ${
                entry.team === 'mine' 
                  ? 'bg-blue-50 border-blue-200' 
                  : 'bg-white border-gray-100'
              }`}
            >
              {/* Draft Order */}
              <div className="text-xs text-gray-400 font-mono w-6 text-center">
                #{draftOrderIndex + 1}
              </div>
              {/* Team Indicator */}
              <div className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                entry.team === 'mine' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {entry.team === 'mine' ? 'Mine' : 'Other'}
              </div>
              <PlayerAvatar player={entry.player} size="sm" />
              <div className="flex items-center justify-between flex-1 min-w-0">
                <div className="min-w-0 flex-1">
                  <div className="text-sm text-gray-900 truncate">{formatPlayerName(entry.player)}</div>
                  <div className="text-xs text-gray-500">
                    {entry.player.team} · {entry.player.position} · BYE {entry.player.byeWeek || '-'}
                  </div>
                </div>
                <button
                  onClick={() => undraftPlayer(entry.player.id)}
                  className="text-xs text-gray-400 hover:text-gray-600 ml-2 flex-shrink-0"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}

          {draftOrder.length === 0 && (
            <div className="text-center text-sm text-gray-500 py-8">
              No players drafted yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DraftedPlayers; 