import { describe, expect, it } from 'vitest';
import {
  KOUT_CONTRACT_SCORES,
  KOUT_LEVELS,
  checkWinner,
  computeContractScore,
  dealerIndex,
  isContractComplete,
  teamTotalsFromPlayers,
  topScorerPerTeam,
  totals,
} from './scoring';
import type { GameStateSlice } from './types';

// Helpers — build state slices without ceremony.
function customState(
  scores: number[][],
  opts: Partial<GameStateSlice> = {},
): GameStateSlice {
  return {
    gameMode: 'custom',
    winRule: 'highest',
    threshold: 100,
    players: ['P1', 'P2', 'P3', 'P4'],
    playerTeam: [],
    scores,
    ...opts,
  };
}

function sebeetaState(
  scores: number[][],
  opts: Partial<GameStateSlice> = {},
): GameStateSlice {
  return {
    gameMode: 'sebeeta',
    winRule: 'lowest',
    threshold: 201,
    players: ['P1', 'P2', 'P3', 'P4', 'P5', 'P6'],
    // 1,3,5 → team 0; 2,4,6 → team 1
    playerTeam: [0, 1, 0, 1, 0, 1],
    scores,
    ...opts,
  };
}

function koutState(
  scores: number[][],
  opts: Partial<GameStateSlice> = {},
): GameStateSlice {
  return {
    gameMode: 'kout',
    winRule: 'highest',
    threshold: 101,
    players: ['P1', 'P2', 'P3', 'P4', 'P5', 'P6'],
    playerTeam: [0, 1, 0, 1, 0, 1],
    scores,
    ...opts,
  };
}

describe('computeContractScore', () => {
  it('returns [0,0] for an incomplete contract', () => {
    expect(computeContractScore(null, 'bab', 'made')).toEqual([0, 0]);
    expect(computeContractScore(0, null, 'made')).toEqual([0, 0]);
    expect(computeContractScore(0, 'bab', null)).toEqual([0, 0]);
  });

  it('credits the caller on made, opponent on failed', () => {
    expect(computeContractScore(0, 'bab', 'made')).toEqual([5, 0]);
    expect(computeContractScore(0, 'bab', 'failed')).toEqual([0, 10]);
    expect(computeContractScore(1, 'bab', 'made')).toEqual([0, 5]);
    expect(computeContractScore(1, 'bab', 'failed')).toEqual([10, 0]);
  });

  it('matches the published score table for every level', () => {
    const expected: Record<string, [number, number]> = {
      bab: [5, 10],
      '6': [6, 12],
      '7': [7, 14],
      '8': [8, 16],
      bawan: [36, 18],
      malzoom: [5, 5],
    };
    for (const level of KOUT_LEVELS) {
      expect(KOUT_CONTRACT_SCORES[level]).toEqual({
        made: expected[level][0],
        failed: expected[level][1],
      });
      expect(computeContractScore(0, level, 'made')).toEqual([expected[level][0], 0]);
      expect(computeContractScore(0, level, 'failed')).toEqual([0, expected[level][1]]);
    }
  });

  it('never returns a negative score (no-minus invariant)', () => {
    for (const level of KOUT_LEVELS) {
      for (const outcome of ['made', 'failed'] as const) {
        for (const caller of [0, 1] as const) {
          const [a, b] = computeContractScore(caller, level, outcome);
          expect(a).toBeGreaterThanOrEqual(0);
          expect(b).toBeGreaterThanOrEqual(0);
        }
      }
    }
  });
});

describe('isContractComplete', () => {
  it('is true only when all three fields are set', () => {
    expect(isContractComplete({ caller: 0, level: 'bab', outcome: 'made' })).toBe(true);
    expect(isContractComplete({ caller: null, level: 'bab', outcome: 'made' })).toBe(false);
    expect(isContractComplete({ caller: 0, level: null, outcome: 'made' })).toBe(false);
    expect(isContractComplete({ caller: 0, level: 'bab', outcome: null })).toBe(false);
  });
});

describe('totals', () => {
  it('sums per-player rounds for custom mode', () => {
    const s = customState([
      [10, 20, 5, 0],
      [5, 0, 15, 30],
      [0, 0, 10, 10],
    ]);
    expect(totals(s)).toEqual([15, 20, 30, 40]);
  });

  it('returns one total per team for kout', () => {
    const s = koutState([
      [7, 0],
      [0, 12],
      [5, 0],
    ]);
    expect(totals(s)).toEqual([12, 12]);
  });

  it('handles empty score history', () => {
    expect(totals(customState([]))).toEqual([0, 0, 0, 0]);
    expect(totals(koutState([]))).toEqual([0, 0]);
  });

  it('treats missing slots in a round as 0', () => {
    const s = customState([[10], [5, 5]]);
    expect(totals(s)).toEqual([15, 5, 0, 0]);
  });
});

describe('teamTotalsFromPlayers', () => {
  it('sums per-player totals into two team totals', () => {
    // playerTeam: [0,1,0,1,0,1] → team 0 = p0+p2+p4, team 1 = p1+p3+p5
    expect(teamTotalsFromPlayers([10, 20, 30, 40, 50, 60], [0, 1, 0, 1, 0, 1])).toEqual([
      90,
      120,
    ]);
  });

  it('skips players with an invalid team index', () => {
    expect(teamTotalsFromPlayers([10, 20, 30], [0, -1, 1])).toEqual([10, 30]);
  });

  it('returns [0,0] when no players are on a team', () => {
    expect(teamTotalsFromPlayers([], [])).toEqual([0, 0]);
  });
});

describe('dealerIndex', () => {
  it('returns the lowest scorer when winRule is highest', () => {
    expect(dealerIndex([100, 50, 75], 'highest')).toBe(1);
  });

  it('returns the highest scorer when winRule is lowest', () => {
    expect(dealerIndex([10, 90, 50], 'lowest')).toBe(1);
  });

  it('returns -1 for an empty array', () => {
    expect(dealerIndex([], 'highest')).toBe(-1);
  });

  it('breaks ties by first occurrence', () => {
    expect(dealerIndex([20, 20, 10], 'lowest')).toBe(0);
    expect(dealerIndex([20, 30, 30], 'highest')).toBe(0);
  });
});

describe('checkWinner — sebeeta', () => {
  it('returns the opposing team when a player crosses threshold', () => {
    // player 0 (team 0) hits 201 → team 1 wins
    const s = sebeetaState([[201, 0, 0, 0, 0, 0]]);
    expect(checkWinner(s, totals(s))).toEqual({ type: 'team', idx: 1 });
  });

  it('returns the other side when a team-1 player crosses', () => {
    // player 1 (team 1) hits 201 → team 0 wins
    const s = sebeetaState([[0, 201, 0, 0, 0, 0]]);
    expect(checkWinner(s, totals(s))).toEqual({ type: 'team', idx: 0 });
  });

  it('returns null when no one has crossed', () => {
    const s = sebeetaState([[100, 50, 50, 50, 50, 50]]);
    expect(checkWinner(s, totals(s))).toBeNull();
  });

  it('sums rounds across the game', () => {
    const s = sebeetaState([
      [100, 0, 0, 0, 0, 0],
      [101, 0, 0, 0, 0, 0],
    ]);
    // player 0 total = 201 → team 1 wins
    expect(checkWinner(s, totals(s))).toEqual({ type: 'team', idx: 1 });
  });
});

describe('checkWinner — kout', () => {
  it('returns the team that reaches threshold first', () => {
    const s = koutState([
      [50, 30],
      [51, 20],
    ]);
    expect(checkWinner(s, totals(s))).toEqual({ type: 'team', idx: 0 });
  });

  it('on simultaneous crossings, the higher total wins', () => {
    const s = koutState([[110, 105]]);
    expect(checkWinner(s, totals(s))).toEqual({ type: 'team', idx: 0 });
    const s2 = koutState([[101, 120]]);
    expect(checkWinner(s2, totals(s2))).toEqual({ type: 'team', idx: 1 });
  });

  it('returns null below threshold', () => {
    const s = koutState([[50, 50]]);
    expect(checkWinner(s, totals(s))).toBeNull();
  });
});

describe('checkWinner — custom + highest', () => {
  it('returns the first player to cross threshold', () => {
    const s = customState([[101, 50, 50, 50]], { winRule: 'highest', threshold: 100 });
    expect(checkWinner(s, totals(s))).toEqual({ type: 'player', idx: 0 });
  });

  it('on multiple crossings, the highest total wins', () => {
    const s = customState([[110, 105, 50, 50]], { winRule: 'highest', threshold: 100 });
    expect(checkWinner(s, totals(s))).toEqual({ type: 'player', idx: 0 });
  });

  it('returns null when no one is at threshold', () => {
    const s = customState([[50, 60, 70, 80]], { winRule: 'highest', threshold: 100 });
    expect(checkWinner(s, totals(s))).toBeNull();
  });
});

describe('checkWinner — custom + lowest', () => {
  it('returns the lowest-scoring player once anyone crosses threshold', () => {
    const s = customState([[101, 50, 30, 80]], { winRule: 'lowest', threshold: 100 });
    expect(checkWinner(s, totals(s))).toEqual({ type: 'player', idx: 2 });
  });

  it('returns null until someone crosses', () => {
    const s = customState([[80, 50, 30, 90]], { winRule: 'lowest', threshold: 100 });
    expect(checkWinner(s, totals(s))).toBeNull();
  });
});

describe('checkWinner — custom + teams', () => {
  it('returns the winning team when the highest team total crosses threshold (highest wins)', () => {
    // team 0 = p0+p2 = 60+50 = 110, team 1 = p1+p3 = 30+40 = 70
    const s = customState([[60, 30, 50, 40]], {
      winRule: 'highest',
      threshold: 100,
      playerTeam: [0, 1, 0, 1],
    });
    expect(checkWinner(s, totals(s))).toEqual({ type: 'team', idx: 0 });
  });

  it('on simultaneous crossings (highest), the higher team total wins', () => {
    // team 0 = 60+45 = 105, team 1 = 60+50 = 110 — both cross 100
    const s = customState([[60, 60, 45, 50]], {
      winRule: 'highest',
      threshold: 100,
      playerTeam: [0, 1, 0, 1],
    });
    expect(checkWinner(s, totals(s))).toEqual({ type: 'team', idx: 1 });
  });

  it('returns the lower team total once any team crosses threshold (lowest wins)', () => {
    // team 0 = 70+50 = 120 (crosses), team 1 = 30+40 = 70 — team 1 wins
    const s = customState([[70, 30, 50, 40]], {
      winRule: 'lowest',
      threshold: 100,
      playerTeam: [0, 1, 0, 1],
    });
    expect(checkWinner(s, totals(s))).toEqual({ type: 'team', idx: 1 });
  });

  it('returns null until any team crosses threshold', () => {
    const s = customState([[40, 30, 50, 20]], {
      winRule: 'highest',
      threshold: 100,
      playerTeam: [0, 1, 0, 1],
    });
    expect(checkWinner(s, totals(s))).toBeNull();
  });

  it('falls back to per-player detection when playerTeam is empty', () => {
    // No playerTeam → still individual scoring (regression guard)
    const s = customState([[101, 50, 30, 80]], { winRule: 'highest', threshold: 100 });
    expect(checkWinner(s, totals(s))).toEqual({ type: 'player', idx: 0 });
  });
});

describe('checkWinner — trix', () => {
  const players = ['P1', 'P2', 'P3', 'P4'];
  function fullRounds() {
    const rounds = [] as import('../state/persistedState').TrixRoundMeta[];
    for (let k = 0; k < 4; k++) {
      rounds.push({
        kind: 'penalty',
        contracts: ['kingOfHearts', 'queens', 'diamonds', 'tricks'],
        kingdom: k,
        kingIdx: k,
      });
      rounds.push({ kind: 'trix', kingdom: k, kingIdx: k });
    }
    return rounds;
  }

  it('returns null until all 4 kingdoms are complete', () => {
    const rounds = fullRounds().filter((r) => !(r.kingdom === 3 && r.kind === 'trix'));
    const s: GameStateSlice = {
      gameMode: 'trix',
      winRule: 'lowest',
      threshold: 0,
      players,
      playerTeam: [],
      scores: rounds.map(() => [0, 0, 0, 0]),
      trixMatch: { partnership: false, kingFirst: 0, rounds },
    };
    expect(checkWinner(s, totals(s))).toBeNull();
  });

  it('returns the lowest-total player once all kingdoms complete', () => {
    const rounds = fullRounds();
    // Give player 2 the lowest net total via the ladder.
    const scores = rounds.map((r) => (r.kind === 'trix' ? [-50, -100, -200, -150] : [125, 125, 125, 125]));
    const s: GameStateSlice = {
      gameMode: 'trix',
      winRule: 'lowest',
      threshold: 0,
      players,
      playerTeam: [],
      scores,
      trixMatch: { partnership: false, kingFirst: 0, rounds },
    };
    // player 2 gets -200 four times from trix, +125*4 penalty = (500-800)=-300 net; others higher
    expect(checkWinner(s, totals(s))).toEqual({ type: 'player', idx: 2 });
  });

  it('returns null when trixMatch is missing', () => {
    const s: GameStateSlice = {
      gameMode: 'trix',
      winRule: 'lowest',
      threshold: 0,
      players,
      playerTeam: [],
      scores: [],
    };
    expect(checkWinner(s, totals(s))).toBeNull();
  });
});

describe('topScorerPerTeam', () => {
  it('returns the highest individual scorer per team', () => {
    // playerTeam: [0,1,0,1,0,1] → team 0 = p0,p2,p4 ; team 1 = p1,p3,p5
    const result = topScorerPerTeam([10, 20, 30, 40, 50, 60], [0, 1, 0, 1, 0, 1]);
    expect(result[0]).toEqual({ playerIdx: 4, score: 50 });
    expect(result[1]).toEqual({ playerIdx: 5, score: 60 });
  });

  it('returns null for a team with no players', () => {
    // Both players on team 0 → team 1 has no one
    const result = topScorerPerTeam([10, 20], [0, 0]);
    expect(result[0]).toEqual({ playerIdx: 1, score: 20 });
    expect(result[1]).toBeNull();
  });

  it('breaks ties by first occurrence', () => {
    // two players on team 0 with the same score → first one wins
    const result = topScorerPerTeam([30, 0, 30, 0], [0, 1, 0, 1]);
    expect(result[0]?.playerIdx).toBe(0);
  });
});
