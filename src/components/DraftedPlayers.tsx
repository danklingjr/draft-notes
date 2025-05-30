import React from 'react';
import { useDraft } from '../context/DraftContext';
import { NFLPlayer } from '../services/nflService';
import PlayerAvatar from './PlayerAvatar';

const DraftedPlayers: React.FC = () => {
  const { otherDraftedPlayers, undraftPlayer } = useDraft();

  const formatPlayerName = (player: NFLPlayer): string => {
    if (player.position === 'DEF') {
      return player.fullName.replace(' Defense', '');
    }
    return player.fullName;
  };

  return (
    <div className="h-full flex flex-col">
      {/* Players List */}
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-2 p-4">
          {otherDraftedPlayers.map(player => (
            <div
              key={player.id}
              className="flex items-center gap-1 p-2 rounded bg-white border border-gray-100"
            >
              <PlayerAvatar player={player} size="sm" />
              <div className="flex items-center justify-between flex-1">
                <div>
                  <div className="text-sm text-gray-900">{formatPlayerName(player)}</div>
                  <div className="text-xs text-gray-500">
                    {player.team} · {player.position} · BYE {player.byeWeek || '-'}
                  </div>
                </div>
                <button
                  onClick={() => undraftPlayer(player.id, false)}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}

          {otherDraftedPlayers.length === 0 && (
            <div className="text-center text-sm text-gray-500 py-4">
              No players drafted yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DraftedPlayers; 