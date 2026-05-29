import { describe, it, expect, vi } from 'vitest';
import { fireEvent } from '@testing-library/react';
import { renderWithGame } from '../../test/harness';
import { QuickFill } from './QuickFill';
import type { Profile } from '../../state/persistedState';

const profiles = (): Record<string, Profile> => ({
  sam: { name: 'Sam', gamesPlayed: 3, wins: 1, lastPlayed: 0, teammates: {} },
  lee: { name: 'Lee', gamesPlayed: 2, wins: 2, lastPlayed: 0, teammates: {} },
});

describe('QuickFill', () => {
  it('renders top players and fires onPick when a pill is tapped', () => {
    const onPick = vi.fn();
    const { getByText } = renderWithGame(<QuickFill onPick={onPick} />, {
      initial: { playerProfiles: profiles() },
    });
    fireEvent.click(getByText('Sam'));
    expect(onPick).toHaveBeenCalledWith('Sam');
  });

  it('renders nothing when there are no saved players', () => {
    const { container } = renderWithGame(<QuickFill onPick={() => {}} />);
    expect(container.querySelector('.quickfill')).toBeNull();
  });

  it('removes a single quick-add player via its ×', () => {
    const { getByLabelText, api } = renderWithGame(<QuickFill onPick={() => {}} />, {
      initial: { playerProfiles: profiles() },
    });
    fireEvent.click(getByLabelText('Remove player — Sam'));
    expect(api.state.playerProfiles.sam).toBeUndefined();
    expect(api.state.playerProfiles.lee).toBeDefined();
  });

  it('clears all quick-add players after confirming', () => {
    const { getByText, container, api } = renderWithGame(
      <QuickFill onPick={() => {}} />,
      { initial: { playerProfiles: profiles() } },
    );
    // The section's Clear-all link (the only "Clear" before the sheet opens).
    fireEvent.click(getByText('Clear'));
    const confirmBtn = container.querySelector(
      '.confirm-sheet .btn-danger',
    ) as HTMLButtonElement;
    fireEvent.click(confirmBtn);
    expect(Object.keys(api.state.playerProfiles)).toHaveLength(0);
  });
});
