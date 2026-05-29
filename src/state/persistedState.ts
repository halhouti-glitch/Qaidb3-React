import type { Lang } from '../i18n/strings';

export type GameMode = 'sebeeta' | 'kout' | 'custom' | 'trix';
export type WinRule = 'lowest' | 'highest';

// --- Trix ---------------------------------------------------------------
// Trix is a kingdom-based trick game. The numeric source of truth stays
// `scores: number[][]` (per-player deltas per deal); `trixMatch` carries the
// per-deal metadata, index-aligned with `scores`. See project-trix-spec.
export type TrixPenalty = 'kingOfHearts' | 'queens' | 'diamonds' | 'tricks';

// A deal is either one of the (1–4 merged) penalty contracts, or the solo
// Trix ladder. `doubled` (declared/doubled King or Queens) is P3 — carried in
// the type now so the data model is stable, ignored by P1 scoring.
export type TrixDeal =
  | {
      kind: 'penalty';
      contracts: TrixPenalty[];
      // King of Hearts declared/doubled (binary — it's one card → ×2).
      doubled?: TrixPenalty[];
      // Count of queens that were declared this deal (each scores 50 not 25).
      // Per-queen, so a deal can mix declared + normal queens.
      declaredQueens?: number;
    }
  | { kind: 'trix'; naghil?: boolean };

export type TrixRoundMeta = TrixDeal & {
  kingdom: number; // 0..3
  kingIdx: number; // player who is King this kingdom
};

export type TrixMatch = {
  partnership: boolean; // true = 2v2 rollup (P2; P1 ships individual-only)
  kingFirst: number;    // 7♥ holder = kingdom 0's King
  rounds: TrixRoundMeta[]; // length === scores.length
};
export type Theme = 'light' | 'dark';
export type EntryStyle = 'pm' | 'numpad';
export type KoutEntryMode = 'contract' | 'manual';
export type Screen =
  | 'home'
  | 'setup'
  | 'play'
  | 'history'
  | 'winner'
  | 'stats';

export type RecentGame = {
  kind: GameMode;
  players: string[];
  teamNames: string[];
  when: number;
  roundCount: number;
  winner: string;
  score: string;
  // Optional round snapshot (added after v0.3.0). Lets a finished game be
  // inspected round-by-round and reopened for editing. Absent on entries
  // logged by older builds — features must degrade gracefully when missing.
  scores?: number[][];
  playerTeam?: number[];
  threshold?: number;
  winRule?: WinRule;
  koutEntryMode?: KoutEntryMode;
  // Trix per-deal metadata snapshot, so a finished Trix game can be inspected
  // by kingdom and reopened for editing. Absent for other modes.
  trixMatch?: TrixMatch;
};

// Lifetime per-player memory. Keyed by `name.toLowerCase().trim()` so the
// same person captured under different casings consolidates into one record.
// `teammates` counts games-together for partner mode (Kout/Sebeeta and
// Custom+teams).
export type Profile = {
  name: string;                          // canonical casing (last seen)
  gamesPlayed: number;
  wins: number;
  lastPlayed: number;                    // epoch ms
  teammates: Record<string, number>;     // partner key → games-together count
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
  // Lifetime player memory — see Profile. Survives across games via the same
  // localStorage key; older fork installs spread-merge an empty record.
  playerProfiles: Record<string, Profile>;
  // PORT_FROM_VANILLA.md item 7. When false, vibrate + audio calls no-op.
  sound: boolean;
  // Trix-only per-deal metadata, index-aligned with `scores`. Absent for all
  // other modes and for states saved by pre-Trix builds — optional so the
  // legacy-compatible storage shape is unchanged.
  trixMatch?: TrixMatch;
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
  playerProfiles: {},
  sound: true,
};

// Per-field validators. Each returns the default when the input doesn't
// match the contract — keeps `cardScoreTracker_v1` legacy-compat (no schema
// version bump, no key rename) while protecting against forward-version
// payloads or corrupted localStorage.
const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const oneOf =
  <T extends string>(...allowed: T[]) =>
  (v: unknown, fallback: T): T =>
    typeof v === 'string' && (allowed as string[]).includes(v)
      ? (v as T)
      : fallback;

const stringArray = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];

const finiteNumber = (v: unknown, fallback: number): number =>
  typeof v === 'number' && Number.isFinite(v) ? v : fallback;

const positiveInt = (v: unknown, fallback: number): number => {
  const n = finiteNumber(v, fallback);
  return n > 0 ? Math.floor(n) : fallback;
};

const numberArray = (v: unknown): number[] =>
  Array.isArray(v)
    ? v.map((x) => (typeof x === 'number' && Number.isFinite(x) ? x : 0))
    : [];

const scoresMatrix = (v: unknown): number[][] =>
  Array.isArray(v) ? v.map(numberArray) : [];

// --- Trix sanitization --------------------------------------------------
// The allowlist sanitizer DROPS unknown fields, so trixMatch must be parsed
// explicitly or it would vanish on every load/backup round-trip. Reject (→
// undefined) anything malformed rather than fabricating a partial match.
const TRIX_PENALTY_VALUES: TrixPenalty[] = ['kingOfHearts', 'queens', 'diamonds', 'tricks'];

const trixPenaltyArray = (v: unknown): TrixPenalty[] =>
  Array.isArray(v)
    ? v.filter((x): x is TrixPenalty => TRIX_PENALTY_VALUES.includes(x as TrixPenalty))
    : [];

const sanitizeTrixRound = (v: unknown): TrixRoundMeta | null => {
  if (!isObject(v)) return null;
  if (typeof v.kingdom !== 'number' || typeof v.kingIdx !== 'number') return null;
  const kingdom = Math.floor(v.kingdom);
  const kingIdx = Math.floor(v.kingIdx);
  if (v.kind === 'trix') {
    const round: TrixRoundMeta = { kind: 'trix', kingdom, kingIdx };
    if (v.naghil === true) round.naghil = true;
    return round;
  }
  if (v.kind === 'penalty') {
    const contracts = trixPenaltyArray(v.contracts);
    if (contracts.length === 0) return null;
    const round: TrixRoundMeta = { kind: 'penalty', contracts, kingdom, kingIdx };
    const doubled = trixPenaltyArray(v.doubled);
    if (doubled.length > 0) round.doubled = doubled;
    if (
      typeof v.declaredQueens === 'number' &&
      Number.isFinite(v.declaredQueens) &&
      v.declaredQueens > 0
    ) {
      round.declaredQueens = Math.floor(v.declaredQueens);
    }
    return round;
  }
  return null;
};

const sanitizeTrixMatch = (v: unknown): TrixMatch | undefined => {
  if (!isObject(v)) return undefined;
  if (typeof v.kingFirst !== 'number' || !Array.isArray(v.rounds)) return undefined;
  const rounds = v.rounds
    .map(sanitizeTrixRound)
    .filter((r): r is TrixRoundMeta => r !== null);
  return {
    partnership: v.partnership === true,
    kingFirst: Math.floor(v.kingFirst),
    rounds,
  };
};

const sanitizeRecentGame = (v: unknown): RecentGame | null => {
  if (!isObject(v)) return null;
  const kind = oneOf('sebeeta', 'kout', 'custom', 'trix')(v.kind, 'custom');
  const out: RecentGame = {
    kind,
    players: stringArray(v.players),
    teamNames: stringArray(v.teamNames),
    when: finiteNumber(v.when, 0),
    roundCount: positiveInt(v.roundCount, 0),
    winner: typeof v.winner === 'string' ? v.winner : '',
    score: typeof v.score === 'string' ? v.score : '',
  };
  // Optional round snapshot — only attach when present so older entries stay
  // lean and `g.scores`-style truthiness checks remain meaningful.
  if (Array.isArray(v.scores)) out.scores = scoresMatrix(v.scores);
  if (Array.isArray(v.playerTeam)) out.playerTeam = numberArray(v.playerTeam);
  if (typeof v.threshold === 'number' && Number.isFinite(v.threshold)) {
    out.threshold = positiveInt(v.threshold, 0);
  }
  if (v.winRule === 'lowest' || v.winRule === 'highest') out.winRule = v.winRule;
  if (v.koutEntryMode === 'contract' || v.koutEntryMode === 'manual') {
    out.koutEntryMode = v.koutEntryMode;
  }
  const trixMatch = sanitizeTrixMatch(v.trixMatch);
  if (trixMatch) out.trixMatch = trixMatch;
  return out;
};

const sanitizeProfile = (v: unknown): Profile | null => {
  if (!isObject(v) || typeof v.name !== 'string') return null;
  const teammates: Record<string, number> = {};
  if (isObject(v.teammates)) {
    for (const [k, n] of Object.entries(v.teammates)) {
      if (typeof n === 'number' && Number.isFinite(n) && n > 0) teammates[k] = n;
    }
  }
  return {
    name: v.name,
    gamesPlayed: Math.max(0, positiveInt(v.gamesPlayed, 0)),
    wins: Math.max(0, positiveInt(v.wins, 0)),
    lastPlayed: finiteNumber(v.lastPlayed, 0),
    teammates,
  };
};

const sanitizeProfiles = (v: unknown): Record<string, Profile> => {
  if (!isObject(v)) return {};
  const out: Record<string, Profile> = {};
  for (const [k, raw] of Object.entries(v)) {
    const p = sanitizeProfile(raw);
    if (p) out[k] = p;
  }
  return out;
};

export function sanitizeState(raw: unknown): PersistedState {
  if (!isObject(raw)) return { ...DEFAULT_STATE };
  const recent = Array.isArray(raw.recentGames)
    ? (raw.recentGames
        .map(sanitizeRecentGame)
        .filter((r): r is RecentGame => r !== null)
        .slice(0, 10))
    : [];
  const trixMatch = sanitizeTrixMatch(raw.trixMatch);
  return {
    gameMode: oneOf('sebeeta', 'kout', 'custom', 'trix')(raw.gameMode, DEFAULT_STATE.gameMode),
    players: stringArray(raw.players),
    playerTeam: numberArray(raw.playerTeam),
    teamNames: stringArray(raw.teamNames),
    scores: scoresMatrix(raw.scores),
    threshold: positiveInt(raw.threshold, DEFAULT_STATE.threshold),
    winRule: oneOf('lowest', 'highest')(raw.winRule, DEFAULT_STATE.winRule),
    gameOver: typeof raw.gameOver === 'boolean' ? raw.gameOver : false,
    gameLogged: typeof raw.gameLogged === 'boolean' ? raw.gameLogged : false,
    lang: oneOf('en', 'ar')(raw.lang, DEFAULT_STATE.lang),
    koutEntryMode: oneOf('contract', 'manual')(raw.koutEntryMode, DEFAULT_STATE.koutEntryMode),
    entryStyle: oneOf('pm', 'numpad')(raw.entryStyle, DEFAULT_STATE.entryStyle),
    currentScreen: oneOf('home', 'setup', 'play', 'history', 'winner', 'stats')(
      raw.currentScreen,
      DEFAULT_STATE.currentScreen,
    ),
    recentGames: recent,
    theme: oneOf('light', 'dark')(raw.theme, DEFAULT_STATE.theme),
    playerProfiles: sanitizeProfiles(raw.playerProfiles),
    sound: typeof raw.sound === 'boolean' ? raw.sound : DEFAULT_STATE.sound,
    // Only attach when a valid trix match parsed — keeps non-trix states lean
    // and the optional field truly absent.
    ...(trixMatch ? { trixMatch } : {}),
  };
}

export function loadState(): PersistedState {
  if (typeof localStorage === 'undefined') return { ...DEFAULT_STATE };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATE };
    return sanitizeState(JSON.parse(raw));
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
