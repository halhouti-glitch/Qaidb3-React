// Game registry — single source of truth for per-mode defaults and
// capabilities. Mirrors vanilla `js/games/index.js` (see PORT_FROM_VANILLA.md
// item 1). Add a new game by extending GAMES + GAME_ORDER + (if needed) the
// PersistedState `gameMode` union. Screens drive their behaviour from these
// fields rather than `isKout/isSebeeta/isCustom` branches.
import type { FC } from 'react';
import { CustomArt, KoutArt, SebeetaArt, TrixArt } from '../screens/home/GameArt';
import type { StringKey } from '../i18n/strings';
import type { GameMode, WinRule } from '../state/persistedState';

export type Game = {
  key: GameMode;
  i18nKey: StringKey;
  descKey: StringKey;
  metaKey: StringKey;
  hintKey: StringKey | null;
  ArtComponent: FC;
  defaultThreshold: number;
  winRule: WinRule;
  isTeamMode: boolean;          // forces 2-team format on Setup
  teamSize: number | null;
  numPlayers: number | null;    // null = user-chosen on Setup
  scoreScope: 'player' | 'team';
  configurable: boolean;        // shows threshold + winRule controls
  contractsEnabled: boolean;
};

export const GAMES: Record<GameMode, Game> = {
  sebeeta: {
    key: 'sebeeta',
    i18nKey: 'gameSebeeta',
    descKey: 'gameSebeetaDesc',
    metaKey: 'gameSebeetaMeta',
    hintKey: 'sebeetaHint',
    ArtComponent: SebeetaArt,
    defaultThreshold: 201,
    winRule: 'lowest',
    isTeamMode: true,
    teamSize: 3,
    numPlayers: 6,
    scoreScope: 'player',
    configurable: false,
    contractsEnabled: false,
  },
  kout: {
    key: 'kout',
    i18nKey: 'gameKout',
    descKey: 'gameKoutDesc',
    metaKey: 'gameKoutMeta',
    hintKey: 'koutHint',
    ArtComponent: KoutArt,
    defaultThreshold: 101,
    winRule: 'highest',
    isTeamMode: true,
    teamSize: 3,
    numPlayers: 6,
    scoreScope: 'team',
    configurable: false,
    contractsEnabled: true,
  },
  trix: {
    key: 'trix',
    i18nKey: 'gameTrix',
    descKey: 'gameTrixDesc',
    metaKey: 'gameTrixMeta',
    hintKey: 'trixHint',
    ArtComponent: TrixArt,
    // Threshold/winRule are not user-facing: the game ends when all 4
    // kingdoms are complete, and lowest total wins. Kept for the shared
    // engine plumbing only.
    defaultThreshold: 0,
    winRule: 'lowest',
    isTeamMode: false,    // P1 ships individual-only (partnership = P2)
    teamSize: null,
    numPlayers: 4,
    scoreScope: 'player',
    configurable: false,
    contractsEnabled: true,
  },
  custom: {
    key: 'custom',
    i18nKey: 'gameCustom',
    descKey: 'gameCustomDesc',
    metaKey: 'gameCustomMeta',
    hintKey: null,
    ArtComponent: CustomArt,
    defaultThreshold: 100,
    winRule: 'highest',
    isTeamMode: false,
    teamSize: null,
    numPlayers: null,
    scoreScope: 'player',
    configurable: true,
    contractsEnabled: false,
  },
};

export const GAME_ORDER: GameMode[] = ['sebeeta', 'kout', 'trix', 'custom'];

export const getGame = (key: GameMode): Game => GAMES[key];
