'use client';

import React, { useState, useEffect } from 'react';
import DraftBoard from '../components/DraftBoard';
import SuggestionsSidebar from '../components/SuggestionsSidebar';
import { DraftProvider, useDraft } from '../context/DraftContext';
import { NFLPlayer, getNFLPlayers } from '../services/nflService';

const DraftApp: React.FC = () => {
  return (
    <DraftProvider>
      <DraftAppContent />
    </DraftProvider>
  );
};

const DraftAppContent: React.FC = () => {
  const { myDraftedPlayers, otherDraftedPlayers, draftPlayerToMine, draftPlayerToOthers } = useDraft();
  const [availablePlayers, setAvailablePlayers] = useState<NFLPlayer[]>([]);

  // Calculate round and pick
  const totalDrafted = myDraftedPlayers.length + otherDraftedPlayers.length;
  const round = Math.floor(totalDrafted / 12) + 1; // Assuming 12 teams
  const pick = (totalDrafted % 12) + 1;

  // Load available players
  useEffect(() => {
    const loadPlayers = async () => {
      try {
        const allPlayers = await getNFLPlayers();
        console.log('Loaded all players:', allPlayers.length);
        const draftedPlayerIds = new Set([
          ...myDraftedPlayers.map(p => p.id),
          ...otherDraftedPlayers.map(p => p.id)
        ]);
        const available = allPlayers.filter(player => !draftedPlayerIds.has(player.id));
        console.log('Available players:', available.length);
        setAvailablePlayers(available);
      } catch (error) {
        console.error('Error loading available players:', error);
      }
    };
    loadPlayers();
  }, [myDraftedPlayers, otherDraftedPlayers]);

  const handleDraft = (player: NFLPlayer, mine: boolean) => {
    if (mine) {
      draftPlayerToMine(player);
    } else {
      draftPlayerToOthers(player);
    }
  };

  console.log('Rendering DraftAppContent:', {
    availablePlayers: availablePlayers.length,
    myDraftedPlayers: myDraftedPlayers.length,
    otherDraftedPlayers: otherDraftedPlayers.length,
    round,
    pick
  });

  return (
    <main className="flex h-screen bg-gray-100">
      <div className="flex-1 overflow-auto">
        <DraftBoard />
      </div>
      <div className="w-96 border-l border-gray-300">
        <SuggestionsSidebar
          availablePlayers={availablePlayers}
          myRoster={myDraftedPlayers}
          round={round}
          pick={pick}
          onDraft={handleDraft}
        />
      </div>
    </main>
  );
};

export default function Home() {
  return <DraftApp />;
} 