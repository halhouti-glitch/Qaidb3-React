import { describe, expect, it } from 'vitest';
import {
  TRIX_CONTRACT_SCORES,
  TRIX_LADDER,
  TRIX_NAGHIL,
  kingdomComplete,
  trixDealChecksumOk,
  trixExpectedDealTotal,
  trixGameOver,
  trixKingIdx,
  trixKingdomRemaining,
} from './trix';
import type { TrixMatch, TrixRoundMeta } from '../state/persistedState';

// Build the round-meta for a fully-played kingdom in one helper. Default is
// the maximal-merge ("complex") layout: all 4 penalties in one deal + Trix.
function kingdom(
  k: number,
  kingIdx: number,
  layout: TrixRoundMeta[] = [
    { kind: 'penalty', contracts: ['kingOfHearts', 'queens', 'diamonds', 'tricks'], kingdom: k, kingIdx },
    { kind: 'trix', kingdom: k, kingIdx },
  ],
): TrixRoundMeta[] {
  return layout.map((r) => ({ ...r, kingdom: k, kingIdx }));
}

describe('trixKingIdx — 7♥ holder first, counter-clockwise', () => {
  it('kingdom 0 is the 7♥ holder', () => {
    expect(trixKingIdx(2, 0)).toBe(2);
  });
  it('rotates counter-clockwise and wraps mod 4', () => {
    expect(trixKingIdx(2, 1)).toBe(1);
    expect(trixKingIdx(2, 2)).toBe(0);
    expect(trixKingIdx(2, 3)).toBe(3); // (2-3) mod 4 = 3
  });
  it('covers all 4 seats exactly once across a match', () => {
    const seats = [0, 1, 2, 3].map((n) => trixKingIdx(0, n));
    expect([...seats].sort()).toEqual([0, 1, 2, 3]);
  });
});

describe('trixExpectedDealTotal — zero-sum guard', () => {
  it('a single penalty contract equals its canonical total', () => {
    expect(trixExpectedDealTotal({ kind: 'penalty', contracts: ['kingOfHearts'] })).toBe(75);
    expect(trixExpectedDealTotal({ kind: 'penalty', contracts: ['queens'] })).toBe(100);
    expect(trixExpectedDealTotal({ kind: 'penalty', contracts: ['diamonds'] })).toBe(130);
    expect(trixExpectedDealTotal({ kind: 'penalty', contracts: ['tricks'] })).toBe(195);
  });
  it('all 4 penalties merged sum to +500', () => {
    expect(
      trixExpectedDealTotal({
        kind: 'penalty',
        contracts: ['kingOfHearts', 'queens', 'diamonds', 'tricks'],
      }),
    ).toBe(500);
  });
  it('doubles a declared King of Hearts (75→150)', () => {
    expect(
      trixExpectedDealTotal({ kind: 'penalty', contracts: ['kingOfHearts'], doubled: ['kingOfHearts'] }),
    ).toBe(150);
  });

  it('adds +25 per declared queen (per-queen, mixable)', () => {
    // 2 of the 4 queens declared → 2×50 + 2×25 = 150.
    expect(
      trixExpectedDealTotal({ kind: 'penalty', contracts: ['queens'], declaredQueens: 2 }),
    ).toBe(150);
    // All 4 declared → 200.
    expect(
      trixExpectedDealTotal({ kind: 'penalty', contracts: ['queens'], declaredQueens: 4 }),
    ).toBe(200);
    // None declared → base 100.
    expect(trixExpectedDealTotal({ kind: 'penalty', contracts: ['queens'] })).toBe(100);
  });

  it('combines a declared King with declared queens in a merged deal', () => {
    // King ×2 (150) + queens with 1 declared (125) + diamonds (130).
    expect(
      trixExpectedDealTotal({
        kind: 'penalty',
        contracts: ['kingOfHearts', 'queens', 'diamonds'],
        doubled: ['kingOfHearts'],
        declaredQueens: 1,
      }),
    ).toBe(150 + 125 + 130);
  });

  it('ignores declaring fields when the contract is not in the deal', () => {
    expect(
      trixExpectedDealTotal({ kind: 'penalty', contracts: ['diamonds'], doubled: ['kingOfHearts'], declaredQueens: 2 }),
    ).toBe(130);
  });

  it('Trix ladder deal sums to −500, naghil to −700', () => {
    expect(trixExpectedDealTotal({ kind: 'trix' })).toBe(-500);
    expect(trixExpectedDealTotal({ kind: 'trix', naghil: true })).toBe(-700);
  });
  it('the ladder + naghil constants match the spec', () => {
    expect(TRIX_LADDER).toEqual([-200, -150, -100, -50]);
    expect(TRIX_NAGHIL).toBe(-400);
    expect(TRIX_LADDER.reduce((a, b) => a + b, 0)).toBe(-500);
  });
});

describe('trixDealChecksumOk', () => {
  it('passes when per-player deltas sum to the expected total', () => {
    // King of Hearts captured by player 0 → +75 on seat 0.
    expect(trixDealChecksumOk([75, 0, 0, 0], { kind: 'penalty', contracts: ['kingOfHearts'] })).toBe(
      true,
    );
    // Diamonds split unevenly but summing to 130.
    expect(trixDealChecksumOk([50, 30, 30, 20], { kind: 'penalty', contracts: ['diamonds'] })).toBe(
      true,
    );
    // Trix ladder.
    expect(trixDealChecksumOk([-200, -150, -100, -50], { kind: 'trix' })).toBe(true);
  });
  it('fails when the totals are off', () => {
    expect(trixDealChecksumOk([70, 0, 0, 0], { kind: 'penalty', contracts: ['kingOfHearts'] })).toBe(
      false,
    );
  });
});

describe('kingdomComplete', () => {
  it('true for the maximal-merge layout (all 4 + Trix)', () => {
    expect(kingdomComplete(kingdom(0, 0), 0)).toBe(true);
  });
  it('true for a split layout that still partitions the 4 penalties', () => {
    const rounds = kingdom(0, 0, [
      { kind: 'penalty', contracts: ['kingOfHearts', 'queens'], kingdom: 0, kingIdx: 0 },
      { kind: 'penalty', contracts: ['diamonds'], kingdom: 0, kingIdx: 0 },
      { kind: 'penalty', contracts: ['tricks'], kingdom: 0, kingIdx: 0 },
      { kind: 'trix', kingdom: 0, kingIdx: 0 },
    ]);
    expect(kingdomComplete(rounds, 0)).toBe(true);
  });
  it('false when a penalty is missing', () => {
    const rounds: TrixRoundMeta[] = [
      { kind: 'penalty', contracts: ['kingOfHearts', 'queens', 'diamonds'], kingdom: 0, kingIdx: 0 },
      { kind: 'trix', kingdom: 0, kingIdx: 0 },
    ];
    expect(kingdomComplete(rounds, 0)).toBe(false);
  });
  it('false when a penalty is duplicated across deals', () => {
    const rounds: TrixRoundMeta[] = [
      { kind: 'penalty', contracts: ['kingOfHearts', 'queens'], kingdom: 0, kingIdx: 0 },
      { kind: 'penalty', contracts: ['queens', 'diamonds', 'tricks'], kingdom: 0, kingIdx: 0 },
      { kind: 'trix', kingdom: 0, kingIdx: 0 },
    ];
    expect(kingdomComplete(rounds, 0)).toBe(false);
  });
  it('false with no Trix deal, or with two Trix deals', () => {
    const noTrix: TrixRoundMeta[] = [
      { kind: 'penalty', contracts: ['kingOfHearts', 'queens', 'diamonds', 'tricks'], kingdom: 0, kingIdx: 0 },
    ];
    expect(kingdomComplete(noTrix, 0)).toBe(false);
    const twoTrix: TrixRoundMeta[] = [
      { kind: 'penalty', contracts: ['kingOfHearts', 'queens', 'diamonds', 'tricks'], kingdom: 0, kingIdx: 0 },
      { kind: 'trix', kingdom: 0, kingIdx: 0 },
      { kind: 'trix', kingdom: 0, kingIdx: 0 },
    ];
    expect(kingdomComplete(twoTrix, 0)).toBe(false);
  });
});

describe('trixKingdomRemaining', () => {
  it('lists all 4 penalties + trix available for an empty kingdom', () => {
    const r = trixKingdomRemaining([], 0);
    expect(r.penalties).toEqual(['kingOfHearts', 'queens', 'diamonds', 'tricks']);
    expect(r.trixAvailable).toBe(true);
  });
  it('removes played penalties and flips trixAvailable once Trix is recorded', () => {
    const rounds: TrixRoundMeta[] = [
      { kind: 'penalty', contracts: ['kingOfHearts', 'queens'], kingdom: 0, kingIdx: 0 },
      { kind: 'trix', kingdom: 0, kingIdx: 0 },
    ];
    const r = trixKingdomRemaining(rounds, 0);
    expect(r.penalties).toEqual(['diamonds', 'tricks']);
    expect(r.trixAvailable).toBe(false);
  });
  it('ignores deals from other kingdoms', () => {
    const rounds: TrixRoundMeta[] = [
      { kind: 'penalty', contracts: ['kingOfHearts'], kingdom: 1, kingIdx: 3 },
    ];
    expect(trixKingdomRemaining(rounds, 0).penalties).toHaveLength(4);
  });
});

describe('trixGameOver', () => {
  function fullMatch(): TrixMatch {
    return {
      partnership: false,
      kingFirst: 0,
      rounds: [
        ...kingdom(0, 0),
        ...kingdom(1, 3),
        ...kingdom(2, 2),
        ...kingdom(3, 1),
      ],
    };
  }
  it('true when all 4 kingdoms are complete', () => {
    expect(trixGameOver(fullMatch())).toBe(true);
  });
  it('false when the last kingdom is missing its Trix deal', () => {
    const m = fullMatch();
    m.rounds = m.rounds.filter((r) => !(r.kingdom === 3 && r.kind === 'trix'));
    expect(trixGameOver(m)).toBe(false);
  });
  it('false for a fresh match', () => {
    expect(trixGameOver({ partnership: false, kingFirst: 0, rounds: [] })).toBe(false);
  });
});

describe('TRIX_CONTRACT_SCORES totals to +500', () => {
  it('sums the canonical penalty contracts', () => {
    const sum = Object.values(TRIX_CONTRACT_SCORES).reduce((a, b) => a + b, 0);
    expect(sum).toBe(500);
  });
});
