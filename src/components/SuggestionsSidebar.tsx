import React, { useEffect, useState } from 'react';
import { NFLPlayer } from '../services/nflService';
import PlayerAvatar from './PlayerAvatar';

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

function getSuggestedPlayers(availablePlayers: NFLPlayer[], myRoster: NFLPlayer[]): NFLPlayer[] {
  const neededPositions = getNeededPositions(myRoster);
  const suggestions: NFLPlayer[] = [];
  const usedIds = new Set<string>();

  // Skill positions first
  for (const pos of SKILL_POSITIONS) {
    const neededCount = neededPositions.filter(p => p === pos).length;
    if (neededCount > 0) {
      const bestForPos = availablePlayers
        .filter(p => p.position === pos && !usedIds.has(p.id))
        .sort((a, b) => (b.projectedFantasyPoints2025 || 0) - (a.projectedFantasyPoints2025 || 0))
        .slice(0, neededCount);
      for (const player of bestForPos) {
        suggestions.push(player);
        usedIds.add(player.id);
        if (suggestions.length >= 5) return suggestions;
      }
    }
  }

  // Only suggest K/DEF if all skill needs are filled or fewer than 5 suggestions
  for (const pos of OTHER_POSITIONS) {
    const neededCount = neededPositions.filter(p => p === pos).length;
    if (neededCount > 0 && suggestions.length < 5) {
      const bestForPos = availablePlayers
        .filter(p => p.position === pos && !usedIds.has(p.id))
        .sort((a, b) => (b.projectedFantasyPoints2025 || 0) - (a.projectedFantasyPoints2025 || 0))
        .slice(0, neededCount);
      for (const player of bestForPos) {
        suggestions.push(player);
        usedIds.add(player.id);
        if (suggestions.length >= 5) return suggestions;
      }
    }
  }

  // If fewer than 5, fill with best available regardless of position
  if (suggestions.length < 5) {
    const bestAvailable = availablePlayers
      .filter(p => !usedIds.has(p.id))
      .sort((a, b) => (b.projectedFantasyPoints2025 || 0) - (a.projectedFantasyPoints2025 || 0));
    for (const p of bestAvailable) {
      suggestions.push(p);
      if (suggestions.length >= 5) break;
    }
  }

  return suggestions;
}

const SuggestionsSidebar: React.FC<SuggestionsSidebarProps> = ({ availablePlayers, myRoster, round, pick, onDraft }) => {
  const [suggested, setSuggested] = useState<NFLPlayer[]>([]);

  useEffect(() => {
    setSuggested(getSuggestedPlayers(availablePlayers, myRoster));
  }, [availablePlayers, myRoster]);

  return (
    <aside className="rounded-xl p-4 w-96 flex flex-col items-center min-h-screen text-sm">
      <div className="flex items-center mb-4 w-full">
        <div>
          <div className="text-white font-bold leading-tight">ROUND {round}</div>
          <div className="text-white font-semibold">PICK {pick}</div>
        </div>
      </div>
      {suggested.length === 0 ? (
        <div className="text-gray-700 text-center mt-8">No suggestions available.<br/>Draft a player to see new suggestions.</div>
      ) : (
        suggested.map((player, idx) => (
          <div key={player.id} className="bg-white rounded-xl shadow p-4 mb-4 w-full flex flex-col text-sm">
            <div className="flex items-center mb-2">
              <PlayerAvatar player={player} size="md" />
              <div className="ml-3 flex-1">
                <div className="font-bold leading-tight text-gray-900">{player.fullName}</div>
                <div className="text-xs text-gray-500">{player.team}, {player.position} - Bye {player.byeWeek || '-'}</div>
              </div>
              <div className="bg-[#0d2235] text-white rounded px-2 py-1 font-bold text-base">{player.projectedFantasyPoints2025?.toFixed(1) ?? '-'}</div>
            </div>
            <div className="flex mt-2">
              <button className="flex-1 bg-gray-200 text-gray-700 font-semibold py-2 rounded-l-lg" onClick={() => onDraft(player, false)}>Theirs</button>
              <button className="flex-1 bg-blue-500 text-white font-semibold py-2 rounded-r-lg ml-1" onClick={() => onDraft(player, true)}>Mine</button>
            </div>
          </div>
        ))
      )}
    </aside>
  );
};

export default SuggestionsSidebar; 