import React, { useMemo } from 'react';
import { NFLPlayer } from '../services/nflService';
import { useDraft } from '../context/DraftContext';
import PlayerAvatar from './PlayerAvatar';

interface PositionSlot {
  id: string;
  position: string;
  display: string;
}

const MyRoster: React.FC = () => {
  const positionSlots: PositionSlot[] = [
    { id: 'QB1', position: 'QB', display: 'QB' },
    { id: 'QB2', position: 'QB', display: 'QB' },
    { id: 'RB1', position: 'RB', display: 'RB' },
    { id: 'RB2', position: 'RB', display: 'RB' },
    { id: 'WR1', position: 'WR', display: 'WR' },
    { id: 'WR2', position: 'WR', display: 'WR' },
    { id: 'TE1', position: 'TE', display: 'TE' },
    { id: 'FLEX1', position: 'FLEX', display: 'FLEX' },
    { id: 'K1', position: 'K', display: 'K' },
    { id: 'DEF1', position: 'DEF', display: 'DEF' },
    { id: 'BE1', position: 'BE', display: 'BE' },
    { id: 'BE2', position: 'BE', display: 'BE' },
    { id: 'BE3', position: 'BE', display: 'BE' },
    { id: 'BE4', position: 'BE', display: 'BE' },
    { id: 'BE5', position: 'BE', display: 'BE' },
    { id: 'BE6', position: 'BE', display: 'BE' },
  ];

  const { myDraftedPlayers, undraftPlayer } = useDraft();

  const formatPlayerName = (player: NFLPlayer): string => {
    if (player.position === 'DEF') {
      return player.fullName.replace(' Defense', '');
    }
    return player.fullName;
  };

  // Create a memoized roster assignment to prevent duplicates
  const rosterAssignments = useMemo(() => {
    const assignments = new Map<string, NFLPlayer>();
    const usedPlayerIds = new Set<string>();

    // Helper to find an unused player of a specific position
    const findUnusedPlayer = (validPositions: string[]) => {
      return myDraftedPlayers.find(p => 
        validPositions.includes(p.position) && !usedPlayerIds.has(p.id)
      );
    };

    // Assign players to positions in order
    positionSlots.forEach(slot => {
      let player: NFLPlayer | undefined;

      if (slot.position === 'FLEX') {
        player = findUnusedPlayer(['RB', 'WR', 'TE']);
      } else if (slot.position === 'BE') {
        // For bench spots, take any remaining player
        player = myDraftedPlayers.find(p => !usedPlayerIds.has(p.id));
      } else {
        player = findUnusedPlayer([slot.position]);
      }

      if (player) {
        assignments.set(slot.id, player);
        usedPlayerIds.add(player.id);
      }
    });

    return assignments;
  }, [myDraftedPlayers]);

  // Group positions for display
  const groupedPositions = {
    starters: positionSlots.filter(p => !p.position.startsWith('BE')),
    bench: positionSlots.filter(p => p.position.startsWith('BE'))
  };

  const renderPlayerSlot = (slot: PositionSlot) => {
    const player = rosterAssignments.get(slot.id);
    
    return (
      <div
        key={slot.id}
        className="flex items-center gap-1 p-2 rounded bg-white border border-gray-100"
      >
        <div className="w-10 text-sm text-gray-500">{slot.display}</div>
        {player ? (
          <div className="flex items-center justify-between flex-1">
            <div className="flex items-center gap-1">
              <PlayerAvatar player={player} />
              <div>
                <div className="text-sm text-gray-900">{formatPlayerName(player)}</div>
                <div className="text-xs text-gray-500">
                  {player.team} · BYE {player.byeWeek || '-'}
                </div>
              </div>
            </div>
            <button
              onClick={() => undraftPlayer(player.id, true)}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        ) : (
          <div className="text-sm text-gray-400">Empty</div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Roster Slots */}
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-2 p-4">
          {/* Starters */}
          <div className="space-y-2">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Starters</div>
            {groupedPositions.starters.map(renderPlayerSlot)}
          </div>

          {/* Bench */}
          <div className="space-y-2">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Bench</div>
            {groupedPositions.bench.map(renderPlayerSlot)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyRoster; 