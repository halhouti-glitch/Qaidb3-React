import type {
  ContractEntry,
  GameStateSlice,
  KoutCaller,
  KoutLevel,
  KoutOutcome,
  Winner,
} from './types';
import { trixGameOver } from './trix';

// Kout contract scoring table — per legacy.html:1946.
// Each level has a 'made' value (paid to the caller) and a 'failed' value
// (paid to the opposing team).
export const KOUT_CONTRACT_SCORES: Record<KoutLevel, { made: number; failed: number }> = {
  bab: { made: 5, failed: 10 },
  '6': { made: 6, failed: 12 },
  '7': { made: 7, failed: 14 },
  '8': { made: 8, failed: 16 },
  bawan: { made: 36, failed: 18 },
  malzoom: { made: 5, failed: 5 },
};

export const KOUT_LEVELS: readonly KoutLevel[] = ['bab', '6', '7', '8', 'bawan', 'malzoom'];

// Compute the per-team score [A, B] for a Kout contract. Returns [0, 0] when
// the contract isn't fully specified yet (used by the live preview).
//
// Note: outputs are always >= 0 — Kout's "no-minus" rule is enforced at the UI
// layer (no −10 button in the Kout manual entry row, contract mode looks up
// non-negative values here).
export function computeContractScore(
  caller: KoutCaller | null,
  level: KoutLevel | null,
  outcome: KoutOutcome | null,
): [number, number] {
  if (caller === null || level === null || outcome === null) return [0, 0];
  const cfg = KOUT_CONTRACT_SCORES[level];
  const out: [number, number] = [0, 0];
  if (outcome === 'made') out[caller] = cfg.made;
  else out[1 - caller] = cfg.failed;
  return out;
}

export function isContractComplete(c: ContractEntry): boolean {
  return c.caller !== null && c.level !== null && c.outcome !== null;
}

// Per-entity totals.
//   custom/sebeeta → one total per player
//   kout           → one total per team [A, B]
export function totals(state: GameStateSlice): number[] {
  const n = state.gameMode === 'kout' ? 2 : state.players.length;
  const out = new Array<number>(n).fill(0);
  for (const round of state.scores) {
    for (let i = 0; i < n; i++) out[i] += round[i] ?? 0;
  }
  return out;
}

// Sebeeta only: collapse per-player totals into per-team totals [A, B].
export function teamTotalsFromPlayers(
  playerTotals: number[],
  playerTeam: number[],
): [number, number] {
  const t: [number, number] = [0, 0];
  playerTeam.forEach((tIdx, pIdx) => {
    if (tIdx === 0 || tIdx === 1) {
      t[tIdx] += playerTotals[pIdx] ?? 0;
    }
  });
  return t;
}

// Dealer = the entity that's currently losing (opposite of the win condition).
//   winRule 'highest' → lowest score is dealer
//   winRule 'lowest'  → highest score is dealer
// Returns -1 when there are no entities to rank. Ties resolve to the first
// occurrence (matches legacy.html:2419 behavior).
export function dealerIndex(totalsArr: number[], winRule: 'highest' | 'lowest'): number {
  if (totalsArr.length === 0) return -1;
  if (winRule === 'highest') {
    let min = Infinity;
    let idx = 0;
    totalsArr.forEach((v, i) => {
      if (v < min) {
        min = v;
        idx = i;
      }
    });
    return idx;
  }
  let max = -Infinity;
  let idx = 0;
  totalsArr.forEach((v, i) => {
    if (v > max) {
      max = v;
      idx = i;
    }
  });
  return idx;
}

// Returns the winning entity when the game has ended, else null. Matches
// legacy.html:2436.
//   sebeeta: a player crossing threshold → the OPPOSING team wins
//   kout:    first team to threshold; simultaneous → higher total wins
//   custom + highest: first to cross threshold; simultaneous → higher wins
//   custom + lowest:  any cross → lowest total among all players wins
export function checkWinner(state: GameStateSlice, totalsArr: number[]): Winner | null {
  if (state.gameMode === 'sebeeta') {
    for (let i = 0; i < totalsArr.length; i++) {
      if (totalsArr[i] >= state.threshold) {
        const loserTeam = state.playerTeam[i];
        if (loserTeam !== 0 && loserTeam !== 1) return null;
        return { type: 'team', idx: (1 - loserTeam) as 0 | 1 };
      }
    }
    return null;
  }

  if (state.gameMode === 'trix') {
    // Threshold is unused — the game ends when all 4 kingdoms are complete.
    if (!state.trixMatch || !trixGameOver(state.trixMatch)) return null;
    // Individual, lowest total wins. Partnership rollup is P2.
    let min = Infinity;
    let idx = -1;
    totalsArr.forEach((v, i) => {
      if (v < min) {
        min = v;
        idx = i;
      }
    });
    if (idx < 0) return null;
    return { type: 'player', idx };
  }

  if (state.gameMode === 'kout') {
    const reached: number[] = [];
    totalsArr.forEach((v, i) => {
      if (v >= state.threshold) reached.push(i);
    });
    if (reached.length === 0) return null;
    let max = -Infinity;
    let idx = -1;
    for (const i of reached) {
      if (totalsArr[i] > max) {
        max = totalsArr[i];
        idx = i;
      }
    }
    if (idx !== 0 && idx !== 1) return null;
    return { type: 'team', idx };
  }

  // custom + teams: roll per-player totals up to two team totals, then apply
  // the same win rule at the team level. Detected by playerTeam being sized
  // to match the roster.
  const isCustomTeams =
    state.playerTeam.length === state.players.length && state.players.length > 0;
  if (isCustomTeams) {
    const teamTotals = teamTotalsFromPlayers(totalsArr, state.playerTeam);
    if (state.winRule === 'highest') {
      const reached: Array<0 | 1> = [];
      ([0, 1] as const).forEach((i) => {
        if (teamTotals[i] >= state.threshold) reached.push(i);
      });
      if (reached.length === 0) return null;
      const idx =
        reached.length === 1
          ? reached[0]
          : teamTotals[0] >= teamTotals[1]
            ? 0
            : 1;
      return { type: 'team', idx };
    }
    // lowest
    if (teamTotals[0] < state.threshold && teamTotals[1] < state.threshold) {
      return null;
    }
    return { type: 'team', idx: teamTotals[0] <= teamTotals[1] ? 0 : 1 };
  }

  // custom + individual + highest
  if (state.winRule === 'highest') {
    const reached: number[] = [];
    totalsArr.forEach((v, i) => {
      if (v >= state.threshold) reached.push(i);
    });
    if (reached.length === 0) return null;
    let max = -Infinity;
    let idx = -1;
    for (const i of reached) {
      if (totalsArr[i] > max) {
        max = totalsArr[i];
        idx = i;
      }
    }
    return { type: 'player', idx };
  }

  // custom + individual + lowest
  const anyReached = totalsArr.some((v) => v >= state.threshold);
  if (!anyReached) return null;
  let min = Infinity;
  let idx = -1;
  totalsArr.forEach((v, i) => {
    if (v < min) {
      min = v;
      idx = i;
    }
  });
  return { type: 'player', idx };
}

export type TopScorer = { playerIdx: number; score: number };

// Sebeeta top-scorer summary — for each team, who has the highest individual
// total. Returns null entries for teams with no players. Per legacy.html:2503.
export function topScorerPerTeam(
  playerTotals: number[],
  playerTeam: number[],
): [TopScorer | null, TopScorer | null] {
  const out: [TopScorer | null, TopScorer | null] = [null, null];
  [0, 1].forEach((ti) => {
    let topIdx = -1;
    let topScore = -Infinity;
    playerTeam.forEach((tIdx, pIdx) => {
      if (tIdx === ti && (playerTotals[pIdx] ?? 0) > topScore) {
        topScore = playerTotals[pIdx] ?? 0;
        topIdx = pIdx;
      }
    });
    if (topIdx >= 0) out[ti as 0 | 1] = { playerIdx: topIdx, score: topScore };
  });
  return out;
}
