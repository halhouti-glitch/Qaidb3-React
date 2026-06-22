import { describe, expect, it } from 'vitest';
import { SCORE_SCOPE, scoreScopeFor } from './modes';
import { GAMES } from '../games/registry';
import type { GameMode } from '../state/persistedState';

describe('score scope', () => {
  it('tallies Kout per team and everything else per player', () => {
    expect(scoreScopeFor('kout')).toBe('team');
    expect(scoreScopeFor('sebeeta')).toBe('player');
    expect(scoreScopeFor('custom')).toBe('player');
    expect(scoreScopeFor('trix')).toBe('player');
  });

  it('stays the single source of truth for the registry (no drift)', () => {
    (Object.keys(GAMES) as GameMode[]).forEach((mode) => {
      expect(GAMES[mode].scoreScope).toBe(SCORE_SCOPE[mode]);
    });
  });
});
