import { NFLPlayer } from './nflService';

interface DraftState {
  myDraftedPlayers: NFLPlayer[];
  otherDraftedPlayers: NFLPlayer[];
  timestamp: string;
}

const STORAGE_KEY = 'draft_state';

export async function saveDraftState(myDraftedPlayers: NFLPlayer[], otherDraftedPlayers: NFLPlayer[]): Promise<void> {
  const state: DraftState = {
    myDraftedPlayers,
    otherDraftedPlayers,
    timestamp: new Date().toISOString()
  };

  try {
    console.log('Saving draft state:', state);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    console.log('Draft state saved successfully');
  } catch (error) {
    console.error('Error saving draft state:', error);
    throw error;
  }
}

export async function loadDraftState(): Promise<DraftState | null> {
  try {
    const savedState = localStorage.getItem(STORAGE_KEY);
    console.log('Loading draft state from storage:', savedState);
    
    if (!savedState) {
      console.log('No saved state found');
      return null;
    }
    
    const parsedState = JSON.parse(savedState);
    console.log('Parsed state:', parsedState);
    return parsedState;
  } catch (error) {
    console.error('Error loading draft state:', error);
    return null;
  }
}

export function clearDraftState(): void {
  try {
    console.log('Clearing draft state');
    localStorage.removeItem(STORAGE_KEY);
    console.log('Draft state cleared successfully');
  } catch (error) {
    console.error('Error clearing draft state:', error);
    throw error;
  }
} 