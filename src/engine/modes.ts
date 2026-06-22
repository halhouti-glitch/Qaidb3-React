import type { GameMode } from '../state/persistedState';

/**
 * Single source of truth for how a mode's scores are tallied:
 *   'player' → one running total per player (scores rows are per-player)
 *   'team'   → one running total per team [A, B] (scores rows are [teamA, teamB])
 *
 * The engine's `totals()` and the UI game registry both read this, so the two
 * can't drift. Typed as `Record<GameMode, …>`, so adding a mode to the union
 * (e.g. Baloot) forces an entry here or the build fails — closing the trap
 * where a new team-scored mode would be silently tallied as per-player.
 */
export const SCORE_SCOPE: Record<GameMode, 'player' | 'team'> = {
  sebeeta: 'player',
  kout: 'team',
  custom: 'player',
  trix: 'player',
};

export const scoreScopeFor = (mode: GameMode): 'player' | 'team' =>
  SCORE_SCOPE[mode];
