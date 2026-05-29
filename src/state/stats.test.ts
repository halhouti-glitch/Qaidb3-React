import { describe, it, expect } from 'vitest';
import {
  gamesByMode,
  leaderboard,
  didPlayerWin,
  currentStreaks,
} from './stats';
import type { GameMode, Profile, RecentGame } from './persistedState';

const profile = (name: string, gamesPlayed: number, wins: number): Profile => ({
  name,
  gamesPlayed,
  wins,
  lastPlayed: 0,
  teammates: {},
});

const rg = (p: Partial<RecentGame> & { kind: GameMode }): RecentGame => ({
  players: [],
  teamNames: [],
  when: 0,
  roundCount: 0,
  winner: '',
  score: '',
  ...p,
});

describe('stats', () => {
  it('gamesByMode counts each kind', () => {
    const recents = [rg({ kind: 'kout' }), rg({ kind: 'kout' }), rg({ kind: 'custom' })];
    expect(gamesByMode(recents)).toEqual({ sebeeta: 0, kout: 2, custom: 1, trix: 0 });
  });

  it('leaderboard ranks by wins, then win-rate, and drops 0-game profiles', () => {
    const profiles = {
      a: profile('A', 10, 8),
      b: profile('B', 2, 2),
      c: profile('C', 0, 0),
    };
    const board = leaderboard(profiles);
    expect(board.map((r) => r.name)).toEqual(['A', 'B']);
    expect(board[0].winRate).toBe(80);
    expect(board[1].winRate).toBe(100);
  });

  it('didPlayerWin resolves a solo winner by name (case-insensitive)', () => {
    const g = rg({ kind: 'custom', players: ['Sam', 'Lee'], winner: 'Sam' });
    expect(didPlayerWin(g, 'sam')).toBe(true);
    expect(didPlayerWin(g, 'Lee')).toBe(false);
  });

  it('didPlayerWin resolves a team game via playerTeam + team name', () => {
    const g = rg({
      kind: 'kout',
      players: ['A1', 'A2', 'B1', 'B2'],
      teamNames: ['Alpha', 'Bravo'],
      playerTeam: [0, 0, 1, 1],
      winner: 'Bravo',
    });
    expect(didPlayerWin(g, 'B1')).toBe(true);
    expect(didPlayerWin(g, 'A1')).toBe(false);
  });

  it('currentStreaks walks newest-first until the first loss', () => {
    const recents = [
      rg({ kind: 'custom', players: ['Sam', 'Lee'], winner: 'Sam' }),
      rg({ kind: 'custom', players: ['Sam', 'Lee'], winner: 'Sam' }),
      rg({ kind: 'custom', players: ['Sam', 'Lee'], winner: 'Lee' }),
    ];
    expect(currentStreaks(recents)).toEqual([{ name: 'Sam', streak: 2 }]);
  });

  it('currentStreaks ignores games a player did not appear in', () => {
    const recents = [
      rg({ kind: 'custom', players: ['Sam'], winner: 'Sam' }),
      rg({ kind: 'custom', players: ['Lee'], winner: 'Lee' }), // Sam absent — skipped
      rg({ kind: 'custom', players: ['Sam'], winner: 'Sam' }),
    ];
    expect(currentStreaks(recents)).toEqual([{ name: 'Sam', streak: 2 }]);
  });
});
