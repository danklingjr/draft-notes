import React, { useEffect, useState, useRef } from 'react';
import { NFLPlayer } from '../services/nflService';
import PlayerAvatar from './PlayerAvatar';
import { AnimatePresence, motion } from 'framer-motion';
import DraftTable from './DraftTable';
import { useDraft, DraftedPlayerEntry } from '../context/DraftContext';

interface SuggestionsSidebarProps {
  availablePlayers: NFLPlayer[];
  myRoster: NFLPlayer[];
  round: number;
  pick: number;
  onDraft: (player: NFLPlayer, mine: boolean) => void;
  otherDraftedPlayers?: NFLPlayer[];
}

const ROSTER_LIMITS: Record<string, number> = { QB: 2, RB: 2, WR: 2, TE: 1, K: 1, DEF: 1 };
const SKILL_POSITIONS = ['RB', 'WR', 'QB', 'TE'];
const OTHER_POSITIONS = ['K', 'DEF'];
const POSITION_ORDER = [...SKILL_POSITIONS, ...OTHER_POSITIONS];

// Position weights
const POSITION_WEIGHTS: Record<string, number> = {
  QB: 1.2,
  RB: 1.1,
  WR: 1.0,
  TE: 0.95,
  K: 0.7,
  DEF: 0.7,
};

type DraftValuePlayer = NFLPlayer & { _draftValueScore: number };

function getPlayerScore(player: NFLPlayer) {
  const weight = POSITION_WEIGHTS[player.position] || 1.0;
  return (player.projectedFantasyPoints2025 || 0) * weight;
}

function getNeededPositions(myRoster: NFLPlayer[]) {
  const counts = myRoster.reduce((acc, p) => {
    acc[p.position] = (acc[p.position] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const needed: string[] = [];
  for (const pos of POSITION_ORDER) {
    const have = counts[pos] || 0;
    const need = ROSTER_LIMITS[pos] || 0;
    if (have < need) {
      for (let i = 0; i < need - have; i++) {
        needed.push(pos);
      }
    }
  }
  return needed;
}

// League settings
const TEAMS = 10;
const STARTERS = { QB: 2, RB: 2, WR: 2, TE: 1, K: 1, DEF: 1 };
type PositionKey = keyof typeof STARTERS;
const BASELINE_INDEX: Record<PositionKey, number> = {
  QB: TEAMS * STARTERS.QB - 1,
  RB: TEAMS * STARTERS.RB - 1,
  WR: TEAMS * STARTERS.WR - 1,
  TE: TEAMS * STARTERS.TE - 1,
  K: TEAMS * STARTERS.K - 1,
  DEF: TEAMS * STARTERS.DEF - 1,
};

// Footballguys need factor table (simplified for 1 or 2 starters)
function getNeedMultiplier(position: string, draftedCount: number, starters: number) {
  if (starters === 1) {
    if (draftedCount === 0) return 1.0;
    if (draftedCount === 1) return 0.8;
    if (draftedCount === 2) return 0.6;
    if (draftedCount === 3) return 0.4;
    if (draftedCount === 4) return 0.2;
  } else if (starters === 2) {
    if (draftedCount === 0) return 1.0;
    if (draftedCount === 1) return 1.0;
    if (draftedCount === 2) return 0.8;
    if (draftedCount === 3) return 0.6;
    if (draftedCount === 4) return 0.4;
  }
  return 1.0;
}

function getVBDScores(availablePlayers: NFLPlayer[], myRoster: NFLPlayer[]): DraftValuePlayer[] {
  // 1. Compute baseline for each position
  const byPosition: Record<PositionKey, NFLPlayer[]> = {
    QB: [], RB: [], WR: [], TE: [], K: [], DEF: []
  };
  for (const pos of Object.keys(BASELINE_INDEX) as PositionKey[]) {
    byPosition[pos] = availablePlayers
      .filter(p => p.position === pos)
      .sort((a, b) => (b.projectedFantasyPoints2025 || 0) - (a.projectedFantasyPoints2025 || 0));
  }
  const baselines: Record<PositionKey, number> = { QB: 0, RB: 0, WR: 0, TE: 0, K: 0, DEF: 0 };
  for (const pos of Object.keys(BASELINE_INDEX) as PositionKey[]) {
    const idx = BASELINE_INDEX[pos];
    baselines[pos] = byPosition[pos][idx]?.projectedFantasyPoints2025 || 0;
  }
  // 2. For each player, calculate VBD
  // 3. Apply need factor and flat bonus for open slots
  const myCounts: Record<string, number> = {};
  for (const p of myRoster) {
    myCounts[p.position] = (myCounts[p.position] || 0) + 1;
  }
  
  // Check if I haven't drafted key positions yet (only MY roster matters)
  const myQBs = myCounts['QB'] || 0;
  const myRBs = myCounts['RB'] || 0;
  const myWRs = myCounts['WR'] || 0;
  const myTEs = myCounts['TE'] || 0;
  
  const noQBsOnMyRoster = myQBs === 0;
  const noRBsOnMyRoster = myRBs === 0;
  const noWRsOnMyRoster = myWRs === 0;
  const noTEsOnMyRoster = myTEs === 0;
  
  return availablePlayers.map(p => {
    const baseline = baselines[(p.position as PositionKey)] || 0;
    const vbd = (p.projectedFantasyPoints2025 || 0) - baseline;
    const draftedCount = myCounts[p.position] || 0;
    const starters = STARTERS[(p.position as PositionKey)] || 1;
    const needMultiplier = getNeedMultiplier(p.position, draftedCount, starters);
    const adjVBD = vbd * needMultiplier;
    const openSlots = Math.max(0, starters - draftedCount);
    const needWeight = 1 + 0.2 * openSlots; // +20% per open slot
    let finalScore = adjVBD * needWeight;
    
    // Add extra weight to key positions when I haven't drafted any yet
    if (p.position === 'QB' && noQBsOnMyRoster) {
      finalScore *= 1.3; // +30% boost for QBs when I have none
    } else if (p.position === 'RB' && noRBsOnMyRoster) {
      finalScore *= 1.25; // +25% boost for RBs when I have none
    } else if (p.position === 'WR' && noWRsOnMyRoster) {
      finalScore *= 1.25; // +25% boost for WRs when I have none
    } else if (p.position === 'TE' && noTEsOnMyRoster) {
      finalScore *= 1.15; // +15% boost for TEs when I have none (smaller than RB/WR)
    }
    
    // De-emphasize QB, TE, K, DEF if you have 2 or more; TE if you have 1
    if ((['QB', 'K', 'DEF'] as PositionKey[]).includes(p.position as PositionKey) && draftedCount >= 2) {
      finalScore *= 0.2;
    } else if (p.position === 'TE' && draftedCount === 2) {
      finalScore *= 0.2;
    } else if (p.position === 'TE' && draftedCount === 1) {
      finalScore *= 0.5;
    }
    return { ...p, _draftValueScore: Math.round(finalScore) };
  });
}

function getInitialSuggestionQueue(availablePlayers: NFLPlayer[], myRoster: NFLPlayer[]): DraftValuePlayer[] {
  const scoredPlayers = getVBDScores(availablePlayers, myRoster);
  // Sort by VBD, apply 2-QB max rule
  const queue: DraftValuePlayer[] = [];
  let qbCount = 0;
  for (const player of scoredPlayers.sort((a, b) => (b._draftValueScore ?? 0) - (a._draftValueScore ?? 0))) {
    if (player.position === 'QB') {
      if (qbCount >= 2) continue;
      qbCount++;
    }
    queue.push(player);
    if (queue.length >= 5) break;
  }
  return queue;
}

function getBestSuggestion(availablePlayers: NFLPlayer[], myRoster: NFLPlayer[], excludeIds: Set<string> = new Set(), currentQueue: DraftValuePlayer[] = []): DraftValuePlayer | undefined {
  const scoredPlayers = getVBDScores(
    availablePlayers.filter(p => !excludeIds.has(p.id)),
    myRoster
  );
  const qbCount = currentQueue.filter(p => p.position === 'QB').length;
  for (const player of scoredPlayers.sort((a, b) => (b._draftValueScore ?? 0) - (a._draftValueScore ?? 0))) {
    if (player.position === 'QB' && qbCount >= 2) continue;
    return player;
  }
  return undefined;
}

const SuggestionsSidebar: React.FC<SuggestionsSidebarProps> = ({ 
  availablePlayers, 
  myRoster, 
  round, 
  pick, 
  onDraft,
  otherDraftedPlayers = []
}) => {
  const [suggestionQueue, setSuggestionQueue] = useState<DraftValuePlayer[]>([]);
  const [showDraftTable, setShowDraftTable] = useState(false);
  const prevAvailablePlayersRef = useRef<NFLPlayer[]>([]);
  const { draftOrder, updateDraftOrder } = useDraft();

  // Reset the queue if availablePlayers changes significantly (e.g., draft reset)
  useEffect(() => {
    setSuggestionQueue(getInitialSuggestionQueue(availablePlayers, myRoster));
    prevAvailablePlayersRef.current = availablePlayers;
  }, [availablePlayers, myRoster]);

  // Handle draft from the sidebar
  const handleDraft = (player: NFLPlayer, mine: boolean) => {
    onDraft(player, mine);
    setSuggestionQueue(prevQueue => {
      const newQueue = prevQueue.filter(p => p.id !== player.id);
      // Exclude all drafted and already-shown players
      const excludeIds = new Set([
        ...myRoster.map(p => p.id),
        ...newQueue.map(p => p.id),
        player.id
      ]);
      const next = getBestSuggestion(availablePlayers, myRoster, excludeIds, newQueue);
      if (next) newQueue.push(next);
      return newQueue;
    });
  };

  const handleDraftOrderChange = (newDraftOrder: DraftedPlayerEntry[]) => {
    updateDraftOrder(newDraftOrder);
  };

  return (
    <>
      <aside className="rounded-xl p-4 w-96 flex flex-col items-center text-sm">
        <div className="flex items-center mb-4 w-full">
          <img src="/draftnotes.png" alt="Pig Logo" className="w-14 mr-2" />
          <div>
            <div className="text-white font-bold leading-tight text-xl">ROUND {round}</div>
            <div className="text-white">PICK {pick}</div>
          </div>
        </div>
        <AnimatePresence initial={false} mode="wait">
          {suggestionQueue.length === 0 ? (
            <motion.div
              key="no-suggestions"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-gray-700 text-center mt-8"
            >
              No suggestions available.<br/>Draft a player to see new suggestions.
            </motion.div>
          ) : (
            suggestionQueue.map((player, idx) => {
              const isNew = idx === suggestionQueue.length - 1 && suggestionQueue.length > 1;
              if (isNew) {
                return (
                  <motion.div
                    key={player.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-white rounded-xl shadow p-4 mb-4 w-full flex flex-col text-sm"
                  >
                    <div className="flex items-center mb-2">
                      <PlayerAvatar player={player} size="md" />
                      <div className="ml-3 flex-1">
                        <div className="font-bold leading-tight text-gray-900">{player.fullName}</div>
                        <div className="text-xs text-gray-500">{player.team}, {player.position} - Bye {player.byeWeek || '-'}</div>
                      </div>
                      <div className="bg-[#0d2235] text-white rounded px-2 py-1 font-bold text-base">{player._draftValueScore}</div>
                    </div>
                    <div className="flex mt-2 gap-2">
                      <button
                        className="w-full px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                        onClick={() => handleDraft(player, false)}
                      >
                        Theirs
                      </button>
                      <button
                        className="w-full px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                        onClick={() => handleDraft(player, true)}
                      >
                        Mine
                      </button>
                    </div>
                  </motion.div>
                );
              } else {
                return (
                  <div
                    key={player.id}
                    className="bg-white rounded-xl shadow p-4 mb-4 w-full flex flex-col text-sm"
                  >
                    <div className="flex items-center mb-2">
                      <PlayerAvatar player={player} size="md" />
                      <div className="ml-3 flex-1">
                        <div className="font-bold leading-tight text-gray-900">{player.fullName}</div>
                        <div className="text-xs text-gray-500">{player.team}, {player.position} - Bye {player.byeWeek || '-'}</div>
                      </div>
                      <div className="bg-[#0d2235] text-white rounded px-2 py-1 font-bold text-base">{player._draftValueScore}</div>
                    </div>
                    <div className="flex mt-2 gap-2">
                      <button
                        className="w-full px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                        onClick={() => handleDraft(player, false)}
                      >
                        Theirs
                      </button>
                      <button
                        className="w-full px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                        onClick={() => handleDraft(player, true)}
                      >
                        Mine
                      </button>
                    </div>
                  </div>
                );
              }
            })
          )}
        </AnimatePresence>
        
        {/* Table Button */}
        <div className="mt-auto pt-4 w-full">
          <button
            onClick={() => setShowDraftTable(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white rounded-lg shadow hover:bg-gray-50 transition-colors text-gray-700"
          >
            <svg 
              className="w-5 h-5" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" 
              />
            </svg>
            <span className="font-medium">Draft Board</span>
          </button>
        </div>
      </aside>
      
      {/* Draft Table Modal */}
      {showDraftTable && (
        <DraftTable
          draftOrder={draftOrder}
          teams={10}
          onClose={() => setShowDraftTable(false)}
          onDraftOrderChange={handleDraftOrderChange}
        />
      )}
    </>
  );
};

export default SuggestionsSidebar; 