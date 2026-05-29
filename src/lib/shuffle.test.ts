import { describe, it, expect } from 'vitest';
import { shuffle } from './shuffle';

describe('shuffle', () => {
  it('returns a new array with the same elements, leaving the input intact', () => {
    const input = [1, 2, 3, 4, 5];
    const out = shuffle(input, () => 0);
    expect(out).not.toBe(input);
    expect([...out].sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5]);
    expect(input).toEqual([1, 2, 3, 4, 5]);
  });

  it('is deterministic for a given rng sequence', () => {
    const seq = [0.1, 0.9, 0.3, 0.7];
    const makeRng = () => {
      let i = 0;
      return () => seq[i++ % seq.length];
    };
    const a = shuffle(['a', 'b', 'c', 'd', 'e'], makeRng());
    const b = shuffle(['a', 'b', 'c', 'd', 'e'], makeRng());
    expect(a).toEqual(b);
  });

  it('handles single-element and empty arrays', () => {
    expect(shuffle([], () => 0)).toEqual([]);
    expect(shuffle([7], () => 0)).toEqual([7]);
  });
});
