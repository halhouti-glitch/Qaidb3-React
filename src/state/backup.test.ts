import { describe, it, expect } from 'vitest';
import { serializeBackup, parseBackup } from './backup';
import { DEFAULT_STATE, type PersistedState } from './persistedState';

describe('backup serialize/parse', () => {
  it('round-trips a state through serialize → parse', () => {
    const state = {
      ...DEFAULT_STATE,
      players: ['A', 'B'],
      threshold: 151,
      lang: 'en' as const,
    };
    const back = parseBackup(serializeBackup(state, 123));
    expect(back?.players).toEqual(['A', 'B']);
    expect(back?.threshold).toBe(151);
    expect(back?.lang).toBe('en');
  });

  it('round-trips a trix match through serialize → parse', () => {
    const state: PersistedState = {
      ...DEFAULT_STATE,
      gameMode: 'trix',
      players: ['A', 'B', 'C', 'D'],
      scores: [[75, 100, 130, 195]],
      trixMatch: {
        partnership: false,
        kingFirst: 1,
        rounds: [
          {
            kind: 'penalty' as const,
            contracts: ['kingOfHearts', 'queens', 'diamonds', 'tricks'],
            kingdom: 0,
            kingIdx: 1,
          },
        ],
      },
    };
    const back = parseBackup(serializeBackup(state, 123));
    expect(back?.gameMode).toBe('trix');
    expect(back?.trixMatch).toEqual(state.trixMatch);
  });

  it('wraps the state in a versioned envelope', () => {
    const env = JSON.parse(serializeBackup(DEFAULT_STATE, 999));
    expect(env.format).toBe('qaid-backup');
    expect(env.schema).toBe(1);
    expect(env.exportedAt).toBe(999);
    expect(typeof env.data).toBe('object');
  });

  it('accepts a bare PersistedState with no envelope', () => {
    const bare = JSON.stringify({ ...DEFAULT_STATE, threshold: 77 });
    expect(parseBackup(bare)?.threshold).toBe(77);
  });

  it('sanitises a partially-corrupt payload', () => {
    const text = JSON.stringify({
      format: 'qaid-backup',
      schema: 1,
      data: { threshold: 'bad', players: ['ok', 5, 'two'] },
    });
    const back = parseBackup(text);
    expect(back?.threshold).toBe(DEFAULT_STATE.threshold);
    expect(back?.players).toEqual(['ok', 'two']); // non-strings dropped
  });

  it('returns null for non-JSON text', () => {
    expect(parseBackup('not json{')).toBeNull();
  });

  it('returns null for JSON that is not an object', () => {
    expect(parseBackup('42')).toBeNull();
    expect(parseBackup('[1,2,3]')).toBeNull();
  });
});
