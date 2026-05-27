import { describe, expect, it } from 'vitest';
import {
  profileKey,
  topProfiles,
  topTeammates,
  upsertProfiles,
  winnerPlayerIndices,
} from './profiles';
import { DEFAULT_STATE, type PersistedState, type Profile } from './persistedState';

function state(over: Partial<PersistedState>): PersistedState {
  return { ...DEFAULT_STATE, ...over };
}

function profile(p: Partial<Profile> & { name: string }): Profile {
  return {
    gamesPlayed: 0,
    wins: 0,
    lastPlayed: 0,
    teammates: {},
    ...p,
  };
}

describe('profileKey', () => {
  it('lowercases and trims', () => {
    expect(profileKey('  Alice  ')).toBe('alice');
    expect(profileKey('AHMED')).toBe('ahmed');
  });
});

describe('topProfiles', () => {
  it('sorts by gamesPlayed desc, then lastPlayed desc', () => {
    const profiles = {
      a: profile({ name: 'A', gamesPlayed: 5, lastPlayed: 100 }),
      b: profile({ name: 'B', gamesPlayed: 10, lastPlayed: 50 }),
      c: profile({ name: 'C', gamesPlayed: 10, lastPlayed: 200 }),
    };
    const tops = topProfiles(profiles, 3);
    expect(tops.map((p) => p.name)).toEqual(['C', 'B', 'A']);
  });

  it('respects n', () => {
    const profiles = {
      a: profile({ name: 'A', gamesPlayed: 5 }),
      b: profile({ name: 'B', gamesPlayed: 4 }),
      c: profile({ name: 'C', gamesPlayed: 3 }),
    };
    expect(topProfiles(profiles, 2).map((p) => p.name)).toEqual(['A', 'B']);
  });
});

describe('topTeammates', () => {
  it('returns top partners by count, resolving canonical casing', () => {
    const me = profile({
      name: 'Ali',
      teammates: { bob: 4, carol: 7, dan: 1 },
    });
    const profiles = {
      bob: profile({ name: 'Bob' }),
      carol: profile({ name: 'Carol' }),
      dan: profile({ name: 'Dan' }),
    };
    expect(topTeammates(me, profiles, 2)).toEqual([
      { name: 'Carol', count: 7 },
      { name: 'Bob', count: 4 },
    ]);
  });

  it('skips zero-count entries', () => {
    const me = profile({ name: 'Ali', teammates: { bob: 0, carol: 1 } });
    const tops = topTeammates(me, { carol: profile({ name: 'Carol' }) }, 2);
    expect(tops).toEqual([{ name: 'Carol', count: 1 }]);
  });

  it('falls back to the lookup key when canonical name is missing', () => {
    const me = profile({ name: 'Ali', teammates: { ghost: 3 } });
    expect(topTeammates(me, {}, 1)).toEqual([{ name: 'ghost', count: 3 }]);
  });

  it('defaults to limit=2 — Sebeeta/Kout have 2 partners per game (item 4)', () => {
    const me = profile({
      name: 'Ali',
      teammates: { bob: 5, carol: 4, dan: 3, evan: 2 },
    });
    const profiles = {
      bob: profile({ name: 'Bob' }),
      carol: profile({ name: 'Carol' }),
      dan: profile({ name: 'Dan' }),
      evan: profile({ name: 'Evan' }),
    };
    // No explicit limit — should return top 2.
    expect(topTeammates(me, profiles)).toEqual([
      { name: 'Bob', count: 5 },
      { name: 'Carol', count: 4 },
    ]);
  });
});

describe('winnerPlayerIndices', () => {
  it('returns a single index for player-type winners (Custom individual)', () => {
    const s = state({
      gameMode: 'custom',
      players: ['A', 'B', 'C'],
      playerTeam: [],
    });
    const set = winnerPlayerIndices(s, { type: 'player', idx: 1 });
    expect([...set]).toEqual([1]);
  });

  it('returns every player on the winning team (Kout)', () => {
    const s = state({
      gameMode: 'kout',
      players: ['A', 'B', 'C', 'D', 'E', 'F'],
      playerTeam: [0, 1, 0, 1, 0, 1],
    });
    const set = winnerPlayerIndices(s, { type: 'team', idx: 1 });
    expect([...set].sort()).toEqual([1, 3, 5]);
  });

  it('Sebeeta footgun — engine emits the *winning* team idx, so winners are players on that side', () => {
    // Sebeeta: p0 (team 0) crossed threshold → engine returns team 1 as the winner.
    const s = state({
      gameMode: 'sebeeta',
      players: ['A', 'B', 'C', 'D', 'E', 'F'],
      playerTeam: [0, 1, 0, 1, 0, 1],
    });
    const set = winnerPlayerIndices(s, { type: 'team', idx: 1 });
    expect([...set].sort()).toEqual([1, 3, 5]);
  });
});

describe('upsertProfiles', () => {
  const players = ['Ahmed', 'Bilal', 'Carlos', 'Dawood', 'Esa', 'Faisal'];

  it('increments gamesPlayed for every named player', () => {
    const s = state({ players, playerTeam: [], gameMode: 'custom' });
    const next = upsertProfiles(s, new Set([0]));
    expect(next.ahmed.gamesPlayed).toBe(1);
    expect(next.faisal.gamesPlayed).toBe(1);
    expect(Object.keys(next)).toHaveLength(6);
  });

  it('only credits a win to players in winnerIdxSet', () => {
    const s = state({ players, playerTeam: [], gameMode: 'custom' });
    const next = upsertProfiles(s, new Set([2]));
    expect(next.carlos.wins).toBe(1);
    expect(next.ahmed.wins).toBe(0);
  });

  it('rolls teammate counts up for team mode only', () => {
    const s = state({
      players,
      playerTeam: [0, 1, 0, 1, 0, 1],
      gameMode: 'kout',
    });
    const next = upsertProfiles(s, new Set([0, 2, 4]));
    // Ahmed (idx 0, team 0) teammates: Carlos + Esa
    expect(next.ahmed.teammates).toEqual({ carlos: 1, esa: 1 });
    // Bilal (idx 1, team 1) teammates: Dawood + Faisal
    expect(next.bilal.teammates).toEqual({ dawood: 1, faisal: 1 });
  });

  it('leaves teammates untouched for individual Custom', () => {
    const s = state({ players, playerTeam: [], gameMode: 'custom' });
    const next = upsertProfiles(s, new Set([0]));
    expect(next.ahmed.teammates).toEqual({});
  });

  it('accumulates across games and refreshes canonical casing', () => {
    const prior: Record<string, Profile> = {
      ahmed: profile({
        name: 'AHMED',
        gamesPlayed: 4,
        wins: 2,
        teammates: { bilal: 3 },
      }),
    };
    const s = state({
      players: ['Ahmed', 'Bilal'],
      playerTeam: [0, 0],
      gameMode: 'custom',
      playerProfiles: prior,
    });
    const next = upsertProfiles(s, new Set([0]), 1234);
    expect(next.ahmed.name).toBe('Ahmed'); // case refreshed
    expect(next.ahmed.gamesPlayed).toBe(5);
    expect(next.ahmed.wins).toBe(3);
    expect(next.ahmed.lastPlayed).toBe(1234);
    expect(next.ahmed.teammates.bilal).toBe(4); // 3 + 1
  });

  it('ignores empty/whitespace-only player names', () => {
    const s = state({
      players: ['Ali', '', '  ', 'Bob'],
      playerTeam: [],
      gameMode: 'custom',
    });
    const next = upsertProfiles(s, new Set([0]));
    expect(Object.keys(next).sort()).toEqual(['ali', 'bob']);
  });
});
