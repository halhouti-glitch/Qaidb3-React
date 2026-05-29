import type { TrixDeal, TrixMatch, TrixPenalty, TrixRoundMeta } from '../state/persistedState';

// Trix scoring (lowest total wins — penalty tally). Penalties ADD points
// against you; the Trix ladder SUBTRACTS. See project-trix-spec.
//
// Each value is the contract's *canonical total* across all players:
//   King of Hearts: one capturer takes +75
//   Queens:         4 queens × +25 = +100
//   Diamonds:       13 × +10       = +130
//   Tricks (لطوش):  13 × +15       = +195
// Sum of the 4 penalties = +500; the Trix ladder sums to −500 → each kingdom
// is zero-sum (the free correctness guard).
export const TRIX_CONTRACT_SCORES: Record<TrixPenalty, number> = {
  kingOfHearts: 75,
  queens: 100,
  diamonds: 130,
  tricks: 195,
};

export const TRIX_PENALTIES: readonly TrixPenalty[] = [
  'kingOfHearts',
  'queens',
  'diamonds',
  'tricks',
];

// Trix ladder by finish order (1st out … last). Naghil replaces 1st with −400.
export const TRIX_LADDER: readonly number[] = [-200, -150, -100, -50];
export const TRIX_NAGHIL = -400;
export const TRIX_KINGDOMS = 4;

// King rotation: 7♥ holder is kingdom 0's King, then counter-clockwise.
// Seats numbered clockwise → kingIdx[n] = (kingFirst - n) mod 4.
export function trixKingIdx(kingFirst: number, kingdom: number): number {
  return (((kingFirst - kingdom) % TRIX_KINGDOMS) + TRIX_KINGDOMS) % TRIX_KINGDOMS;
}

// Canonical total a deal's per-player deltas should sum to. Penalty deal =
// sum of its included contracts; Trix deal = −500 (−700 with naghil). The
// declared/doubled adjustments (King +75 / Queen +25 each) are P3 — `doubled`
// is intentionally not yet folded in here.
export function trixExpectedDealTotal(deal: TrixDeal): number {
  if (deal.kind === 'trix') return deal.naghil ? TRIX_NAGHIL - 300 : -500;
  let total = 0;
  for (const c of deal.contracts) total += TRIX_CONTRACT_SCORES[c];
  return total;
}

// Soft correctness guard (analogous to Kout's no-minus rule): a deal's entered
// per-player deltas should sum to its expected total.
export function trixDealChecksumOk(roundScores: number[], deal: TrixDeal): boolean {
  const sum = roundScores.reduce((a, b) => a + (b ?? 0), 0);
  return sum === trixExpectedDealTotal(deal);
}

// A kingdom is complete when its penalty deals partition all 4 penalties
// (each exactly once, disjoint) AND exactly one Trix deal is recorded.
export function kingdomComplete(rounds: TrixRoundMeta[], kingdom: number): boolean {
  const inK = rounds.filter((r) => r.kingdom === kingdom);
  if (inK.filter((r) => r.kind === 'trix').length !== 1) return false;
  const seen = new Set<TrixPenalty>();
  for (const r of inK) {
    if (r.kind === 'penalty') {
      for (const c of r.contracts) {
        if (seen.has(c)) return false; // duplicate within the kingdom
        seen.add(c);
      }
    }
  }
  return TRIX_PENALTIES.every((p) => seen.has(p)) && seen.size === TRIX_PENALTIES.length;
}

// What's still playable in a kingdom — drives the deal-type picker + merge
// multi-select. `penalties` are those not yet played; `trixAvailable` is false
// once the kingdom's solo Trix deal has been recorded.
export function trixKingdomRemaining(
  rounds: TrixRoundMeta[],
  kingdom: number,
): { penalties: TrixPenalty[]; trixAvailable: boolean } {
  const played = new Set<TrixPenalty>();
  let trixPlayed = false;
  for (const r of rounds) {
    if (r.kingdom !== kingdom) continue;
    if (r.kind === 'penalty') r.contracts.forEach((c) => played.add(c));
    else trixPlayed = true;
  }
  return {
    penalties: TRIX_PENALTIES.filter((p) => !played.has(p)),
    trixAvailable: !trixPlayed,
  };
}

// Game over = all 4 kingdoms complete.
export function trixGameOver(trixMatch: TrixMatch): boolean {
  for (let k = 0; k < TRIX_KINGDOMS; k++) {
    if (!kingdomComplete(trixMatch.rounds, k)) return false;
  }
  return true;
}
