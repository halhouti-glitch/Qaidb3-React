import { act, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { WinnerScreen } from './WinnerScreen';
import { renderWithGame } from '../test/harness';
import * as shareModule from '../share';

vi.mock('../share', () => ({ shareGameImage: vi.fn() }));

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

describe('WinnerScreen — share button state', () => {
  it('share button is enabled by default and disabled while sharing is in flight', async () => {
    // Hold the share promise open so we can observe the disabled state.
    let resolveShare: (() => void) | null = null;
    const sharePromise = new Promise<void>((res) => {
      resolveShare = res;
    });
    (shareModule.shareGameImage as ReturnType<typeof vi.fn>).mockReturnValue(
      sharePromise,
    );

    const { getByLabelText } = renderWithGame(<WinnerScreen />, {
      initial: sebeetaWon,
    });
    const shareBtn = getByLabelText('Share') as HTMLButtonElement;
    expect(shareBtn.disabled).toBe(false);

    act(() => {
      fireEvent.click(shareBtn);
    });
    expect(shareBtn.disabled).toBe(true);
    expect(shareModule.shareGameImage).toHaveBeenCalledOnce();

    // Resolve the in-flight share and let the finally block re-enable the button.
    await act(async () => {
      resolveShare!();
      await sharePromise;
    });
    expect(shareBtn.disabled).toBe(false);
  });

  it('clicking share while already sharing is a no-op (no double invocation)', async () => {
    let resolveShare: (() => void) | null = null;
    const sharePromise = new Promise<void>((res) => {
      resolveShare = res;
    });
    (shareModule.shareGameImage as ReturnType<typeof vi.fn>)
      .mockReset()
      .mockReturnValue(sharePromise);

    const { getByLabelText } = renderWithGame(<WinnerScreen />, {
      initial: sebeetaWon,
    });
    const shareBtn = getByLabelText('Share') as HTMLButtonElement;
    // Separate act() per click so React commits the disabled state between them
    // — otherwise all clicks land on the same render with the same closure.
    act(() => {
      fireEvent.click(shareBtn);
    });
    expect(shareBtn.disabled).toBe(true);
    act(() => {
      fireEvent.click(shareBtn);
    });
    act(() => {
      fireEvent.click(shareBtn);
    });
    expect(shareModule.shareGameImage).toHaveBeenCalledOnce();
    await act(async () => {
      resolveShare!();
      await sharePromise;
    });
  });
});
