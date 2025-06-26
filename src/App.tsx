import React, { useEffect, useState } from 'react';
import DraftBoard from './components/DraftBoard';
import SuggestionsSidebar from './components/SuggestionsSidebar';
import DraftSidebar from './components/DraftSidebar';
import { DraftProvider, useDraft } from './context/DraftContext';
import { NFLPlayer, getNFLPlayers } from './services/nflService';

const TEAMS = 10;

const AppContent: React.FC = () => {
  const { myDraftedPlayers, otherDraftedPlayers, draftPlayerToMine, draftPlayerToOthers } = useDraft();
  const [availablePlayers, setAvailablePlayers] = useState<NFLPlayer[]>([]);

  // Calculate round and pick
  const totalDrafted = myDraftedPlayers.length + otherDraftedPlayers.length;
  const round = Math.floor(totalDrafted / TEAMS) + 1;
  const pick = (totalDrafted % TEAMS) + 1;

  // Load available players
  useEffect(() => {
    const loadPlayers = async () => {
      try {
        const allPlayers = await getNFLPlayers();
        const draftedPlayerIds = new Set([
          ...myDraftedPlayers.map(p => p.id),
          ...otherDraftedPlayers.map(p => p.id)
        ]);
        const available = allPlayers.filter(player => !draftedPlayerIds.has(player.id));
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

  return (
    <div className="min-h-screen bg-[#0A1929] p-4 flex">
      {/* Suggestions Sidebar (flush left) */}
      <div className="w-96 h-full mr-4">
        <SuggestionsSidebar
          availablePlayers={availablePlayers}
          myRoster={myDraftedPlayers}
          round={round}
          pick={pick}
          onDraft={handleDraft}
        />
      </div>
      {/* Main Content Container (centered) */}
      <div className="flex-1">
        <div className="container mx-auto h-[calc(100vh-32px)]">
          <div className="flex bg-white rounded-lg shadow-lg h-full">
            {/* Draft Board (center) */}
            <div className="flex-1">
              <DraftBoard />
            </div>
            {/* Roster/Drafted Sidebar (right) */}
            <div className="w-80 h-full border-l border-gray-200">
              <DraftSidebar />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function App() {
  useEffect(() => {
    console.log('App component mounted');
  }, []);

  return (
    <DraftProvider>
      <AppContent />
    </DraftProvider>
  );
}

export default App; 