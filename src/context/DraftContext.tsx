import React, { createContext, useContext, useState, useEffect } from 'react';
import { NFLPlayer } from '../services/nflService';
import { saveDraftState, loadDraftState, clearDraftState } from '../services/draftPersistenceService';

export type DraftedPlayerEntry = {
  player: NFLPlayer;
  team: 'mine' | 'other';
};

interface DraftContextType {
  draftOrder: DraftedPlayerEntry[];
  draftPlayerToMine: (player: NFLPlayer) => void;
  draftPlayerToOthers: (player: NFLPlayer) => void;
  undraftPlayer: (playerId: string) => void;
  isPlayerDrafted: (playerId: string) => boolean;
  clearDraft: () => void;
  saveCurrentDraft: () => Promise<void>;
  updateDraftOrder: (newDraftOrder: DraftedPlayerEntry[]) => void;
  myDraftedPlayers: NFLPlayer[];
  otherDraftedPlayers: NFLPlayer[];
}

const DraftContext = createContext<DraftContextType | undefined>(undefined);

export function DraftProvider({ children }: { children: React.ReactNode }) {
  const [draftOrder, setDraftOrder] = useState<DraftedPlayerEntry[]>([]);
  const [autoSave, setAutoSave] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load initial state
  useEffect(() => {
    const loadInitialState = async () => {
      console.log('Loading initial state...');
      try {
        const state = await loadDraftState();
        console.log('Loaded state:', state);
        if (state && state.draftOrder) {
          setDraftOrder(state.draftOrder);
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
    if (!isLoaded) return;
    if (autoSave) {
      console.log('Auto-saving state...');
      saveDraftState(draftOrder).catch(error => {
        console.error('Failed to save draft state:', error);
      });
    }
  }, [draftOrder, autoSave, isLoaded]);

  const clearDraft = () => {
    console.log('Clearing draft...');
    setAutoSave(false);
    setDraftOrder([]);
    clearDraftState();
    setAutoSave(true);
  };

  const saveCurrentDraft = async () => {
    console.log('Manual save triggered...');
    await saveDraftState(draftOrder);
  };

  const draftPlayerToMine = (player: NFLPlayer) => {
    setDraftOrder(prev => [...prev, { player, team: 'mine' }]);
  };

  const draftPlayerToOthers = (player: NFLPlayer) => {
    setDraftOrder(prev => [...prev, { player, team: 'other' }]);
  };

  const undraftPlayer = (playerId: string) => {
    setDraftOrder(prev => prev.filter(entry => entry.player.id !== playerId));
  };

  const isPlayerDrafted = (playerId: string) => {
    return draftOrder.some(entry => entry.player.id === playerId);
  };

  const updateDraftOrder = (newDraftOrder: DraftedPlayerEntry[]) => {
    setDraftOrder([...newDraftOrder]);
  };

  // Selectors for convenience
  const myDraftedPlayers = draftOrder.filter(entry => entry.team === 'mine').map(entry => entry.player);
  const otherDraftedPlayers = draftOrder.filter(entry => entry.team === 'other').map(entry => entry.player);

  return (
    <DraftContext.Provider
      value={{
        draftOrder,
        draftPlayerToMine,
        draftPlayerToOthers,
        undraftPlayer,
        isPlayerDrafted,
        clearDraft,
        saveCurrentDraft,
        updateDraftOrder,
        myDraftedPlayers,
        otherDraftedPlayers,
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