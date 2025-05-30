import React, { useState } from 'react';
import { useDraft } from '../context/DraftContext';
import { NFLPlayer } from '../services/nflService';
import MyRoster from './MyRoster';
import DraftedPlayers from './DraftedPlayers';
import DraftControls from './DraftControls';

const ROSTER_SLOTS = [
  { id: 'QB1', label: 'QB' },
  { id: 'QB2', label: 'QB' },
  { id: 'RB1', label: 'RB' },
  { id: 'RB2', label: 'RB' },
  { id: 'WR1', label: 'WR' },
  { id: 'WR2', label: 'WR' },
  { id: 'TE', label: 'TE' },
  { id: 'FLEX', label: 'FLEX' },
  { id: 'K', label: 'K' },
  { id: 'DEF', label: 'DEF' },
  { id: 'BE1', label: 'BE' },
  { id: 'BE2', label: 'BE' },
  { id: 'BE3', label: 'BE' },
  { id: 'BE4', label: 'BE' },
  { id: 'BE5', label: 'BE' },
  { id: 'BE6', label: 'BE' },
  { id: 'BE7', label: 'BE' },
];

type Tab = 'roster' | 'drafted';

const DraftSidebar: React.FC = () => {
  const { myDraftedPlayers, otherDraftedPlayers, undraftPlayer } = useDraft();
  const [activeTab, setActiveTab] = useState<Tab>('roster');

  // Function to find a player for a roster slot
  const getPlayerForSlot = (slotId: string) => {
    const position = slotId.replace(/[0-9]/g, '');
    const usedPlayerIds = new Set<string>();

    // Helper to mark a player as used
    const markPlayerAsUsed = (player: NFLPlayer | undefined) => {
      if (player) {
        usedPlayerIds.add(player.id);
      }
    };

    // Get all used players before this slot
    ROSTER_SLOTS.slice(0, ROSTER_SLOTS.findIndex(slot => slot.id === slotId)).forEach(slot => {
      markPlayerAsUsed(getPlayerForSlotSimple(slot.id));
    });

    // Helper to find an unused player of a specific position
    const findUnusedPlayer = (positions: string[]) => {
      return myDraftedPlayers.find(p => 
        positions.includes(p.position) && !usedPlayerIds.has(p.id)
      );
    };

    // Simple slot assignment without considering used players
    function getPlayerForSlotSimple(slotId: string) {
      const pos = slotId.replace(/[0-9]/g, '');
      if (pos === 'FLEX') {
        return findUnusedPlayer(['RB', 'WR', 'TE']);
      }
      if (pos === 'BE') {
        const index = parseInt(slotId.replace('BE', '')) - 1;
        const remainingPlayers = myDraftedPlayers.filter(p => !usedPlayerIds.has(p.id));
        return remainingPlayers[index];
      }
      return findUnusedPlayer([pos]);
    }

    return getPlayerForSlotSimple(slotId);
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 border-l border-gray-200 overflow-hidden rounded-r-lg">
      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-gray-50">
        <button
          onClick={() => setActiveTab('roster')}
          className={`flex-1 py-3 text-sm font-medium ${
            activeTab === 'roster'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          My Roster
        </button>
        <button
          onClick={() => setActiveTab('drafted')}
          className={`flex-1 py-3 text-sm font-medium ${
            activeTab === 'drafted'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Drafted
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0">
        {activeTab === 'roster' ? (
          <MyRoster />
        ) : (
          <DraftedPlayers />
        )}
      </div>

      {/* Controls */}
      <DraftControls />
    </div>
  );
};

export default DraftSidebar; 