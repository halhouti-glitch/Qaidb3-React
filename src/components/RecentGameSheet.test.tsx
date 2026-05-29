import { describe, it, expect } from 'vitest';
import { act, fireEvent } from '@testing-library/react';
import { renderWithGame } from '../test/harness';
import { RecentGameSheet } from './RecentGameSheet';
import type { RecentGame } from '../state/persistedState';

const recent: RecentGame = {
  kind: 'custom',
  players: ['Sam', 'Lee'],
  teamNames: [],
  when: 1,
  roundCount: 1,
  winner: 'Sam',
  score: '30',
  scores: [[10, 20]],
  playerTeam: [],
  threshold: 25,
  winRule: 'highest',
};

describe('RecentGameSheet', () => {
  it('shows the round breakdown and reopens the game for editing', () => {
    const { getByText, api } = renderWithGame(
      <RecentGameSheet recentIndex={0} onClose={() => {}} />,
      { initial: { recentGames: [recent] } },
    );
    expect(getByText('Edit rounds')).toBeDefined();
    act(() => {
      fireEvent.click(getByText('Edit rounds'));
    });
    expect(api.state.currentScreen).toBe('history');
    expect(api.state.scores).toEqual([[10, 20]]);
    expect(api.state.recentGames).toHaveLength(0);
  });

  it('degrades to a message when no round snapshot exists', () => {
    const noScores: RecentGame = { ...recent, scores: undefined };
    const { getByText, queryByText } = renderWithGame(
      <RecentGameSheet recentIndex={0} onClose={() => {}} />,
      { initial: { recentGames: [noScores] } },
    );
    expect(getByText("Round details weren't saved for this game.")).toBeDefined();
    expect(queryByText('Edit rounds')).toBeNull();
  });
});
