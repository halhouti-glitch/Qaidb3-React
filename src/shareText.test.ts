import { describe, it, expect } from 'vitest';
import { buildShareText } from './share';
import { DEFAULT_STATE, type PersistedState } from './state/persistedState';

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

  it('labels a trix game and ranks lowest-first', () => {
    const state: PersistedState = {
      ...DEFAULT_STATE,
      lang: 'en',
      gameMode: 'trix',
      players: ['Ann', 'Ben', 'Cal', 'Dan'],
      playerTeam: [],
      scores: [
        [500, 0, 0, 0],
        [-50, -200, -100, -150], // Ben lowest overall (-200)
      ],
      winRule: 'lowest',
      trixMatch: {
        partnership: false,
        kingFirst: 0,
        rounds: [
          { kind: 'penalty', contracts: ['kingOfHearts', 'queens', 'diamonds', 'tricks'], kingdom: 0, kingIdx: 0 },
          { kind: 'trix', kingdom: 0, kingIdx: 0 },
        ],
      },
    };
    const text = buildShareText(state);
    expect(text).toContain('Trix');
    const firstPlace = text.split('\n').find((l) => l.startsWith('1.'));
    expect(firstPlace).toContain('Ben'); // lowest total (-200) ranks first
  });
});
