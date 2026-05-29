import { describe, it, expect } from 'vitest';
import { act } from '@testing-library/react';
import { renderWithGame } from '../test/harness';
import { DEFAULT_STATE, type RecentGame } from './persistedState';

const recent: RecentGame = {
  kind: 'custom',
  players: ['Sam', 'Lee'],
  teamNames: [],
  when: 1,
  roundCount: 2,
  winner: 'Sam',
  score: '30',
  scores: [
    [10, 5],
    [20, 5],
  ],
  playerTeam: [],
  threshold: 25,
  winRule: 'highest',
};

describe('replaceState', () => {
  it('replaces the whole state and lands on home', () => {
    const { api } = renderWithGame(null, {
      initial: { players: ['x'], currentScreen: 'play' },
    });
    act(() =>
      api.actions.replaceState({
        ...DEFAULT_STATE,
        players: ['Imported'],
        currentScreen: 'winner',
      }),
    );
    expect(api.state.players).toEqual(['Imported']);
    expect(api.state.currentScreen).toBe('home');
  });
});

describe('reopenRecentGame', () => {
  it('loads the snapshot into the active game and removes the entry', () => {
    const { api } = renderWithGame(null, {
      initial: { recentGames: [recent], scores: [], gameOver: false },
    });
    act(() => api.actions.reopenRecentGame(0));
    expect(api.state.scores).toEqual([
      [10, 5],
      [20, 5],
    ]);
    expect(api.state.players).toEqual(['Sam', 'Lee']);
    expect(api.state.threshold).toBe(25);
    expect(api.state.currentScreen).toBe('history');
    expect(api.state.recentGames).toHaveLength(0);
  });

  it('is a no-op for entries without a round snapshot', () => {
    const noScores: RecentGame = { ...recent, scores: undefined };
    const { api } = renderWithGame(null, {
      initial: { recentGames: [noScores] },
    });
    act(() => api.actions.reopenRecentGame(0));
    expect(api.state.recentGames).toHaveLength(1);
    expect(api.state.currentScreen).toBe('home');
  });
});
