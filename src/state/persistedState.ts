import type { Lang } from '../i18n/strings';

export type GameMode = 'sebeeta' | 'kout' | 'custom';
export type WinRule = 'lowest' | 'highest';
export type Theme = 'light' | 'dark';
export type EntryStyle = 'pm' | 'numpad';
export type KoutEntryMode = 'contract' | 'manual';
export type Screen = 'home' | 'setup' | 'play' | 'history' | 'winner';

export type RecentGame = {
  kind: GameMode;
  players: string[];
  teamNames: string[];
  when: number;
  roundCount: number;
  winner: string;
  score: string;
};

// Shape persisted under cardScoreTracker_v1 in localStorage. Mirrors the
// legacy single-file build (legacy.html ~line 1922) — DO NOT change keys
// or value shapes without a migration.
export type PersistedState = {
  gameMode: GameMode;
  players: string[];
  playerTeam: number[];
  teamNames: string[];
  // custom/sebeeta: number[][] (per-player per-round)
  // kout:           [number, number][] (per-team per-round)
  scores: number[][];
  threshold: number;
  winRule: WinRule;
  gameOver: boolean;
  gameLogged: boolean;
  lang: Lang;
  koutEntryMode: KoutEntryMode;
  entryStyle: EntryStyle;
  currentScreen: Screen;
  recentGames: RecentGame[];
  theme: Theme;
};

export const STORAGE_KEY = 'cardScoreTracker_v1';

export const DEFAULT_STATE: PersistedState = {
  gameMode: 'sebeeta',
  players: [],
  playerTeam: [],
  teamNames: [],
  scores: [],
  threshold: 201,
  winRule: 'lowest',
  gameOver: false,
  gameLogged: false,
  lang: 'ar',
  koutEntryMode: 'contract',
  entryStyle: 'pm',
  currentScreen: 'home',
  recentGames: [],
  theme: 'light',
};

export function loadState(): PersistedState {
  if (typeof localStorage === 'undefined') return { ...DEFAULT_STATE };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATE };
    const parsed = JSON.parse(raw) as Partial<PersistedState>;
    return { ...DEFAULT_STATE, ...parsed };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

export function saveState(state: PersistedState): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Quota or private-mode failures are non-fatal — game continues in-memory.
  }
}
