import type { PersistedState } from './persistedState';
import { checkWinner, totals } from '../engine/scoring';
import { revertProfiles, winnerPlayerIndices } from './profiles';

// True when `recentGames[0]` was produced by logging the currently-active
// game (i.e. the orphan entry we'd need to pop on reverse). We can't
// distinguish by id (the entry has none), so we check the player roster and
// round count — both are captured at log time inside applyScoresUpdate.
function headLooksLikeOurLog(state: PersistedState): boolean {
  const head = state.recentGames[0];
  if (!head) return false;
  if (head.kind !== state.gameMode) return false;
  if (head.roundCount !== state.scores.length) return false;
  if (head.players.length !== state.players.length) return false;
  return head.players.every((p, i) => p === state.players[i]);
}

// Undo the forward log made by `applyScoresUpdate` on a previous tick: pop
// the orphan recentGames entry, decrement profile counters, and clear the
// `gameLogged` flag. Caller is responsible for then running the forward path
// on the new scores (which may or may not re-log).
//
// Returns `state` unchanged when there's nothing to reverse — keeps callers
// simple.
export function reverseGameLog(state: PersistedState): PersistedState {
  if (!state.gameLogged) return state;

  const prevTotals = totals(state);
  const prevWinner = checkWinner(state, prevTotals);
  const winnerIdxSet = prevWinner
    ? winnerPlayerIndices(state, prevWinner)
    : new Set<number>();

  return {
    ...state,
    gameLogged: false,
    recentGames: headLooksLikeOurLog(state)
      ? state.recentGames.slice(1)
      : state.recentGames,
    playerProfiles: revertProfiles(state, winnerIdxSet),
  };
}
