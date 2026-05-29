import type { GameMode, TrixMatch, WinRule } from '../state/persistedState';

export type KoutLevel = 'bab' | '6' | '7' | '8' | 'bawan' | 'malzoom';
export type KoutOutcome = 'made' | 'failed';
export type KoutCaller = 0 | 1;

export type ContractEntry = {
  caller: KoutCaller | null;
  level: KoutLevel | null;
  outcome: KoutOutcome | null;
};

// Winner = the entity that won. For Sebeeta the type is 'team' (the opposing
// team of whichever player crossed the threshold). For Kout it's 'team'. For
// Custom it's 'player'.
export type Winner =
  | { type: 'player'; idx: number }
  | { type: 'team'; idx: 0 | 1 };

// Subset of PersistedState that the engine actually reads. Keeping this narrow
// makes the functions easy to test without constructing a full PersistedState.
export type GameStateSlice = {
  gameMode: GameMode;
  winRule: WinRule;
  threshold: number;
  players: string[];
  playerTeam: number[];
  scores: number[][];
  // Trix-only. Drives the kingdoms-complete game-over check (threshold unused).
  trixMatch?: TrixMatch;
};
