import React, { createContext, useContext, useState, useEffect } from 'react';
import { NFLPlayer } from '../services/nflService';
import { saveDraftState, loadDraftState, clearDraftState } from '../services/draftPersistenceService';

interface DraftContextType {
  myDraftedPlayers: NFLPlayer[];
  otherDraftedPlayers: NFLPlayer[];
  draftPlayerToMine: (player: NFLPlayer) => void;
  draftPlayerToOthers: (player: NFLPlayer) => void;
  undraftPlayer: (playerId: string, isFromMyRoster: boolean) => void;
  isPlayerDrafted: (playerId: string) => boolean;
  clearDraft: () => void;
  saveCurrentDraft: () => Promise<void>;
}

const DraftContext = createContext<DraftContextType | undefined>(undefined);

export function DraftProvider({ children }: { children: React.ReactNode }) {
  const [myDraftedPlayers, setMyDraftedPlayers] = useState<NFLPlayer[]>([]);
  const [otherDraftedPlayers, setOtherDraftedPlayers] = useState<NFLPlayer[]>([]);
  const [autoSave, setAutoSave] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load initial state
  useEffect(() => {
    const loadInitialState = async () => {
      console.log('Loading initial state...');
      try {
        const state = await loadDraftState();
        console.log('Loaded state:', state);
        if (state) {
          setMyDraftedPlayers(state.myDraftedPlayers);
          setOtherDraftedPlayers(state.otherDraftedPlayers);
        }
      } catch (error) {
        console.error('Error loading initial state:', error);
      } finally {
        setIsLoaded(true);
      }
    };

    loadInitialState();
  }, []);

  // Save state whenever it changes
  useEffect(() => {
    if (!isLoaded) return; // Don't save until initial load is complete
    
    if (autoSave) {
      console.log('Auto-saving state...');
      saveDraftState(myDraftedPlayers, otherDraftedPlayers).catch(error => {
        console.error('Failed to save draft state:', error);
      });
    }
  }, [myDraftedPlayers, otherDraftedPlayers, autoSave, isLoaded]);

  const clearDraft = () => {
    console.log('Clearing draft...');
    setAutoSave(false);
    setMyDraftedPlayers([]);
    setOtherDraftedPlayers([]);
    clearDraftState();
    setAutoSave(true);
  };

  const saveCurrentDraft = async () => {
    console.log('Manual save triggered...');
    await saveDraftState(myDraftedPlayers, otherDraftedPlayers);
  };

  const draftPlayerToMine = (player: NFLPlayer) => {
    console.log('Adding player to my roster:', player);
    setMyDraftedPlayers(prev => [...prev, player]);
  };

  const draftPlayerToOthers = (player: NFLPlayer) => {
    console.log('Adding player to others:', player);
    setOtherDraftedPlayers(prev => [...prev, player]);
  };

  const undraftPlayer = (playerId: string, isFromMyRoster: boolean) => {
    console.log('Undrafting player:', playerId, 'from my roster:', isFromMyRoster);
    if (isFromMyRoster) {
      setMyDraftedPlayers(prev => prev.filter(p => p.id !== playerId));
    } else {
      setOtherDraftedPlayers(prev => prev.filter(p => p.id !== playerId));
    }
  };

  const isPlayerDrafted = (playerId: string) => {
    return (
      myDraftedPlayers.some(p => p.id === playerId) ||
      otherDraftedPlayers.some(p => p.id === playerId)
    );
  };

  return (
    <DraftContext.Provider
      value={{
        myDraftedPlayers,
        otherDraftedPlayers,
        draftPlayerToMine,
        draftPlayerToOthers,
        undraftPlayer,
        isPlayerDrafted,
        clearDraft,
        saveCurrentDraft,
      }}
    >
      {children}
    </DraftContext.Provider>
  );
}

export function useDraft() {
  const context = useContext(DraftContext);
  if (context === undefined) {
    throw new Error('useDraft must be used within a DraftProvider');
  }
  return context;
} 