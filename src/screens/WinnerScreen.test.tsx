import { act, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { WinnerScreen } from './WinnerScreen';
import { renderWithGame } from '../test/harness';
import * as shareModule from '../share';

vi.mock('../share', () => ({
  shareGameImage: vi.fn(() => Promise.resolve()),
  copyShareText: vi.fn(() => Promise.resolve(true)),
  shareGameText: vi.fn(() => Promise.resolve(true)),
}));

const ROSTER = ['A1', 'A2', 'A3', 'B1', 'B2', 'B3'];
const TEAM = [0, 0, 0, 1, 1, 1];

// Sebeeta: p0 (team 0) crossed 201 → engine emits team 1 (Bravo) as winner.
const sebeetaWon = {
  gameMode: 'sebeeta' as const,
  currentScreen: 'winner' as const,
  players: ROSTER,
  playerTeam: TEAM,
  teamNames: ['Alpha', 'Bravo'],
  threshold: 201,
  winRule: 'lowest' as const,
  scores: [
    [100, 30, 20, 10, 10, 10],
    [105, 30, 20, 10, 10, 10],
  ],
  gameOver: true,
  gameLogged: true,
};

describe('WinnerScreen', () => {
  it('renders the winning team name', () => {
    const { getByText } = renderWithGame(<WinnerScreen />, { initial: sebeetaWon });
    expect(getByText('Bravo')).toBeDefined();
  });

  it('shows the correct round count', () => {
    const { container } = renderWithGame(<WinnerScreen />, { initial: sebeetaWon });
    // The rounds stat value renders as a <div class="val"> — assert via text
    // appearance inside the winner-stats area.
    const stats = container.querySelector('.winner-stats');
    expect(stats?.textContent).toContain('2');
  });

  it('Rematch button resets scores but keeps players, then routes to play', () => {
    const { api, getByText } = renderWithGame(<WinnerScreen />, { initial: sebeetaWon });
    act(() => {
      fireEvent.click(getByText('Rematch'));
    });
    expect(api.state.scores).toEqual([]);
    expect(api.state.gameOver).toBe(false);
    expect(api.state.gameLogged).toBe(false);
    expect(api.state.players).toEqual(ROSTER); // roster preserved
    expect(api.state.currentScreen).toBe('play');
  });
});

describe('WinnerScreen — share sheet', () => {
  it('opens the share sheet when the share button is tapped', () => {
    const { getByLabelText, container } = renderWithGame(<WinnerScreen />, {
      initial: sebeetaWon,
    });
    expect(container.querySelector('.share-sheet.open')).toBeNull();
    act(() => {
      fireEvent.click(getByLabelText('Share'));
    });
    expect(container.querySelector('.share-sheet.open')).not.toBeNull();
  });

  it('shares an image via the sheet', async () => {
    const { getByLabelText, getByText } = renderWithGame(<WinnerScreen />, {
      initial: sebeetaWon,
    });
    act(() => {
      fireEvent.click(getByLabelText('Share'));
    });
    await act(async () => {
      fireEvent.click(getByText('Share image'));
    });
    expect(shareModule.shareGameImage).toHaveBeenCalledOnce();
  });

  it('copies a text summary via the sheet', async () => {
    const { getByLabelText, getByText } = renderWithGame(<WinnerScreen />, {
      initial: sebeetaWon,
    });
    act(() => {
      fireEvent.click(getByLabelText('Share'));
    });
    await act(async () => {
      fireEvent.click(getByText('Copy summary'));
    });
    expect(shareModule.copyShareText).toHaveBeenCalledOnce();
  });
});
