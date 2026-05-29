import { describe, it, expect, vi } from 'vitest';
import { fireEvent } from '@testing-library/react';
import { renderWithGame } from '../../test/harness';
import { QuickFill } from './QuickFill';
import type { Profile, RecentGame } from '../../state/persistedState';

describe('QuickFill', () => {
  it('renders top players and fires onPick', () => {
    const onPick = vi.fn();
    const profiles: Record<string, Profile> = {
      sam: { name: 'Sam', gamesPlayed: 3, wins: 1, lastPlayed: 0, teammates: {} },
    };
    const { getByText } = renderWithGame(
      <QuickFill
        mode="custom"
        count={2}
        showShuffle
        onPick={onPick}
        onApplyTemplate={() => {}}
        onShuffle={() => {}}
      />,
      { initial: { playerProfiles: profiles } },
    );
    fireEvent.click(getByText('Sam'));
    expect(onPick).toHaveBeenCalledWith('Sam');
  });

  it('offers matching recent line-ups and fires onApplyTemplate', () => {
    const onApply = vi.fn();
    const recents: RecentGame[] = [
      {
        kind: 'custom',
        players: ['A', 'B'],
        teamNames: [],
        when: 1,
        roundCount: 1,
        winner: 'A',
        score: '1',
      },
    ];
    const { getByText } = renderWithGame(
      <QuickFill
        mode="custom"
        count={2}
        showShuffle={false}
        onPick={() => {}}
        onApplyTemplate={onApply}
        onShuffle={() => {}}
      />,
      { initial: { recentGames: recents } },
    );
    fireEvent.click(getByText('A · B'));
    expect(onApply).toHaveBeenCalledWith(['A', 'B']);
  });

  it('fires onShuffle when shuffle is shown', () => {
    const onShuffle = vi.fn();
    const { getByText } = renderWithGame(
      <QuickFill
        mode="sebeeta"
        count={6}
        showShuffle
        onPick={() => {}}
        onApplyTemplate={() => {}}
        onShuffle={onShuffle}
      />,
      { initial: {} },
    );
    fireEvent.click(getByText('Shuffle'));
    expect(onShuffle).toHaveBeenCalled();
  });
});
