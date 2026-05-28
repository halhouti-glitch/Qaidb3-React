import { describe, expect, it } from 'vitest';
import { DEFAULT_STATE, sanitizeState } from './persistedState';

describe('sanitizeState — guards against bad localStorage payloads', () => {
  it('returns defaults for non-object input', () => {
    expect(sanitizeState(null)).toEqual(DEFAULT_STATE);
    expect(sanitizeState('garbage')).toEqual(DEFAULT_STATE);
    expect(sanitizeState(42)).toEqual(DEFAULT_STATE);
    expect(sanitizeState([1, 2, 3])).toEqual(DEFAULT_STATE);
  });

  it('round-trips a fully valid state', () => {
    const valid = {
      ...DEFAULT_STATE,
      players: ['Ali', 'Bob'],
      scores: [[10, 5]],
      threshold: 100,
      currentScreen: 'play' as const,
    };
    expect(sanitizeState(valid)).toEqual(valid);
  });

  it('defaults unknown enums while keeping the surrounding fields', () => {
    const bad = {
      ...DEFAULT_STATE,
      gameMode: 'trix', // future / unknown value
      lang: 'fr', // unsupported
      currentScreen: 'lobby', // unknown screen
      theme: 'rainbow',
      winRule: 'medianest',
      players: ['Ali'],
    };
    const next = sanitizeState(bad);
    expect(next.gameMode).toBe(DEFAULT_STATE.gameMode);
    expect(next.lang).toBe(DEFAULT_STATE.lang);
    expect(next.currentScreen).toBe('home');
    expect(next.theme).toBe('light');
    expect(next.winRule).toBe('lowest');
    expect(next.players).toEqual(['Ali']); // valid sibling preserved
  });

  it('drops non-string entries from players + teamNames', () => {
    const next = sanitizeState({
      ...DEFAULT_STATE,
      players: ['Ali', 42, null, 'Bob', undefined],
      teamNames: ['A', 0],
    });
    expect(next.players).toEqual(['Ali', 'Bob']);
    expect(next.teamNames).toEqual(['A']);
  });

  it('coerces non-numeric scores to 0 within rows', () => {
    const next = sanitizeState({
      ...DEFAULT_STATE,
      scores: [[10, 'x', NaN, 20], 'not-a-row', [5]],
    });
    expect(next.scores).toEqual([[10, 0, 0, 20], [], [5]]);
  });

  it('falls back to default threshold for invalid types or non-positive numbers', () => {
    expect(sanitizeState({ ...DEFAULT_STATE, threshold: '201' }).threshold).toBe(
      DEFAULT_STATE.threshold,
    );
    expect(sanitizeState({ ...DEFAULT_STATE, threshold: -5 }).threshold).toBe(
      DEFAULT_STATE.threshold,
    );
    expect(sanitizeState({ ...DEFAULT_STATE, threshold: NaN }).threshold).toBe(
      DEFAULT_STATE.threshold,
    );
    expect(sanitizeState({ ...DEFAULT_STATE, threshold: 151 }).threshold).toBe(151);
  });

  it('caps recentGames at 10 and filters bad entries', () => {
    const ok = {
      kind: 'sebeeta',
      players: ['A', 'B'],
      teamNames: ['X', 'Y'],
      when: 1234,
      roundCount: 3,
      winner: 'X',
      score: '60-60',
    };
    const bad = { kind: 'nope', players: 'not-array' };
    const many = Array.from({ length: 15 }, (_, i) => ({ ...ok, when: i }));
    const next = sanitizeState({
      ...DEFAULT_STATE,
      recentGames: [bad, ...many],
    });
    // Bad object is rebuilt as a "custom" entry with empty players — and
    // valid entries follow it; total capped at 10.
    expect(next.recentGames).toHaveLength(10);
    expect(next.recentGames[0].kind).toBe('custom'); // bad.kind defaulted
    expect(next.recentGames[0].players).toEqual([]); // bad.players dropped
  });

  it('drops profiles missing a name + filters non-positive teammate counts', () => {
    const next = sanitizeState({
      ...DEFAULT_STATE,
      playerProfiles: {
        ali: { name: 'Ali', gamesPlayed: 4, wins: 2, lastPlayed: 100, teammates: { bob: 3, eve: 0, dan: -1 } },
        ghost: { gamesPlayed: 1 }, // missing name → dropped
        bob: 'not-an-object', // dropped
      },
    });
    expect(Object.keys(next.playerProfiles).sort()).toEqual(['ali']);
    expect(next.playerProfiles.ali.teammates).toEqual({ bob: 3 });
  });

  it('treats non-boolean gameOver / gameLogged / sound as false / default', () => {
    const next = sanitizeState({
      ...DEFAULT_STATE,
      gameOver: 'yes',
      gameLogged: 1,
      sound: 'off',
    });
    expect(next.gameOver).toBe(false);
    expect(next.gameLogged).toBe(false);
    expect(next.sound).toBe(DEFAULT_STATE.sound); // default true
  });
});
