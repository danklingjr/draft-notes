interface PlayerNotes {
  [playerId: string]: string;
}

interface NotesState {
  notes: PlayerNotes;
  timestamp: string;
}

const STORAGE_KEY = 'player_notes';

export async function savePlayerNotes(notes: PlayerNotes): Promise<void> {
  const state: NotesState = {
    notes,
    timestamp: new Date().toISOString()
  };

  try {
    console.log('Saving player notes:', state);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    console.log('Player notes saved successfully');
  } catch (error) {
    console.error('Error saving player notes:', error);
    throw error;
  }
}

export async function loadPlayerNotes(): Promise<PlayerNotes> {
  try {
    const savedState = localStorage.getItem(STORAGE_KEY);
    console.log('Loading player notes from storage:', savedState);
    
    if (!savedState) {
      console.log('No saved notes found');
      return {};
    }
    
    const parsedState: NotesState = JSON.parse(savedState);
    console.log('Parsed notes state:', parsedState);
    return parsedState.notes || {};
  } catch (error) {
    console.error('Error loading player notes:', error);
    return {};
  }
}

export function clearPlayerNotes(): void {
  try {
    console.log('Clearing player notes');
    localStorage.removeItem(STORAGE_KEY);
    console.log('Player notes cleared successfully');
  } catch (error) {
    console.error('Error clearing player notes:', error);
    throw error;
  }
} 