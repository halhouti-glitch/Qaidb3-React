import { describe, expect, it } from 'vitest';
import { reverseGameLog } from './gameLog';
import { upsertProfiles, winnerPlayerIndices } from './profiles';
import { checkWinner, totals } from '../engine/scoring';
import {
  DEFAULT_STATE,
  type PersistedState,
  type RecentGame,
} from './persistedState';

function state(over: Partial<PersistedState>): PersistedState {
  return { ...DEFAULT_STATE, ...over };
}

// Build a state that simulates the result of applyScoresUpdate's forward
// path: scores set, gameOver, gameLogged, head recentGame populated,
// profiles upserted. Used as the "previously logged" starting point.
function loggedSebeetaState(): PersistedState {
  const players = ['A1', 'A2', 'A3', 'B1', 'B2', 'B3'];
  const playerTeam = [0, 0, 0, 1, 1, 1];
  // p0 (team 0) crosses 201 → team 1 wins
  const scores: number[][] = [
    [100, 30, 20, 10, 10, 10],
    [105, 30, 20, 10, 10, 10],
  ];
  const base = state({
    gameMode: 'sebeeta',
    players,
    playerTeam,
    teamNames: ['Alpha', 'Bravo'],
    scores,
    threshold: 201,
    winRule: 'lowest',
    gameOver: true,
    gameLogged: true,
    currentScreen: 'winner',
  });
  const totalsArr = totals(base);
  const winner = checkWinner(base, totalsArr);
  if (!winner) throw new Error('fixture broken: expected a winner');
  const winnerIdxSet = winnerPlayerIndices(base, winner);
  const playerProfiles = upsertProfiles(base, winnerIdxSet);
  const head: RecentGame = {
    kind: 'sebeeta',
    players: players.slice(),
    teamNames: ['Alpha', 'Bravo'],
    when: 1234,
    roundCount: scores.length,
    winner: 'Bravo',
    score: '60–60',
  };
  return { ...base, playerProfiles, recentGames: [head] };
}

describe('reverseGameLog', () => {
  it('returns state unchanged when gameLogged is false', () => {
    const s = state({ players: ['A'], scores: [[5]], gameLogged: false });
    expect(reverseGameLog(s)).toBe(s);
  });

  it('clears gameLogged', () => {
    const s = loggedSebeetaState();
    expect(reverseGameLog(s).gameLogged).toBe(false);
  });

  it('pops the orphan recentGames[0] when it matches the active game', () => {
    const s = loggedSebeetaState();
    const next = reverseGameLog(s);
    expect(next.recentGames).toEqual([]);
  });

  it('leaves recentGames alone when head does not match the active game', () => {
    const s = loggedSebeetaState();
    // Tamper: head was for a different roster
    const mismatched: RecentGame = {
      ...s.recentGames[0]!,
      players: ['Different', 'Players'],
    };
    const tampered = { ...s, recentGames: [mismatched] };
    const next = reverseGameLog(tampered);
    expect(next.recentGames).toEqual([mismatched]);
  });

  it('reverts profile increments produced by the forward log', () => {
    const s = loggedSebeetaState();
    const next = reverseGameLog(s);
    // All six players got gamesPlayed:1 from upsertProfiles — should now be 0
    // (and therefore dropped since wins+teammates also zero out).
    expect(Object.keys(next.playerProfiles)).toEqual([]);
  });

  it('round-trips: upsert then reverse equals the original profiles record', () => {
    const players = ['Ali', 'Bob', 'Carol', 'Dan', 'Eve', 'Fox'];
    const start = state({
      gameMode: 'kout',
      players,
      playerTeam: [0, 1, 0, 1, 0, 1],
      scores: [[60, 0], [60, 0]],
      threshold: 101,
      winRule: 'highest',
      gameOver: true,
      gameLogged: true,
      playerProfiles: {
        ali: {
          name: 'Ali',
          gamesPlayed: 7,
          wins: 4,
          lastPlayed: 999,
          teammates: { carol: 5, eve: 5 },
        },
      },
      recentGames: [
        {
          kind: 'kout',
          players: players.slice(),
          teamNames: [],
          when: 1234,
          roundCount: 2,
          winner: 'Team A',
          score: '120–0',
        },
      ],
    });
    const totalsArr = totals(start);
    const winner = checkWinner(start, totalsArr);
    if (!winner) throw new Error('fixture broken');
    const upserted = upsertProfiles(start, winnerPlayerIndices(start, winner));
    const reverted = reverseGameLog({ ...start, playerProfiles: upserted });
    // gamesPlayed/wins/teammates round-trip; lastPlayed intentionally does not.
    expect(reverted.playerProfiles.ali?.gamesPlayed).toBe(7);
    expect(reverted.playerProfiles.ali?.wins).toBe(4);
    expect(reverted.playerProfiles.ali?.teammates).toEqual({ carol: 5, eve: 5 });
  });

  it('safe when prev had no winner (gameLogged set anomalously) — still clears the flag', () => {
    // Defensive: if gameLogged is true but scores don't actually win, the
    // reverse path computes an empty winnerIdxSet and only adjusts
    // gamesPlayed (not wins). The flag still clears.
    const s = state({
      gameMode: 'custom',
      players: ['A'],
      scores: [[10]],
      threshold: 100,
      winRule: 'highest',
      gameLogged: true,
      playerProfiles: {
        a: { name: 'A', gamesPlayed: 1, wins: 0, lastPlayed: 0, teammates: {} },
      },
    });
    const next = reverseGameLog(s);
    expect(next.gameLogged).toBe(false);
    expect(next.playerProfiles.a).toBeUndefined();
  });
});
