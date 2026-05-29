import { describe, it, expect } from 'vitest';
import { buildShareText } from './share';
import { DEFAULT_STATE } from './state/persistedState';

describe('buildShareText', () => {
  it('summarises a custom game with ranked standings', () => {
    const state = {
      ...DEFAULT_STATE,
      lang: 'en' as const,
      gameMode: 'custom' as const,
      players: ['Sam', 'Lee'],
      playerTeam: [],
      scores: [[10, 30]],
      threshold: 25,
      winRule: 'highest' as const,
    };
    const text = buildShareText(state);
    expect(text).toContain('🏆');
    expect(text).toContain('Lee'); // Lee crossed 25 → winner
    const lines = text.split('\n');
    const firstPlace = lines.find((l) => l.startsWith('1.'));
    expect(firstPlace).toContain('Lee'); // highest-wins ranks Lee (30) first
    expect(firstPlace).toContain('30');
  });

  it('reports the rounds played', () => {
    const state = {
      ...DEFAULT_STATE,
      lang: 'en' as const,
      gameMode: 'custom' as const,
      players: ['A', 'B'],
      scores: [
        [1, 2],
        [3, 4],
      ],
    };
    expect(buildShareText(state)).toContain('2');
  });
});
