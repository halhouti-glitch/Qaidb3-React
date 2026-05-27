import type { PersistedState, Profile } from './persistedState';
import type { Winner } from '../engine/types';

// Profile key — `localStorage["cardScoreTracker_v1"].playerProfiles` is
// indexed by `name.toLowerCase().trim()` so the same person captured under
// different casings consolidates into one record.
export const profileKey = (name: string): string => name.trim().toLowerCase();

// Sort key for the TopPlayers strip / Setup typeahead: most games first,
// then most recently played as the tiebreaker.
export function topProfiles(
  profiles: Record<string, Profile>,
  n: number,
): Profile[] {
  return Object.values(profiles)
    .sort((a, b) => {
      if (b.gamesPlayed !== a.gamesPlayed) return b.gamesPlayed - a.gamesPlayed;
      return (b.lastPlayed || 0) - (a.lastPlayed || 0);
    })
    .slice(0, n);
}

// Returns the top `limit` partners by games-together count. Resolves keys
// back to canonical casing via the full profiles map. Defaults to 2 because
// Sebeeta/Kout are 3v3 so each player has two teammates per game.
export function topTeammates(
  profile: Profile,
  profiles: Record<string, Profile>,
  limit = 2,
): Array<{ name: string; count: number }> {
  return Object.entries(profile.teammates ?? {})
    .filter(([, c]) => c > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([k, count]) => ({ name: profiles[k]?.name ?? k, count }));
}

// Returns the set of player indices considered "winners" given the engine's
// Winner discriminated union. For team-scope winners (Kout, Sebeeta,
// Custom+teams), every player whose playerTeam matches the winning side
// counts.
export function winnerPlayerIndices(
  state: PersistedState,
  winner: Winner,
): Set<number> {
  const out = new Set<number>();
  if (winner.type === 'player') {
    out.add(winner.idx);
    return out;
  }
  state.playerTeam.forEach((team, idx) => {
    if (team === winner.idx) out.add(idx);
  });
  return out;
}

// Pure: returns a new playerProfiles record with one game logged for every
// player in `state.players`. `winnerIdxSet` (typically from
// winnerPlayerIndices) determines who gets a win credit. Teammate counts
// roll up for the configured team partition; pure individual games leave
// `teammates` untouched.
export function upsertProfiles(
  state: PersistedState,
  winnerIdxSet: Set<number>,
  now = Date.now(),
): Record<string, Profile> {
  const next: Record<string, Profile> = { ...state.playerProfiles };
  const teamMode =
    state.playerTeam.length === state.players.length &&
    state.players.length > 0;

  state.players.forEach((rawName, pIdx) => {
    const name = (rawName || '').trim();
    if (!name) return;
    const key = profileKey(name);
    const prev: Profile = next[key] ?? {
      name,
      gamesPlayed: 0,
      wins: 0,
      lastPlayed: 0,
      teammates: {},
    };
    const updated: Profile = {
      ...prev,
      name, // refresh canonical casing to the last-seen spelling
      gamesPlayed: prev.gamesPlayed + 1,
      wins: prev.wins + (winnerIdxSet.has(pIdx) ? 1 : 0),
      lastPlayed: now,
      teammates: { ...prev.teammates },
    };
    if (teamMode) {
      const myTeam = state.playerTeam[pIdx];
      state.players.forEach((other, oIdx) => {
        if (oIdx === pIdx) return;
        if (state.playerTeam[oIdx] !== myTeam) return;
        const otherKey = profileKey(other || '');
        if (!otherKey) return;
        updated.teammates[otherKey] = (updated.teammates[otherKey] ?? 0) + 1;
      });
    }
    next[key] = updated;
  });
  return next;
}
