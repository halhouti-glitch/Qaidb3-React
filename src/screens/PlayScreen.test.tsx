import { act, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PlayScreen } from './PlayScreen';
import { renderWithGame } from '../test/harness';

const ROSTER = ['A1', 'A2', 'A3', 'B1', 'B2', 'B3'];
const TEAM = [0, 0, 0, 1, 1, 1];

const sebeetaInit = {
  gameMode: 'sebeeta' as const,
  currentScreen: 'play' as const,
  players: ROSTER,
  playerTeam: TEAM,
  teamNames: ['Alpha', 'Bravo'],
  threshold: 201,
  winRule: 'lowest' as const,
};

describe('PlayScreen', () => {
  it('renders the player roster on the scoreboard', () => {
    const { getByText } = renderWithGame(<PlayScreen />, { initial: sebeetaInit });
    expect(getByText('A1')).toBeDefined();
    expect(getByText('B3')).toBeDefined();
  });

  it('Undo button is disabled with zero rounds, enabled after a round, and removes the last round', () => {
    const { api, getByLabelText } = renderWithGame(<PlayScreen />, {
      initial: sebeetaInit,
    });
    const undoBtn = getByLabelText('Undo Last Round') as HTMLButtonElement;
    expect(undoBtn.disabled).toBe(true);

    act(() => {
      api.actions.addRound([10, 20, 30, 0, 0, 0]);
    });
    expect(undoBtn.disabled).toBe(false);
    expect(api.state.scores).toHaveLength(1);

    act(() => {
      fireEvent.click(undoBtn);
    });
    expect(api.state.scores).toEqual([]);
  });

  it('Reset button confirms via window.confirm and clears scores', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const { api, getByText } = renderWithGame(<PlayScreen />, {
      initial: { ...sebeetaInit, scores: [[10, 0, 0, 0, 0, 0]] },
    });
    act(() => {
      fireEvent.click(getByText('Reset Game'));
    });
    expect(confirmSpy).toHaveBeenCalled();
    expect(api.state.scores).toEqual([]);
    confirmSpy.mockRestore();
  });
});
