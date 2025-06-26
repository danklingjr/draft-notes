import React, { useEffect, useState, useRef } from 'react';
import { NFLPlayer } from '../services/nflService';
import PlayerAvatar from './PlayerAvatar';
import { AnimatePresence, motion } from 'framer-motion';

interface SuggestionsSidebarProps {
  availablePlayers: NFLPlayer[];
  myRoster: NFLPlayer[];
  round: number;
  pick: number;
  onDraft: (player: NFLPlayer, mine: boolean) => void;
}

const ROSTER_LIMITS: Record<string, number> = { QB: 2, RB: 2, WR: 2, TE: 1, K: 1, DEF: 1 };
const SKILL_POSITIONS = ['RB', 'WR', 'QB', 'TE'];
const OTHER_POSITIONS = ['K', 'DEF'];
const POSITION_ORDER = [...SKILL_POSITIONS, ...OTHER_POSITIONS];

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

// The same algorithm as before for a single best suggestion
function getBestSuggestion(availablePlayers: NFLPlayer[], myRoster: NFLPlayer[], excludeIds: Set<string> = new Set()) {
  const neededPositions = getNeededPositions(myRoster);
  const isNeed = (pos: string) => neededPositions.includes(pos);
  return [...availablePlayers]
    .filter(p => !excludeIds.has(p.id))
    .sort((a, b) => {
      if (isNeed(a.position) && !isNeed(b.position)) return -1;
      if (!isNeed(a.position) && isNeed(b.position)) return 1;
      return (b.projectedFantasyPoints2025 || 0) - (a.projectedFantasyPoints2025 || 0);
    })[0];
}

function getInitialSuggestionQueue(availablePlayers: NFLPlayer[], myRoster: NFLPlayer[]): NFLPlayer[] {
  const queue: NFLPlayer[] = [];
  const excludeIds = new Set<string>();
  let tempRoster = myRoster;
  for (let i = 0; i < 5; i++) {
    const next = getBestSuggestion(availablePlayers, tempRoster, excludeIds);
    if (!next) break;
    queue.push(next);
    excludeIds.add(next.id);
    // Simulate drafting this player for future needs
    tempRoster = [...tempRoster, next];
  }
  return queue;
}

const SuggestionsSidebar: React.FC<SuggestionsSidebarProps> = ({ availablePlayers, myRoster, round, pick, onDraft }) => {
  const [suggestionQueue, setSuggestionQueue] = useState<NFLPlayer[]>([]);
  const prevAvailablePlayersRef = useRef<NFLPlayer[]>([]);

  // Reset the queue if availablePlayers changes significantly (e.g., draft reset)
  useEffect(() => {
    // If the availablePlayers pool shrinks a lot, or grows (reset), reset the queue
    if (
      prevAvailablePlayersRef.current.length === 0 ||
      availablePlayers.length > prevAvailablePlayersRef.current.length + 5 ||
      availablePlayers.length < prevAvailablePlayersRef.current.length - 5
    ) {
      setSuggestionQueue(getInitialSuggestionQueue(availablePlayers, myRoster));
    }
    prevAvailablePlayersRef.current = availablePlayers;
  }, [availablePlayers, myRoster]);

  // Handle draft from the sidebar
  const handleDraft = (player: NFLPlayer, mine: boolean) => {
    onDraft(player, mine);
    // Remove drafted player from queue and add next best suggestion
    setSuggestionQueue(prevQueue => {
      const newQueue = prevQueue.filter(p => p.id !== player.id);
      // Exclude all drafted and already-shown players
      const excludeIds = new Set([
        ...myRoster.map(p => p.id),
        ...newQueue.map(p => p.id),
        player.id
      ]);
      const next = getBestSuggestion(availablePlayers, myRoster, excludeIds);
      if (next) newQueue.push(next);
      return newQueue;
    });
  };

  return (
    <aside className="rounded-xl p-4 w-96 flex flex-col items-center text-sm">
      <div className="flex items-center mb-4 w-full">
        <div>
          <div className="text-white font-bold leading-tight">ROUND {round}</div>
          <div className="text-white font-semibold">PICK {pick}</div>
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
                    <div className="bg-[#0d2235] text-white rounded px-2 py-1 font-bold text-base">{player.projectedFantasyPoints2025?.toFixed(1) ?? '-'}</div>
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
                    <div className="bg-[#0d2235] text-white rounded px-2 py-1 font-bold text-base">{player.projectedFantasyPoints2025?.toFixed(1) ?? '-'}</div>
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
    </aside>
  );
};

export default SuggestionsSidebar; 