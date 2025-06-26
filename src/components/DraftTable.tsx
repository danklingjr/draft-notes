import React, { useState, useEffect } from 'react';
import { DraftedPlayerEntry, useDraft } from '../context/DraftContext';
import PlayerAvatar from './PlayerAvatar';

interface DraftTableProps {
  draftOrder: DraftedPlayerEntry[];
  teams: number;
  onClose: () => void;
  onDraftOrderChange?: (newDraftOrder: DraftedPlayerEntry[]) => void;
}

const DraftTable: React.FC<DraftTableProps> = ({ 
  draftOrder, 
  teams, 
  onClose,
  onDraftOrderChange 
}) => {
  // Convert linear draftOrder to 2D array for the table
  const getInitialDraftState = () => {
    const draftState: (DraftedPlayerEntry | null)[][] = [];
    for (let round = 0; round < 16; round++) {
      const roundEntries: (DraftedPlayerEntry | null)[] = [];
      const isReverseRound = (round + 1) % 2 === 0;
      for (let pick = 0; pick < teams; pick++) {
        const pickNumber = round * teams + pick;
        if (pickNumber < draftOrder.length) {
          roundEntries.push(draftOrder[pickNumber]);
        } else {
          roundEntries.push(null);
        }
      }
      if (isReverseRound) roundEntries.reverse();
      draftState.push(roundEntries);
    }
    return draftState;
  };

  const [draftState, setDraftState] = useState(getInitialDraftState);
  const [draggedEntry, setDraggedEntry] = useState<DraftedPlayerEntry | null>(null);
  const [draggedFrom, setDraggedFrom] = useState<{round: number, team: number} | null>(null);

  useEffect(() => {
    setDraftState(getInitialDraftState());
  }, [draftOrder, teams]);

  // Convert draft state back to linear order
  const convertDraftStateToLinearOrder = () => {
    const allEntries: DraftedPlayerEntry[] = [];
    for (let round = 0; round < draftState.length; round++) {
      const roundEntries = draftState[round];
      const isReverseRound = (round + 1) % 2 === 0;
      const roundOrder = isReverseRound ? [...roundEntries].reverse() : [...roundEntries];
      roundOrder.forEach(entry => {
        if (entry) allEntries.push(entry);
      });
    }
    return allEntries;
  };

  const handleDragStart = (e: React.DragEvent, entry: DraftedPlayerEntry, round: number, team: number) => {
    setDraggedEntry(entry);
    setDraggedFrom({ round, team });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetRound: number, targetTeam: number) => {
    e.preventDefault();
    if (!draggedEntry || !draggedFrom) return;
    const { round: fromRound, team: fromTeam } = draggedFrom;
    if (fromRound === targetRound && fromTeam === targetTeam) return;
    setDraftState(prevState => {
      const newState = prevState.map((round, roundIndex) => 
        round.map((entry, teamIndex) => {
          if (roundIndex === fromRound && teamIndex === fromTeam) {
            return prevState[targetRound][targetTeam];
          }
          if (roundIndex === targetRound && teamIndex === targetTeam) {
            return draggedEntry;
          }
          return entry;
        })
      );
      setTimeout(() => {
        saveChanges(newState);
      }, 0);
      return newState;
    });
    setDraggedEntry(null);
    setDraggedFrom(null);
  };

  const handleDragEnd = () => {
    setDraggedEntry(null);
    setDraggedFrom(null);
  };

  // Save changes when draft state changes
  const saveChanges = (state: (DraftedPlayerEntry | null)[][]) => {
    if (onDraftOrderChange) {
      const newLinearOrder: DraftedPlayerEntry[] = [];
      for (let round = 0; round < state.length; round++) {
        const roundEntries = state[round];
        const isReverseRound = (round + 1) % 2 === 0;
        const roundOrder = isReverseRound ? [...roundEntries].reverse() : [...roundEntries];
        roundOrder.forEach(entry => {
          if (entry) newLinearOrder.push(entry);
        });
      }
      onDraftOrderChange(newLinearOrder);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full h-full max-w-none max-h-none flex flex-col m-4">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-2xl font-bold text-gray-800">Draft Board</h2>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              Drag players between teams to change order
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
            >
              ×
            </button>
          </div>
        </div>
        {/* Table */}
        <div className="flex-1 overflow-auto p-4">
          <div className="overflow-x-auto h-full">
            <table className="w-full border-collapse">
              <thead className="sticky top-0 bg-white z-10">
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-3 py-2 text-left font-semibold text-sm">Round</th>
                  {Array.from({ length: teams }, (_, i) => (
                    <th 
                      key={i} 
                      className="border border-gray-300 px-2 py-2 text-center font-semibold text-sm"
                    >
                      <div>Team {i + 1}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {draftState.map((roundEntries, roundIndex) => (
                  <tr key={roundIndex} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-3 py-2 text-center font-semibold bg-gray-100 text-sm sticky left-0 z-5">
                      {roundIndex + 1}
                    </td>
                    {roundEntries.map((entry, teamIndex) => (
                      <td 
                        key={entry ? `${entry.player.id}-${teamIndex}` : `empty-${teamIndex}`}
                        className={`border border-gray-300 px-2 py-2 ${
                          draggedEntry && draggedFrom?.round === roundIndex && draggedFrom?.team === teamIndex
                            ? 'bg-blue-50 border-blue-300'
                            : ''
                        }`}
                        draggable={!!entry}
                        onDragStart={(e) => entry && handleDragStart(e, entry, roundIndex, teamIndex)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, roundIndex, teamIndex)}
                        onDragEnd={handleDragEnd}
                      >
                        {entry ? (
                          <div className="flex items-center space-x-2 cursor-move">
                            <PlayerAvatar player={entry.player} size="sm" />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm truncate">{entry.player.fullName}</div>
                              <div className="text-xs text-gray-500">
                                {entry.player.team} • {entry.player.position} • {entry.team === 'mine' ? 'Mine' : 'Other'}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-gray-400 text-sm min-h-[40px] flex items-center justify-center">
                            Drop here
                          </div>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DraftTable; 