import type { GameMode, Profile, RecentGame } from './persistedState';
import { profileKey } from './profiles';

// Pure aggregations over recentGames + playerProfiles for the Stats screen.
// All read-only — nothing here mutates persisted state.

export type LeaderRow = {
  key: string;
  name: string;
  gamesPlayed: number;
  wins: number;
  winRate: number; // 0–100, integer
};

export type StreakRow = { name: string; streak: number };

export function gamesByMode(recents: RecentGame[]): Record<GameMode, number> {
  const out: Record<GameMode, number> = { sebeeta: 0, kout: 0, custom: 0 };
  for (const g of recents) out[g.kind] += 1;
  return out;
}

export function leaderboard(
  profiles: Record<string, Profile>,
  limit = 8,
): LeaderRow[] {
  return Object.entries(profiles)
    .map(([key, p]) => ({
      key,
      name: p.name,
      gamesPlayed: p.gamesPlayed,
      wins: p.wins,
      winRate:
        p.gamesPlayed > 0 ? Math.round((p.wins / p.gamesPlayed) * 100) : 0,
    }))
    .filter((r) => r.gamesPlayed > 0)
    // Rank by actual wins first (rewards playing + winning, not a lucky 1/1),
    // then win-rate, then volume.
    .sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins;
      if (b.winRate !== a.winRate) return b.winRate - a.winRate;
      return b.gamesPlayed - a.gamesPlayed;
    })
    .slice(0, limit);
}

function teamIdxByName(game: RecentGame, name: string): number | null {
  const k = profileKey(name);
  if (profileKey(game.teamNames[0] ?? '') === k) return 0;
  if (profileKey(game.teamNames[1] ?? '') === k) return 1;
  return null;
}

// Did the player keyed by `pk` win this game? Handles solo/custom (winner is
// the player's name) and team games (winner is a team name → resolve to the
// team index, then check the player's team via the stored playerTeam).
function didWinByKey(game: RecentGame, pk: string): boolean {
  if (profileKey(game.winner) === pk) return true;
  if (game.playerTeam && game.playerTeam.length === game.players.length) {
    const winTeam = teamIdxByName(game, game.winner);
    if (winTeam === null) return false;
    const pIdx = game.players.findIndex((n) => profileKey(n) === pk);
    return pIdx >= 0 && game.playerTeam[pIdx] === winTeam;
  }
  return false;
}

/** Public single-game helper (also handy for tests). */
export function didPlayerWin(game: RecentGame, playerName: string): boolean {
  return didWinByKey(game, profileKey(playerName));
}

/**
 * Current win streaks derived from recentGames (assumed newest-first, as
 * stored). For each player, walks games they participated in from newest until
 * the first loss; a run of ≥2 counts as a streak. Returns the hottest `limit`.
 */
export function currentStreaks(
  recents: RecentGame[],
  limit = 5,
): StreakRow[] {
  const keys = new Set<string>();
  const displayName: Record<string, string> = {};
  for (const g of recents) {
    for (const n of g.players) {
      const k = profileKey(n);
      if (!k) continue;
      keys.add(k);
      if (!(k in displayName)) displayName[k] = n.trim();
    }
  }

  const rows: StreakRow[] = [];
  keys.forEach((pk) => {
    let streak = 0;
    for (const g of recents) {
      const played = g.players.some((n) => profileKey(n) === pk);
      if (!played) continue;
      if (didWinByKey(g, pk)) streak += 1;
      else break;
    }
    if (streak >= 2) rows.push({ name: displayName[pk] ?? pk, streak });
  });

  return rows.sort((a, b) => b.streak - a.streak).slice(0, limit);
}

export function activePlayerCount(profiles: Record<string, Profile>): number {
  return Object.values(profiles).filter((p) => p.gamesPlayed > 0).length;
}
